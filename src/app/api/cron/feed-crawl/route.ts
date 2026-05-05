import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { crawlAllSources } from '@/lib/feed/crawler'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const crawled = await crawlAllSources()
    if (crawled.length === 0) {
      return NextResponse.json({ ok: true, inserted: 0 })
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
      console.error('Cron feed crawl existing check error:', fetchError)
      return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
    }

    const existingUrls = new Set<string>(
      (existing as { source_url: string }[] | null)?.map((row) => row.source_url) ?? []
    )

    const newItems = crawled.filter((item) => !existingUrls.has(item.source_url))

    if (newItems.length === 0) {
      return NextResponse.json({ ok: true, inserted: 0 })
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
      console.error('Cron feed crawl insert error:', insertError)
      return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, inserted: newItems.length })
  } catch (err) {
    console.error('Cron feed crawl unexpected error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
