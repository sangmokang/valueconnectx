import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, notFound, forbidden, serverError } from '@/lib/api/error'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const { id: sessionId } = await params

    // 세션 조회 (host_id 확인용)
    const { data: session } = await supabase
      .from('vcx_ceo_coffee_sessions')
      .select('host_id')
      .eq('id', sessionId)
      .single()

    if (!session) return notFound('세션을 찾을 수 없습니다')

    const isHost = session.host_id === user.id

    // 수락된 신청 중 현재 사용자 관련 brief 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error } = await (supabase as any)
      .from('vcx_coffee_applications')
      .select('id, applicant_id, host_brief, applicant_brief, brief_generated_at, status')
      .eq('session_id', sessionId)
      .eq('status', 'accepted')
      .eq(isHost ? 'session_id' : 'applicant_id', isHost ? sessionId : user.id)
      .maybeSingle() as { data: { id: string; applicant_id: string; host_brief: string | null; applicant_brief: string | null; brief_generated_at: string | null; status: string } | null; error: unknown }

    if (error) return serverError('브리프 조회에 실패했습니다')

    if (!isHost && !application) {
      return forbidden('이 세션의 브리프에 접근할 권한이 없습니다')
    }

    if (!application) {
      return NextResponse.json({ brief: null, briefGeneratedAt: null })
    }

    const brief = isHost ? application.host_brief : application.applicant_brief

    return NextResponse.json({
      brief,
      briefGeneratedAt: application.brief_generated_at,
      applicationId: application.id,
    })
  } catch {
    return serverError()
  }
}
