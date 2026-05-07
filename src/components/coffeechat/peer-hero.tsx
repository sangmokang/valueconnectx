interface PeerHeroProps {
  onWriteClick: () => void
}

export function PeerHero({ onWriteClick }: PeerHeroProps) {
  return (
    <div className="bg-vcx-dark relative overflow-hidden py-16 sm:py-20">
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
          <div className="w-7 h-px bg-vcx-gold" />
          <span className="font-vcx-sans text-[12px] font-semibold text-vcx-gold">
            Coffeechat · 같은 고민, 직접 만남
          </span>
        </div>

        {/* Heading + button row */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1
              className="font-vcx-serif text-[clamp(24px,3.5vw,40px)] font-extrabold text-vcx-beige leading-[1.25] tracking-tight mb-5"
            >
              같은 고민을 갖고 있는<br />프로페셔널들과<br />온·오프라인 미팅
            </h1>
            <p className="text-[15px] text-vcx-cream leading-[1.9] font-vcx-sans max-w-[520px] mb-4">
              갖고 있는 Agenda를 간단히 남겨주시거나, 꼭 특정 주제가 없더라도 네트워킹 확장을 위해 신청해주세요.
            </p>
            <p className="text-[13px] text-sub-4 leading-[1.8] font-vcx-sans max-w-[520px] border-l-2 border-vcx-gold/40 pl-3">
              VCX는 네트워크 안에서 이루어지는 채용 연결도 함께 지원합니다. 대화가 채용으로 이어지는 경우, ValueConnect 팀에 먼저 알려주시면 합격자분께 리워드가 돌아갑니다.
            </p>
          </div>

          <button
            onClick={onWriteClick}
            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-vcx-beige text-vcx-dark text-[13.5px] font-bold font-vcx-sans hover:bg-white transition-colors"
          >
            ☕ 커피챗 사연 올리기
          </button>
        </div>
      </div>
    </div>
  )
}
