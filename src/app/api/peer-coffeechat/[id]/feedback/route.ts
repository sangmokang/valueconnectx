import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { unauthorized, badRequest, conflict, serverError, forbidden } from '@/lib/api/error'

const feedbackSchema = z.object({
  applicationId: z.string().uuid(),
  overallRating: z.number().int().min(1).max(5),
  wouldConnectAgain: z.boolean().optional(),
  feedbackTags: z.array(z.string()).default([]),
  comment: z.string().max(500).optional(),
  briefHelpful: z.boolean().optional(),
})

type PeerFeedbackInsertTable = {
  insert: (values: Record<string, unknown>) => Promise<{ error: unknown }>
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const { id: chatId } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest('유효하지 않은 요청 형식입니다')
    }

    const parsed = feedbackSchema.safeParse(body)
    if (!parsed.success) return badRequest('피드백 입력값을 확인해주세요', parsed.error.issues)

    const { applicationId, overallRating, wouldConnectAgain, feedbackTags, comment, briefHelpful } = parsed.data

    const { data: chat } = await supabase
      .from('peer_coffee_chats')
      .select('id, author_id, status')
      .eq('id', chatId)
      .single()

    if (!chat || chat.status !== 'closed') {
      return forbidden('완료된 커피챗에만 피드백을 작성할 수 있습니다')
    }

    const isHost = chat.author_id === user.id
    const reviewerRole = isHost ? 'host' : 'applicant'

    const { data: application } = await supabase
      .from('peer_coffee_applications')
      .select('id, applicant_id, status')
      .eq('id', applicationId)
      .eq('chat_id', chatId)
      .single()

    if (!application || application.status !== 'accepted') {
      return forbidden('유효하지 않은 신청입니다')
    }

    if (!isHost && application.applicant_id !== user.id) {
      return forbidden('이 신청에 대한 피드백 권한이 없습니다')
    }

    const { error: insertError } = await (supabase.from('peer_coffeechat_feedback') as unknown as PeerFeedbackInsertTable)
      .insert({
        chat_id: chatId,
        application_id: applicationId,
        reviewer_id: user.id,
        reviewer_role: reviewerRole,
        overall_rating: overallRating,
        would_connect_again: wouldConnectAgain,
        feedback_tags: feedbackTags,
        comment,
        brief_helpful: briefHelpful,
      })

    if (insertError) {
      const pgError = insertError as { code?: string }
      if (pgError.code === '23505') return conflict('이미 피드백을 제출했습니다')
      console.error('Peer feedback insert error:', insertError)
      return serverError()
    }

    return NextResponse.json({ success: true })
  } catch {
    return serverError()
  }
}
