'use client'

interface RecommendationCardProps {
  id: string
  name: string
  title: string | null
  current_company: string | null
  matchPercent: number
  commonFields: string[]
  is_open_to_chat: boolean | null
}

export function RecommendationCard({
  name,
  title,
  current_company,
  matchPercent,
  commonFields,
  is_open_to_chat,
}: RecommendationCardProps) {
  return (
    <div className="flex-shrink-0 w-[220px] sm:w-[240px] bg-white border border-[#1a1a1a] p-4 flex flex-col gap-3">
      {/* Match score */}
      <div className="flex items-center justify-between">
        <span className="vcx-label text-[#c9a84c]">매칭 {matchPercent}%</span>
        {is_open_to_chat && (
          <span className="vcx-label px-2 py-0.5 border border-[#c9a84c] text-[#c9a84c] text-[10px]">
            채팅 가능
          </span>
        )}
      </div>

      {/* Score bar */}
      <div className="w-full h-1 bg-[#e8e2d9]">
        <div
          className="h-1 bg-[#c9a84c] transition-all"
          style={{ width: `${matchPercent}%` }}
        />
      </div>

      {/* Member info */}
      <div>
        <p className="font-vcx-serif text-[15px] text-vcx-dark leading-snug">{name}</p>
        {(title || current_company) && (
          <p className="text-[12px] font-vcx-sans text-vcx-sub-3 mt-0.5">
            {[title, current_company].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* Common fields */}
      {commonFields.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {commonFields.slice(0, 3).map((field) => (
            <span
              key={field}
              className="vcx-label px-2 py-0.5 bg-[#f0ebe2] text-vcx-sub-3 text-[10px]"
            >
              {field}
            </span>
          ))}
          {commonFields.length > 3 && (
            <span className="vcx-label px-2 py-0.5 bg-[#f0ebe2] text-vcx-sub-4 text-[10px]">
              +{commonFields.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
