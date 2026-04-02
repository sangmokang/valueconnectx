import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { hashToken } from '@/lib/invite'
import { rateLimit, authLimiter } from '@/lib/rate-limit'
import { sendNotification } from '@/lib/notification'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
    const { success: rateLimitOk } = await rateLimit(authLimiter, `invite-accept:${ip}`)
    if (!rateLimitOk) return NextResponse.json({ error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })

    let body
    try { body = await request.json() } catch { return NextResponse.json({ error: '유효하지 않은 요청 형식입니다' }, { status: 400 }) }
    const { token, password, name, linkedin_url } = body
    if (!token || !password || !name || !linkedin_url) return NextResponse.json({ error: '모든 필드를 입력해주세요' }, { status: 400 })
    if (!/^https?:\/\/(www\.)?linkedin\.com\/in\//i.test(linkedin_url)) return NextResponse.json({ error: 'LinkedIn 프로필 URL이어야 합니다 (linkedin.com/in/...)' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다' }, { status: 400 })

    const adminClient = createAdminClient()
    const tokenHash = hashToken(token)

    // S4.5.1: Atomic invite consumption via RPC to prevent race conditions
    const { data: inviteRows, error: rpcError } = await adminClient.rpc('vcx_consume_invite', { p_token_hash: tokenHash })
    if (rpcError || !inviteRows || inviteRows.length === 0) {
      console.warn('Invite accept failed: token not found or already consumed', { rpcError, tokenHash })
      return NextResponse.json({ error: '초대 링크가 유효하지 않습니다' }, { status: 400 })
    }
    const invite = inviteRows[0]

    // Check expiry AFTER consuming atomically; revert to expired if past expiry
    if (new Date(invite.expires_at) < new Date()) {
      await adminClient.from('vcx_invites').update({ status: 'expired' }).eq('id', invite.id)
      console.warn('Invite accept failed: token expired', { expires_at: invite.expires_at, inviteId: invite.id })
      return NextResponse.json({ error: '초대 링크가 유효하지 않습니다' }, { status: 400 })
    }

    // S4.5.2: Use filtered listUsers instead of fetching all users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingUserData } = await adminClient.auth.admin.listUsers({ filter: `email.eq.${invite.email}` } as any)
    const existingUser = existingUserData?.users?.[0]
    let userId: string

    // S4.5.3: Update password for existing auth users
    if (existingUser) {
      userId = existingUser.id
      await adminClient.auth.admin.updateUserById(userId, { password })
    } else {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: invite.email, password, email_confirm: true,
      })
      if (createError) return NextResponse.json({ error: '계정 생성에 실패했습니다' }, { status: 500 })
      userId = newUser.user.id
    }

    // Get endorser info from recommendation
    let endorsedBy: string | null = null
    let endorsedByName: string | null = null
    if (invite.recommendation_id) {
      const { data: rec } = await adminClient.from('vcx_recommendations').select('recommender_id').eq('id', invite.recommendation_id).single()
      if (rec) {
        const { data: recommender } = await adminClient.from('vcx_members').select('id, name').eq('id', rec.recommender_id).single()
        if (recommender) { endorsedBy = recommender.id; endorsedByName = recommender.name }
      }
    }

    const { error: memberError } = await adminClient.from('vcx_members').insert({
      id: userId, name, email: invite.email, member_tier: invite.member_tier, system_role: 'member',
      endorsed_by: invite.member_tier === 'endorsed' ? endorsedBy : null,
      endorsed_by_name: invite.member_tier === 'endorsed' ? endorsedByName : null,
      linkedin_url: linkedin_url || null,
    })
    if (memberError) return NextResponse.json({ error: '멤버 프로필 생성에 실패했습니다' }, { status: 500 })

    // Note: invite status already set to 'accepted' atomically by vcx_consume_invite RPC

    // Notify inviter that their invite was accepted (fire-and-forget)
    if (invite.invited_by) {
      sendNotification(invite.invited_by, 'invite_accepted', {
        title: '초대가 수락되었습니다',
        body: `${name}님이 초대를 수락하고 VCX에 가입했습니다.`,
        link: '/admin/invitations',
      }).catch(() => {})
    }

    const serverClient = await createClient()
    const { error: signInError } = await serverClient.auth.signInWithPassword({ email: invite.email, password })
    if (signInError) {
      return NextResponse.json({ success: true, message: '계정이 생성되었습니다. 로그인해주세요.', redirectTo: '/login' })
    }
    return NextResponse.json({ success: true, redirectTo: '/onboarding' })
  } catch (error) {
    console.error('Accept error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
