import Link from 'next/link'
import { ArrowLeft, FileText, Search, Sparkles } from 'lucide-react'

export default function ValueHireCareerPage() {
  return (
    <main className="min-h-screen bg-vcx-abyss text-vcx-text">
      <div className="mx-auto max-w-[980px] px-5 py-10 sm:px-8 lg:px-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-vcx-muted hover:text-vcx-emerald">
          <ArrowLeft className="size-4" aria-hidden="true" />
          ValueHire 홈
        </Link>
        <section className="py-14">
          <p className="vcx-section-label">ValueHire · Candidate Sprint 0</p>
          <h1 className="mt-5 max-w-[760px] text-[42px] font-semibold leading-[1.08] tracking-normal text-vcx-text sm:text-[64px]">
            당신의 이력서는, 지금 이 시장의 언어로 쓰여 있나요?
          </h1>
          <p className="mt-6 max-w-[720px] text-[17px] leading-8 text-vcx-soft">
            한국 채용 시장의 공고 데이터를 기준으로 이력서를 다시 읽고, 지금 매칭되는 공고와 보완해야 할 표현을 함께 보여드립니다.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/positions" className="bg-vcx-emerald px-6 py-3.5 text-[15px] font-bold text-vcx-abyss no-underline">
              내 이력서 진단받기
            </Link>
            <p className="self-center text-sm text-vcx-muted">무료 · 회원가입 없이 바로 시작</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { icon: FileText, title: '이력서 언어 진단', body: '공고에서 반복되는 직무 언어와 내 이력서 표현의 차이를 찾습니다.' },
            { icon: Search, title: '실시간 공고 매칭', body: '동일 직무와 유관 산업의 채용공고를 기준으로 매칭 가능성을 보여줍니다.' },
            { icon: Sparkles, title: '개선 문장 제안', body: '성과, 스킬, 도메인 맥락이 드러나도록 문장 개선 방향을 제안합니다.' },
          ].map((item) => (
            <article key={item.title} className="border border-vcx-border bg-vcx-surface p-5">
              <item.icon className="size-5 text-vcx-emerald" aria-hidden="true" />
              <h2 className="mt-5 text-xl font-semibold text-vcx-text">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-vcx-soft">{item.body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
