import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'
import { sendNotification } from '@/lib/notification'

const reactionSchema = z.object({
  reaction_type: z.enum(['like']).default('like'),
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data, error } = await db
      .from('vcx_community_reactions')
      .select('reaction_type, user_id')
      .eq('post_id', id)

    if (error) {
      console.error('Reaction GET error:', error)
      return serverError()
    }

    // Count by reaction_type
    const counts: Record<string, number> = {}
    const userReactions: string[] = []
    const rows = (data ?? []) as { reaction_type: string; user_id: string }[]
    for (const r of rows) {
      counts[r.reaction_type] = (counts[r.reaction_type] ?? 0) + 1
      if (r.user_id === user.id) userReactions.push(r.reaction_type)
    }

    return NextResponse.json({ counts, userReactions })
  } catch (error) {
    console.error('Reaction GET error:', error)
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
    if (!member) return forbidden('VCX 멤버만 반응할 수 있습니다')

    const parsed = await parseBody(request, reactionSchema)
    if (parsed.error) return parsed.error

    const { reaction_type } = parsed.data

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    // Check if reaction already exists
    const { data: existing } = await db
      .from('vcx_community_reactions')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .eq('reaction_type', reaction_type)
      .single()

    if (existing) {
      // Toggle off — delete
      const { error } = await db
        .from('vcx_community_reactions')
        .delete()
        .eq('post_id', id)
        .eq('user_id', user.id)
        .eq('reaction_type', reaction_type)
      if (error) {
        console.error('Reaction delete error:', error)
        return serverError()
      }
      return NextResponse.json({ action: 'removed', reaction_type })
    } else {
      // Toggle on — insert
      const { error } = await db
        .from('vcx_community_reactions')
        .insert({ post_id: id, user_id: user.id, reaction_type })
      if (error) {
        console.error('Reaction insert error:', error)
        return serverError()
      }
      // Notify post author (fire-and-forget, skip self-reaction)
      const { data: postForNotify } = await supabase
        .from('community_posts')
        .select('author_id')
        .eq('id', id)
        .single()
      if (postForNotify && postForNotify.author_id !== user.id) {
        sendNotification(postForNotify.author_id, 'community_reaction', {
          title: '게시글에 좋아요가 달렸습니다',
          link: `/community/${id}`,
        }).catch(() => {})
      }

      return NextResponse.json({ action: 'added', reaction_type }, { status: 201 })
    }
  } catch (error) {
    console.error('Reaction POST error:', error)
    return serverError()
  }
}
