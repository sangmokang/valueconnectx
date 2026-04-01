'use client'

import { useState } from 'react'
import type { CeoSession } from '@/types'

export type { CeoSession }

interface CeoSessionCardProps {
  session: CeoSession
  isOpen: boolean
  onToggle: () => void
  isApplied: boolean
  onApply: () => void
}

function getInitial(name: string) {
  return name.charAt(0)
}

export function CeoSessionCard({
  session,
  isOpen,
  onToggle,
  isApplied,
  onApply,
}: CeoSessionCardProps) {
  const [hovered, setHovered] = useState(false)

  const hostName = session.host?.name ?? ''
  const hostTitle = session.host?.title ?? ''
  const company = session.host?.company ?? ''
  const companyDesc = session.host?.company_desc ?? session.title

  // Deadline: parse session_date
  const deadlineLabel = session.deadline_label ?? (() => {
    try {
      const d = new Date(session.session_date)
      return `${d.getMonth() + 1}월 ${d.getDate()}일 마감`
    } catch {
      return '마감일 미정'
    }
  })()

  const slotsRemaining =
    session.slots_remaining !== undefined
      ? session.slots_remaining
      : Math.max(0, session.max_participants - session.application_count)

  const lookingFor = session.looking_for ?? session.description
  const signal = session.signal ?? ''

  const borderColor =
    isOpen ? 'rgba(0,0,0,0.12)' : hovered ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.08)'

  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${borderColor}`,
        boxShadow: isOpen ? '0 4px 24px rgba(0,0,0,0.07)' : 'none',
        transition: 'all 0.18s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Collapsed row */}
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
        {/* Avatar */}
        <div
          style={{
            width: 52,
            height: 52,
            background: '#1a1a1a',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: '#c9a84c',
              fontSize: 18,
              fontWeight: 800,
              fontFamily: 'Georgia, serif',
            }}
          >
            {getInitial(hostName)}
          </span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 4,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: '#1a1a1a',
                fontFamily: 'Georgia, serif',
              }}
            >
              {hostName}
            </span>
            {hostTitle && (
              <span style={{ fontSize: 13.5, color: '#555', fontFamily: 'system-ui, sans-serif' }}>
                {hostTitle}
              </span>
            )}
            <span style={{ fontSize: 12, color: '#888' }}>·</span>
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: '#1a1a1a',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {company}
            </span>
            {companyDesc && (
              <span
                style={{
                  fontSize: 12,
                  color: '#888',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                — {companyDesc}
              </span>
            )}
          </div>

          {/* Deadline + slots */}
          <div
            style={{
              fontSize: 13,
              color: '#e85555',
              fontWeight: 600,
              marginBottom: 10,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            ⏰ {deadlineLabel} · 남은 자리 {slotsRemaining}석
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(session.tags ?? []).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 11.5,
                  padding: '2px 9px',
                  background: '#f5f0e8',
                  border: '1px solid rgba(0,0,0,0.08)',
                  color: '#777',
                  borderRadius: 100,
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 8,
          }}
        >
          {isApplied ? (
            <div
              style={{
                padding: '8px 16px',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                color: '#16a34a',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              ✓ 신청 완료
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onApply()
              }}
              style={{
                padding: '10px 20px',
                background: '#1a1a1a',
                color: '#f5f0e8',
                border: 'none',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              신청하기 →
            </button>
          )}
          <span
            style={{
              fontSize: 12,
              color: '#888',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {session.application_count}명 신청중
          </span>
        </div>
      </div>

      {/* Expanded panel */}
      {isOpen && (
        <div
          style={{
            borderTop: '1px solid rgba(0,0,0,0.08)',
            padding: '24px 28px',
            background: '#fdfcf9',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 32,
            }}
          >
            {/* CEO message */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: '#c9a84c',
                  letterSpacing: '0.15em',
                  fontWeight: 700,
                  marginBottom: 12,
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                CEO의 메시지
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: '#555',
                  lineHeight: 1.85,
                  margin: 0,
                  fontStyle: 'italic',
                  fontFamily: 'Georgia, serif',
                }}
              >
                &ldquo;{lookingFor}&rdquo;
              </p>
            </div>

            {/* Signal + CTA */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: '#888',
                  letterSpacing: '0.15em',
                  fontWeight: 700,
                  marginBottom: 12,
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                핵심 시그널
              </div>
              <div
                style={{
                  padding: '14px 18px',
                  background: '#fff',
                  borderLeft: '3px solid #c9a84c',
                  border: '1px solid rgba(0,0,0,0.07)',
                  borderLeftWidth: 3,
                  borderLeftColor: '#c9a84c',
                }}
              >
                <span
                  style={{
                    fontSize: 13.5,
                    color: '#1a1a1a',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {signal || '세션 상세를 확인하세요'}
                </span>
              </div>
              {!isApplied && (
                <button
                  onClick={onApply}
                  style={{
                    marginTop: 16,
                    width: '100%',
                    padding: '12px',
                    background: '#1a1a1a',
                    color: '#f5f0e8',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  비공개로 신청하기 →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
