import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, notFound, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'
import { sendNotification } from '@/lib/notification'

const commentSchema = z.object({
  content: z.string().min(1).max(5000),
  is_anonymous: z.boolean().default(false),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const { data: post } = await supabase
      .from('community_posts')
      .select('id')
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (!post) return notFound('게시글을 찾을 수 없습니다')

    const { data: comments, error } = await supabase
      .from('community_comments')
      .select('id, post_id, author_id, content, is_anonymous, status, created_at')
      .eq('post_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Comments query error:', error)
      return serverError()
    }

    const masked = (comments ?? []).map((c) => ({
      ...c,
      author_id: c.is_anonymous ? null : c.author_id,
    }))

    return NextResponse.json({ data: masked })
  } catch (error) {
    console.error('Comments GET error:', error)
    return serverError()
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const { data: member } = await supabase
      .from('vcx_members')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()
    if (!member) return forbidden('VCX 멤버만 댓글을 작성할 수 있습니다')

    const { data: post } = await supabase
      .from('community_posts')
      .select('id')
      .eq('id', id)
      .eq('status', 'active')
      .single()
    if (!post) return notFound('게시글을 찾을 수 없습니다')

    const parsed = await parseBody(request, commentSchema)
    if (parsed.error) return parsed.error

    const { content, is_anonymous } = parsed.data

    const { data, error } = await supabase
      .from('community_comments')
      .insert({ post_id: id, author_id: user.id, content, is_anonymous })
      .select('id, post_id, is_anonymous, created_at')
      .single()

    if (error) {
      console.error('Comment insert error:', error)
      return serverError()
    }

    // Notify post author (fire-and-forget, skip self-comment)
    const { data: postForNotify } = await supabase
      .from('community_posts')
      .select('author_id')
      .eq('id', id)
      .single()
    if (postForNotify && postForNotify.author_id !== user.id) {
      sendNotification(postForNotify.author_id, 'community_comment', {
        title: '새 댓글이 달렸습니다',
        link: `/community/${id}`,
      }).catch(() => {})
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Comments POST error:', error)
    return serverError()
  }
}
