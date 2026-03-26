import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditForm } from '@/components/directory/profile-edit-form'
import { ProfileCompletion } from '@/components/directory/profile-completion'

export default async function ProfileEditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('vcx_members')
    .select(
      'id, name, current_company, title, bio, industry, location, is_open_to_chat, profile_visibility, professional_fields, linkedin_url, years_of_experience'
    )
    .eq('id', user.id)
    .eq('is_active', true)
    .single()

  if (!member) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/directory"
        className="inline-flex items-center gap-1.5 text-xs font-vcx-sans text-[#888888] hover:text-[#1a1a1a] transition-colors mb-6"
      >
        <span>←</span>
        <span>멤버 디렉토리로 돌아가기</span>
      </Link>

      <div className="mb-6">
        <p className="vcx-section-label mb-1">내 프로필</p>
        <h1 className="font-vcx-serif font-bold text-[#1a1a1a] text-3xl">프로필 수정</h1>
        <p className="text-sm font-vcx-sans text-[#888888] mt-1">
          안녕하세요, <span className="text-[#1a1a1a] font-medium">{member.name}</span>님
        </p>
      </div>

      <ProfileCompletion
        name={member.name}
        current_company={member.current_company}
        title={member.title}
        professional_fields={member.professional_fields}
        years_of_experience={member.years_of_experience}
        bio={member.bio}
        linkedin_url={member.linkedin_url}
        className="mb-6"
      />

      <div className="bg-white border border-[#e0d9ce] p-6">
        <ProfileEditForm
          initialData={{
            bio: member.bio,
            industry: member.industry,
            location: member.location,
            is_open_to_chat: member.is_open_to_chat,
            profile_visibility: member.profile_visibility as 'members_only' | 'corporate_only' | 'all',
            professional_fields: member.professional_fields,
            linkedin_url: member.linkedin_url,
          }}
        />
      </div>
    </div>
  )
}
