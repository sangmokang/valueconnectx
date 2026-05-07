import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ServicePillars } from '@/components/service-pillars'

const HERO_SIGNALS = [
  { label: '초대 전용', value: '탁월한 성과를 입증한 분들을 Invitation-Only 로 모십니다' },
  { label: '신뢰 기반', value: '고민을 나누고 서로에게 배우는 성장하는 공간' },
  { label: '채용 Hot Line', value: '최적합 인재와 의사 결정권자간의 편한 커피챗' },
]


export default function ServicePage() {
  return (
    <div className="min-h-screen bg-vcx-night font-vcx-sans text-vcx-white">
      <section className="relative overflow-hidden border-b border-vcx-surface">
        <div className="absolute inset-x-0 top-0 h-40 bg-vcx-gold/10 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[calc(100svh-72px)] max-w-[1180px] grid-cols-1 gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:items-center lg:px-10 lg:py-16">
          <div className="flex min-w-0 flex-col">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-8 bg-vcx-gold" />
              <span className="vcx-section-label">VALUECONNECT X · 초대 전용 네트워크</span>
            </div>
            <h1 className="font-vcx-serif text-[36px] font-bold leading-[1.06] text-vcx-white sm:text-[54px] lg:text-[64px]">
              <span className="block">최고수준의 프로페셔널들의</span>
              <span className="block text-vcx-gold">Community</span>
            </h1>
            <p className="mt-6 max-w-[620px] text-[15px] leading-7 text-vcx-silver sm:text-[16px] sm:leading-8">
              VCX는 검증된 핵심 인재에게 시장의 신호, 신뢰할 수 있는 포지션, 그리고 결정권자와의 직접 대화를 하나의 흐름으로 제공합니다.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/feed"
                className="inline-flex h-12 items-center justify-center gap-2 bg-vcx-gold px-6 text-[13px] font-bold uppercase tracking-[0.14em] text-vcx-dark transition-colors hover:bg-vcx-gold/90"
              >
                큐레이션 시작
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/directory"
                className="inline-flex h-12 items-center justify-center border border-vcx-muted-dark bg-vcx-surface-soft px-6 text-[13px] font-bold uppercase tracking-[0.14em] text-vcx-white transition-colors hover:border-vcx-gold hover:text-vcx-gold"
              >
                멤버 디렉토리
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-1 border border-vcx-surface sm:grid-cols-3">
              {HERO_SIGNALS.map((signal) => (
                <div key={signal.label} className="border-b border-vcx-surface p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                  <p className="vcx-label text-vcx-silver">{signal.label}</p>
                  <p className="mt-2 font-vcx-serif text-[20px] font-bold text-vcx-gold">{signal.value}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <section className="bg-vcx-night">
        <div className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
          <div className="mb-8 flex flex-col gap-3 border-b border-vcx-surface pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="vcx-section-label">다섯 가지 핵심 경험</span>
              <h2 className="mt-3 font-vcx-serif text-[28px] font-bold leading-tight text-vcx-white sm:text-[36px]">
                한 번 들어오면 계속 돌아오게 만드는 구조
              </h2>
            </div>
            <p className="max-w-[360px] text-[13px] leading-6 text-vcx-silver">
              각 기능은 독립된 카드처럼 명확하지만, 사용자의 다음 행동으로 자연스럽게 이어집니다.
            </p>
          </div>

          <ServicePillars />

          <div className="mt-12 border border-vcx-muted-dark bg-vcx-surface p-5 shadow-vcx-dark-medium sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-6 bg-vcx-gold" />
              <span className="vcx-section-label">VCX가 보는 문제</span>
            </div>
            <p className="max-w-[760px] font-vcx-serif text-[22px] font-bold leading-[1.45] text-vcx-white sm:text-[28px]">
              &ldquo;지금 가장 중요한 것은 사람을 모으는 것이 아니라, 사람이 머무는 이유를 설계하는 것이다.&rdquo;
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/feed"
                className="inline-flex h-12 items-center justify-center gap-2 bg-vcx-gold px-6 text-[13px] font-bold uppercase tracking-[0.14em] text-vcx-dark transition-colors hover:bg-vcx-gold/90"
              >
                큐레이션 피드 보기
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/directory"
                className="inline-flex h-12 items-center justify-center border border-vcx-muted-dark bg-transparent px-6 text-[13px] font-bold uppercase tracking-[0.14em] text-vcx-white transition-colors hover:border-vcx-gold hover:text-vcx-gold"
              >
                멤버 소개 보기
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
