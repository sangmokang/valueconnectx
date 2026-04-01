export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, serverError } from '@/lib/api/error'
import { parseSearchParams } from '@/lib/api/validation'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const parsed = parseSearchParams(searchParams, querySchema)
    if (parsed.error) return parsed.error

    const { page, limit } = parsed.data
    const offset = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any

    const { data: items, error: itemsError, count } = await supa
      .from('vcx_feed_items')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (itemsError) {
      console.error('Feed items query error:', itemsError)
      return serverError()
    }

    // 현재 유저의 반응 조회
    const itemIds = (items ?? []).map((i: { id: string }) => i.id)
    let responsesMap: Record<string, string> = {}

    if (itemIds.length > 0) {
      const { data: responses } = await supa
        .from('vcx_feed_responses')
        .select('feed_item_id, response')
        .eq('user_id', user.id)
        .in('feed_item_id', itemIds)

      if (responses) {
        responsesMap = Object.fromEntries(
          (responses as { feed_item_id: string; response: string }[]).map((r) => [r.feed_item_id, r.response])
        )
      }
    }

    const data = (items ?? []).map((item: { id: string }) => ({
      ...item,
      user_response: responsesMap[item.id] ?? null,
    }))

    return NextResponse.json({ data, total: count, page, limit })
  } catch (error) {
    console.error('Feed GET error:', error)
    return serverError()
  }
}
