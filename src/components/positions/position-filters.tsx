'use client'

import { useState } from 'react'

export type DomainFilter = '전체' | 'Business' | 'Product' | 'Engineering' | 'Finance' | 'Sales'

const FILTERS: DomainFilter[] = ['전체', 'Business', 'Product', 'Engineering', 'Finance', 'Sales']

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
      <div className="mx-auto max-w-[1100px] px-6 md:px-12 flex overflow-x-auto">
        {FILTERS.map((f) => {
          const active = f === value
          return (
            <button
              key={f}
              type="button"
              onClick={() => onChange(f)}
              className="shrink-0 transition-colors"
              style={{
                padding: '16px 20px',
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid #c9a84c' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: 13.5,
                fontWeight: active ? 700 : 400,
                color: active ? '#1a1a1a' : '#888888',
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
