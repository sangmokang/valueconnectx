import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unauthorized, notFound, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'

export const dynamic = 'force-dynamic'

async function getAdminUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: member } = await supabase
    .from('vcx_members')
    .select('system_role')
    .eq('id', user.id)
    .in('system_role', ['super_admin', 'admin'])
    .single()

  return member ? user : null
}

const updateFeedItemSchema = z.object({
  company: z.string().min(1, '회사명을 입력해주세요').optional(),
  company_tag: z.string().optional().nullable(),
  role: z.string().min(1, '역할을 입력해주세요').optional(),
  level: z.string().optional().nullable(),
  team_size: z.string().optional().nullable(),
  salary_band: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional().nullable(),
  exclusive: z.boolean().optional(),
  published_at: z.string().datetime().optional().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const adminUser = await getAdminUser(supabase)
    if (!adminUser) return unauthorized()

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
    const supabase = await createClient()
    const adminUser = await getAdminUser(supabase)
    if (!adminUser) return unauthorized()

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
