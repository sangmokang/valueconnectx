import Link from 'next/link'
import { ArrowRight, BriefcaseBusiness, FileText } from 'lucide-react'

export default function ValueHireHomePage() {
  return (
    <main className="min-h-screen bg-vcx-abyss text-vcx-text">
      <section className="mx-auto grid min-h-screen max-w-[1180px] gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-10">
        <div>
          <p className="vcx-section-label">ValueHire · Sprint 0 Preview</p>
          <h1 className="mt-5 max-w-[760px] text-[42px] font-semibold leading-[1.08] tracking-normal text-vcx-text sm:text-[64px]">
            당신의 이력서는,
            <br />
            지금 이 시장의 언어로 쓰여 있나요?
          </h1>
          <p className="mt-6 max-w-[680px] text-[17px] leading-8 text-vcx-soft">
            한국 채용 시장의 6만+ 공고 데이터를 기준으로 이력서를 다시 쓰고,
            지금 이 순간 매칭되는 공고를 함께 보여드립니다.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/valuehire/career"
              className="inline-flex items-center gap-2 bg-vcx-emerald px-6 py-3.5 text-[15px] font-bold text-vcx-abyss no-underline"
            >
              내 이력서 진단받기
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <p className="text-sm text-vcx-muted">무료 · 회원가입 없이 바로 시작</p>
          </div>
          <p className="mt-10 text-sm text-vcx-muted">ValueConnect · Sprint 0 prototype</p>
        </div>

        <div className="grid gap-4">
          <Link
            href="/valuehire/career"
            className="group border border-vcx-border bg-vcx-surface p-6 text-vcx-text no-underline transition-colors hover:border-vcx-emerald"
          >
            <FileText className="size-6 text-vcx-emerald" aria-hidden="true" />
            <p className="mt-10 text-sm text-vcx-muted">Candidate Entry</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">ValueHire로 이직하기</h2>
            <p className="mt-4 text-[15px] leading-7 text-vcx-soft">
              이력서 진단, 시장 언어 재작성, 지금 맞는 공고 추천으로 후보자 경험을 시작합니다.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-vcx-emerald">
              후보자 Preview
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </Link>

          <Link
            href="/valuehire/hire"
            className="group border border-vcx-emerald bg-vcx-surface p-6 text-vcx-text no-underline transition-colors hover:bg-vcx-surface-raised"
          >
            <BriefcaseBusiness className="size-6 text-vcx-emerald" aria-hidden="true" />
            <p className="mt-10 text-sm text-vcx-muted">Recruiter Entry</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">ValueHire로 채용하기</h2>
            <p className="mt-4 text-[15px] leading-7 text-vcx-soft">
              자사 JD와 후보자 리스트를 시장 채용공고 기준으로 비교하고, JD 적합도와 시장가치를 100점 기준으로 점수화합니다.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-vcx-emerald">
              B2B Recruiter Preview
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </Link>
        </div>
      </section>
    </main>
  )
}
