'use client'

import useSWR from 'swr'
import { RecommendationCard } from './recommendation-card'

type MatchedMember = {
  id: string
  name: string
  title: string | null
  current_company: string | null
  matchPercent: number
  commonFields: string[]
  is_open_to_chat: boolean | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function RecommendationsSection() {
  const { data, isLoading } = useSWR<{ data: MatchedMember[] }>(
    '/api/recommendations/matches',
    fetcher,
    { revalidateOnFocus: false }
  )

  const members = data?.data ?? []

  if (isLoading) {
    return (
      <div className="mb-10">
        <p className="vcx-section-label mb-4">추천 멤버</p>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[220px] sm:w-[240px] h-[140px] bg-[#e8e2d9] animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (members.length === 0) return null

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <p className="vcx-section-label">추천 멤버</p>
        <span className="text-[12px] font-vcx-sans text-vcx-sub-4">
          내 프로필 기반 매칭
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {members.map((member) => (
          <RecommendationCard
            key={member.id}
            id={member.id}
            name={member.name}
            title={member.title}
            current_company={member.current_company}
            matchPercent={member.matchPercent}
            commonFields={member.commonFields}
            is_open_to_chat={member.is_open_to_chat}
          />
        ))}
      </div>
    </div>
  )
}
