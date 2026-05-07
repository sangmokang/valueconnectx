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
            background: 'var(--color-vcx-dark)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            className="font-vcx-serif"
            style={{
              color: 'var(--color-vcx-gold)',
              fontSize: 18,
              fontWeight: 800,
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
              className="font-vcx-serif"
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--color-vcx-dark)',
              }}
            >
              {hostName}
            </span>
            {hostTitle && (
              <span className="font-vcx-sans" style={{ fontSize: 13.5, color: 'var(--color-sub-2)' }}>
                {hostTitle}
              </span>
            )}
            <span style={{ fontSize: 12, color: 'var(--color-sub-4)' }}>·</span>
            <span
              className="font-vcx-sans"
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: 'var(--color-vcx-dark)',
              }}
            >
              {company}
            </span>
            {companyDesc && (
              <span
                className="font-vcx-sans"
                style={{
                  fontSize: 12,
                  color: 'var(--color-sub-4)',
                }}
              >
                — {companyDesc}
              </span>
            )}
          </div>

          {/* Deadline + slots */}
          <div
            className="font-vcx-sans"
            style={{
              fontSize: 13,
              color: 'var(--color-vcx-error)',
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            ⏰ {deadlineLabel} · 남은 자리 {slotsRemaining}석
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(session.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="font-vcx-sans"
                style={{
                  fontSize: 11.5,
                  padding: '2px 9px',
                  background: 'var(--color-vcx-beige)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  color: 'var(--color-sub-3)',
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
              className="font-vcx-sans"
              style={{
                padding: '8px 16px',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                color: '#16a34a',
                fontSize: 13,
                fontWeight: 700,
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
              className="font-vcx-sans"
              style={{
                padding: '10px 20px',
                background: 'var(--color-vcx-dark)',
                color: 'var(--color-vcx-beige)',
                border: 'none',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              신청하기 →
            </button>
          )}
          <span
            className="font-vcx-sans"
            style={{
              fontSize: 12,
              color: 'var(--color-sub-4)',
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
            background: 'var(--color-vcx-off-white)',
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
                className="font-vcx-sans"
                style={{
                  fontSize: 10,
                  color: 'var(--color-vcx-gold)',
                  letterSpacing: '0.15em',
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                이런 분과 이야기하고 싶습니다
              </div>
              <p
                className="font-vcx-serif"
                style={{
                  fontSize: 14,
                  color: 'var(--color-sub-2)',
                  lineHeight: 1.85,
                  margin: 0,
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{lookingFor}&rdquo;
              </p>
            </div>

            {/* Signal + CTA */}
            <div>
              <div
                className="font-vcx-sans"
                style={{
                  fontSize: 10,
                  color: 'var(--color-sub-4)',
                  letterSpacing: '0.15em',
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                핵심 시그널
              </div>
              <div
                style={{
                  padding: '14px 18px',
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.07)',
                  borderLeft: '3px solid var(--color-vcx-gold)',
                }}
              >
                <span
                  className="font-vcx-sans"
                  style={{
                    fontSize: 13.5,
                    color: 'var(--color-vcx-dark)',
                  }}
                >
                  {signal || '세션 상세를 확인하세요'}
                </span>
              </div>
              {!isApplied && (
                <button
                  onClick={onApply}
                  className="font-vcx-sans"
                  style={{
                    marginTop: 16,
                    width: '100%',
                    padding: '12px',
                    background: 'var(--color-vcx-dark)',
                    color: 'var(--color-vcx-beige)',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  대화 신청하기 →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
