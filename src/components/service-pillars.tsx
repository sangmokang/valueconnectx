import Link from 'next/link'
import { Coffee, MessageSquareText, Radio, UsersRound } from 'lucide-react'

const PILLARS = [
  {
    num: '01',
    label: '큐레이션 피드',
    title: '채용시장 큐레이션 피드',
    desc: '관심 분야를 등록하면 해당 시장의 동향과 핵심 기회가 매주 요약되어 도착합니다. 시장을 읽는 가장 빠른 방법입니다.',
    insight:
      '제한된 정보라고 하더라도 최고의 프로페셔널 분들께 도움이 되는 채용 정보를 제공하고 싶습니다.',
    Icon: Radio,
    progressClass: 'w-[25%]',
    href: '/feed',
  },
  {
    num: '02',
    label: '커뮤니티 라운지',
    title: '커뮤니티 라운지',
    desc: '초대 전용 커뮤니티입니다. 개개인이 겪는 여러 어렵고 민감한 주제를 조금은 편하게 소통 나눌 수 있기를 바랍니다.',
    insight:
      '이직 이야기, 리더십 고민, 연봉 협상처럼 실명으로는 꺼내기 어려운 주제도 신뢰할 수 있는 사람들과 나눌 수 있는 공간을 지향합니다.',
    Icon: MessageSquareText,
    progressClass: 'w-[50%]',
    href: '/community',
  },
  {
    num: '03',
    label: 'CEO 커피챗',
    title: '최고 의사 결정권자와의 편한 소통',
    desc: '공개 정보로는 알 수 없는 조직의 고민, 리더십의 결, 일하는 방식을 최고 의사 결정권자와 직접 대화하며 확인합니다.',
    insight:
      '최고의 인재는 연봉만이 아니라 함께 일할 사람과 조직의 방향을 보고 결정합니다. CEO 커피챗은 그 판단의 밀도를 높이는 구조입니다.',
    Icon: Coffee,
    progressClass: 'w-[75%]',
    href: '/ceo-coffeechat',
  },
  {
    num: '04',
    label: '멤버 커피챗',
    title: '같은 눈높이의 고민상담',
    desc: '멤버가 사연을 올리고 신청자를 직접 선택하는 P2P 네트워킹입니다.',
    insight:
      '철이 철을 날카롭게 하듯이 같은 고민을 하고 있는 동료들에게 어떻게 문제를 해결했고 성장했는지 소통 나눠본다면 결국 문제를 해결해 나갈 수 있을 것입니다.',
    Icon: UsersRound,
    progressClass: 'w-full',
    href: '/coffeechat',
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
