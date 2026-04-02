interface PeerHeroProps {
  onWriteClick: () => void
}

export function PeerHero({ onWriteClick }: PeerHeroProps) {
  return (
    <div className="bg-[#1a1a1a] relative overflow-hidden py-16 sm:py-20">
      {/* Radial accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 80% 50%, rgba(201,168,76,0.05) 0%, transparent 60%)',
        }}
      />

      <div className="max-w-[1000px] mx-auto px-6 sm:px-12">
        {/* Label */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-7 h-px bg-[#c9a84c]" />
          <span className="text-[#c9a84c] text-[11px] tracking-[0.2em] font-semibold font-vcx-sans">
            PEER COFFEE CHAT · MEMBER-TO-MEMBER
          </span>
        </div>

        {/* Heading + button row */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1
              className="font-vcx-serif text-[clamp(28px,4vw,46px)] font-extrabold text-[#f5f0e8] leading-[1.25] tracking-tight mb-5"
            >
              같은 고도에서<br />나누는 대화
            </h1>
            <p className="text-[15px] text-[#b0a898] leading-[1.9] font-vcx-sans max-w-[480px]">
              멤버가 사연을 올리고 신청자를 직접 선택합니다.
            </p>
          </div>

          <button
            onClick={onWriteClick}
            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-[#f5f0e8] text-[#1a1a1a] text-[13.5px] font-bold font-vcx-sans hover:bg-white transition-colors"
          >
            ☕ 커피챗 사연 올리기
          </button>
        </div>
      </div>
    </div>
  )
}
