import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { unauthorized, forbidden, notFound, badRequest, serverError } from '@/lib/api/error'

const updateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  session_date: z.string().optional(),
  duration_minutes: z.number().int().min(15).max(480).optional(),
  max_participants: z.number().int().min(1).max(50).optional(),
  location_type: z.enum(['online', 'offline', 'hybrid']).optional(),
  location_detail: z.string().optional(),
  status: z.enum(['open', 'closed', 'completed', 'cancelled']).optional(),
  target_tier: z.enum(['core', 'endorsed', 'all']).optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return unauthorized('인증이 필요합니다')
    }

    const { id } = await params

    const { data: session, error } = await supabase
      .from('vcx_ceo_coffee_sessions')
      .select(`
        *,
        host:vcx_corporate_users(id, name, title, company, role)
      `)
      .eq('id', id)
      .single()

    if (error || !session) {
      return notFound('세션을 찾을 수 없습니다')
    }

    const { data: countData } = await supabase
      .rpc('vcx_coffee_application_count', { p_session_id: id })

    return NextResponse.json({ data: { ...session, application_count: countData ?? 0 } })
  } catch (error) {
    console.error('GET /api/ceo-coffeechat/[id] error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return unauthorized('인증이 필요합니다')
    }

    const { id } = await params

    const { data: session } = await supabase
      .from('vcx_ceo_coffee_sessions')
      .select('host_id')
      .eq('id', id)
      .single()

    if (!session) {
      return notFound('세션을 찾을 수 없습니다')
    }
    if (session.host_id !== user.id) {
      return forbidden('수정 권한이 없습니다')
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest('유효하지 않은 요청 형식입니다')
    }

    const parsed = updateSessionSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Validation error')
    }

    const { data: updated, error: updateError } = await supabase
      .from('vcx_ceo_coffee_sessions')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Session update error:', updateError)
      return serverError('세션 수정에 실패했습니다')
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT /api/ceo-coffeechat/[id] error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return unauthorized('인증이 필요합니다')
    }

    const { id } = await params

    const { data: session } = await supabase
      .from('vcx_ceo_coffee_sessions')
      .select('host_id')
      .eq('id', id)
      .single()

    if (!session) {
      return notFound('세션을 찾을 수 없습니다')
    }

    const isHost = session.host_id === user.id

    if (!isHost) {
      // Check if user is admin
      const { data: adminUser } = await supabase
        .from('vcx_members')
        .select('system_role')
        .eq('id', user.id)
        .in('system_role', ['admin', 'super_admin'])
        .single()

      if (!adminUser) {
        return forbidden('삭제 권한이 없습니다')
      }
    }

    const { error: updateError } = await supabase
      .from('vcx_ceo_coffee_sessions')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (updateError) {
      console.error('Session delete error:', updateError)
      return serverError('세션 삭제에 실패했습니다')
    }

    return NextResponse.json({ message: '세션이 취소되었습니다' })
  } catch (error) {
    console.error('DELETE /api/ceo-coffeechat/[id] error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}
