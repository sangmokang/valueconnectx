'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PositionCard, type PositionCardData } from './position-card'
import { PositionFilters, type DomainFilter } from './position-filters'

interface ApiResponse {
  data: PositionCardData[]
  total: number
  page: number
  limit: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const DOMAIN_KEYWORDS: Record<Exclude<DomainFilter, '전체'>, string[]> = {
  Business: ['business', 'bd', '사업', '파트너십', '전략'],
  Product: ['product', 'pm', '프로덕트', '기획'],
  Engineering: ['engineer', 'developer', 'tech', '개발', 'ml', 'platform', 'cto'],
  Finance: ['finance', 'cfo', '재무', '투자', '회계'],
  Sales: ['sales', 'cro', '세일즈', '영업'],
}

function matchesDomain(pos: PositionCardData, filter: DomainFilter): boolean {
  if (filter === '전체') return true
  if (pos.domain) return pos.domain.toLowerCase() === filter.toLowerCase()
  const keywords = DOMAIN_KEYWORDS[filter]
  const haystack = `${pos.title} ${pos.role_description}`.toLowerCase()
  return keywords.some((kw) => haystack.includes(kw))
}

export function PositionsClient() {
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('전체')
  const [openId, setOpenId] = useState<string | null>(null)

  const { data, error, isLoading } = useSWR<ApiResponse>(
    '/api/positions?limit=100',
    fetcher
  )

  const positions = data?.data ?? []
  const filtered = positions.filter((p) => matchesDomain(p, domainFilter))

  return (
    <>
      <PositionFilters value={domainFilter} onChange={setDomainFilter} />

      <div
        className="mx-auto max-w-[1100px] px-6 md:px-12"
        style={{ paddingTop: 40, paddingBottom: 80 }}
      >
        {isLoading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 96,
                  background: '#ffffff',
                  border: '1px solid rgba(0,0,0,0.08)',
                  opacity: 0.6,
                }}
                className="animate-pulse"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="py-16 text-center">
            <p style={{ color: '#888', fontSize: 14 }}>포지션을 불러오지 못했습니다.</p>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="py-16 text-center">
            <p style={{ color: '#888', fontSize: 14 }}>새로운 포지션이 준비 중입니다. 관심 분야를 등록하면 가장 먼저 알려드립니다.</p>
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="flex flex-col gap-4">
            {filtered.map((pos) => (
              <PositionCard
                key={pos.id}
                position={pos}
                isOpen={openId === pos.id}
                onToggle={() => setOpenId(openId === pos.id ? null : pos.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
