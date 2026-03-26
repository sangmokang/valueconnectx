import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { unauthorized, forbidden, notFound, badRequest, serverError } from '@/lib/api/error'
import { sendNotification } from '@/lib/notification'

const updateApplicationSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
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

    const { id, appId } = await params

    const { data: chat } = await supabase
      .from('peer_coffee_chats')
      .select('author_id, title')
      .eq('id', id)
      .single()

    if (!chat) return notFound('글을 찾을 수 없습니다')
    if (chat.author_id !== user.id) return forbidden('작성자만 신청을 처리할 수 있습니다')

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest('유효하지 않은 요청 형식입니다')
    }

    const parsed = updateApplicationSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Validation error')
    }

    const { data: updated, error: updateError } = await supabase
      .from('peer_coffee_applications')
      .update({ status: parsed.data.status })
      .eq('id', appId)
      .eq('chat_id', id)
      .select()
      .single()

    if (updateError || !updated) {
      console.error('Peer application update error:', updateError)
      return serverError('신청 처리에 실패했습니다')
    }

    // Send notification via service layer
    sendNotification(
      updated.applicant_id,
      parsed.data.status === 'accepted' ? 'peer_chat_accepted' : 'peer_chat_rejected',
      {
        title: `피어 커피챗 신청이 ${parsed.data.status === 'accepted' ? '수락' : '거절'}되었습니다`,
        body: chat.title ?? '피어 커피챗 신청',
        link: `/coffeechat/${id}`,
      }
    ).catch(() => {}) // fire-and-forget

    // Fetch applicant email for author when accepted
    let contactEmail: string | null = null
    if (parsed.data.status === 'accepted') {
      const adminClient = createAdminClient()
      const { data: applicantMember } = await adminClient
        .from('vcx_members')
        .select('email')
        .eq('id', updated.applicant_id)
        .single()
      contactEmail = applicantMember?.email ?? null
    }

    return NextResponse.json({ data: { ...updated, contact_email: contactEmail } })
  } catch (error) {
    console.error('PUT /api/peer-coffeechat/[id]/applications/[appId] error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}
