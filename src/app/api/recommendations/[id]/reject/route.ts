import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
      .from('vcx_members').select('id, system_role')
      .eq('id', user.id).in('system_role', ['admin', 'super_admin']).single()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })

    const { data: recommendation, error } = await adminClient
      .from('vcx_recommendations')
      .update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id).eq('status', 'pending').select().single()

    if (error || !recommendation) return NextResponse.json({ error: '대기 중인 추천을 찾을 수 없습니다' }, { status: 404 })
    return NextResponse.json({ data: recommendation })
  } catch (error) {
    console.error('Reject error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
