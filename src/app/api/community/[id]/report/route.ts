import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'

const reportSchema = z.object({
  reason: z.string().min(1).max(500),
  comment_id: z.string().uuid().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const { data: member } = await supabase
      .from('vcx_members')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()
    if (!member) return forbidden('VCX 멤버만 신고할 수 있습니다')

    const parsed = await parseBody(request, reportSchema)
    if (parsed.error) return parsed.error

    const { reason, comment_id } = parsed.data

    const { data, error } = await supabase
      .from('community_reports')
      .insert({
        reporter_id: user.id,
        post_id: comment_id ? null : id,
        comment_id: comment_id ?? null,
        reason,
      })
      .select('id, created_at')
      .single()

    if (error) {
      console.error('Report insert error:', error)
      return serverError()
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Report POST error:', error)
    return serverError()
  }
}
