'use client'

import { useState, useTransition } from 'react'
import { trackEvent } from '@/lib/analytics'

export interface PositionCardData {
  id: string
  company_name: string
  title: string
  team_size: string | null
  role_description: string
  salary_range: string | null
  status: string
  created_at: string
  my_interest: 'interested' | 'not_interested' | 'bookmark' | null
  // Optional enriched fields (may not be in DB)
  domain?: string
  score?: number
  exclusive?: boolean
  location?: string
  level?: string
  tags?: string[]
  full_desc?: string
  reqs?: string[]
  texture?: string[]
  posted_label?: string
}

function formatPosted(created_at: string): string {
  const now = Date.now()
  const diff = now - new Date(created_at).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '오늘'
  if (days === 1) return '1일 전'
  if (days < 7) return `${days}일 전`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}주 전`
  return `${Math.floor(days / 30)}개월 전`
}

interface PositionCardProps {
  position: PositionCardData
  isOpen: boolean
  onToggle: () => void
}

export function PositionCard({ position: pos, isOpen, onToggle }: PositionCardProps) {
  const [hovered, setHovered] = useState(false)
  const [interest, setInterest] = useState<'interested' | 'bookmark' | null>(
    pos.my_interest === 'interested' || pos.my_interest === 'bookmark' ? pos.my_interest : null
  )
  const [isPending, startTransition] = useTransition()

  const score = pos.score
  const scoreHigh = score !== undefined && score >= 90
  const postedLabel = pos.posted_label ?? formatPosted(pos.created_at)

  const handleInterest = (type: 'interested' | 'bookmark') => {
    startTransition(async () => {
      const next = interest === type ? null : type
      const method = next === null ? 'DELETE' : 'POST'
      const body =
        method === 'POST'
          ? JSON.stringify({ interest_type: next === 'interested' ? 'interested' : 'bookmark' })
          : undefined

      const res = await fetch(`/api/positions/${pos.id}/interest`, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body,
      })
      if (res.ok) {
        setInterest(next)
        trackEvent('position_interested', { position_id: pos.id, interest_type: next })
      }
    })
  }

  const borderColor = isOpen
    ? 'rgba(0,0,0,0.14)'
    : hovered
    ? 'rgba(0,0,0,0.12)'
    : 'rgba(0,0,0,0.08)'

  return (
    <div
      style={{
        background: '#ffffff',
        border: `1px solid ${borderColor}`,
        boxShadow: isOpen ? '0 4px 24px rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.18s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header row */}
      <div
        onClick={onToggle}
        style={{
          padding: '24px 28px',
          cursor: 'pointer',
          display: 'flex',
          gap: 20,
          alignItems: 'flex-start',
        }}
      >
        {/* Match score */}
        {score !== undefined ? (
          <div
            style={{
              width: 52,
              height: 52,
              background: scoreHigh ? '#f0faf5' : '#fafaf0',
              border: `1.5px solid ${scoreHigh ? '#22c55e' : '#c9a84c'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: scoreHigh ? '#16a34a' : '#a07830',
                lineHeight: 1,
              }}
            >
              {score}
            </span>
            <span style={{ fontSize: 9, color: '#b0a898', letterSpacing: '0.05em' }}>MATCH</span>
          </div>
        ) : null}

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Company row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 6,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 15.5,
                fontWeight: 800,
                color: '#1a1a1a',
                fontFamily: 'Georgia, serif',
              }}
            >
              {pos.company_name}
            </span>
            {pos.domain && (
              <span style={{ fontSize: 12, color: '#b0a898' }}>{pos.domain}</span>
            )}
            {pos.exclusive && (
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 7px',
                  background: '#1a1a1a',
                  color: '#c9a84c',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                }}
              >
                EXCLUSIVE
              </span>
            )}
            <span style={{ fontSize: 12, color: '#b0a898', marginLeft: 'auto' }}>
              {postedLabel}
            </span>
          </div>

          {/* Role title */}
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>
            {pos.title}
          </div>

          {/* Meta + tags */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {pos.location && (
              <span style={{ fontSize: 12.5, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                📍 {pos.location}
              </span>
            )}
            {pos.level && (
              <span style={{ fontSize: 12.5, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                📊 {pos.level}
              </span>
            )}
            {pos.salary_range && (
              <span style={{ fontSize: 12.5, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                💰 {pos.salary_range}
              </span>
            )}
            {pos.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-full"
                style={{
                  fontSize: 11.5,
                  padding: '2px 9px',
                  background: '#f5f0e8',
                  border: '1px solid rgba(0,0,0,0.08)',
                  color: '#777',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Toggle / bookmark indicator */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
          {interest === 'bookmark' && (
            <span style={{ fontSize: 13, color: '#c9a84c' }}>🔖</span>
          )}
          <span
            style={{
              fontSize: 12,
              color: '#ccc',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
              display: 'inline-block',
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {isOpen && (
        <div
          style={{
            borderTop: '1px solid rgba(0,0,0,0.08)',
            padding: '28px',
            background: '#fdfcf9',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 32,
            }}
          >
            {/* Left: summary + reqs */}
            <div>
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#c9a84c',
                    letterSpacing: '0.15em',
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  POSITION SUMMARY
                </div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.85, margin: 0 }}>
                  {pos.full_desc ?? pos.role_description}
                </p>
              </div>

              {pos.reqs && pos.reqs.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#b0a898',
                      letterSpacing: '0.15em',
                      fontWeight: 700,
                      marginBottom: 10,
                    }}
                  >
                    주요 요건
                  </div>
                  {pos.reqs.map((req, i) => (
                    <div
                      key={i}
                      style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}
                    >
                      <div
                        className="rounded-full"
                        style={{ width: 4, height: 4, background: '#c9a84c', flexShrink: 0, marginTop: 8 }}
                      />
                      <span style={{ fontSize: 13.5, color: '#555', lineHeight: 1.65 }}>{req}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: texture + CTA */}
            <div>
              {pos.texture && pos.texture.length > 0 && (
                <>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#b0a898',
                      letterSpacing: '0.15em',
                      fontWeight: 700,
                      marginBottom: 14,
                    }}
                  >
                    이런 분을 찾습니다
                  </div>
                  {pos.texture.map((t, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '14px 18px',
                        background: '#ffffff',
                        border: '1px solid rgba(0,0,0,0.07)',
                        marginBottom: 8,
                        borderLeft: '3px solid #c9a84c',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13.5,
                          color: '#1a1a1a',
                          fontStyle: 'italic',
                          lineHeight: 1.6,
                          fontFamily: 'Georgia, serif',
                        }}
                      >
                        {t}
                      </span>
                    </div>
                  ))}
                </>
              )}

              <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleInterest('interested')}
                  style={{
                    flex: 2,
                    padding: '12px',
                    background: interest === 'interested' ? '#c9a84c' : '#1a1a1a',
                    color: interest === 'interested' ? '#1a1a1a' : '#f5f0e8',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    fontFamily: 'system-ui, sans-serif',
                    opacity: isPending ? 0.6 : 1,
                    transition: 'background 0.15s',
                  }}
                >
                  {interest === 'interested' ? '✓ 관심 있음' : '관심 있음 →'}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleInterest('bookmark')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'transparent',
                    border: '1px solid rgba(0,0,0,0.12)',
                    fontSize: 14,
                    color: interest === 'bookmark' ? '#c9a84c' : '#888',
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    fontFamily: 'system-ui, sans-serif',
                    opacity: isPending ? 0.6 : 1,
                    transition: 'color 0.15s',
                  }}
                >
                  🔖 나중에
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
