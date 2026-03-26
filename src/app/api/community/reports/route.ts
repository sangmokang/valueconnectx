import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unauthorized, forbidden, notFound, serverError } from '@/lib/api/error'
import { parseSearchParams, parseBody } from '@/lib/api/validation'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'reviewed', 'action_taken']).optional(),
})

const patchSchema = z.object({
  report_id: z.string().uuid(),
  action: z.enum(['hide_post', 'hide_comment', 'dismiss']),
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await getAdminUser(supabase)
    if (!admin) return forbidden('관리자 권한이 필요합니다')

    const { searchParams } = new URL(request.url)
    const parsed = parseSearchParams(searchParams, querySchema)
    if (parsed.error) return parsed.error

    const { page, limit, status } = parsed.data
    const offset = (page - 1) * limit

    const adminSupabase = createAdminClient()
    let query = adminSupabase
      .from('community_reports')
      .select(
        'id, reporter_id, post_id, comment_id, reason, status, created_at, community_posts(id, title, status), community_comments(id, content, status)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) {
      console.error('Reports GET error:', error)
      return serverError()
    }

    return NextResponse.json({ data, total: count, page, limit })
  } catch (error) {
    console.error('Reports GET error:', error)
    return serverError()
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await getAdminUser(supabase)
    if (!admin) return forbidden('관리자 권한이 필요합니다')

    const parsed = await parseBody(request, patchSchema)
    if (parsed.error) return parsed.error

    const { report_id, action } = parsed.data
    const adminSupabase = createAdminClient()

    // Fetch the report
    const { data: report, error: reportError } = await adminSupabase
      .from('community_reports')
      .select('id, post_id, comment_id, status')
      .eq('id', report_id)
      .single()

    if (reportError || !report) return notFound('신고를 찾을 수 없습니다')

    if (action === 'hide_post' && report.post_id) {
      const { error } = await adminSupabase
        .from('community_posts')
        .update({ status: 'hidden' })
        .eq('id', report.post_id)
      if (error) {
        console.error('Hide post error:', error)
        return serverError()
      }
    } else if (action === 'hide_comment' && report.comment_id) {
      const { error } = await adminSupabase
        .from('community_comments')
        .update({ status: 'hidden' })
        .eq('id', report.comment_id)
      if (error) {
        console.error('Hide comment error:', error)
        return serverError()
      }
    }

    // Mark report as processed
    const newStatus = action === 'dismiss' ? 'reviewed' : 'action_taken'
    const { data, error } = await adminSupabase
      .from('community_reports')
      .update({ status: newStatus })
      .eq('id', report_id)
      .select('id, status')
      .single()

    if (error) {
      console.error('Report PATCH error:', error)
      return serverError()
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Reports PATCH error:', error)
    return serverError()
  }
}
