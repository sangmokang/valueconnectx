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
        background: 'var(--color-vcx-dark)',
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
          <div style={{ width: 28, height: 1, background: 'var(--color-vcx-gold)' }} />
          <span
            style={{
              color: 'var(--color-vcx-gold)',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            CEO 커피챗 · 결이 맞는 대화
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 46px)',
            fontWeight: 800,
            color: 'var(--color-vcx-cream)',
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
            margin: '0 0 16px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          기업 경영을 하면서 주요 포지션의 채용이 필요하거나, 기간 한정적으로 미션 해결을 위해 도움이 필요할 때 계약관계로 협업할 수 있습니다.
        </p>
        <p
          style={{
            fontSize: 13,
            color: 'var(--color-vcx-sub-4)',
            lineHeight: 1.8,
            maxWidth: 520,
            margin: 0,
            fontFamily: 'system-ui, sans-serif',
            paddingLeft: 12,
            borderLeft: '2px solid rgba(201,168,76,0.4)',
          }}
        >
          채용 및 프리랜서 계약 논의 시, ValueConnect 팀과 함께 진행해주시면 감사하겠습니다.
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
                  color: 'var(--color-vcx-gold)',
                  fontFamily: 'Georgia, serif',
                }}
              >
                {m.val}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--color-vcx-sub-4)',
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
