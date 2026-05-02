'use client'

import type { LoungeCategoryKey } from '@/types'

export type LoungeCatKey = LoungeCategoryKey

export const LOUNGE_CATS = [
  { key: 'all' as LoungeCatKey, icon: '▤', label: '전체' },
  { key: 'career' as LoungeCatKey, icon: '💼', label: '이직 이야기' },
  { key: 'leadership' as LoungeCatKey, icon: '🧠', label: '리더십 & 조직' },
  { key: 'salary' as LoungeCatKey, icon: '💰', label: '연봉 협상' },
  { key: 'burnout' as LoungeCatKey, icon: '🌿', label: '번아웃·회복' },
  { key: 'productivity' as LoungeCatKey, icon: '⚡', label: '생산성 & Tech' },
  { key: 'company_review' as LoungeCatKey, icon: '🏢', label: '이 회사 어때요?' },
]

interface LoungeSidebarProps {
  active: LoungeCatKey
  counts: Record<string, number>
  onSelect: (key: LoungeCatKey) => void
}

export function LoungeSidebar({ active, counts, onSelect }: LoungeSidebarProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.08)',
        overflow: 'hidden',
        position: 'sticky',
        top: '80px',
      }}
    >
      <div
        style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            color: '#b0a898',
            letterSpacing: '0.15em',
            fontWeight: 600,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          CATEGORIES
        </div>
      </div>

      {LOUNGE_CATS.map((cat) => {
        const isActive = active === cat.key
        return (
          <button
            key={cat.key}
            onClick={() => onSelect(cat.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '10px 16px',
              cursor: 'pointer',
              borderLeft: isActive ? '2px solid #c9a84c' : '2px solid transparent',
              background: isActive ? '#faf8f4' : 'transparent',
              borderTop: 'none',
              borderRight: 'none',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              textAlign: 'left',
            }}
          >
            <span
              style={{
                fontSize: '13.5px',
                color: isActive ? '#1a1a1a' : '#666',
                fontWeight: isActive ? 700 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <span style={{ fontSize: '13px' }}>{cat.icon}</span>
              {cat.label}
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: 0,
                background: isActive ? 'rgba(201,168,76,0.12)' : 'rgba(0,0,0,0.05)',
                color: isActive ? '#a07c2a' : '#b0a898',
                fontWeight: isActive ? 700 : 400,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {counts[cat.key] ?? 0}
            </span>
          </button>
        )
      })}
    </div>
  )
}
