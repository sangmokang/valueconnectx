'use client'

export type DomainFilter = '전체' | '사업개발' | '프로덕트' | '엔지니어링' | '재무' | '세일즈'

const FILTERS: DomainFilter[] = ['전체', '사업개발', '프로덕트', '엔지니어링', '재무', '세일즈']

interface PositionFiltersProps {
  value: DomainFilter
  onChange: (v: DomainFilter) => void
}

export function PositionFilters({ value, onChange }: PositionFiltersProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <div className="mx-auto max-w-[1100px] px-4 md:px-12 flex flex-wrap md:flex-nowrap md:overflow-x-auto">
        {FILTERS.map((f) => {
          const active = f === value
          return (
            <button
              key={f}
              type="button"
              onClick={() => onChange(f)}
              className="shrink-0 transition-colors"
              style={{
                padding: '14px 16px',
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid var(--color-vcx-gold)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: 13.5,
                fontWeight: active ? 700 : 400,
                color: active ? 'var(--color-vcx-dark)' : 'var(--color-vcx-sub-4)',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {f}
            </button>
          )
        })}
      </div>
    </div>
  )
}
