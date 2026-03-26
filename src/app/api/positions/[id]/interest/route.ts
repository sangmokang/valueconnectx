import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'

const interestSchema = z.object({
  interest_type: z.enum(['interested', 'not_interested', 'bookmark']),
})

export async function POST(
  request: NextRequest,
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

    const { id: position_id } = await params
    const parsed = await parseBody(request, interestSchema)
    if (parsed.error) return parsed.error

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('position_interests')
      .upsert(
        { position_id, user_id: user.id, interest_type: parsed.data.interest_type },
        { onConflict: 'position_id,user_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Interest POST error:', error)
      return serverError()
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('Interest POST error:', err)
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

    // Verify member
    const { data: member } = await supabase
      .from('vcx_members')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()
    if (!member) return forbidden('VCX 멤버만 접근할 수 있습니다')

    const { id: position_id } = await params

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('position_interests')
      .delete()
      .eq('position_id', position_id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Interest DELETE error:', error)
      return serverError()
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Interest DELETE error:', err)
    return serverError()
  }
}
