import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProtectedPageWrapper } from '@/components/layout/protected-page-wrapper'
import { MeClient, type MeProfile } from './me-client'

export const dynamic = 'force-dynamic'

export default async function MePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('vcx_members')
    .select(
      'id, name, email, current_company, title, bio, professional_fields, years_of_experience, linkedin_url, member_tier, avatar_url'
    )
    .eq('id', user.id)
    .eq('is_active', true)
    .single()

  if (!member) redirect('/login')

  const profile: MeProfile = {
    id: member.id,
    name: member.name,
    email: member.email ?? user.email ?? null,
    current_company: member.current_company,
    title: member.title,
    bio: member.bio,
    professional_fields: member.professional_fields ?? [],
    years_of_experience: member.years_of_experience,
    linkedin_url: member.linkedin_url,
    member_tier: member.member_tier,
    avatar_url: member.avatar_url,
  }

  return (
    <ProtectedPageWrapper currentPath="/me">
      <MeClient profile={profile} />
    </ProtectedPageWrapper>
  )
}
