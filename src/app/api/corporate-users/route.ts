import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getVcxUser, isAdmin } from '@/lib/auth/get-vcx-user'
import { unauthorized, forbidden, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'
import { randomUUID } from 'crypto'

const createCorporateUserSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  email: z.string().email('유효한 이메일을 입력해주세요'),
  company: z.string().min(1, '회사명을 입력해주세요'),
  title: z.string().min(1, '직함을 입력해주세요'),
  role: z.enum(['ceo', 'founder', 'c_level', 'hr_leader'], {
    error: '유효한 역할을 선택해주세요',
  }),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getVcxUser()
    if (!user) return unauthorized()
    if (!isAdmin(user)) return forbidden('관리자 권한이 필요합니다')

    const { data, error } = await parseBody(request, createCorporateUserSchema)
    if (error) return error

    const supabase = await createClient()

    const { data: corporateUser, error: insertError } = await supabase
      .from('vcx_corporate_users')
      .insert({
        id: randomUUID(),
        name: data.name,
        email: data.email,
        company: data.company,
        title: data.title,
        role: data.role,
        is_verified: false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Corporate user insert error:', insertError)
      if (insertError.code === '23505') {
        return NextResponse.json({ error: '이미 등록된 이메일입니다' }, { status: 409 })
      }
      return serverError('기업 사용자 생성에 실패했습니다')
    }

    return NextResponse.json({ data: corporateUser }, { status: 201 })
  } catch (error) {
    console.error('Corporate user creation error:', error)
    return serverError()
  }
}
