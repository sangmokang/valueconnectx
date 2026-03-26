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
      .select('author_id')
      .eq('id', id)
      .single()

    if (!chat) return notFound('글을 찾을 수 없습니다')
    if (chat.author_id !== user.id) return forbidden('작성자만 신청 목록을 확인할 수 있습니다')

    const { data: applications, error } = await supabase
      .from('peer_coffee_applications')
      .select(`
        *,
        applicant:vcx_members(id, name, email, title, current_company, member_tier, avatar_url)
      `)
      .eq('chat_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Peer applications fetch error:', error)
      return serverError('신청 목록 조회에 실패했습니다')
    }

    return NextResponse.json({ data: applications ?? [] })
  } catch (error) {
    console.error('GET /api/peer-coffeechat/[id]/applications error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}
