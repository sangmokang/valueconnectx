'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { PositionMatchCard } from './position-match-card'
import type { MatchResult } from '@/lib/position-matcher'

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('fetch failed')
    return res.json()
  })

export function ProfileMatchSection() {
  const { data, error, isLoading } = useSWR<{ data: MatchResult[] }>(
    '/api/positions/matches',
    fetcher,
    { revalidateOnFocus: false }
  )

  if (error) return null
  if (isLoading) {
    return (
      <div className="mt-8">
        <p className="vcx-section-label mb-2">맞춤 포지션</p>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-white border border-[#e0d9ce] animate-pulse"
              style={{ borderRadius: 0 }}
            />
          ))}
        </div>
      </div>
    )
  }

  const matches = (data?.data ?? []).slice(0, 3)
  if (matches.length === 0) return null

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="vcx-section-label mb-0.5">맞춤 포지션</p>
          <h2 className="font-vcx-serif font-bold text-[#1a1a1a] text-xl">
            내 프로필에 맞는 포지션
          </h2>
        </div>
        <Link
          href="/positions"
          className="text-xs font-vcx-sans text-[#888888] hover:text-[#1a1a1a] transition-colors"
        >
          전체 보기 →
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {matches.map((match) => (
          <PositionMatchCard key={match.position.id} match={match} />
        ))}
      </div>
    </div>
  )
}
