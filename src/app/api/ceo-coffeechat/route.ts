import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { unauthorized, forbidden, badRequest, serverError } from '@/lib/api/error'

const createSessionSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  description: z.string().min(1, '설명을 입력해주세요'),
  session_date: z.string().min(1, '세션 날짜를 입력해주세요'),
  duration_minutes: z.number().int().min(15).max(480).default(60),
  max_participants: z.number().int().min(1).max(50).default(5),
  location_type: z.enum(['online', 'offline', 'hybrid']),
  location_detail: z.string().optional(),
  target_tier: z.enum(['core', 'endorsed', 'all']).optional(),
  tags: z.array(z.string()).default([]),
  agreement_accepted: z.boolean().refine((v) => v === true, '헤드헌팅 수수료 원칙에 동의해야 합니다'),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return unauthorized('인증이 필요합니다')
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const offset = (page - 1) * limit

    let query = supabase
      .from('vcx_ceo_coffee_sessions')
      .select(`
        *,
        host:vcx_corporate_users(id, name, title, company, role)
      `, { count: 'exact' })
      .order('session_date', { ascending: true })
      .range(offset, offset + limit - 1)

    if (status && ['open', 'closed', 'completed', 'cancelled'].includes(status)) {
      query = query.eq('status', status as 'open' | 'closed' | 'completed' | 'cancelled')
    }

    const { data: sessions, error, count } = await query
    if (error) {
      console.error('Sessions fetch error:', error)
      return serverError('세션 목록 조회에 실패했습니다')
    }

    // Fetch application counts via SECURITY DEFINER RPC
    const sessionsWithCount = await Promise.all(
      (sessions || []).map(async (session) => {
        const { data: countData } = await supabase
          .rpc('vcx_coffee_application_count', { p_session_id: session.id })
        return { ...session, application_count: countData ?? 0 }
      })
    )

    return NextResponse.json({ data: sessionsWithCount, total: count, page, limit })
  } catch (error) {
    console.error('GET /api/ceo-coffeechat error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return unauthorized('인증이 필요합니다')
    }

    // Check corporate user role
    const { data: corporateUser } = await supabase
      .from('vcx_corporate_users')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (!corporateUser || !['ceo', 'founder'].includes(corporateUser.role)) {
      return forbidden('CEO/Founder만 세션을 생성할 수 있습니다')
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest('유효하지 않은 요청 형식입니다')
    }

    const parsed = createSessionSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Validation error')
    }

    const { data: session, error: insertError } = await supabase
      .from('vcx_ceo_coffee_sessions')
      .insert({
        host_id: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        session_date: parsed.data.session_date,
        duration_minutes: parsed.data.duration_minutes,
        max_participants: parsed.data.max_participants,
        location_type: parsed.data.location_type,
        location_detail: parsed.data.location_detail ?? null,
        target_tier: parsed.data.target_tier ?? null,
        tags: parsed.data.tags,
        agreement_accepted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Session insert error:', insertError)
      return serverError('세션 생성에 실패했습니다')
    }

    return NextResponse.json({ data: session }, { status: 201 })
  } catch (error) {
    console.error('POST /api/ceo-coffeechat error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}
