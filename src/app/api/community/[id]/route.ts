import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, notFound, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'

const VALID_CATEGORIES = ['career', 'leadership', 'salary', 'burnout', 'productivity', 'company_review'] as const

const updateSchema = z.object({
  category: z.enum(VALID_CATEGORIES).optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  is_anonymous: z.boolean().optional(),
  status: z.enum(['active', 'hidden', 'deleted']).optional(),
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

    // Check if current user is a corporate user
    const { data: corporateUser } = await supabase
      .from('vcx_corporate_users')
      .select('id')
      .eq('id', user.id)
      .single()
    const isCorporateUser = !!corporateUser

    const { data: post, error } = await supabase
      .from('community_posts')
      .select('id, author_id, category, title, content, is_anonymous, status, created_at, updated_at')
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (error || !post) return notFound('게시글을 찾을 수 없습니다')

    return NextResponse.json({
      data: {
        ...post,
        author_id:
          post.is_anonymous || (post.category === 'company_review' && isCorporateUser)
            ? null
            : post.author_id,
      }
    })
  } catch (error) {
    console.error('Community GET [id] error:', error)
    return serverError()
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const { data: post } = await supabase
      .from('community_posts')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!post) return notFound('게시글을 찾을 수 없습니다')

    // Check admin or owner
    const { data: adminMember } = await supabase
      .from('vcx_members')
      .select('system_role')
      .eq('id', user.id)
      .in('system_role', ['super_admin', 'admin'])
      .single()

    if (post.author_id !== user.id && !adminMember) {
      return forbidden('수정 권한이 없습니다')
    }

    const parsed = await parseBody(request, updateSchema)
    if (parsed.error) return parsed.error

    const { data, error } = await supabase
      .from('community_posts')
      .update(parsed.data)
      .eq('id', id)
      .select('id, category, title, is_anonymous, status, updated_at')
      .single()

    if (error) {
      console.error('Community PUT error:', error)
      return serverError()
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Community PUT [id] error:', error)
    return serverError()
  }
}

export async function DELETE(
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
      .select('author_id')
      .eq('id', id)
      .single()

    if (!post) return notFound('게시글을 찾을 수 없습니다')

    const { data: adminMember } = await supabase
      .from('vcx_members')
      .select('system_role')
      .eq('id', user.id)
      .in('system_role', ['super_admin', 'admin'])
      .single()

    if (post.author_id !== user.id && !adminMember) {
      return forbidden('삭제 권한이 없습니다')
    }

    const { error } = await supabase
      .from('community_posts')
      .update({ status: 'deleted' })
      .eq('id', id)

    if (error) {
      console.error('Community DELETE error:', error)
      return serverError()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Community DELETE [id] error:', error)
    return serverError()
  }
}
