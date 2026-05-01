'use client'

import { useState } from 'react'
import Link from 'next/link'

const PILLARS = [
  {
    num: '01',
    label: 'CURATION FEED',
    title: '시장을 먼저 읽는 큐레이션 피드',
    desc: '관심 분야에서 지금 주목해야 할 채용 소식, 산업 뉴스, 커뮤니티 논의를 선별해 전달합니다. 정보 과부하 속에서 중요한 신호만 빠르게 읽을 수 있습니다.',
    insight:
      '네트워크에 오래 머물기 전에도 개인에게 즉시 가치가 생겨야 합니다. 좋은 커뮤니티의 첫 경험은 막연한 소속감이 아니라, 혼자서는 놓쳤을 신호를 먼저 발견하는 일입니다.',
    icon: '◈',
    href: '/feed',
  },
  {
    num: '02',
    label: 'COMMUNITY LOUNGE',
    title: '서로의 기준을 높이는 커뮤니티 라운지',
    desc: '최고 수준의 인재들이 익명 기반으로 배우고 성장하며 고충을 나누는 공간입니다. 커리어 전환, 리더십, 보상, 조직 문화처럼 실명으로는 꺼내기 어려운 주제를 깊이 있게 다룹니다.',
    insight:
      '철이 철을 날카롭게 하듯, 각자의 자리에서 높은 기준으로 일하는 사람들과 대화할 때 관점도 정교해집니다. 솔직함은 보호받는 환경에서 시작되고, 신뢰는 반복되는 좋은 대화에서 만들어집니다.',
    icon: '◐',
    href: '/community',
  },
  {
    num: '03',
    label: 'DECISION MAKER COFFEE CHAT',
    title: '의사결정권자와의 Coffee Chat',
    desc: '외부에 드러나지 않은 채용의 배경, 조직의 고민, 리더십의 결, 경영진의 성향을 직접 확인합니다. 공고보다 깊고, 면접보다 빠르게 서로의 컬처핏을 검토하는 자리입니다.',
    insight:
      '다음 조직을 선택할 때는 신중에 신중을 더해야 합니다. Coffee Chat은 시간과 에너지를 줄이면서도 의사결정권자와 밀도 높은 대화를 나눌 수 있는 가장 효율적인 탐색 방식입니다.',
    icon: '◎',
    href: '/ceo-coffeechat',
  },
  {
    num: '04',
    label: 'PEER COFFEE CHAT',
    title: '성과를 만든 사람들과의 Peer Coffee Chat',
    desc: '어떤 업계에서든 큰 성과를 만든 사람의 관점은 쉽게 대체되지 않습니다. 멤버가 직접 사연을 올리고, 대화하고 싶은 신청자를 선택해 깊이 있는 네트워크를 만듭니다.',
    insight:
      '서로에게는 서로가 가장 흥미로운 대화 상대일 수 있습니다. 바쁜 일상에서 잠시 시야를 넓히고, 경험과 지혜를 나누며 다음 선택의 단서를 얻는 기회입니다.',
    icon: '◉',
    href: '/coffeechat',
  },
]

function PillarBlock({ pillar }: { pillar: (typeof PILLARS)[0] }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={pillar.href}
      className="no-underline block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="grid grid-cols-1 md:grid-cols-2 border border-[#3d3a39] border-b-0 cursor-pointer transition-colors duration-200 last:border-b"
        style={{ background: hovered ? '#101010' : 'transparent' }}
      >
        {/* Left: description */}
        <div className="p-5 sm:p-8 md:p-10 md:border-r border-[#3d3a39]">
          <div className="text-[13px] text-[#00d992] tracking-[0.08em] mb-3 font-semibold">
            {pillar.num} · {pillar.label}
          </div>
          <h3
            className="text-[22px] font-bold tracking-normal leading-[1.3] mt-0 mb-4 text-[#f2f2f2] sm:text-[24px]"
          >
            {pillar.title}
          </h3>
          <p className="text-[15px] text-[#b8b3b0] leading-[1.75] mb-5">{pillar.desc}</p>
          <span className="text-[15px] text-[#2fd6a1] font-semibold">자세히 보기</span>
        </div>

        {/* Right: insight */}
        <div className="p-5 sm:p-8 md:p-10 flex items-center">
          <div className="border-l-2 border-[rgba(0,217,146,0.45)] pl-5 sm:pl-6">
            <div className="text-[13px] text-[#8b949e] tracking-[0.08em] mb-2.5 font-semibold">
              INSIGHT
            </div>
            <p
              className="text-[15px] text-[#b8b3b0] leading-[1.75] m-0"
            >
              {pillar.insight}
            </p>
            <div className="mt-4">
              <span
                className="font-vcx-mono text-[22px] transition-colors duration-200"
                style={{ color: hovered ? '#00d992' : '#8b949e' }}
              >
                {pillar.icon}
              </span>
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
