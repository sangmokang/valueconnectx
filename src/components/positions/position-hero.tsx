export function PositionHero() {
  return (
    <div
      className="relative overflow-hidden"
      style={{ background: '#1a1a1a', padding: '64px 0 72px' }}
    >
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 85% 50%, rgba(201,168,76,0.05) 0%, transparent 60%)',
        }}
      />

      <div className="mx-auto max-w-[1100px] px-6 md:px-12">
        {/* Label */}
        <div className="mb-6 flex items-center gap-2.5">
          <div style={{ width: 28, height: 1, background: '#c9a84c' }} />
          <span
            className="font-bold tracking-[0.2em]"
            style={{ color: '#c9a84c', fontSize: 11 }}
          >
            POSITIONS · CURATED BY VCX
          </span>
        </div>

        {/* Heading */}
        <h1
          className="font-bold leading-tight"
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(28px, 4vw, 46px)',
            color: '#f5f0e8',
            letterSpacing: '-1px',
            marginBottom: 20,
          }}
        >
          ValueConnect가<br />직접 선별한 포지션
        </h1>

        {/* Sub-copy */}
        <p
          className="leading-[1.9]"
          style={{ fontSize: 15.5, color: '#b0a898', maxWidth: 480 }}
        >
          공개 채용 공고가 아닙니다. ValueConnect가 기업과 직접 계약하고,
          <br className="hidden sm:block" />
          당신에게만 먼저 보여주는 포지션입니다.
        </p>
      </div>
    </div>
  )
}
