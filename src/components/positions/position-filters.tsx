'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

export function PositionFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [showFilters, setShowFilters] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentCompany = searchParams.get('company') ?? ''

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

  const hasFilters = currentCompany || q

  return (
    <div className="bg-white border border-[#e0d9ce] p-4 mb-6">
      {/* Search input */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="포지션, 회사, 역할 검색..."
          className="flex-1 px-3 py-2 text-sm font-vcx-sans bg-[#f7f3ed] border border-[#e0d9ce] text-[#1a1a1a] placeholder-[#999999] outline-none focus:border-[#c9a84c]"
          style={{ borderRadius: 0 }}
        />
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="md:hidden px-3 py-2 text-xs font-vcx-sans text-[#666666] border border-[#e0d9ce] bg-[#f7f3ed]"
          style={{ borderRadius: 0 }}
        >
          필터 {showFilters ? '닫기' : '열기'}
        </button>
      </div>

      {/* Additional filters */}
      <div className={`mt-3 flex flex-wrap gap-4 items-center ${showFilters ? 'flex' : 'hidden md:flex'}`}>
        <input
          type="text"
          value={currentCompany}
          onChange={(e) => updateParams({ company: e.target.value })}
          placeholder="회사명 필터..."
          className="px-3 py-1.5 text-xs font-vcx-sans bg-white border border-[#e0d9ce] text-[#666666] outline-none focus:border-[#c9a84c] w-40"
          style={{ borderRadius: 0 }}
        />

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQ('')
              updateParams({ q: '', company: '' })
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
