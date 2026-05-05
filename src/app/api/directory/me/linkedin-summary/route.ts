import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVcxUser } from '@/lib/auth/get-vcx-user'
import { unauthorized, badRequest, serverError } from '@/lib/api/error'
import { generateCareerSummary } from '@/lib/ai/career-summary'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const user = await getVcxUser()
    if (!user) return unauthorized()

    const supabase = await createClient()
    const { data: profile, error } = await supabase
      .from('vcx_members')
      .select('name, title, current_company, professional_fields, years_of_experience, bio, linkedin_url')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (error || !profile) return serverError('프로필을 불러올 수 없습니다')

    if (!profile.linkedin_url) {
      return badRequest('LinkedIn URL을 먼저 저장해주세요')
    }

    const summary = await generateCareerSummary({
      name: profile.name ?? user.name,
      title: profile.title,
      currentCompany: profile.current_company,
      professionalFields: Array.isArray(profile.professional_fields) ? profile.professional_fields : [],
      yearsOfExperience: profile.years_of_experience,
      existingBio: profile.bio,
    })

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('linkedin-summary POST error:', error)
    return serverError()
  }
}
