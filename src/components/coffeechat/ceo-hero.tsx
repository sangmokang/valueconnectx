'use client'

interface CeoHeroProps {
  sessionCount: number
  totalApplicants: number
  totalSlots: number
}

export function CeoHero({ sessionCount, totalApplicants, totalSlots }: CeoHeroProps) {
  const avgRatio = totalSlots > 0 ? Math.round(totalApplicants / totalSlots) : 0

  return (
    <div
      style={{
        background: '#1a1a1a',
        padding: '64px 0 72px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Radial gold glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 60% 100% at 80% 50%, rgba(201,168,76,0.06) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          padding: '0 24px',
        }}
      >
        {/* Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
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
            CEO COFFEE CHAT · CULTURE FIT
          </span>
        </div>

        {/* Headline */}
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
          서로의 결을
          <br />
          확인하는 자리
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: 15.5,
            color: '#b0a898',
            lineHeight: 1.9,
            maxWidth: 520,
            margin: 0,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          채용 면접이 아닙니다. 사업에 몰입하는 CEO와 분야 최고의 인재가 서로 잘 맞는지
          대화로 확인하는 자리입니다.
        </p>

        {/* Stats */}
        <div
          style={{
            marginTop: 32,
            display: 'flex',
            gap: 32,
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: '현재 열린 세션', val: `${sessionCount}건` },
            { label: '총 신청자', val: `${totalApplicants}명` },
            { label: '평균 선발률', val: avgRatio > 0 ? `1/${avgRatio}` : '-' },
          ].map((m) => (
            <div key={m.label}>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#c9a84c',
                  fontFamily: 'Georgia, serif',
                }}
              >
                {m.val}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#888',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
