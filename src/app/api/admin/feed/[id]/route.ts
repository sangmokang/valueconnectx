import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getVcxUser, isAdmin } from '@/lib/auth/get-vcx-user'
import { unauthorized, forbidden, notFound, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'

export const dynamic = 'force-dynamic'

async function authorizeAdmin() {
  const user = await getVcxUser()
  if (!user) return { error: unauthorized() }
  if (!isAdmin(user)) return { error: forbidden('관리자만 접근할 수 있습니다') }

  return { error: null }
}

const nullableText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullish()

const updateFeedItemSchema = z.object({
  company: z.string().trim().min(1, '회사명을 입력해주세요').optional(),
  company_tag: nullableText,
  role: z.string().trim().min(1, '역할을 입력해주세요').optional(),
  level: nullableText,
  team_size: nullableText,
  salary_band: nullableText,
  location: nullableText,
  tags: z.array(z.string().trim().min(1, '빈 태그는 추가할 수 없습니다')).max(10, '태그는 최대 10개까지 입력할 수 있습니다').optional(),
  summary: nullableText,
  exclusive: z.boolean().optional(),
  published_at: z.string().datetime().optional().nullable(),
}).strict()

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await authorizeAdmin()
    if (adminAuth.error) return adminAuth.error

    const { id } = await params
    const parsed = await parseBody(request, updateFeedItemSchema)
    if (parsed.error) return parsed.error

    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('vcx_feed_items')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') return notFound('피드 아이템을 찾을 수 없습니다')
      console.error('Admin feed PATCH error:', error)
      return serverError()
    }

    return NextResponse.json({ item: data })
  } catch (err) {
    console.error('Admin feed PATCH unexpected error:', err)
    return serverError()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await authorizeAdmin()
    if (adminAuth.error) return adminAuth.error

    const { id } = await params
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('vcx_feed_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Admin feed DELETE error:', error)
      return serverError()
    }

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('Admin feed DELETE unexpected error:', err)
    return serverError()
  }
}
