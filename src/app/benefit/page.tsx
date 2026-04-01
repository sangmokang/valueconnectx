const TIERS = [
  {
    name: 'Core',
    dark: true,
    desc: '최상위 검증 멤버. ValueConnect가 직접 인증한 핵심인재.',
    benefits: [
      '채용정보 큐레이션 피드 (주 1회)',
      '커뮤니티 라운지 전체 접근',
      'CEO Coffee Chat 신청 권한',
      'Peer Coffee Chat 생성 & 신청',
      '멤버 디렉터리 전체 열람',
      'AI Match Engine 우선 매칭',
      '성사 시 Self Referral 보상',
    ],
  },
  {
    name: 'Endorsed',
    dark: false,
    desc: 'Core 멤버가 보증한 준회원. 단계적으로 Core로 전환됩니다.',
    benefits: [
      '채용정보 큐레이션 피드 (주 1회)',
      '커뮤니티 라운지 읽기 + 댓글',
      'CEO Coffee Chat 읽기',
      'Peer Coffee Chat 신청',
      '멤버 디렉터리 부분 열람',
      'Core 추천 시 등급 전환 검토',
    ],
  },
]

const REWARDS = [
  {
    type: '성사 수수료',
    who: '기업 → VCX',
    val: '연봉의 25%',
    desc: '채용 성사 시 기업이 지불',
  },
  {
    type: 'Self Referral',
    who: 'VCX → 멤버',
    val: '고정 보상',
    desc: '본인 직접 추천 성사 시',
  },
  {
    type: 'Peer Referral',
    who: 'VCX → 추천 멤버',
    val: '높은 보상',
    desc: '동료 추천 성사 시 (소싱·보증 노력 반영)',
  },
]

export default function BenefitPage() {
  return (
    <div className="bg-[#f5f0e8] min-h-screen font-[system-ui]">
      {/* HERO */}
      <div className="bg-[#1a1a1a] py-16 md:py-[64px]">
        <div className="max-w-[900px] mx-auto px-6 md:px-12">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-7 h-px bg-[#c9a84c]" />
            <span className="text-[#c9a84c] text-[11px] tracking-[0.2em] font-semibold">MEMBERSHIP · BENEFIT</span>
          </div>
          <h1 className="text-[clamp(28px,4vw,46px)] font-extrabold text-[#f5f0e8] leading-[1.25] mt-0 mb-5 tracking-[-1px] font-[Georgia,serif]">
            멤버십 혜택
          </h1>
          <p className="text-[15.5px] text-[#b0a898] leading-[1.9] max-w-[500px] m-0">
            네트워크의 질은 구성원의 질을 초과할 수 없다.<br />
            두 개의 등급, 하나의 기준 — 탁월함.
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-[900px] mx-auto px-6 md:px-12 py-12 pb-20">
        {/* Tier grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className="p-9 border"
              style={{
                background: tier.dark ? '#1a1a1a' : '#f7f5f0',
                borderColor: tier.dark ? '#1a1a1a' : 'rgba(0,0,0,0.08)',
              }}
            >
              <div
                className="text-[12px] tracking-[0.2em] font-bold mb-2"
                style={{ color: tier.dark ? '#c9a84c' : '#888' }}
              >
                {tier.name.toUpperCase()} MEMBER
              </div>
              <p
                className="text-[13.5px] leading-[1.7] mb-7"
                style={{ color: tier.dark ? '#b0a898' : '#555' }}
              >
                {tier.desc}
              </p>
              <div className="flex flex-col gap-2.5">
                {tier.benefits.map((b, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <div
                      className="w-4 h-4 flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{
                        background: tier.dark ? '#c9a84c' : '#1a1a1a',
                        borderRadius: '50%',
                      }}
                    >
                      <span
                        className="text-[9px] font-extrabold"
                        style={{ color: tier.dark ? '#1a1a1a' : '#fff' }}
                      >
                        ✓
                      </span>
                    </div>
                    <span
                      className="text-[13.5px] leading-[1.5]"
                      style={{ color: tier.dark ? '#ddd' : '#555' }}
                    >
                      {b}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Reward structure */}
        <div className="mt-10 p-9 bg-white border border-black/[0.08]">
          <div className="text-[11px] text-[#888] tracking-[0.15em] font-semibold mb-5">REWARD STRUCTURE</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {REWARDS.map((r) => (
              <div key={r.type} className="p-5 bg-[#f5f0e8]">
                <div className="text-[11px] text-[#888] font-semibold mb-1.5">{r.type}</div>
                <div className="text-[11px] text-[#888] mb-2">{r.who}</div>
                <div className="text-[20px] font-extrabold text-[#c9a84c] font-[Georgia,serif] mb-1.5">{r.val}</div>
                <div className="text-[12px] text-[#888] leading-[1.5]">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
