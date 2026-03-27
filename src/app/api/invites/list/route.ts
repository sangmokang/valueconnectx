import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

    const { data: admin } = await supabase.from('vcx_members').select('id, system_role').eq('id', user.id).in('system_role', ['admin', 'super_admin']).single()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))
    const offset = (page - 1) * limit

    let query = supabase.from('vcx_invites').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + limit - 1)
    if (status && ['pending', 'accepted', 'expired', 'revoked'].includes(status)) query = query.eq('status', status as 'pending' | 'accepted' | 'expired' | 'revoked')
    if (search) {
      const escapedSearch = search.replace(/%/g, '\\%').replace(/_/g, '\\_')
      query = query.ilike('email', `%${escapedSearch}%`)
    }

    const { data, error, count } = await query
    if (error) return NextResponse.json({ error: '초대 목록 조회에 실패했습니다' }, { status: 500 })
    return NextResponse.json({ data, total: count, page, limit })
  } catch (error) {
    console.error('List error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
