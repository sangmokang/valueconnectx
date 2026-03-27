import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { forbidden, notFound, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'

const patchSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'paid', 'cancelled']),
})

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const admin = await getAdminUser(supabase)
    if (!admin) return forbidden('관리자 권한이 필요합니다')

    const { id } = await params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminSupabase = createAdminClient() as any
    const { data, error } = await adminSupabase
      .from('vcx_hiring_records')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return notFound('채용 기록을 찾을 수 없습니다')

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Hiring record GET error:', error)
    return serverError()
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const admin = await getAdminUser(supabase)
    if (!admin) return forbidden('관리자 권한이 필요합니다')

    const { id } = await params

    const parsed = await parseBody(request, patchSchema)
    if (parsed.error) return parsed.error

    const { status } = parsed.data

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminSupabase = createAdminClient() as any

    // Verify record exists
    const { data: existing, error: fetchError } = await adminSupabase
      .from('vcx_hiring_records')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError || !existing) return notFound('채용 기록을 찾을 수 없습니다')

    const updatePayload: { status: string; confirmed_at?: string } = { status }
    if (status === 'confirmed') {
      updatePayload.confirmed_at = new Date().toISOString()
    }

    const { data, error } = await adminSupabase
      .from('vcx_hiring_records')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Hiring record PATCH error:', error)
      return serverError()
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Hiring record PATCH error:', error)
    return serverError()
  }
}
