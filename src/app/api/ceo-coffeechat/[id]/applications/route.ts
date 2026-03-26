import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, notFound, serverError } from '@/lib/api/error'

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

    const { id: sessionId } = await params

    // Verify caller is the host
    const { data: session } = await supabase
      .from('vcx_ceo_coffee_sessions')
      .select('id, host_id')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return notFound('세션을 찾을 수 없습니다')
    }
    if (session.host_id !== user.id) {
      return forbidden('호스트만 신청 목록을 조회할 수 있습니다')
    }

    const { data: applications, error } = await supabase
      .from('vcx_coffee_applications')
      .select(`
        *,
        applicant:vcx_members(id, name, email, title, current_company, member_tier, avatar_url)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Applications fetch error:', error)
      return serverError('신청 목록 조회에 실패했습니다')
    }

    return NextResponse.json({ data: applications ?? [] })
  } catch (error) {
    console.error('GET /applications error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}
