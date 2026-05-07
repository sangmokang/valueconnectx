import { Badge } from '@/components/ui/badge'
import { displayFieldLabel, displayMemberTier, displayRoleLabel } from '@/lib/display-labels'

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
      <div className="bg-vcx-dark p-6 sm:p-8 mb-4">
        {/* Tier badge row */}
        <div className="mb-4">
          <Badge variant={member.member_tier}>
            {displayMemberTier(member.member_tier)}
          </Badge>
        </div>

        <div className="flex items-start gap-4 sm:gap-6">
          {member.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={member.avatar_url}
              alt={member.name}
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover flex-shrink-0 border border-vcx-gold/30"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-vcx-card border border-vcx-gold/40 flex items-center justify-center flex-shrink-0">
              <span className="text-vcx-gold text-2xl font-vcx-serif font-bold">
                {member.name.charAt(0)}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="font-vcx-serif font-bold text-vcx-beige text-xl sm:text-[28px] leading-tight">
              {member.name}
            </h1>

            {member.title && (
              <p className="text-sm font-vcx-sans text-vcx-gold mt-1">{displayRoleLabel(member.title)}</p>
            )}
            {member.current_company && (
              <p className="text-sm font-vcx-sans text-vcx-cream mt-0.5">
                {member.current_company}
              </p>
            )}

            {member.is_open_to_chat && (
              <div className="flex items-center gap-1.5 mt-3">
                <span className="w-2 h-2 bg-vcx-gold" />
                <span className="text-[12px] font-vcx-sans text-vcx-gold tracking-[0.02em] font-bold">커피챗 가능</span>
              </div>
            )}
          </div>
        </div>

        {/* Gold bottom accent */}
        <div className="mt-6 h-[1px] bg-vcx-gold/30" />
      </div>

      {/* Bio */}
      {member.bio && (
        <div className="bg-vcx-beige-light border border-vcx-dark/10 p-6 mb-4">
          <p className="vcx-section-label mb-3">소개</p>
          <p className="text-sm font-vcx-sans text-vcx-sub-1 leading-relaxed whitespace-pre-wrap">
            {member.bio}
          </p>
        </div>
      )}

      {/* Professional fields */}
      {member.professional_fields.length > 0 && (
        <div className="bg-vcx-beige-light border border-vcx-dark/10 p-6 mb-4">
          <p className="vcx-section-label mb-3">전문 분야</p>
          <div className="flex flex-wrap gap-2">
            {member.professional_fields.map((field) => (
              <span
                key={field}
                className="px-3 py-1 text-xs font-vcx-sans text-vcx-sub-3 bg-vcx-beige border border-vcx-dark/10"
  
              >
                {displayFieldLabel(field)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Details */}
      <div className="bg-vcx-beige-light border border-vcx-dark/10 p-6 mb-4">
        <p className="vcx-section-label mb-3">상세 정보</p>
        <dl className="space-y-3">
          {member.industry && (
            <div className="flex gap-4">
              <dt className="text-xs font-vcx-sans text-vcx-sub-5 w-20 sm:w-24 flex-shrink-0">업종</dt>
              <dd className="text-sm font-vcx-sans text-vcx-sub-1">{displayFieldLabel(member.industry)}</dd>
            </div>
          )}
          {member.location && (
            <div className="flex gap-4">
              <dt className="text-xs font-vcx-sans text-vcx-sub-5 w-20 sm:w-24 flex-shrink-0">위치</dt>
              <dd className="text-sm font-vcx-sans text-vcx-sub-1">{member.location}</dd>
            </div>
          )}
          {member.years_of_experience !== null && (
            <div className="flex gap-4">
              <dt className="text-xs font-vcx-sans text-vcx-sub-5 w-20 sm:w-24 flex-shrink-0">경력</dt>
              <dd className="text-sm font-vcx-sans text-vcx-sub-1">{member.years_of_experience}년</dd>
            </div>
          )}
          {member.join_date && (
            <div className="flex gap-4">
              <dt className="text-xs font-vcx-sans text-vcx-sub-5 w-20 sm:w-24 flex-shrink-0">합류일</dt>
              <dd className="text-sm font-vcx-sans text-vcx-sub-1">
                {new Date(member.join_date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                })}
              </dd>
            </div>
          )}
          {member.endorsed_by_name && member.member_tier === 'endorsed' && (
            <div className="flex gap-4">
              <dt className="text-xs font-vcx-sans text-vcx-sub-5 w-20 sm:w-24 flex-shrink-0">추천인</dt>
              <dd className="text-sm font-vcx-sans text-vcx-sub-1">{member.endorsed_by_name}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* LinkedIn */}
      {member.linkedin_url && (
        <div className="bg-vcx-beige-light border border-vcx-dark/10 p-6 mb-4">
          <a
            href={member.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-2 text-sm font-vcx-sans text-vcx-gold hover:text-vcx-dark transition-colors"
          >
            <span>LinkedIn 프로필 보기</span>
            <span>→</span>
          </a>
        </div>
      )}
    </div>
  )
}
