const TIERS = [
  {
    name: '코어 멤버',
    dark: true,
    desc: 'ValueConnect가 직접 검증한 멤버.',
    benefits: [
      '채용정보 큐레이션 피드 (주 1회)',
      '커뮤니티 라운지 전체 접근',
      'CEO 커피챗 신청 권한',
      '멤버 커피챗 생성 및 신청',
      '멤버 디렉터리 전체 열람',
      '맞춤 추천 우선 매칭',
      '채용 연결 시 보상 지급',
    ],
  },
  {
    name: '추천 멤버',
    dark: false,
    desc: '멤버의 추천으로 참여한 분. 활동에 따라 전환됩니다.',
    benefits: [
      '채용정보 큐레이션 피드 (주 1회)',
      '커뮤니티 라운지 읽기 + 댓글',
      'CEO 커피챗 열람',
      '멤버 커피챗 신청',
      '멤버 디렉터리 부분 열람',
      '코어 멤버 전환 검토 (추천 시)',
    ],
  },
]

const MEMBER_VALUES = [
  {
    icon: '🔗',
    title: '채용 연결 보상',
    desc: '관심 표시한 포지션에 채용이 성사되면, ValueConnect가 멤버에게 직접 보상을 지급합니다.',
  },
  {
    icon: '🤝',
    title: '동료 추천 보상',
    desc: '네트워크 내 동료를 추천하여 채용이 성사되면, 소싱과 보증 노력에 대한 보상이 지급됩니다.',
  },
  {
    icon: '🔒',
    title: '완전한 비밀 보장',
    desc: '모든 이직 관련 활동은 현 직장에 노출되지 않습니다. 관심 표시, 커피챗 신청 모두 비공개로 처리됩니다.',
  },
]

export default function BenefitPage() {
  return (
    <div className="min-h-screen bg-vcx-beige font-vcx-sans">
      {/* HERO */}
      <div className="bg-vcx-dark py-14 sm:py-16">
        <div className="mx-auto max-w-[900px] px-5 sm:px-8 md:px-12">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="h-px w-7 bg-vcx-gold" />
            <span className="font-vcx-sans text-[12px] font-semibold text-vcx-gold">멤버십 혜택</span>
          </div>
          <h1 className="mb-5 mt-0 font-vcx-serif text-[30px] font-extrabold leading-[1.22] text-vcx-beige sm:text-[42px]">
            멤버십 혜택
          </h1>
          <p className="m-0 max-w-[520px] text-[16px] leading-8 text-[#b0a898]">
            네트워크의 깊이는 구성원의 수준에서 결정됩니다.<br />
            두 개의 등급, 하나의 기준 — 탁월함.
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto max-w-[900px] px-5 py-12 pb-20 sm:px-8 md:px-12">
        {/* Tier grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className="border p-6 sm:p-9"
              style={{
                background: tier.dark ? 'var(--color-vcx-dark)' : '#f7f5f0',
                borderColor: tier.dark ? 'var(--color-vcx-dark)' : 'rgba(0,0,0,0.08)',
              }}
            >
              <div
                className="mb-2 font-vcx-sans text-[13px] font-bold"
                style={{ color: tier.dark ? 'var(--color-vcx-gold)' : '#888888' }}
              >
                {tier.name}
              </div>
              <p
                className="mb-7 text-[14px] leading-7"
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
                        background: tier.dark ? 'var(--color-vcx-gold)' : 'var(--color-vcx-dark)',
                      }}
                    >
                      <span
                        className="text-[12px] font-extrabold leading-none"
                        style={{ color: tier.dark ? 'var(--color-vcx-dark)' : '#fff' }}
                      >
                        ✓
                      </span>
                    </div>
                    <span
                      className="text-[14px] leading-6"
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

        {/* Member value */}
        <div className="mt-10 border border-black/[0.08] bg-white p-6 sm:p-9">
          <div className="mb-5 font-vcx-sans text-[12px] font-semibold text-vcx-sub-4">멤버 가치</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {MEMBER_VALUES.map((v) => (
              <div key={v.title} className="p-5 bg-[#f5f0e8]">
                <div className="text-[24px] mb-3">{v.icon}</div>
                <div className="mb-2 font-vcx-serif text-[16px] font-bold text-vcx-dark">{v.title}</div>
                <div className="text-[14px] leading-7 text-vcx-sub-2">{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
