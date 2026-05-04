export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getVcxUser, isAdmin } from '@/lib/auth/get-vcx-user'
import { unauthorized, forbidden, serverError } from '@/lib/api/error'
import { runCuration } from '@/lib/feed/curator'

export async function POST() {
  // 1. 관리자 인증
  const user = await getVcxUser()
  if (!user) return unauthorized()
  if (!isAdmin(user)) return forbidden('관리자만 접근할 수 있습니다')

  // 2. 큐레이션 실행
  const items = await runCuration()
  if (items.length === 0) {
    return NextResponse.json({ inserted: 0, message: '큐레이션할 기사가 없습니다' })
  }

  // 3. DB 삽입 (중복 URL 스킵 — source_url이 같으면 upsert 무시)
  const adminClient = createAdminClient()
  const toInsert = items.map((item) => ({
    ...item,
    created_by: user.id,
    published_at: new Date().toISOString(),
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('vcx_feed_items')
    .upsert(toInsert, { onConflict: 'source_url', ignoreDuplicates: true })
    .select('id')

  if (error) {
    console.error('Feed curate insert error:', error)
    return serverError()
  }

  return NextResponse.json(
    {
      inserted: (data ?? []).length,
      message: `${(data ?? []).length}건의 뉴스가 피드에 추가되었습니다`,
    },
    { status: 201 },
  )
}
