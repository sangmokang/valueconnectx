import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, serverError } from '@/lib/api/error'
import { matchPositions } from '@/lib/position-matcher'
import type { MemberProfile, PositionData } from '@/lib/position-matcher'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any

    // 현재 사용자 프로필 조회
    const { data: member, error: memberError } = await supa
      .from('vcx_members')
      .select(
        'id, professional_fields, years_of_experience, industry, bio, location'
      )
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError || !member) return forbidden('VCX 멤버만 접근할 수 있습니다')

    // 활성 포지션 전체 조회 (status='open' 또는 'active')
    const { data: positions, error: posError } = await supa
      .from('positions')
      .select(
        'id, title, company_name, role_description, required_fields, min_experience, industry, location, team_size, salary_range, status'
      )
      .in('status', ['open', 'active'])

    if (posError) {
      console.error('Matches GET positions error:', posError)
      return serverError()
    }

    const memberProfile: MemberProfile = {
      professional_fields: member.professional_fields ?? null,
      years_of_experience: member.years_of_experience ?? null,
      industry: member.industry ?? null,
      bio: member.bio ?? null,
      location: member.location ?? null,
    }

    const positionList: PositionData[] = (positions ?? []).map(
      (p: {
        id: string
        title: string
        company_name: string
        role_description: string
        required_fields: string[] | null
        min_experience: number | null
        industry: string | null
        location: string | null
        team_size: string | null
        salary_range: string | null
        status: string
      }) => ({
        id: p.id,
        title: p.title,
        company_name: p.company_name,
        role_description: p.role_description,
        required_fields: p.required_fields ?? null,
        min_experience: p.min_experience ?? null,
        industry: p.industry ?? null,
        location: p.location ?? null,
        team_size: p.team_size ?? null,
        salary_range: p.salary_range ?? null,
        status: p.status,
      })
    )

    const matches = matchPositions(memberProfile, positionList).slice(0, 10)

    return NextResponse.json({ data: matches })
  } catch (err) {
    console.error('Matches GET error:', err)
    return serverError()
  }
}
