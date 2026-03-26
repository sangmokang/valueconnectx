import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVcxUser, isAdmin } from '@/lib/auth/get-vcx-user'
import { unauthorized, forbidden, notFound, serverError } from '@/lib/api/error'

export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getVcxUser()
    if (!user) return unauthorized()
    if (!isAdmin(user)) return forbidden('관리자 권한이 필요합니다')

    const supabase = await createClient()

    const { data: existing } = await supabase
      .from('vcx_corporate_users')
      .select('id')
      .eq('id', params.id)
      .single()

    if (!existing) return notFound('기업 사용자를 찾을 수 없습니다')

    const { data, error } = await supabase
      .from('vcx_corporate_users')
      .update({ is_verified: true })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Corporate user verify error:', error)
      return serverError('인증 처리에 실패했습니다')
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Corporate user verify error:', error)
    return serverError()
  }
}
