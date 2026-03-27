import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { data: member } = await supabase
      .from('vcx_members')
      .select('id, name, member_tier, is_active')
      .eq('id', user.id)
      .single()

    if (!member || member.member_tier !== 'core' || !member.is_active) {
      return NextResponse.json({ error: 'Core Member만 추천할 수 있습니다' }, { status: 403 })
    }

    let body
    try { body = await request.json() } catch { return NextResponse.json({ error: '유효하지 않은 요청 형식입니다' }, { status: 400 }) }
    const { recommended_email, recommended_name, reason, member_tier } = body

    if (!recommended_email || !recommended_name || !member_tier) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요' }, { status: 400 })
    }
    if (!['core', 'endorsed'].includes(member_tier)) {
      return NextResponse.json({ error: '유효하지 않은 멤버 등급입니다' }, { status: 400 })
    }

    const { data: existingMember } = await supabase.from('vcx_members').select('id').eq('email', recommended_email).single()
    if (existingMember) {
      return NextResponse.json({ error: '이미 멤버인 이메일입니다' }, { status: 409 })
    }

    const { data: existingRec } = await supabase.from('vcx_recommendations').select('id').eq('recommended_email', recommended_email).eq('status', 'pending').single()
    if (existingRec) {
      return NextResponse.json({ error: '이미 대기 중인 추천이 있습니다' }, { status: 409 })
    }

    const { data: recommendation, error: insertError } = await supabase
      .from('vcx_recommendations')
      .insert({ recommender_id: user.id, recommended_email, recommended_name, reason: reason || null, member_tier })
      .select()
      .single()

    if (insertError) {
      console.error('Recommendation insert error:', insertError)
      return NextResponse.json({ error: '추천 생성에 실패했습니다' }, { status: 500 })
    }
    return NextResponse.json({ data: recommendation }, { status: 201 })
  } catch (error) {
    console.error('Recommendation error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
