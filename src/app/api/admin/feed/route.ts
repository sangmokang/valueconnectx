import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unauthorized, forbidden, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'

export const dynamic = 'force-dynamic'

async function authorizeAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, error: unauthorized() }

  const { data: member, error: memberError } = await supabase
    .from('vcx_members')
    .select('system_role')
    .eq('id', user.id)
    .in('system_role', ['super_admin', 'admin'])
    .single()

  if (memberError && memberError.code !== 'PGRST116') return { user: null, error: serverError() }
  if (!member) return { user: null, error: forbidden('관리자만 접근할 수 있습니다') }

  return { user, error: null }
}

const nullableText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullish()

const tagsSchema = z
  .array(z.string().trim().min(1, '빈 태그는 추가할 수 없습니다'))
  .max(10, '태그는 최대 10개까지 입력할 수 있습니다')
  .default([])

const createFeedItemSchema = z.object({
  company: z.string().trim().min(1, '회사명을 입력해주세요'),
  company_tag: nullableText,
  role: z.string().trim().min(1, '역할을 입력해주세요'),
  level: nullableText,
  team_size: nullableText,
  salary_band: nullableText,
  location: nullableText,
  tags: tagsSchema,
  summary: nullableText,
  exclusive: z.boolean().default(false),
  published_at: z.string().datetime().optional().nullable(),
}).strict()

export async function GET() {
  try {
    const supabase = await createClient()
    const admin = await authorizeAdmin(supabase)
    if (admin.error) return admin.error

    const adminClient = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminClient as any)
      .from('vcx_feed_items')
      .select('*')
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Admin feed GET error:', error)
      return serverError()
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (err) {
    console.error('Admin feed GET unexpected error:', err)
    return serverError()
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await authorizeAdmin(supabase)
    if (admin.error) return admin.error

    const parsed = await parseBody(request, createFeedItemSchema)
    if (parsed.error) return parsed.error

    const adminClient = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminClient as any)
      .from('vcx_feed_items')
      .insert({
        ...parsed.data,
        created_by: admin.user.id,
        published_at: parsed.data.published_at ?? new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Admin feed POST error:', error)
      return serverError()
    }

    return NextResponse.json({ item: data }, { status: 201 })
  } catch (err) {
    console.error('Admin feed POST unexpected error:', err)
    return serverError()
  }
}
