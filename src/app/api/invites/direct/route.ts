import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateInviteToken, hashToken, calculateExpiry } from '@/lib/invite'
import { sendInviteEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

    const { data: admin } = await supabase.from('vcx_members').select('id, name, system_role').eq('id', user.id).in('system_role', ['admin', 'super_admin']).single()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })

    const body = await request.json()
    const { email, member_tier } = body
    if (!email || !member_tier) return NextResponse.json({ error: '필수 항목을 입력해주세요' }, { status: 400 })

    const adminClient = createAdminClient()
    const { data: existingMember } = await adminClient.from('vcx_members').select('id').eq('email', email).single()
    if (existingMember) return NextResponse.json({ error: '이미 멤버인 이메일입니다' }, { status: 409 })

    const { data: existingInvite } = await adminClient.from('vcx_invites').select('id').eq('email', email).eq('status', 'pending').single()
    if (existingInvite) return NextResponse.json({ error: '이미 대기 중인 초대가 있습니다' }, { status: 409 })

    const rawToken = generateInviteToken()
    const { data: invite, error: insertError } = await adminClient.from('vcx_invites').insert({
      email, invited_by: user.id, invited_by_name: admin.name,
      member_tier, token_hash: hashToken(rawToken), expires_at: calculateExpiry(),
    }).select().single()
    if (insertError) return NextResponse.json({ error: '초대 생성에 실패했습니다' }, { status: 500 })

    await sendInviteEmail({ to: email, inviterName: admin.name, token: rawToken, memberTier: member_tier })
    return NextResponse.json({ data: invite }, { status: 201 })
  } catch (error) {
    console.error('Direct invite error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
