import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashToken } from '@/lib/invite'
import { rateLimit, authLimiter } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
    const { success: rateLimitOk } = await rateLimit(authLimiter, `invite-verify:${ip}`)
    if (!rateLimitOk) return NextResponse.json({ error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })

    const adminClient = createAdminClient()
    const tokenHash = hashToken(token)

    const { data: invite, error } = await adminClient
      .from('vcx_invites')
      .select('email, invited_by_name, member_tier, expires_at, status')
      .eq('token_hash', tokenHash).single()

    if (error || !invite) return NextResponse.json({ valid: false, reason: '유효하지 않은 초대 링크입니다' })
    if (invite.status !== 'pending') return NextResponse.json({ valid: false, reason: '이미 사용된 초대 링크입니다' })
    if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ valid: false, reason: '초대가 만료되었습니다. 추천인에게 다시 요청해주세요.' })

    return NextResponse.json({ valid: true, email: invite.email, invitedByName: invite.invited_by_name, memberTier: invite.member_tier })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
