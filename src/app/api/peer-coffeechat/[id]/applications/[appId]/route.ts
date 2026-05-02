import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { unauthorized, forbidden, notFound, badRequest, serverError } from '@/lib/api/error'
import { sendNotification } from '@/lib/notification'
import { generateCoffeechatBrief } from '@/lib/ai/brief'

type PeerApplicationUpdateTable = {
  update: (values: Record<string, unknown>) => {
    eq: (column: string, value: string) => Promise<unknown>
  }
}

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
      .select('author_id, title, content, category')
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

    if (parsed.data.status === 'accepted') {
      try {
        await supabase
          .from('peer_coffee_chats')
          .update({ status: 'matched' })
          .eq('id', id)
      } catch (error) {
        console.error('Peer chat status update failed:', error)
      }
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

      generatePeerBriefAsync(id, appId, updated.applicant_id).catch((err) => {
        console.error('Peer brief generation failed:', err)
      })
    }

    return NextResponse.json({ data: { ...updated, contact_email: contactEmail } })
  } catch (error) {
    console.error('PUT /api/peer-coffeechat/[id]/applications/[appId] error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}

async function generatePeerBriefAsync(
  chatId: string,
  appId: string,
  applicantId: string
) {
  const supabase = await createClient()

  const { data: chat } = await supabase
    .from('peer_coffee_chats')
    .select('title, content, category, author:vcx_members(name, title, current_company, professional_fields, member_tier)')
    .eq('id', chatId)
    .single()

  if (!chat) return

  const { data: applicant } = await supabase
    .from('vcx_members')
    .select('name, title, current_company, professional_fields, member_tier')
    .eq('id', applicantId)
    .single()

  if (!applicant) return

  const author = Array.isArray(chat.author) ? chat.author[0] : chat.author
  if (!author) return

  const { hostBrief, applicantBrief } = await generateCoffeechatBrief({
    sessionTitle: chat.title,
    sessionDescription: chat.content ?? '',
    sessionTags: [chat.category].filter(Boolean),
    hostName: author.name,
    hostTitle: author.title ?? '',
    hostCompany: author.current_company ?? '',
    hostCompanyDesc: null,
    applicantName: applicant.name,
    applicantRole: applicant.title ?? '',
    applicantCompany: applicant.current_company ?? '',
    applicantSpecialties: (applicant.professional_fields as string[]) ?? [],
    applicantMemberTier: applicant.member_tier as 'core' | 'endorsed',
  })

  await (supabase.from('peer_coffee_applications') as unknown as PeerApplicationUpdateTable)
    .update({
      host_brief: hostBrief,
      applicant_brief: applicantBrief,
      brief_generated_at: new Date().toISOString(),
      brief_error: null,
    })
    .eq('id', appId)
}
