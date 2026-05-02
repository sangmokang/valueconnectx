export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 클릭 추적 허용 도메인 (open redirect 방지)
const ALLOWED_HOSTS = [
  'valueconnectx.com',
  'www.valueconnectx.com',
  'localhost',
]

function isSafeUrl(raw: string | null): boolean {
  if (!raw) return false
  try {
    const url = new URL(raw)
    return ALLOWED_HOSTS.includes(url.hostname)
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t')
  const encodedUrl = request.nextUrl.searchParams.get('u')
  const destination = encodedUrl ? decodeURIComponent(encodedUrl) : null

  if (!isSafeUrl(destination)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (token) {
    try {
      const supabase = await createClient()
      const { data: recipient } = await supabase.rpc('vcx_get_recipient_by_token', { p_token: token })

      if (recipient?.id) {
        await Promise.all([
          recipient.first_clicked_at
            ? Promise.resolve()
            : supabase
                .from('vcx_newsletter_recipients')
                .update({ first_clicked_at: new Date().toISOString() })
                .eq('id', recipient.id),
          supabase.from('vcx_newsletter_events').insert({
            recipient_id: recipient.id,
            type: 'click',
            url: destination,
            user_agent: request.headers.get('user-agent') ?? null,
          }),
        ])
      }
    } catch {
      // 트래킹 실패 무시 — 리다이렉트는 항상 수행
    }
  }

  return NextResponse.redirect(destination!, { status: 302 })
}
