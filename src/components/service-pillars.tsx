import Link from 'next/link'
import { BriefcaseBusiness, Coffee, MessageSquareText, Radio, UsersRound } from 'lucide-react'

const PILLARS = [
  {
    num: '01',
    label: '큐레이션 피드',
    title: '채용시장 큐레이션 피드',
    desc: '관심 분야를 등록하면 해당 시장의 동향과 핵심 기회가 매주 요약되어 도착합니다. 시장을 읽는 가장 빠른 방법.',
    insight:
      '네트워크가 아직 작아도 개인적 가치가 즉시 발생하는 서비스를 먼저 만듭니다. 인재를 끌어오는 첫 번째 이유는 커뮤니티가 아니라, 혼자서도 가치를 느끼는 정보입니다.',
    Icon: Radio,
    progressClass: 'w-[18%]',
    href: '/feed',
  },
  {
    num: '02',
    label: '커뮤니티 라운지',
    title: '커뮤니티 라운지',
    desc: '초대 전용 익명 커뮤니티. 익명이 솔직함을 만들고, 솔직함이 신뢰를 만든다. 이직 이야기, 리더십 고민, 연봉 협상 — 실명으로는 꺼내기 어려운 것들.',
    insight:
      '커뮤니티 없이는 최고 수준의 인재가 머물지 않는다. VCX의 커뮤니티는 채용의 수단이 아닌 목적 그 자체다.',
    Icon: MessageSquareText,
    progressClass: 'w-[36%]',
    href: '/community',
  },
  {
    num: '03',
    label: 'CEO 커피챗',
    title: '서로의 결을 확인하는 자리',
    desc: '공개 정보로는 알 수 없는 것들 — 조직의 언어, 리더십의 결, 일하는 방식. CEO와 직접 대화하며 서로의 컬쳐핏을 확인합니다.',
    insight:
      '최고의 인재는 연봉이 아니라 함께 일할 사람을 보고 결정한다. CEO 커피챗은 그 판단의 밀도를 높이는 구조다.',
    Icon: Coffee,
    progressClass: 'w-[54%]',
    href: '/ceo-coffeechat',
  },
  {
    num: '04',
    label: '멤버 커피챗',
    title: '같은 고도의 대화',
    desc: "멤버가 사연을 올리고 신청자를 직접 선택하는 P2P 네트워킹.",
    insight:
      '정보 격차를 좁히는 단서는 가까운 지인보다 서로 다른 맥락을 가진 멤버와의 느슨한 연결에서 올 때가 많습니다.',
    Icon: UsersRound,
    progressClass: 'w-[72%]',
    href: '/coffeechat',
  },
  {
    num: '05',
    label: '포지션 보드',
    title: '큐레이션 피드',
    desc: "검증된 시장 신호와 핵심 기회를 관심 분야 기준으로 선별합니다. 공개 채널을 훑지 않아도 이번 주 확인할 흐름을 먼저 볼 수 있습니다.",
    insight:
      "정보 과부하의 시대에 진짜 희소 자원은 '좋은 필터'다. 스펙이 아닌 결(texture)로 선별되는 포지션은 의사결정의 질을 바꾼다.",
    Icon: BriefcaseBusiness,
    progressClass: 'w-[90%]',
    href: '/feed',
  },
]

function PillarBlock({ pillar }: { pillar: (typeof PILLARS)[0] }) {
  const Icon = pillar.Icon

  return (
    <Link
      href={pillar.href}
      className="group block no-underline"
    >
      <div
        className="grid cursor-pointer grid-cols-1 border-b border-vcx-surface bg-vcx-night transition-colors duration-200 hover:bg-vcx-surface md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
      >
        <div className="p-5 sm:p-7 md:border-r md:border-vcx-surface">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="vcx-label text-vcx-gold">
              {pillar.num} · {pillar.label}
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center bg-vcx-surface-soft text-vcx-gold">
              <Icon className="size-5" aria-hidden="true" />
            </div>
          </div>
          <h3 className="font-vcx-serif text-[22px] font-bold leading-[1.22] text-vcx-white sm:text-[26px]">
            {pillar.title}
          </h3>
          <p className="mt-4 text-[14px] leading-7 text-vcx-silver">{pillar.desc}</p>
          <span className="mt-5 inline-flex items-center text-[13px] font-bold text-vcx-gold">
            자세히 보기
            <span className="ml-2" aria-hidden="true">→</span>
          </span>
        </div>

        <div className="flex items-center p-5 pt-0 sm:p-7 sm:pt-0 md:pt-7">
          <div className="border-l-2 border-vcx-gold/40 pl-5">
            <div className="vcx-label mb-3 text-vcx-silver">설계 의도</div>
            <p className="font-vcx-serif text-[14px] italic leading-7 text-vcx-silver sm:text-[15px]">
              {pillar.insight}
            </p>
            <div className="mt-5 h-1 w-full bg-vcx-surface-soft">
              <div
                className={`h-full bg-vcx-gold transition-all duration-300 group-hover:w-full ${pillar.progressClass}`}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function ServicePillars() {
  return (
    <div className="flex flex-col gap-0">
      {PILLARS.map((pillar) => (
        <PillarBlock key={pillar.num} pillar={pillar} />
      ))}
    </div>
  )
}
