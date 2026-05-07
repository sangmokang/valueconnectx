import Link from 'next/link'
import { displayFieldLabel, displayMemberTier, displayRoleLabel } from '@/lib/display-labels'

export interface MemberCardData {
  id: string
  name: string
  current_company: string | null
  title: string | null
  member_tier: 'core' | 'endorsed'
  professional_fields: string[]
  industry: string | null
  is_open_to_chat: boolean
  avatar_url: string | null
  bio?: string | null
  join_date?: string | null
}

interface MemberCardProps {
  member: MemberCardData
}

export function MemberCard({ member }: MemberCardProps) {
  const initial = member.name.charAt(0)
  const isCore = member.member_tier === 'core'
  const joinLabel = member.join_date
    ? `가입 ${member.join_date.slice(0, 7).replace('-', '.')}`
    : null

  return (
    <Link
      href={`/directory/${member.id}`}
      className="block bg-white border border-black/[0.08] no-underline hover:border-vcx-gold transition-colors duration-150"
    >
      <div className="p-6 md:p-7 flex gap-5">
        {/* Avatar */}
        {member.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.avatar_url}
            alt={member.name}
            className="w-[52px] h-[52px] object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-[52px] h-[52px] bg-vcx-dark flex items-center justify-center flex-shrink-0"
          >
            <span
              className="text-vcx-gold text-[18px] font-extrabold font-vcx-serif"
            >
              {initial}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name + badge + join date */}
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            <span
              className="text-[16px] font-extrabold text-vcx-dark font-vcx-serif"
            >
              {member.name}
            </span>
            <span
              className={`px-2 py-0.5 text-[12px] font-bold ${isCore ? 'bg-vcx-dark text-vcx-gold' : 'bg-vcx-beige text-vcx-sub-4'}`}
            >
              {displayMemberTier(member.member_tier)}
            </span>
            {joinLabel && (
              <span className="text-[12px] text-vcx-sub-4 ml-auto">{joinLabel}</span>
            )}
          </div>

          {/* Company + Title */}
          {(member.current_company || member.title) && (
            <div className="mb-2">
              {member.current_company && (
                <div className="text-[13.5px] text-vcx-sub-2 font-medium">{member.current_company}</div>
              )}
              {member.title && (
                <div className="text-[13px] text-vcx-sub-4">{displayRoleLabel(member.title)}</div>
              )}
            </div>
          )}

          {/* Industry */}
          {member.industry && (
            <div className="text-[12px] text-vcx-sub-4 mb-2">{displayFieldLabel(member.industry)}</div>
          )}

          {/* Bio */}
          {member.bio && (
            <p
              className="text-[14px] text-vcx-sub-2 leading-[1.8] mb-3 italic line-clamp-2 font-vcx-serif"
            >
              &ldquo;{member.bio}&rdquo;
            </p>
          )}

          {/* Tags */}
          {member.professional_fields.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {member.professional_fields.slice(0, 3).map((field) => (
                <span
                  key={field}
                  className="bg-vcx-beige border border-black/[0.08] px-2 py-0.5 text-[12px] text-vcx-sub-4"
                >
                  {displayFieldLabel(field)}
                </span>
              ))}
              {member.professional_fields.length > 3 && (
                <span className="text-[12px] text-vcx-sub-5">
                  +{member.professional_fields.length - 3}
                </span>
              )}
            </div>
          )}
          {/* Open to chat */}
          {member.is_open_to_chat && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-vcx-dark/10">
              <span className="w-1.5 h-1.5 bg-vcx-gold flex-shrink-0" />
              <span className="text-[12px] text-vcx-gold font-semibold">커피챗 가능</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
