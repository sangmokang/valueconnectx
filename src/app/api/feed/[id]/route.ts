export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVcxUser } from '@/lib/auth/get-vcx-user'
import { notFound, unauthorized, serverError } from '@/lib/api/error'
import { isMissingSchemaError } from '@/lib/api/supabase-errors'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getVcxUser()
    if (!user) return unauthorized()

    const { id } = await params
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any

    const { data: item, error } = await supa
      .from('vcx_feed_items')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (isMissingSchemaError(error) || error.code === 'PGRST116') return notFound()
      console.error('Feed item GET error:', error)
      return serverError()
    }
    if (!item) return notFound()

    // 유저 반응 조회
    const { data: response } = await supa
      .from('vcx_feed_responses')
      .select('response')
      .eq('user_id', user.id)
      .eq('feed_item_id', id)
      .single()

    // 관심 카운트
    const { count } = await supa
      .from('vcx_feed_responses')
      .select('id', { count: 'exact', head: true })
      .eq('feed_item_id', id)
      .eq('response', 'yes')

    return NextResponse.json({
      data: {
        ...item,
        user_response: response?.response ?? null,
        interest_count: count ?? 0,
      },
    })
  } catch (err) {
    console.error('Feed item GET error:', err)
    return serverError()
  }
}
