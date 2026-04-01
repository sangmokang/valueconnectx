'use client'

import type { FeedItem } from './feed-card'

interface FeedDetailModalProps {
  item: FeedItem
  onClose: () => void
  onInterest: (value: 'yes' | null) => void
  onSkip: () => void
}

export function FeedDetailModal({ item, onClose, onInterest, onSkip }: FeedDetailModalProps) {
  const interested = item.user_response === 'yes'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {/* gold top bar */}
        <div
          style={{
            height: 3,
            background: 'linear-gradient(90deg, #c9a84c, #a8892e)',
          }}
        />
        <div style={{ padding: '32px 36px' }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#aaa',
            }}
          >
            ✕
          </button>

          {item.exclusive && (
            <div
              style={{
                display: 'inline-block',
                fontSize: 10,
                padding: '3px 9px',
                background: '#1a1a1a',
                color: '#c9a84c',
                fontWeight: 800,
                letterSpacing: '0.1em',
                marginBottom: 16,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              EXCLUSIVE
            </div>
          )}

          <div
            style={{
              fontSize: 12,
              color: '#888',
              marginBottom: 6,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {item.company}
            {item.company_tag ? ` · ${item.company_tag}` : ''}
          </div>

          <h2
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: '#1a1a1a',
              margin: '0 0 24px',
              fontFamily: 'Georgia, serif',
              letterSpacing: '-0.5px',
            }}
          >
            {item.role}
          </h2>

          {/* 2x2 메타 그리드 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 28,
              padding: 20,
              background: '#f5f0e8',
            }}
          >
            {[
              { label: '팀 규모', value: item.team_size },
              { label: '연봉 밴드', value: item.salary_band },
              { label: '위치', value: item.location },
              { label: '레벨', value: item.level },
            ]
              .filter((m) => m.value)
              .map((m) => (
                <div key={m.label}>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#888',
                      fontWeight: 600,
                      marginBottom: 3,
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    {m.label}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#1a1a1a',
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    {m.value}
                  </div>
                </div>
              ))}
          </div>

          {item.summary && (
            <p
              style={{
                fontSize: 14.5,
                color: '#555',
                lineHeight: 1.85,
                marginBottom: 28,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {item.summary}
            </p>
          )}

          {/* 액션 버튼 */}
          <div
            style={{
              borderTop: '1px solid rgba(0,0,0,0.08)',
              paddingTop: 24,
              display: 'flex',
              gap: 10,
            }}
          >
            <button
              onClick={() => onInterest(interested ? null : 'yes')}
              style={{
                flex: 2,
                padding: 13,
                background: interested ? '#c9a84c' : '#1a1a1a',
                color: interested ? '#1a1a1a' : '#f5f0e8',
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {interested ? '✓ 관심 있음' : '관심 있음 →'}
            </button>
            <button
              onClick={() => {
                onSkip()
                onClose()
              }}
              style={{
                flex: 1,
                padding: 13,
                background: 'transparent',
                border: '1px solid rgba(0,0,0,0.12)',
                fontSize: 14,
                color: '#888',
                cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              관심 없음
            </button>
          </div>

          {/* 안내 메시지 */}
          <div
            style={{
              marginTop: 20,
              padding: '14px 16px',
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.2)',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#a8892e',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              관심 있음을 클릭하면 ValueConnect 헤드헌터가 직접 연락드립니다.
              이 정보는 채용 목적으로만 사용됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
