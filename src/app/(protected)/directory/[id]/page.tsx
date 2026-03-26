import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProtectedPageWrapper } from '@/components/layout/protected-page-wrapper'
import { MemberProfile } from '@/components/directory/member-profile'

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: member, error } = await supabase
    .from('vcx_members')
    .select(
      'id, name, email, current_company, title, professional_fields, years_of_experience, bio, linkedin_url, member_tier, avatar_url, join_date, industry, location, is_open_to_chat, profile_visibility, endorsed_by_name'
    )
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error || !member) notFound()

  return (
    <ProtectedPageWrapper currentPath={`/directory/${id}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link
          href="/directory"
          className="inline-flex items-center gap-1.5 text-xs font-vcx-sans text-[#888888] hover:text-[#1a1a1a] transition-colors mb-6"
        >
          <span>←</span>
          <span>멤버 디렉토리로 돌아가기</span>
        </Link>

        <MemberProfile member={member} />
      </div>
    </ProtectedPageWrapper>
  )
}
