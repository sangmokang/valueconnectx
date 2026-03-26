import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { unauthorized, forbidden, notFound, badRequest, conflict, serverError } from '@/lib/api/error'
import { sendNotification } from '@/lib/notification'

const applySchema = z.object({
  message: z.string().max(1000).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return unauthorized('인증이 필요합니다')
    }

    // Only VCX members can apply
    const { data: member } = await supabase
      .from('vcx_members')
      .select('id, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (!member) {
      return forbidden('VCX 멤버만 신청할 수 있습니다')
    }

    const { id: sessionId } = await params

    // Check session exists and is open
    const { data: session } = await supabase
      .from('vcx_ceo_coffee_sessions')
      .select('id, status, host_id, title')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return notFound('세션을 찾을 수 없습니다')
    }
    if (session.status !== 'open') {
      return badRequest('신청이 마감된 세션입니다')
    }
    if (session.host_id === user.id) {
      return badRequest('본인이 주최한 세션에는 신청할 수 없습니다')
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const parsed = applySchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Validation error')
    }

    const { data: application, error: insertError } = await supabase
      .from('vcx_coffee_applications')
      .insert({
        session_id: sessionId,
        applicant_id: user.id,
        message: parsed.data.message ?? null,
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return conflict('이미 신청한 세션입니다')
      }
      console.error('Application insert error:', insertError)
      return serverError('신청에 실패했습니다')
    }

    // Notify host of new application
    sendNotification(
      session.host_id,
      'coffeechat_applied',
      {
        title: '새로운 커피챗 신청이 도착했습니다',
        body: session.title,
        link: `/ceo-coffeechat/${sessionId}`,
      }
    ).catch(() => {}) // fire-and-forget

    return NextResponse.json({ data: application }, { status: 201 })
  } catch (error) {
    console.error('POST /apply error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}
