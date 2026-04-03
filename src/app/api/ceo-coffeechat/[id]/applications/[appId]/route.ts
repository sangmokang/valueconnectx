import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { unauthorized, forbidden, notFound, badRequest, serverError } from '@/lib/api/error'
import { sendNotification } from '@/lib/notification'
import { generateCoffeechatBrief } from '@/lib/ai/brief'

const updateStatusSchema = z.object({
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

    const { id: sessionId, appId } = await params

    // Verify caller is the host
    const { data: session } = await supabase
      .from('vcx_ceo_coffee_sessions')
      .select('id, host_id, title')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return notFound('세션을 찾을 수 없습니다')
    }
    if (session.host_id !== user.id) {
      return forbidden('호스트만 신청을 처리할 수 있습니다')
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest('유효하지 않은 요청 형식입니다')
    }

    const parsed = updateStatusSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Validation error')
    }

    const { status } = parsed.data

    const { data: application, error: updateError } = await supabase
      .from('vcx_coffee_applications')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', appId)
      .eq('session_id', sessionId)
      .select('id, applicant_id, status')
      .single()

    if (updateError || !application) {
      console.error('Application update error:', updateError)
      return serverError('신청 처리에 실패했습니다')
    }

    // Send notification via service layer (admin client, bypasses RLS)
    sendNotification(
      application.applicant_id,
      status === 'accepted' ? 'coffeechat_accepted' : 'coffeechat_rejected',
      {
        title: `커피챗 신청이 ${status === 'accepted' ? '수락' : '거절'}되었습니다`,
        body: session.title,
        link: `/ceo-coffeechat/${sessionId}`,
      }
    ).catch(() => {}) // fire-and-forget, non-blocking

    // Fetch applicant email for host when accepted
    let contactEmail: string | null = null
    if (status === 'accepted') {
      const adminClient = createAdminClient()
      const { data: applicantMember } = await adminClient
        .from('vcx_members')
        .select('email')
        .eq('id', application.applicant_id)
        .single()
      contactEmail = applicantMember?.email ?? null

      // AI Pre-Brief 비동기 생성 (fire-and-forget, 응답 지연 방지)
      generateCoffeechatBriefAsync(
        sessionId,
        appId,
        application.applicant_id
      ).catch((err) => console.error('Brief generation failed:', err))
    }

    return NextResponse.json({ data: { ...application, contact_email: contactEmail } })
  } catch (error) {
    console.error('PUT /applications/[appId] error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}

async function generateCoffeechatBriefAsync(
  sessionId: string,
  appId: string,
  applicantId: string
) {
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('vcx_ceo_coffee_sessions')
    .select('title, description, tags, host:vcx_corporate_users(name, title, company, company_desc)')
    .eq('id', sessionId)
    .single()

  if (!session) return

  const { data: member } = await supabase
    .from('vcx_members')
    .select('name, title, current_company, professional_fields, member_tier')
    .eq('id', applicantId)
    .single()

  if (!member) return

  const host = Array.isArray(session.host) ? session.host[0] : session.host
  if (!host) return

  const { hostBrief, applicantBrief } = await generateCoffeechatBrief({
    sessionTitle: session.title,
    sessionDescription: session.description ?? '',
    sessionTags: (session.tags as string[]) ?? [],
    hostName: host.name,
    hostTitle: host.title ?? '',
    hostCompany: host.company,
    hostCompanyDesc: host.company_desc,
    applicantName: member.name,
    applicantRole: member.title ?? '',
    applicantCompany: member.current_company ?? '',
    applicantSpecialties: (member.professional_fields as string[]) ?? [],
    applicantMemberTier: member.member_tier as 'core' | 'endorsed',
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('vcx_coffee_applications') as any)
    .update({
      host_brief: hostBrief,
      applicant_brief: applicantBrief,
      brief_generated_at: new Date().toISOString(),
    })
    .eq('id', appId)
}
