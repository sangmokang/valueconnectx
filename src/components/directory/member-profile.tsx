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
      {/* Header */}
      <div className="bg-white border border-[#e0d9ce] p-4 sm:p-6 mb-4">
        <div className="flex items-start gap-3 sm:gap-5">
          {member.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={member.avatar_url}
              alt={member.name}
              className="w-16 h-16 object-cover flex-shrink-0"

            />
          ) : (
            <div
              className="w-16 h-16 bg-[#e8e2d9] flex items-center justify-center flex-shrink-0"

            >
              <span className="text-[#888888] text-2xl font-vcx-serif font-bold">
                {member.name.charAt(0)}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h1 className="font-vcx-serif font-bold text-[#1a1a1a] text-xl sm:text-2xl">
                {member.name}
              </h1>
              <Badge variant={member.member_tier}>
                {member.member_tier === 'core' ? 'Core Member' : 'Endorsed Member'}
              </Badge>
            </div>

            {member.title && (
              <p className="text-sm font-vcx-sans text-[#666666] mt-1">{member.title}</p>
            )}
            {member.current_company && (
              <p className="text-sm font-vcx-sans text-[#444444] font-medium mt-0.5">
                {member.current_company}
              </p>
            )}

            {member.is_open_to_chat && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 bg-[#c9a84c]" style={{ borderRadius: 0 }} />
                <span className="vcx-section-label">커피챗 가능</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {member.bio && (
        <div className="bg-white border border-[#e0d9ce] p-6 mb-4">
          <p className="vcx-section-label mb-3">소개</p>
          <p className="text-sm font-vcx-sans text-[#444444] leading-relaxed whitespace-pre-wrap">
            {member.bio}
          </p>
        </div>
      )}

      {/* Professional fields */}
      {member.professional_fields.length > 0 && (
        <div className="bg-white border border-[#e0d9ce] p-6 mb-4">
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
      <div className="bg-white border border-[#e0d9ce] p-6 mb-4">
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
        <div className="bg-white border border-[#e0d9ce] p-6 mb-4">
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
