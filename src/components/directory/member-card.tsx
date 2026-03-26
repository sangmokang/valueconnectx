import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

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
}

interface MemberCardProps {
  member: MemberCardData
}

export function MemberCard({ member }: MemberCardProps) {
  return (
    <Link
      href={`/directory/${member.id}`}
      className="block bg-white border border-[#e0d9ce] hover:border-[#c9a84c] transition-colors duration-150"
      style={{ borderRadius: 0 }}
    >
      <div className="p-5">
        {/* Header: avatar + name + tier */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {member.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={member.avatar_url}
                alt={member.name}
                className="w-10 h-10 object-cover flex-shrink-0"
                style={{ borderRadius: 0 }}
              />
            ) : (
              <div
                className="w-10 h-10 bg-[#e8e2d9] flex items-center justify-center flex-shrink-0"
                style={{ borderRadius: 0 }}
              >
                <span className="text-[#888888] text-sm font-vcx-serif font-bold">
                  {member.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-vcx-serif font-bold text-[#1a1a1a] text-base leading-tight truncate">
                {member.name}
              </p>
              {member.industry && (
                <p className="vcx-label text-[#888888] mt-0.5">{member.industry}</p>
              )}
            </div>
          </div>
          <Badge variant={member.member_tier}>
            {member.member_tier === 'core' ? 'Core' : 'Endorsed'}
          </Badge>
        </div>

        {/* Company + Title */}
        {(member.current_company || member.title) && (
          <div className="mb-3">
            {member.current_company && (
              <p className="text-sm font-vcx-sans text-[#444444] font-medium truncate">
                {member.current_company}
              </p>
            )}
            {member.title && (
              <p className="text-xs font-vcx-sans text-[#888888] truncate mt-0.5">
                {member.title}
              </p>
            )}
          </div>
        )}

        {/* Specialty tags */}
        {member.professional_fields.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {member.professional_fields.slice(0, 3).map((field) => (
              <span
                key={field}
                className="px-2 py-0.5 text-[10px] font-vcx-sans text-[#666666] bg-[#f0ebe2] border border-[#e0d9ce]"
                style={{ borderRadius: 0 }}
              >
                {field}
              </span>
            ))}
            {member.professional_fields.length > 3 && (
              <span className="px-2 py-0.5 text-[10px] font-vcx-sans text-[#999999]">
                +{member.professional_fields.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Open to chat */}
        {member.is_open_to_chat && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#e8e2d9]">
            <span className="w-1.5 h-1.5 bg-[#c9a84c] flex-shrink-0" style={{ borderRadius: 0 }} />
            <span className="vcx-label text-[#c9a84c]">커피챗 가능</span>
          </div>
        )}
      </div>
    </Link>
  )
}
