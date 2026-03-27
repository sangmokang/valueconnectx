import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { unauthorized, forbidden, badRequest, serverError } from '@/lib/api/error'

const createChatSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  content: z.string().min(1, '내용을 입력해주세요'),
  category: z.enum(['general', 'career', 'hiring', 'mentoring']).default('general'),
})

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const offset = (page - 1) * limit

    let query = supabase
      .from('peer_coffee_chats')
      .select(`
        *,
        author:vcx_members(id, name, title, current_company, member_tier, avatar_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category && ['general', 'career', 'hiring', 'mentoring'].includes(category)) {
      query = query.eq('category', category as 'general' | 'career' | 'hiring' | 'mentoring')
    }
    if (status && ['open', 'matched', 'closed'].includes(status)) {
      query = query.eq('status', status as 'open' | 'matched' | 'closed')
    }

    const { data: chats, error, count } = await query
    if (error) {
      console.error('Peer chats fetch error:', error)
      return serverError('목록 조회에 실패했습니다')
    }

    return NextResponse.json({ data: chats ?? [], total: count, page, limit })
  } catch (error) {
    console.error('GET /api/peer-coffeechat error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}

export async function POST(request: NextRequest) {
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

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest('유효하지 않은 요청 형식입니다')
    }

    const parsed = createChatSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Validation error')
    }

    const { data: chat, error: insertError } = await supabase
      .from('peer_coffee_chats')
      .insert({
        author_id: user.id,
        title: parsed.data.title,
        content: parsed.data.content,
        category: parsed.data.category,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Peer chat insert error:', insertError)
      return serverError('글 작성에 실패했습니다')
    }

    return NextResponse.json({ data: chat }, { status: 201 })
  } catch (error) {
    console.error('POST /api/peer-coffeechat error:', error)
    return serverError('서버 오류가 발생했습니다')
  }
}
