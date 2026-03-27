import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unauthorized, forbidden, serverError } from '@/lib/api/error'

export const dynamic = 'force-dynamic'
import { parseSearchParams } from '@/lib/api/validation'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['active', 'closed', 'draft']).optional(),
})

async function getAdminUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: member } = await supabase
    .from('vcx_members')
    .select('system_role')
    .eq('id', user.id)
    .in('system_role', ['super_admin', 'admin'])
    .single()

  return member ? user : null
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminUser = await getAdminUser(supabase)
    if (!adminUser) return unauthorized()

    const { searchParams } = new URL(request.url)
    const parsed = parseSearchParams(searchParams, querySchema)
    if (parsed.error) return parsed.error

    const { page, limit, status } = parsed.data
    const offset = (page - 1) * limit

    const admin = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (admin as any)
      .from('positions')
      .select('id, company_name, title, team_size, role_description, salary_range, status, created_at, updated_at, requirements, benefits, required_fields, min_experience, location', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) {
      console.error('Admin positions GET error:', error)
      return serverError()
    }

    // Fetch interest counts per position
    const positionIds = (data ?? []).map((p: { id: string }) => p.id)
    let interestCounts: Record<string, number> = {}
    if (positionIds.length > 0) {
      const { data: interests } = await (admin as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .from('position_interests')
        .select('position_id')
        .in('position_id', positionIds)

      if (interests) {
        interestCounts = {}
        for (const i of interests as { position_id: string }[]) {
          interestCounts[i.position_id] = (interestCounts[i.position_id] ?? 0) + 1
        }
      }
    }

    const enriched = (data ?? []).map((p: { id: string }) => ({
      ...p,
      interest_count: interestCounts[p.id] ?? 0,
    }))

    return NextResponse.json({ data: enriched, total: count, page, limit })
  } catch (err) {
    console.error('Admin positions GET error:', err)
    return serverError()
  }
}
