'use client'

import { useState } from 'react'
import Link from 'next/link'

const PILLARS = [
  {
    num: '01',
    label: 'CURATION FEED',
    title: '채용시장 큐레이션 피드',
    desc: '관심 분야를 등록하면 해당 시장의 동향과 핵심 기회가 매주 요약되어 도착합니다. 시장을 읽는 가장 빠른 방법.',
    insight:
      'Cold Start Hook: 네트워크가 작아도 개인적 가치가 즉시 발생하는 서비스를 먼저 만든다. 인재를 끌어오는 첫 번째 이유는 커뮤니티가 아니라, 그들이 혼자서도 가치를 느끼는 정보다.',
    icon: '◈',
    href: '/positions',
  },
  {
    num: '02',
    label: 'COMMUNITY LOUNGE',
    title: '커뮤니티 라운지',
    desc: '초대 전용 익명 커뮤니티. 익명이 솔직함을 만들고, 솔직함이 신뢰를 만든다. 이직 이야기, 리더십 고민, 연봉 협상 — 실명으로는 꺼내기 어려운 것들.',
    insight:
      '커뮤니티 없이는 최고 수준의 인재가 머물지 않는다. VCX의 커뮤니티는 채용의 수단이 아닌 목적 그 자체다.',
    icon: '◐',
    href: '/community',
  },
  {
    num: '03',
    label: 'CEO COFFEE CHAT',
    title: '서로의 결을 확인하는 자리',
    desc: '채용 공고로는 알 수 없는 것들 — 조직의 언어, 리더십의 결, 일하는 방식. CEO와 직접 대화하며 서로의 컬쳐핏을 확인합니다.',
    insight:
      '최고의 인재는 연봉이 아니라 함께 일할 사람을 보고 결정한다. CEO 커피챗은 그 판단의 밀도를 높이는 구조다.',
    icon: '◎',
    href: '/ceo-coffeechat',
  },
  {
    num: '04',
    label: 'PEER COFFEE CHAT',
    title: '같은 고도의 대화',
    desc: "멤버가 사연을 올리고 신청자를 직접 선택하는 P2P 네트워킹.",
    insight:
      "Granovetter의 약한 연결 이론 — 정보 격차를 좁히는 것은 '아는 사람'이 아닌 '잘 모르지만 연결된 사람'에서 온다.",
    icon: '◉',
    href: '/coffeechat',
  },
  {
    num: '05',
    label: 'POSITION BOARD',
    title: '큐레이션 채용 포지션',
    desc: "ValueConnect가 기업과 직접 계약한 포지션만 게시됩니다. 공개 채용 공고가 아닌, 당신에게만 먼저 보여주는 포지션.",
    insight:
      "정보 과부하의 시대에 진짜 희소 자원은 '좋은 필터'다. 스펙이 아닌 결(texture)로 선별되는 포지션은 의사결정의 질을 바꾼다.",
    icon: '◫',
    href: '/positions',
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
        className="grid grid-cols-1 md:grid-cols-2 border-b border-black/[0.07] cursor-pointer transition-colors duration-200"
        style={{ background: hovered ? '#ebe5da' : 'transparent' }}
      >
        {/* Left: description */}
        <div className="py-12 pr-0 md:pr-12 md:border-r border-black/[0.07]">
          <div className="text-[10px] text-[#c9a84c] tracking-[0.15em] mb-2 font-semibold">
            {pillar.num} · {pillar.label}
          </div>
          <h3
            className="text-[22px] font-extrabold tracking-[-0.5px] leading-[1.3] mt-0 mb-4 text-[#1a1a1a]"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {pillar.title}
          </h3>
          <p className="text-[14.5px] text-[#555] leading-[1.85] mb-5">{pillar.desc}</p>
          <span className="text-[13px] text-[#c9a84c] font-semibold">자세히 보기 →</span>
        </div>

        {/* Right: insight */}
        <div className="py-12 pl-0 md:pl-12 flex items-center">
          <div className="border-l-2 border-[rgba(201,168,76,0.3)] pl-6">
            <div className="text-[9px] text-[#bbb] tracking-[0.18em] mb-2.5 font-semibold">
              INSIGHT
            </div>
            <p
              className="text-[13.5px] text-[#777] leading-[1.85] italic m-0"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {pillar.insight}
            </p>
            <div className="mt-4">
              <span
                className="text-[22px] transition-colors duration-200"
                style={{ color: hovered ? '#c9a84c' : '#ccc' }}
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
