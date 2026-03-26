'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

export const CATEGORIES = {
  career: '커리어 고민',
  leadership: '조직·리더십',
  salary: '연봉 협상',
  burnout: '번아웃',
  productivity: '생산성·News',
  company_review: '이 회사 어때요?',
} as const

export type CategoryKey = keyof typeof CATEGORIES

export function CategoryTabs({ current }: { current?: CategoryKey }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function buildHref(cat?: CategoryKey) {
    const params = new URLSearchParams(searchParams.toString())
    if (cat) {
      params.set('category', cat)
    } else {
      params.delete('category')
    }
    params.delete('page')
    return `${pathname}?${params.toString()}`
  }

  const tabs: { key?: CategoryKey; label: string }[] = [
    { key: undefined, label: '전체' },
    ...Object.entries(CATEGORIES).map(([k, v]) => ({ key: k as CategoryKey, label: v })),
  ]

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
      {tabs.map(({ key, label }) => {
        const isActive = key === current || (!key && !current)
        return (
          <Link
            key={key ?? 'all'}
            href={buildHref(key)}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontFamily: 'system-ui, sans-serif',
              textDecoration: 'none',
              border: '1px solid',
              borderColor: isActive ? '#1a1a1a' : '#e0d9ce',
              background: isActive ? '#1a1a1a' : 'transparent',
              color: isActive ? '#c9a84c' : '#555555',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
