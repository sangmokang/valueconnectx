import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, serverError } from '@/lib/api/error'
import { isMissingSchemaError } from '@/lib/api/supabase-errors'

export const dynamic = 'force-dynamic'

export type MyCommunityPost = {
  id: string
  title: string
  category: string
  status: string
  created_at: string
  likes_count: number | null
  comments_count: number | null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const { data, error } = await supabase
      .from('community_posts')
      .select('id, title, category, status, created_at, likes_count, comments_count')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      if (isMissingSchemaError(error)) {
        return NextResponse.json({ data: [] })
      }
      console.error('My community GET error:', error)
      return serverError()
    }

    return NextResponse.json({ data: (data ?? []) as MyCommunityPost[] })
  } catch (error) {
    console.error('GET /api/me/community error:', error)
    return serverError()
  }
}
