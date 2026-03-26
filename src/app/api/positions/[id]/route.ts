import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, notFound, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'

const updateSchema = z.object({
  company_name: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  team_size: z.string().optional(),
  role_description: z.string().min(1).optional(),
  salary_range: z.string().optional(),
  status: z.enum(['active', 'closed', 'draft']).optional(),
})

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('vcx_members')
    .select('system_role')
    .eq('id', userId)
    .in('system_role', ['super_admin', 'admin'])
    .single()
  return !!data
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (!member) return forbidden('VCX 멤버만 접근할 수 있습니다')

    const { id } = await params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any

    const { data, error } = await supa
      .from('positions')
      .select('id, company_name, title, team_size, role_description, salary_range, status, created_at, updated_at')
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (error || !data) return notFound('포지션을 찾을 수 없습니다')

    // Fetch user's interest
    const { data: interest } = await supa
      .from('position_interests')
      .select('interest_type')
      .eq('position_id', id)
      .eq('user_id', user.id)
      .single()

    // Fetch interest counts
    const { data: counts } = await supa
      .from('position_interests')
      .select('interest_type')
      .eq('position_id', id)

    const interestCounts = { interested: 0, not_interested: 0, bookmark: 0 }
    if (counts) {
      for (const c of counts as { interest_type: string }[]) {
        interestCounts[c.interest_type as keyof typeof interestCounts]++
      }
    }

    return NextResponse.json({
      data: {
        ...data,
        my_interest: (interest as { interest_type?: string } | null)?.interest_type ?? null,
        interest_counts: interestCounts,
      },
    })
  } catch (err) {
    console.error('Positions [id] GET error:', err)
    return serverError()
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const admin = await isAdmin(supabase, user.id)
    if (!admin) return forbidden('관리자만 포지션을 수정할 수 있습니다')

    const { id } = await params
    const parsed = await parseBody(request, updateSchema)
    if (parsed.error) return parsed.error

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('positions')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return notFound('포지션을 찾을 수 없습니다')

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Positions [id] PUT error:', err)
    return serverError()
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const admin = await isAdmin(supabase, user.id)
    if (!admin) return forbidden('관리자만 포지션을 삭제할 수 있습니다')

    const { id } = await params

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('positions')
      .delete()
      .eq('id', id)

    if (error) return notFound('포지션을 찾을 수 없습니다')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Positions [id] DELETE error:', err)
    return serverError()
  }
}
