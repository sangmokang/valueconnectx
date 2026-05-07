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

const fetcher = async (url: string) => {
  const response = await fetch(url)
  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(json.error ?? '포지션을 불러오지 못했습니다')
  }
  return json
}

const DOMAIN_KEYWORDS: Record<Exclude<DomainFilter, '전체'>, string[]> = {
  사업개발: ['business', 'bd', '사업', '파트너십', '전략'],
  프로덕트: ['product', 'pm', '프로덕트', '기획'],
  엔지니어링: ['engineer', 'developer', 'tech', '개발', 'ml', 'platform', 'cto'],
  재무: ['finance', 'cfo', '재무', '투자', '회계'],
  세일즈: ['sales', 'cro', '세일즈', '영업'],
}

const DOMAIN_ALIASES: Record<Exclude<DomainFilter, '전체'>, string[]> = {
  사업개발: ['business', 'bd', '사업개발'],
  프로덕트: ['product', '프로덕트'],
  엔지니어링: ['engineering', 'engineer', '엔지니어링'],
  재무: ['finance', '재무'],
  세일즈: ['sales', '세일즈'],
}

function matchesDomain(pos: PositionCardData, filter: DomainFilter): boolean {
  if (filter === '전체') return true
  if (pos.domain) {
    const normalized = pos.domain.toLowerCase()
    return DOMAIN_ALIASES[filter].some((alias) => alias.toLowerCase() === normalized)
  }
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
            <p style={{ color: '#333', fontSize: 17, fontWeight: 700 }}>포지션 목록을 잠시 불러오지 못했습니다.</p>
            <p style={{ color: 'var(--color-vcx-sub-4)', fontSize: 14, marginTop: 8 }}>화면을 새로고침하면 다시 확인할 수 있습니다.</p>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="py-16 text-center">
            <p style={{ color: '#333', fontSize: 17, fontWeight: 700 }}>검증된 포지션을 준비하고 있습니다.</p>
            <p style={{ color: 'var(--color-vcx-sub-4)', fontSize: 14, marginTop: 8 }}>관심 분야를 등록하면 운영팀이 선별한 기회를 가장 먼저 알려드립니다.</p>
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
