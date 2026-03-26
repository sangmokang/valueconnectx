import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateInviteToken, hashToken, calculateExpiry } from '@/lib/invite'
import { sendInviteEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

    const { data: admin } = await supabase
      .from('vcx_members').select('id, name, system_role')
      .eq('id', user.id).in('system_role', ['admin', 'super_admin']).single()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })

    const { data: recommendation, error: recError } = await adminClient
      .from('vcx_recommendations').select('*').eq('id', id).eq('status', 'pending').single()
    if (recError || !recommendation) return NextResponse.json({ error: '대기 중인 추천을 찾을 수 없습니다' }, { status: 404 })

    await adminClient.from('vcx_recommendations').update({
      status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString(),
    }).eq('id', id)

    const rawToken = generateInviteToken()
    const tokenHash = hashToken(rawToken)

    const { data: invite, error: inviteError } = await adminClient
      .from('vcx_invites')
      .insert({
        email: recommendation.recommended_email,
        invited_by: user.id, invited_by_name: admin.name,
        member_tier: recommendation.member_tier,
        token_hash: tokenHash, expires_at: calculateExpiry(),
        recommendation_id: recommendation.id,
      })
      .select().single()

    if (inviteError) return NextResponse.json({ error: '초대 생성에 실패했습니다' }, { status: 500 })

    await sendInviteEmail({
      to: recommendation.recommended_email, inviterName: admin.name,
      token: rawToken, memberTier: recommendation.member_tier as 'core' | 'endorsed',
    })

    return NextResponse.json({ data: invite }, { status: 201 })
  } catch (error) {
    console.error('Approve error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
