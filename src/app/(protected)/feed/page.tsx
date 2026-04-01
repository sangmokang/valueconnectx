import { ProtectedPageWrapper } from '@/components/layout/protected-page-wrapper'
import { FeedClient } from '@/components/feed/feed-client'

export default function FeedPage() {
  return (
    <ProtectedPageWrapper currentPath="/feed">
      {/* HERO — 서버 렌더 */}
      <div
        style={{
          background: '#1a1a1a',
          padding: '64px 0 72px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(ellipse 80% 50% at 80% 50%, rgba(201,168,76,0.06) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            padding: '0 48px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 24,
            }}
          >
            <div style={{ width: 28, height: 1, background: '#c9a84c' }} />
            <span
              style={{
                color: '#c9a84c',
                fontSize: 11,
                letterSpacing: '0.2em',
                fontWeight: 600,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              CURATION FEED · WEEKLY
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 4vw, 46px)',
              fontWeight: 800,
              color: '#f5f0e8',
              lineHeight: 1.25,
              margin: '0 0 20px',
              letterSpacing: '-1px',
              fontFamily: 'Georgia, serif',
            }}
          >
            어떤 시장이
            <br />
            궁금하신가요?
          </h1>

          <p
            style={{
              fontSize: 15.5,
              color: '#b0a898',
              lineHeight: 1.9,
              maxWidth: 540,
              margin: '0 0 36px',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            관심 분야를 선택하면 — 해당 시장의 핵심 포지션을
            <br />
            매주 직접 받아보실 수 있습니다.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 18px',
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.3)',
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: '#d4b56a',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              이 내용이 매주 이메일로 전송됩니다
            </span>
          </div>
        </div>
      </div>

      {/* 클라이언트 컴포넌트 (관심 분야 선택 + 피드) */}
      <FeedClient />
    </ProtectedPageWrapper>
  )
}
