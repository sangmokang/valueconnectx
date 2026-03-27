'use client'

import Link from 'next/link'
import type { MatchResult } from '@/lib/position-matcher'

interface PositionMatchCardProps {
  match: MatchResult
}

export function PositionMatchCard({ match }: PositionMatchCardProps) {
  const { position, matchScore, matchReasons } = match

  return (
    <div
      className="bg-white border border-[#e0d9ce] hover:border-[#c9a84c] transition-colors duration-150 min-w-[260px] max-w-[300px] flex-shrink-0 flex flex-col"
      style={{ borderRadius: 0 }}
    >
      <Link href={`/positions/${position.id}`} className="block p-4 flex-1">
        {/* 매칭 점수 */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-vcx-sans text-[#c9a84c] uppercase tracking-widest">
            AI 추천
          </span>
          <span className="text-xs font-vcx-sans font-semibold text-[#1a1a1a]">
            {matchScore}% 일치
          </span>
        </div>

        {/* 프로그레스 바 */}
        <div
          className="w-full h-1 bg-[#f0ebe2] mb-3"
          style={{ borderRadius: 0 }}
        >
          <div
            className="h-1 bg-[#c9a84c] transition-all duration-300"
            style={{ width: `${matchScore}%`, borderRadius: 0 }}
          />
        </div>

        {/* 회사 */}
        <p className="vcx-section-label mb-1">{position.company_name}</p>

        {/* 포지션 제목 */}
        <h3 className="font-vcx-serif font-bold text-[#1a1a1a] text-base leading-snug mb-3">
          {position.title}
        </h3>

        {/* 매칭 이유 태그 */}
        {matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {matchReasons.slice(0, 3).map((reason, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[10px] font-vcx-sans text-[#666666] bg-[#f0ebe2] border border-[#e0d9ce]"
                style={{ borderRadius: 0 }}
              >
                {reason}
              </span>
            ))}
          </div>
        )}
      </Link>
    </div>
  )
}
