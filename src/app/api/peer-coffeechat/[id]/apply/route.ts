import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { unauthorized, forbidden, notFound, badRequest, conflict, serverError } from '@/lib/api/error'
import { sendNotification } from '@/lib/notification'

const applySchema = z.object({
  message: z.string().min(1, '신청 메시지를 입력해주세요').max(1000),
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

    // Verify member
    const { data: member } = await supabase
      .from('vcx_members')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()
    if (!member) return forbidden('VCX 멤버만 접근할 수 있습니다')

    const { id } = await params

    const { data: chat } = await supabase
      .from('peer_coffee_chats')
      .select('id, author_id, status, title')
      .eq('id', id)
      .single()

    if (!chat) return notFound('글을 찾을 수 없습니다')
    if (chat.author_id === user.id) return forbidden('본인 글에는 신청할 수 없습니다')
    if (chat.status !== 'open') return forbidden('신청이 마감된 글입니다')

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest('유효하지 않은 요청 형식입니다')
    }

    const parsed = applySchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Validation error')
    }

    const { data: application, error: insertError } = await supabase
      .from('peer_coffee_applications')
      .insert({
        chat_id: id,
        applicant_id: user.id,
        message: parsed.data.message,
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return conflict('이미 신청하셨습니다')
      }
      console.error('Peer application insert error:', insertError)
      return serverError('신청에 실패했습니다')
    }

    // Notify author of new application
    sendNotification(
      chat.author_id,
      'peer_chat_applied',
      {
        title: '새로운 피어 커피챗 신청이 도착했습니다',
        body: chat.title ?? '피어 커피챗 신청',
        link: `/coffeechat/${id}`,
      }
    ).catch(() => {}) // fire-and-forget

    return NextResponse.json({ data: application }, { status: 201 })
  } catch (error) {
    console.error('POST /api/peer-coffeechat/[id]/apply error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}
