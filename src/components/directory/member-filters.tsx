'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

const INDUSTRIES = [
  'IT/소프트웨어',
  '금융/핀테크',
  '컨설팅',
  '마케팅/광고',
  '의료/헬스케어',
  '교육',
  '제조/하드웨어',
  '스타트업',
  '미디어/콘텐츠',
  '법률/회계',
  '부동산',
  '기타',
]

export function MemberFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [showFilters, setShowFilters] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentTier = searchParams.get('tier') ?? ''
  const currentIndustry = searchParams.get('industry') ?? ''

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      updateParams({ q })
    }, 300)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const tierOptions = [
    { label: '전체', value: '' },
    { label: 'Core', value: 'core' },
    { label: 'Endorsed', value: 'endorsed' },
  ]

  return (
    <div className="bg-white border border-[#e0d9ce] p-4 mb-6">
      {/* Search input */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름, 회사, 소개 검색..."
          className="flex-1 px-3 py-2 text-sm font-vcx-sans bg-[#f7f3ed] border border-[#e0d9ce] text-[#1a1a1a] placeholder-[#999999] outline-none focus:border-[#c9a84c]"
          style={{ borderRadius: 0 }}
        />
        {/* Mobile filter toggle */}
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="md:hidden px-3 py-2 text-xs font-vcx-sans text-[#666666] border border-[#e0d9ce] bg-[#f7f3ed]"
          style={{ borderRadius: 0 }}
        >
          필터 {showFilters ? '닫기' : '열기'}
        </button>
      </div>

      {/* Filter controls - hidden on mobile unless toggled */}
      <div className={`mt-3 flex flex-wrap gap-4 items-center ${showFilters ? 'flex' : 'hidden md:flex'}`}>
        {/* Tier toggle */}
        <div className="flex gap-0">
          {tierOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateParams({ tier: opt.value })}
              className={`px-3 py-1.5 text-xs font-vcx-sans border transition-colors ${
                currentTier === opt.value
                  ? 'bg-[#1a1a1a] text-[#c9a84c] border-[#1a1a1a]'
                  : 'bg-white text-[#666666] border-[#e0d9ce] hover:border-[#888888]'
              }`}
              style={{ borderRadius: 0 }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Industry dropdown */}
        <select
          value={currentIndustry}
          onChange={(e) => updateParams({ industry: e.target.value })}
          className="px-3 py-1.5 text-xs font-vcx-sans bg-white border border-[#e0d9ce] text-[#666666] outline-none focus:border-[#c9a84c] cursor-pointer"
          style={{ borderRadius: 0 }}
        >
          <option value="">업종 전체</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>

        {/* Clear all */}
        {(currentTier || currentIndustry || q) && (
          <button
            type="button"
            onClick={() => {
              setQ('')
              updateParams({ tier: '', industry: '', q: '' })
            }}
            className="text-xs font-vcx-sans text-[#999999] underline hover:text-[#666666]"
          >
            필터 초기화
          </button>
        )}
      </div>
    </div>
  )
}
