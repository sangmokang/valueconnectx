import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unauthorized, forbidden, badRequest, serverError } from '@/lib/api/error'
import { parseSearchParams, parseBody } from '@/lib/api/validation'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'confirmed', 'paid', 'cancelled']).optional(),
})

const postSchema = z.object({
  coffeechat_type: z.enum(['ceo', 'peer']),
  coffeechat_id: z.string().uuid().optional(),
  candidate_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  introducer_id: z.string().uuid().optional(),
  position_title: z.string().min(1),
  annual_salary: z.number().int().positive(),
  fee_percentage: z.number().min(0).max(100).default(10),
  reward_percentage: z.number().min(0).max(100).default(1),
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
    const admin = await getAdminUser(supabase)
    if (!admin) return forbidden('관리자 권한이 필요합니다')

    const { searchParams } = new URL(request.url)
    const parsed = parseSearchParams(searchParams, querySchema)
    if (parsed.error) return parsed.error

    const { page, limit, status } = parsed.data
    const offset = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminSupabase = createAdminClient() as any
    let query = adminSupabase
      .from('vcx_hiring_records')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) {
      console.error('Hiring records GET error:', error)
      return serverError()
    }

    return NextResponse.json({ data, total: count, page, limit })
  } catch (error) {
    console.error('Hiring records GET error:', error)
    return serverError()
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await getAdminUser(supabase)
    if (!admin) return forbidden('관리자 권한이 필요합니다')

    const parsed = await parseBody(request, postSchema)
    if (parsed.error) return parsed.error

    const {
      coffeechat_type,
      coffeechat_id,
      candidate_id,
      company_id,
      introducer_id,
      position_title,
      annual_salary,
      fee_percentage,
      reward_percentage,
    } = parsed.data

    const fee_amount = Math.round((annual_salary * fee_percentage) / 100)
    const reward_amount = Math.round((annual_salary * reward_percentage) / 100)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminSupabase = createAdminClient() as any
    const { data, error } = await adminSupabase
      .from('vcx_hiring_records')
      .insert({
        coffeechat_type,
        coffeechat_id: coffeechat_id ?? null,
        candidate_id: candidate_id ?? null,
        company_id: company_id ?? null,
        introducer_id: introducer_id ?? null,
        position_title,
        annual_salary,
        fee_percentage,
        fee_amount,
        reward_percentage,
        reward_amount,
        status: 'pending',
      })
      .select('*')
      .single()

    if (error) {
      console.error('Hiring records POST error:', error)
      return serverError()
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Hiring records POST error:', error)
    return serverError()
  }
}
