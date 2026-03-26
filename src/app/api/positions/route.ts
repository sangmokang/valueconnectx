import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, serverError } from '@/lib/api/error'
import { parseSearchParams, parseBody } from '@/lib/api/validation'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
})

const createSchema = z.object({
  company_name: z.string().min(1),
  title: z.string().min(1),
  team_size: z.string().optional(),
  role_description: z.string().min(1),
  salary_range: z.string().optional(),
  status: z.enum(['active', 'closed', 'draft']).default('active'),
})

/* eslint-disable @typescript-eslint/no-explicit-any */
function db(supabase: any) {
  return supabase as {
    from(table: 'positions'): any
    from(table: 'position_interests'): any
    from(table: 'vcx_members'): any
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function isAdmin(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from('vcx_members')
    .select('system_role')
    .eq('id', userId)
    .in('system_role', ['super_admin', 'admin'])
    .single()
  return !!data
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    // Verify member
    const { data: member } = await supabase
      .from('vcx_members')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()
    if (!member) return forbidden('VCX 멤버만 접근할 수 있습니다')

    const { searchParams } = new URL(request.url)
    const parsed = parseSearchParams(searchParams, querySchema)
    if (parsed.error) return parsed.error

    const { page, limit, q, company, title } = parsed.data
    const offset = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any

    let query = supa
      .from('positions')
      .select('id, company_name, title, team_size, role_description, salary_range, status, created_at', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (q) {
      query = query.or(`company_name.ilike.%${q}%,title.ilike.%${q}%,role_description.ilike.%${q}%`)
    }
    if (company) query = query.ilike('company_name', `%${company}%`)
    if (title) query = query.ilike('title', `%${title}%`)

    const { data, error, count } = await query
    if (error) {
      console.error('Positions GET error:', error)
      return serverError()
    }

    // Fetch current user's interests for these positions
    const positionIds = (data ?? []).map((p: { id: string }) => p.id)
    let interests: Record<string, string> = {}
    if (positionIds.length > 0) {
      const { data: interestData } = await supa
        .from('position_interests')
        .select('position_id, interest_type')
        .eq('user_id', user.id)
        .in('position_id', positionIds)
      if (interestData) {
        interests = Object.fromEntries(
          (interestData as { position_id: string; interest_type: string }[]).map((i) => [i.position_id, i.interest_type])
        )
      }
    }

    const enriched = (data ?? []).map((p: { id: string }) => ({ ...p, my_interest: interests[p.id] ?? null }))
    return NextResponse.json({ data: enriched, total: count, page, limit })
  } catch (err) {
    console.error('Positions GET error:', err)
    return serverError()
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const admin = await isAdmin(supabase, user.id)
    if (!admin) return forbidden('관리자만 포지션을 등록할 수 있습니다')

    const parsed = await parseBody(request, createSchema)
    if (parsed.error) return parsed.error

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('positions')
      .insert({ ...parsed.data, created_by: user.id })
      .select()
      .single()

    if (error) {
      console.error('Positions POST error:', error)
      return serverError()
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('Positions POST error:', err)
    return serverError()
  }
}

void db // suppress unused warning
