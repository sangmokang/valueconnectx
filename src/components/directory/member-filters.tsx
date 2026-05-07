'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { INDUSTRIES } from '@/constants/profile'

export function MemberFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams?.toString() ?? ''

  const [q, setQ] = useState(searchParams?.get('q') ?? '')
  const [showFilters, setShowFilters] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentTier = searchParams?.get('tier') ?? ''
  const currentIndustry = searchParams?.get('industry') ?? ''

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(search)
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
    [pathname, router, search]
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
    { label: '코어 멤버', value: 'core' },
    { label: '추천 멤버', value: 'endorsed' },
  ]

  return (
    <div className="bg-white border border-vcx-dark/10 p-4 mb-6">
      {/* Search input */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름, 회사, 소개 검색..."
          className="flex-1 px-3 py-2 text-sm font-vcx-sans bg-vcx-beige-light border border-vcx-dark/10 text-vcx-dark placeholder-[#bbb] outline-none focus:border-vcx-gold"
          style={{ borderRadius: 0 }}
        />
        {/* Mobile filter toggle */}
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="md:hidden min-h-9 px-3 py-2 text-xs font-vcx-sans text-vcx-sub-3 border border-vcx-dark/10 bg-vcx-beige-light"
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
              className={`min-h-9 px-3 py-1.5 text-xs font-vcx-sans border transition-colors ${
                currentTier === opt.value
                  ? 'bg-vcx-dark text-vcx-gold border-vcx-dark'
                  : 'bg-white text-vcx-sub-3 border-vcx-dark/10 hover:border-vcx-sub-4'
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
          className="min-h-9 px-3 py-1.5 text-xs font-vcx-sans bg-white border border-vcx-dark/10 text-vcx-sub-3 outline-none focus:border-vcx-gold cursor-pointer"
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
            className="inline-flex min-h-9 items-center text-xs font-vcx-sans text-vcx-sub-5 underline hover:text-vcx-sub-3"
          >
            필터 초기화
          </button>
        )}
      </div>
    </div>
  )
}
