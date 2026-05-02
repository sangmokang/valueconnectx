export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 1×1 투명 PNG (base64)
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
)

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t')

  if (token) {
    try {
      const supabase = await createClient()
      // service_role 함수로 토큰 조회
      const { data: recipient } = await supabase.rpc('vcx_get_recipient_by_token', { p_token: token })

      if (recipient?.id) {
        await Promise.all([
          // opened_at 최초 1회만 기록
          recipient.opened_at
            ? Promise.resolve()
            : supabase
                .from('vcx_newsletter_recipients')
                .update({ opened_at: new Date().toISOString() })
                .eq('id', recipient.id),
          // 이벤트 append
          supabase.from('vcx_newsletter_events').insert({
            recipient_id: recipient.id,
            type: 'open',
            user_agent: request.headers.get('user-agent') ?? null,
          }),
        ])
      }
    } catch {
      // 트래킹 실패는 조용히 무시 — 픽셀은 항상 반환
    }
  }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
