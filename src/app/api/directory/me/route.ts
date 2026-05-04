import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, notFound, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'
import { linkedinUrlSchema } from '@/lib/validation/linkedin'
import {
  INTEREST_TAG_LIMIT,
  normalizeInterestTags,
} from '@/constants/profile'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해주세요').max(100).optional(),
  current_company: z.string().trim().min(1, '현재 회사를 입력해주세요').max(200).optional(),
  title: z.string().trim().min(1, '직함을 입력해주세요').max(200).optional(),
  linkedin_url: linkedinUrlSchema.optional(),
  years_of_experience: z.number().int().min(0).max(60).optional().nullable(),
  bio: z.string().trim().max(1000).optional().nullable(),
  industry: z.string().trim().max(100).optional().nullable(),
  location: z.string().trim().max(100).optional().nullable(),
  is_open_to_chat: z.boolean().optional(),
  profile_visibility: z.enum(['members_only', 'corporate_only', 'all']).optional(),
  professional_fields: z
    .array(z.string().trim().min(1, '빈 태그는 저장할 수 없습니다').max(40, '태그는 40자 이하로 입력해주세요'))
    .max(INTEREST_TAG_LIMIT, `관심 분야는 최대 ${INTEREST_TAG_LIMIT}개까지 입력할 수 있습니다`)
    .transform(normalizeInterestTags)
    .optional(),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const { data, error } = await supabase
      .from('vcx_members')
      .select(
        'id, name, email, current_company, title, professional_fields, years_of_experience, bio, linkedin_url, member_tier, avatar_url, join_date, industry, location, is_open_to_chat, profile_visibility'
      )
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (error || !data) return notFound('프로필을 찾을 수 없습니다')

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Directory me GET error:', error)
    return serverError()
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const { data: member } = await supabase
      .from('vcx_members')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()
    if (!member) return forbidden('VCX 멤버만 프로필을 수정할 수 있습니다')

    const parsed = await parseBody(request, updateSchema)
    if (parsed.error) return parsed.error

    const { data, error } = await supabase
      .from('vcx_members')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select(
        'id, name, email, current_company, title, professional_fields, years_of_experience, bio, linkedin_url, member_tier, avatar_url, join_date, industry, location, is_open_to_chat, profile_visibility'
      )
      .single()

    if (error) {
      console.error('Directory me PUT error:', error)
      return serverError()
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Directory me PUT error:', error)
    return serverError()
  }
}
