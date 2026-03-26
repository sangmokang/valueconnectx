import Link from 'next/link'
import { InterestButton } from './interest-button'

export interface PositionCardData {
  id: string
  company_name: string
  title: string
  team_size: string | null
  role_description: string
  salary_range: string | null
  status: string
  created_at: string
  my_interest: 'interested' | 'not_interested' | 'bookmark' | null
}

interface PositionCardProps {
  position: PositionCardData
}

export function PositionCard({ position }: PositionCardProps) {
  return (
    <div
      className="bg-white border border-[#e0d9ce] hover:border-[#c9a84c] transition-colors duration-150"
      style={{ borderRadius: 0 }}
    >
      <Link href={`/positions/${position.id}`} className="block p-5 pb-3">
        {/* Company */}
        <p className="vcx-section-label mb-1">{position.company_name}</p>

        {/* Title */}
        <h3 className="font-vcx-serif font-bold text-[#1a1a1a] text-lg leading-snug mb-2">
          {position.title}
        </h3>

        {/* Meta tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {position.team_size && (
            <span
              className="px-2 py-0.5 text-[10px] font-vcx-sans text-[#666666] bg-[#f0ebe2] border border-[#e0d9ce]"
              style={{ borderRadius: 0 }}
            >
              팀 규모 {position.team_size}
            </span>
          )}
          {position.salary_range && (
            <span
              className="px-2 py-0.5 text-[10px] font-vcx-sans text-[#c9a84c] bg-[#fdf8ef] border border-[#e8d9a0]"
              style={{ borderRadius: 0 }}
            >
              {position.salary_range}
            </span>
          )}
        </div>

        {/* Role description preview */}
        <p className="text-sm font-vcx-sans text-[#555555] line-clamp-2 leading-relaxed">
          {position.role_description}
        </p>
      </Link>

      {/* Interest buttons */}
      <div className="px-5 pb-4 pt-2 border-t border-[#f0ebe2]">
        <InterestButton positionId={position.id} initialInterest={position.my_interest} />
      </div>
    </div>
  )
}
