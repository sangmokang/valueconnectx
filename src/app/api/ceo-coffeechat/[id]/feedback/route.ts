import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { unauthorized, badRequest, conflict, serverError, forbidden } from '@/lib/api/error'

const feedbackSchema = z.object({
  applicationId: z.string().uuid(),
  overallRating: z.number().int().min(1).max(5),
  cultureFitScore: z.number().int().min(1).max(5).optional(),
  wouldConnectAgain: z.boolean().optional(),
  feedbackTags: z.array(z.string()).default([]),
  comment: z.string().max(500).optional(),
  briefHelpful: z.boolean().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const { id: sessionId } = await params

    let body: unknown
    try { body = await request.json() } catch { return badRequest('유효하지 않은 요청 형식입니다') }

    const parsed = feedbackSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? '검증 오류')

    const { applicationId, overallRating, cultureFitScore, wouldConnectAgain, feedbackTags, comment, briefHelpful } = parsed.data

    // 세션 완료 상태 확인
    const { data: session } = await supabase
      .from('vcx_ceo_coffee_sessions')
      .select('id, host_id, status')
      .eq('id', sessionId)
      .single()

    if (!session || session.status !== 'completed') {
      return forbidden('완료된 세션에만 피드백을 작성할 수 있습니다')
    }

    const isHost = session.host_id === user.id
    const reviewerRole = isHost ? 'host' : 'applicant'

    // 신청 검증
    const { data: application } = await supabase
      .from('vcx_coffee_applications')
      .select('id, applicant_id, status')
      .eq('id', applicationId)
      .eq('session_id', sessionId)
      .single()

    if (!application || application.status !== 'accepted') {
      return forbidden('유효하지 않은 신청입니다')
    }

    if (!isHost && application.applicant_id !== user.id) {
      return forbidden('이 신청에 대한 피드백 권한이 없습니다')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('vcx_coffeechat_feedback')
      .insert({
        session_id: sessionId,
        application_id: applicationId,
        reviewer_id: user.id,
        reviewer_role: reviewerRole,
        overall_rating: overallRating,
        culture_fit_score: cultureFitScore,
        would_connect_again: wouldConnectAgain,
        feedback_tags: feedbackTags,
        comment,
        brief_helpful: briefHelpful,
      })

    if (insertError) {
      const pgError = insertError as { code?: string }
      if (pgError.code === '23505') return conflict('이미 피드백을 제출했습니다')
      console.error('Feedback insert error:', insertError)
      return serverError()
    }

    return NextResponse.json({ success: true })
  } catch {
    return serverError()
  }
}
