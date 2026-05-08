'use client'

interface CeoHeroProps {
  sessionCount: number
  totalApplicants: number
  totalSlots: number
}

export function CeoHero({ sessionCount, totalApplicants, totalSlots }: CeoHeroProps) {
  const avgRatio = totalSlots > 0 ? Math.round(totalApplicants / totalSlots) : 0

  return (
    <div className="bg-vcx-dark relative overflow-hidden pt-16 pb-[72px]">
      {/* Radial gold glow — gradient retained as inline style (Tailwind cannot express) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 100% at 80% 50%, rgba(201,168,76,0.06) 0%, transparent 100%)',
        }}
      />

      <div className="max-w-[1000px] mx-auto px-6">
        {/* Label */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-7 h-px bg-vcx-gold" />
          <span className="font-vcx-sans text-[12px] font-semibold text-vcx-gold">
            CEO 커피챗 · 결이 맞는 대화
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-vcx-serif text-[clamp(28px,4vw,46px)] font-extrabold text-vcx-cream leading-[1.25] tracking-[-1px] m-0 mb-5">
          서로의 결을
          <br />
          확인하는 자리
        </h1>

        {/* Description */}
        <p className="font-vcx-sans text-[15.5px] text-vcx-cream leading-[1.9] max-w-[520px] m-0 mb-4">
          기업 경영을 하면서 주요 포지션의 채용이 필요하거나, 기간 한정적으로 미션 해결을 위해 도움이 필요할 때 계약관계로 협업할 수 있습니다.
        </p>
        <p className="font-vcx-sans text-[13px] text-vcx-sub-4 leading-[1.8] max-w-[520px] m-0 pl-3 border-l-2 border-vcx-gold/40">
          채용 및 프리랜서 계약 논의 시, ValueConnect 팀과 함께 진행해주시면 감사하겠습니다.
        </p>

        {/* Stats */}
        <div className="mt-8 flex flex-wrap gap-8">
          {[
            { label: '현재 열린 세션', val: `${sessionCount}건` },
            { label: '총 신청자', val: `${totalApplicants}명` },
            { label: '평균 선발률', val: avgRatio > 0 ? `1/${avgRatio}` : '-' },
          ].map((m) => (
            <div key={m.label}>
              <div className="font-vcx-serif text-[24px] font-extrabold text-vcx-gold">
                {m.val}
              </div>
              <div className="font-vcx-sans text-[12px] text-vcx-sub-4">
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
