export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getVcxUser } from '@/lib/auth/get-vcx-user'
import { unauthorized, serverError } from '@/lib/api/error'
import { parseSearchParams } from '@/lib/api/validation'
import { isMissingSchemaError } from '@/lib/api/supabase-errors'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  tags: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return undefined
      const tags = value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
      return tags.length > 0 ? tags : undefined
    },
    z.array(z.string().min(1, '태그를 입력해주세요')).max(10, '태그는 최대 10개까지 선택할 수 있습니다').optional()
  ),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getVcxUser()
    if (!user) return unauthorized()

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const parsed = parseSearchParams(searchParams, querySchema)
    if (parsed.error) return parsed.error

    const { page, limit, tags } = parsed.data
    const offset = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any

    let query = supa
      .from('vcx_feed_items')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false })

    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags)
    }

    const { data: items, error: itemsError, count } = await query
      .range(offset, offset + limit - 1)

    if (itemsError) {
      if (isMissingSchemaError(itemsError)) {
        return NextResponse.json({ data: [], total: 0, page, limit })
      }

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
