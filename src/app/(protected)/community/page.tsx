import { ProtectedPageWrapper } from '@/components/layout/protected-page-wrapper'
import { LoungeFeed } from '@/components/community/lounge-feed'

export default async function CommunityPage() {
  return (
    <ProtectedPageWrapper currentPath="/community">
      <div style={{ background: '#f5f0e8', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        {/* HERO */}
        <div
          style={{
            background: '#1a1a1a',
            padding: '56px 0 64px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse 60% 80% at 90% 50%, rgba(201,168,76,0.04) 0%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              maxWidth: '1100px',
              margin: '0 auto',
              padding: '0 48px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <div style={{ width: '28px', height: '1px', background: '#c9a84c' }} />
              <span
                style={{
                  color: '#c9a84c',
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  fontWeight: 600,
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                COMMUNITY LOUNGE · INVITE-ONLY
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '32px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: 'clamp(26px, 3.5vw, 42px)',
                    fontWeight: 800,
                    color: '#f5f0e8',
                    lineHeight: 1.25,
                    margin: '0 0 16px',
                    letterSpacing: '-1px',
                    fontFamily: 'Georgia, serif',
                  }}
                >
                  실명으로는 말할 수 없는 것들
                </h1>
                <p
                  style={{
                    fontSize: '15px',
                    color: '#b0a898',
                    lineHeight: 1.8,
                    maxWidth: '480px',
                    margin: 0,
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  익명이지만 멤버 인증된 공간. 평가 없이 집단 지성이 작동합니다.
                </p>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '12px' }}>🔒</span>
                <span
                  style={{
                    fontSize: '12.5px',
                    color: '#b0a898',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  채용에 활용되지 않습니다
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Client feed */}
        <LoungeFeed />
      </div>
    </ProtectedPageWrapper>
  )
}
