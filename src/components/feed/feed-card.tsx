'use client'

import { useState } from 'react'
import type { FeedItem } from '@/types'

export type { FeedItem }

interface FeedCardProps {
  item: FeedItem
  onInterest: (value: 'yes' | null) => void
  onSkip: () => void
  onDetail: () => void
}

export function FeedCard({ item, onInterest, onSkip, onDetail }: FeedCardProps) {
  const [hovered, setHovered] = useState(false)
  const interested = item.user_response === 'yes'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#ffffff',
        border: `1px solid ${hovered ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.08)'}`,
        transition: 'all 0.18s',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.06)' : 'none',
      }}
    >
      <div
        style={{
          padding: '24px 28px',
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        {/* 회사 아바타 */}
        <div
          style={{
            width: 44,
            height: 44,
            background: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: '#c9a84c',
              fontSize: 14,
              fontWeight: 800,
              fontFamily: 'Georgia, serif',
            }}
          >
            {item.company[0]}
          </span>
        </div>

        {/* 본문 */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#1a1a1a',
                fontFamily: 'Georgia, serif',
              }}
            >
              {item.company}
            </span>
            {item.company_tag && (
              <span
                style={{
                  fontSize: 11.5,
                  color: '#888',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {item.company_tag}
              </span>
            )}
            {item.exclusive && (
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 7px',
                  background: '#1a1a1a',
                  color: '#c9a84c',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                EXCLUSIVE
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#1a1a1a',
              marginBottom: 10,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {item.role}
          </div>

          {item.summary && (
            <p
              style={{
                fontSize: 13.5,
                color: '#555',
                lineHeight: 1.75,
                margin: '0 0 16px',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {item.summary}
            </p>
          )}

          {/* 메타 */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              marginBottom: 16,
            }}
          >
            {[
              { icon: '👥', label: '팀 규모', value: item.team_size },
              { icon: '💰', label: '연봉 밴드', value: item.salary_band },
              { icon: '📍', label: '위치', value: item.location },
              { icon: '📊', label: '레벨', value: item.level },
            ]
              .filter((m) => m.value)
              .map((m) => (
                <div
                  key={m.label}
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <span style={{ fontSize: 12 }}>{m.icon}</span>
                  <span
                    style={{
                      fontSize: 11.5,
                      color: '#888',
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    {m.label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1a1a1a',
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    {m.value}
                  </span>
                </div>
              ))}
          </div>

          {/* 태그 */}
          {item.tags && item.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11.5,
                    padding: '3px 10px',
                    background: '#f5f0e8',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#777',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 액션 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            flexShrink: 0,
            alignItems: 'flex-end',
          }}
        >
          <button
            onClick={() => onInterest(interested ? null : 'yes')}
            style={{
              padding: '9px 20px',
              background: interested ? '#c9a84c' : 'transparent',
              border: `1.5px solid ${interested ? '#c9a84c' : 'rgba(0,0,0,0.15)'}`,
              color: interested ? '#1a1a1a' : '#555',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'system-ui, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            {interested ? '✓ 관심 있음' : '관심 있음'}
          </button>
          <button
            onClick={onSkip}
            style={{
              padding: '9px 20px',
              background: 'transparent',
              border: '1px solid rgba(0,0,0,0.1)',
              color: '#aaa',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            관심 없음
          </button>
          <button
            onClick={onDetail}
            style={{
              padding: '6px 0',
              background: 'none',
              border: 'none',
              color: '#c9a84c',
              fontSize: 12.5,
              cursor: 'pointer',
              fontFamily: 'system-ui, sans-serif',
              textDecoration: 'underline',
            }}
          >
            상세 보기
          </button>
        </div>
      </div>
    </div>
  )
}
