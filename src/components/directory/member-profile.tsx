import { Badge } from '@/components/ui/badge'

export interface MemberProfileData {
  id: string
  name: string
  email: string
  current_company: string | null
  title: string | null
  professional_fields: string[]
  years_of_experience: number | null
  bio: string | null
  linkedin_url: string | null
  member_tier: 'core' | 'endorsed'
  avatar_url: string | null
  join_date: string
  industry: string | null
  location: string | null
  is_open_to_chat: boolean
  profile_visibility: string
  endorsed_by_name: string | null
}

interface MemberProfileProps {
  member: MemberProfileData
}

export function MemberProfile({ member }: MemberProfileProps) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header — dark hero */}
      <div className="bg-[#1a1a1a] p-6 sm:p-8 mb-4">
        {/* Tier badge row */}
        <div className="mb-4">
          <Badge variant={member.member_tier}>
            {member.member_tier === 'core' ? 'Core Member' : 'Endorsed Member'}
          </Badge>
        </div>

        <div className="flex items-start gap-4 sm:gap-6">
          {member.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={member.avatar_url}
              alt={member.name}
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover flex-shrink-0 border border-[#c9a84c]/30"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#2a2a2a] border border-[#c9a84c]/40 flex items-center justify-center flex-shrink-0">
              <span className="text-[#c9a84c] text-2xl font-vcx-serif font-bold">
                {member.name.charAt(0)}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="font-vcx-serif font-bold text-[#f5f0e8] text-xl sm:text-[28px] leading-tight">
              {member.name}
            </h1>

            {member.title && (
              <p className="text-sm font-vcx-sans text-[#c9a84c] mt-1">{member.title}</p>
            )}
            {member.current_company && (
              <p className="text-sm font-vcx-sans text-[#a09080] mt-0.5">
                {member.current_company}
              </p>
            )}

            {member.is_open_to_chat && (
              <div className="flex items-center gap-1.5 mt-3">
                <span className="w-2 h-2 bg-[#c9a84c]" />
                <span className="text-[11px] font-vcx-sans text-[#c9a84c] tracking-[0.1em] uppercase font-bold">커피챗 가능</span>
              </div>
            )}
          </div>
        </div>

        {/* Gold bottom accent */}
        <div className="mt-6 h-[1px] bg-[#c9a84c]/30" />
      </div>

      {/* Bio */}
      {member.bio && (
        <div className="bg-[#f7f3ed] border border-[#e0d9ce] p-6 mb-4">
          <p className="vcx-section-label mb-3">소개</p>
          <p className="text-sm font-vcx-sans text-[#444444] leading-relaxed whitespace-pre-wrap">
            {member.bio}
          </p>
        </div>
      )}

      {/* Professional fields */}
      {member.professional_fields.length > 0 && (
        <div className="bg-[#f7f3ed] border border-[#e0d9ce] p-6 mb-4">
          <p className="vcx-section-label mb-3">전문 분야</p>
          <div className="flex flex-wrap gap-2">
            {member.professional_fields.map((field) => (
              <span
                key={field}
                className="px-3 py-1 text-xs font-vcx-sans text-[#666666] bg-[#f0ebe2] border border-[#e0d9ce]"
  
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Details */}
      <div className="bg-[#f7f3ed] border border-[#e0d9ce] p-6 mb-4">
        <p className="vcx-section-label mb-3">상세 정보</p>
        <dl className="space-y-3">
          {member.industry && (
            <div className="flex gap-4">
              <dt className="text-xs font-vcx-sans text-[#999999] w-20 sm:w-24 flex-shrink-0">업종</dt>
              <dd className="text-sm font-vcx-sans text-[#444444]">{member.industry}</dd>
            </div>
          )}
          {member.location && (
            <div className="flex gap-4">
              <dt className="text-xs font-vcx-sans text-[#999999] w-20 sm:w-24 flex-shrink-0">위치</dt>
              <dd className="text-sm font-vcx-sans text-[#444444]">{member.location}</dd>
            </div>
          )}
          {member.years_of_experience !== null && (
            <div className="flex gap-4">
              <dt className="text-xs font-vcx-sans text-[#999999] w-20 sm:w-24 flex-shrink-0">경력</dt>
              <dd className="text-sm font-vcx-sans text-[#444444]">{member.years_of_experience}년</dd>
            </div>
          )}
          {member.join_date && (
            <div className="flex gap-4">
              <dt className="text-xs font-vcx-sans text-[#999999] w-20 sm:w-24 flex-shrink-0">합류일</dt>
              <dd className="text-sm font-vcx-sans text-[#444444]">
                {new Date(member.join_date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                })}
              </dd>
            </div>
          )}
          {member.endorsed_by_name && member.member_tier === 'endorsed' && (
            <div className="flex gap-4">
              <dt className="text-xs font-vcx-sans text-[#999999] w-20 sm:w-24 flex-shrink-0">추천인</dt>
              <dd className="text-sm font-vcx-sans text-[#444444]">{member.endorsed_by_name}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* LinkedIn */}
      {member.linkedin_url && (
        <div className="bg-[#f7f3ed] border border-[#e0d9ce] p-6 mb-4">
          <a
            href={member.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-vcx-sans text-[#c9a84c] hover:text-[#1a1a1a] transition-colors"
          >
            <span>LinkedIn 프로필 보기</span>
            <span>→</span>
          </a>
        </div>
      )}
    </div>
  )
}
