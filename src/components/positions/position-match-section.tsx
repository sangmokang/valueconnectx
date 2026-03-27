'use client'

import useSWR from 'swr'
import { PositionMatchCard } from './position-match-card'
import type { MatchResult } from '@/lib/position-matcher'

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('fetch failed')
    return res.json()
  })

export function PositionMatchSection() {
  const { data, error, isLoading } = useSWR<{ data: MatchResult[] }>(
    '/api/positions/matches',
    fetcher,
    { revalidateOnFocus: false }
  )

  // 비인증(401/403) 또는 에러 시 섹션 숨김
  if (error) return null
  if (isLoading) {
    return (
      <div className="mb-6">
        <p className="vcx-section-label mb-2">AI 추천 포지션</p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[260px] h-44 bg-white border border-[#e0d9ce] animate-pulse flex-shrink-0"
              style={{ borderRadius: 0 }}
            />
          ))}
        </div>
      </div>
    )
  }

  const matches = data?.data ?? []
  if (matches.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="vcx-section-label mb-0.5">AI 추천 포지션</p>
          <h2 className="font-vcx-serif font-bold text-[#1a1a1a] text-xl">
            내 프로필에 맞는 포지션
          </h2>
        </div>
        <span className="text-xs font-vcx-sans text-[#888888]">
          {matches.length}개 추천
        </span>
      </div>

      {/* 수평 스크롤 카드 리스트 */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {matches.map((match) => (
          <PositionMatchCard key={match.position.id} match={match} />
        ))}
      </div>
    </div>
  )
}
