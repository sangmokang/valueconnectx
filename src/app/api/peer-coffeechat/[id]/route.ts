import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { unauthorized, forbidden, notFound, badRequest, serverError } from '@/lib/api/error'

const updateChatSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  category: z.enum(['general', 'career', 'hiring', 'mentoring']).optional(),
  status: z.enum(['open', 'matched', 'closed']).optional(),
})

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

    const { data: chat, error } = await supabase
      .from('peer_coffee_chats')
      .select(`
        *,
        author:vcx_members(id, name, title, current_company, member_tier, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (error || !chat) {
      return notFound('글을 찾을 수 없습니다')
    }

    return NextResponse.json({ data: chat })
  } catch (error) {
    console.error('GET /api/peer-coffeechat/[id] error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return unauthorized('인증이 필요합니다')
    }

    const { id } = await params

    const { data: chat } = await supabase
      .from('peer_coffee_chats')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!chat) return notFound('글을 찾을 수 없습니다')
    if (chat.author_id !== user.id) return forbidden('수정 권한이 없습니다')

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest('유효하지 않은 요청 형식입니다')
    }

    const parsed = updateChatSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Validation error')
    }

    const { data: updated, error: updateError } = await supabase
      .from('peer_coffee_chats')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Peer chat update error:', updateError)
      return serverError('글 수정에 실패했습니다')
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT /api/peer-coffeechat/[id] error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return unauthorized('인증이 필요합니다')
    }

    const { id } = await params

    const { data: chat } = await supabase
      .from('peer_coffee_chats')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!chat) return notFound('글을 찾을 수 없습니다')
    if (chat.author_id !== user.id) return forbidden('삭제 권한이 없습니다')

    const { error: deleteError } = await supabase
      .from('peer_coffee_chats')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Peer chat delete error:', deleteError)
      return serverError('글 삭제에 실패했습니다')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/peer-coffeechat/[id] error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}
