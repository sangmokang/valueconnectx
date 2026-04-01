import Link from 'next/link'

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
      className="block bg-white border border-black/[0.08] no-underline hover:border-[#c9a84c] transition-colors duration-150"
    >
      <div className="p-6 md:p-7 flex gap-5">
        {/* Avatar */}
        {member.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.avatar_url}
            alt={member.name}
            className="w-[52px] h-[52px] object-cover flex-shrink-0"
            style={{ borderRadius: '50%' }}
          />
        ) : (
          <div
            className="w-[52px] h-[52px] bg-[#1a1a1a] flex items-center justify-center flex-shrink-0"
            style={{ borderRadius: '50%' }}
          >
            <span
              className="text-[#c9a84c] text-[18px] font-extrabold"
              style={{ fontFamily: 'Georgia, serif' }}
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
              className="text-[16px] font-extrabold text-[#1a1a1a]"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {member.name}
            </span>
            <span
              className="text-[11px] px-2 py-0.5 font-bold tracking-[0.05em]"
              style={{
                background: isCore ? '#1a1a1a' : '#f5f0e8',
                color: isCore ? '#c9a84c' : '#777',
              }}
            >
              {isCore ? 'Core' : 'Endorsed'}
            </span>
            {joinLabel && (
              <span className="text-[12px] text-[#888] ml-auto">{joinLabel}</span>
            )}
          </div>

          {/* Company + Title */}
          {(member.current_company || member.title) && (
            <div className="mb-2">
              {member.current_company && (
                <div className="text-[13.5px] text-[#555] font-medium">{member.current_company}</div>
              )}
              {member.title && (
                <div className="text-[13px] text-[#777]">{member.title}</div>
              )}
            </div>
          )}

          {/* Industry */}
          {member.industry && (
            <div className="text-[12px] text-[#888] mb-2">{member.industry}</div>
          )}

          {/* Bio */}
          {member.bio && (
            <p
              className="text-[14px] text-[#555] leading-[1.8] mb-3 italic line-clamp-2"
              style={{ fontFamily: 'Georgia, serif' }}
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
                  className="text-[11.5px] px-2 py-0.5 bg-[#f5f0e8] border border-black/[0.08] text-[#777]"
                >
                  {field}
                </span>
              ))}
              {member.professional_fields.length > 3 && (
                <span className="text-[11.5px] text-[#999]">
                  +{member.professional_fields.length - 3}
                </span>
              )}
            </div>
          )}
          {/* Open to chat */}
          {member.is_open_to_chat && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#e8e2d9]">
              <span className="w-1.5 h-1.5 bg-[#c9a84c] flex-shrink-0" style={{ borderRadius: 0 }} />
              <span className="text-[11px] text-[#c9a84c] font-semibold tracking-[0.05em]">커피챗 가능</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
