import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getVcxUser, isAdmin } from '@/lib/auth/get-vcx-user'
import { unauthorized, forbidden, serverError } from '@/lib/api/error'
import { crawlAllSources } from '@/lib/feed/crawler'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const user = await getVcxUser()
    if (!user) return unauthorized()
    if (!isAdmin(user)) return forbidden('관리자만 접근할 수 있습니다')

    const crawled = await crawlAllSources()
    if (crawled.length === 0) {
      return NextResponse.json({ inserted: 0, skipped: 0 })
    }

    const adminClient = createAdminClient()

    // 이미 존재하는 source_url 조회
    const sourceUrls = crawled.map((item) => item.source_url)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: fetchError } = await (adminClient as any)
      .from('vcx_feed_items')
      .select('source_url')
      .in('source_url', sourceUrls)

    if (fetchError) {
      console.error('Admin feed crawl existing check error:', fetchError)
      return serverError()
    }

    const existingUrls = new Set<string>(
      (existing as { source_url: string }[] | null)?.map((row) => row.source_url) ?? []
    )

    const newItems = crawled.filter((item) => !existingUrls.has(item.source_url))
    const skipped = crawled.length - newItems.length

    if (newItems.length === 0) {
      return NextResponse.json({ inserted: 0, skipped })
    }

    const rows = newItems.map((item) => ({
      company: item.source_name,
      role: item.headline,
      headline: item.headline,
      source_url: item.source_url,
      source_name: item.source_name,
      tags: item.tags,
      summary: item.summary,
      published_at: item.published_at,
      item_type: item.item_type,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (adminClient as any)
      .from('vcx_feed_items')
      .insert(rows)

    if (insertError) {
      console.error('Admin feed crawl insert error:', insertError)
      return serverError()
    }

    return NextResponse.json({ inserted: newItems.length, skipped })
  } catch (err) {
    console.error('Admin feed crawl unexpected error:', err)
    return serverError()
  }
}
