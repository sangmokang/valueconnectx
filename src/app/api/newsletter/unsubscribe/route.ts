export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 수신 거부 확인 페이지로 리다이렉트
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t') ?? ''
  return NextResponse.redirect(new URL(`/newsletter/unsubscribe?t=${token}`, request.url))
}

// POST: 실제 수신 거부 처리 (확인 페이지에서 호출)
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t')
  if (!token) {
    return NextResponse.json({ error: '토큰이 필요합니다' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data: recipient } = await (supabase as any).rpc('vcx_get_recipient_by_token', { p_token: token })

    if (!recipient?.id) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 404 })
    }

    if (recipient.unsubscribed_at) {
      return NextResponse.json({ message: '이미 수신 거부 처리되었습니다' })
    }

    const now = new Date().toISOString()
    await Promise.all([
      (supabase as any)
        .from('vcx_newsletter_recipients')
        .update({ unsubscribed_at: now })
        .eq('id', recipient.id),
      // 구독 테이블도 비활성화
      recipient.subscription_id
        ? (supabase as any)
            .from('vcx_feed_subscriptions')
            .update({ active: false })
            .eq('id', recipient.subscription_id)
        : Promise.resolve(),
      (supabase as any).from('vcx_newsletter_events').insert({
        recipient_id: recipient.id,
        type: 'unsubscribe',
      }),
    ])

    return NextResponse.json({ message: '수신 거부가 완료되었습니다' })
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error)
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다' }, { status: 500 })
  }
}
