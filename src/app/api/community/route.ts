import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, serverError } from '@/lib/api/error'
import { parseSearchParams, parseBody } from '@/lib/api/validation'

const VALID_CATEGORIES = ['career', 'leadership', 'salary', 'burnout', 'productivity', 'company_review'] as const

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.enum(VALID_CATEGORIES).optional(),
})

const postSchema = z.object({
  category: z.enum(VALID_CATEGORIES),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  is_anonymous: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    // Check if current user is a corporate user
    const { data: corporateUser } = await supabase
      .from('vcx_corporate_users')
      .select('id')
      .eq('id', user.id)
      .single()
    const isCorporateUser = !!corporateUser

    const { searchParams } = new URL(request.url)
    const parsed = parseSearchParams(searchParams, querySchema)
    if (parsed.error) return parsed.error

    const { page, limit, category } = parsed.data
    const offset = (page - 1) * limit

    let query = supabase
      .from('community_posts')
      .select(
        'id, author_id, category, title, content, is_anonymous, status, created_at, updated_at, likes_count, comments_count',
        { count: 'exact' }
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) query = query.eq('category', category)

    const { data, error, count } = await query
    if (error) {
      console.error('Community posts query error:', error)
      return serverError()
    }

    // Mask author_id for anonymous posts and company_review posts viewed by corporate users
    const posts = (data ?? []).map((post) => ({
      ...post,
      author_id:
        post.is_anonymous || (post.category === 'company_review' && isCorporateUser)
          ? null
          : post.author_id,
    }))

    return NextResponse.json({ data: posts, total: count, page, limit })
  } catch (error) {
    console.error('Community GET error:', error)
    return serverError()
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    // Verify member
    const { data: member } = await supabase
      .from('vcx_members')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()
    if (!member) return forbidden('VCX 멤버만 글을 작성할 수 있습니다')

    const parsed = await parseBody(request, postSchema)
    if (parsed.error) return parsed.error

    const { category, title, content, is_anonymous } = parsed.data

    const { data, error } = await supabase
      .from('community_posts')
      .insert({ author_id: user.id, category, title, content, is_anonymous })
      .select('id, category, title, is_anonymous, created_at')
      .single()

    if (error) {
      console.error('Community post insert error:', error)
      return serverError()
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Community POST error:', error)
    return serverError()
  }
}
