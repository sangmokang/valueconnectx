import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unauthorized, forbidden, serverError } from '@/lib/api/error'
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

const createFeedItemSchema = z.object({
  company: z.string().min(1, '회사명을 입력해주세요'),
  company_tag: z.string().optional().nullable(),
  role: z.string().min(1, '역할을 입력해주세요'),
  level: z.string().optional().nullable(),
  team_size: z.string().optional().nullable(),
  salary_band: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  summary: z.string().optional().nullable(),
  exclusive: z.boolean().default(false),
  published_at: z.string().datetime().optional().nullable(),
})

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminUser = await getAdminUser(supabase)
    if (!adminUser) return unauthorized()

    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
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
    const adminUser = await getAdminUser(supabase)
    if (!adminUser) return unauthorized()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return forbidden()

    const parsed = await parseBody(request, createFeedItemSchema)
    if (parsed.error) return parsed.error

    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('vcx_feed_items')
      .insert({
        ...parsed.data,
        created_by: user.id,
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
