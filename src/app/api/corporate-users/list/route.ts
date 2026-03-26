import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVcxUser, isAdmin } from '@/lib/auth/get-vcx-user'
import { unauthorized, forbidden, serverError } from '@/lib/api/error'

export async function GET(request: NextRequest) {
  try {
    const user = await getVcxUser()
    if (!user) return unauthorized()
    if (!isAdmin(user)) return forbidden('관리자 권한이 필요합니다')

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase
      .from('vcx_corporate_users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      const escaped = search.replace(/%/g, '\\%').replace(/_/g, '\\_')
      query = query.or(`name.ilike.%${escaped}%,company.ilike.%${escaped}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Corporate user list error:', error)
      return serverError('기업 사용자 목록 조회에 실패했습니다')
    }

    return NextResponse.json({ data, total: count, page, limit })
  } catch (error) {
    console.error('Corporate user list error:', error)
    return serverError()
  }
}
