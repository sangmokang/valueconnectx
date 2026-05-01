import Link from 'next/link'
import { ArrowLeft, BriefcaseBusiness, Database, FileSearch, Users } from 'lucide-react'

import { AiSearchPanel } from '@/components/valuehire/ai-search-panel'
import {
  assessResumeAgainstMarket,
  matchResumeToJD,
  rankMarketJobsForJD,
} from '@/lib/b2b-intelligence'
import { demoCandidateResumes, demoCompanyJD, demoMarketJobSignals } from '@/data/valuehire-demo'

export default function ValueHireRecruiterPage() {
  const rankedJobs = rankMarketJobsForJD(demoCompanyJD, demoMarketJobSignals)
  const candidateRows = demoCandidateResumes.map((resume) => ({
    resume,
    match: matchResumeToJD(demoCompanyJD, resume),
    market: assessResumeAgainstMarket(resume, demoMarketJobSignals),
  }))

  return (
    <main className="min-h-screen bg-vcx-abyss text-vcx-text">
      <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 lg:px-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-vcx-muted hover:text-vcx-emerald">
          <ArrowLeft className="size-4" aria-hidden="true" />
          ValueHire 홈
        </Link>

        <section className="grid gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="vcx-section-label">ValueHire · Recruiter Sprint 0</p>
            <h1 className="mt-5 max-w-[760px] text-[40px] font-semibold leading-[1.08] tracking-normal text-vcx-text sm:text-[58px]">
              자사 JD를 넣으면 시장 공고와 후보자 리스트가 바로 정렬됩니다.
            </h1>
            <p className="mt-6 max-w-[720px] text-[17px] leading-8 text-vcx-soft">
              Supabase/SQLite에 저장된 JD, 후보자 이력서, 시장 채용공고를 같은 기준으로 비교합니다.
              오늘 버전은 업로드 대신 샘플 데이터를 고정해 흐름과 점수 산식을 먼저 검증합니다.
            </p>
          </div>
          <div className="border border-vcx-border bg-vcx-surface p-5">
            <p className="text-sm text-vcx-muted">현재 분석 JD</p>
            <h2 className="mt-3 text-2xl font-semibold text-vcx-text">{demoCompanyJD.title}</h2>
            <p className="mt-2 text-sm text-vcx-soft">{demoCompanyJD.company_name} · {demoCompanyJD.domain_sector}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[...(demoCompanyJD.required_skills ?? []), ...(demoCompanyJD.preferred_skills ?? [])].map((skill) => (
                <span key={skill} className="border border-vcx-border px-3 py-1 text-xs text-vcx-soft">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { icon: BriefcaseBusiness, label: '자사 JD', value: '1건', note: 'Supabase / SQLite mirror' },
            { icon: Database, label: '시장 공고', value: `${demoMarketJobSignals.length}건`, note: '동종 업계 · 동일 직무 비교' },
            { icon: Users, label: '후보자', value: `${demoCandidateResumes.length}명`, note: '로컬/ATS 이력서 리스트' },
            { icon: FileSearch, label: '점수화', value: '100점', note: 'JD 적합도 · 시장가치' },
          ].map((item) => (
            <div key={item.label} className="border border-vcx-border bg-vcx-surface p-5">
              <item.icon className="size-5 text-vcx-emerald" aria-hidden="true" />
              <p className="mt-5 text-sm text-vcx-muted">{item.label}</p>
              <p className="mt-2 font-vcx-mono text-3xl font-semibold text-vcx-text">{item.value}</p>
              <p className="mt-2 text-sm text-vcx-soft">{item.note}</p>
            </div>
          ))}
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="border border-vcx-border bg-vcx-surface p-5 sm:p-6">
            <p className="vcx-section-label">Market JD List</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-normal text-vcx-text">
              유관 채용공고 비교군
            </h2>
            <div className="mt-5 space-y-3">
              {rankedJobs.map((job) => (
                <article key={job.signal.id} className="border border-vcx-border bg-vcx-abyss p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-vcx-text">{job.signal.title}</p>
                      <p className="mt-1 text-sm text-vcx-muted">{job.signal.company_name} · {job.signal.domain_sector}</p>
                    </div>
                    <p className="font-vcx-mono text-xl font-semibold text-vcx-emerald">{job.relevance_score}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-vcx-soft">
                    {job.relevance_reasons.join(' · ')}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="border border-vcx-border bg-vcx-surface p-5 sm:p-6">
            <p className="vcx-section-label">Candidate Match</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-normal text-vcx-text">
              후보자별 JD 적합도와 시장가치
            </h2>
            <div className="mt-5 space-y-3">
              {candidateRows.map(({ resume, match, market }) => (
                <article key={resume.id} className="border border-vcx-border bg-vcx-abyss p-4">
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-start">
                    <div>
                      <p className="text-base font-semibold text-vcx-text">{resume.candidate_name}</p>
                      <p className="mt-1 text-sm text-vcx-muted">{resume.current_title} · {resume.years_of_experience}년</p>
                    </div>
                    <div>
                      <p className="text-xs text-vcx-muted">JD 적합도</p>
                      <p className="font-vcx-mono text-2xl font-semibold text-vcx-emerald">{match.overall_score}</p>
                    </div>
                    <div>
                      <p className="text-xs text-vcx-muted">시장가치</p>
                      <p className="font-vcx-mono text-2xl font-semibold text-vcx-text">{market.market_percentile}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-vcx-soft">
                    {match.verdict} · {match.reasons[0]}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8">
          <AiSearchPanel defaultQuery="우리 JD와 가장 비슷한 시장 공고를 찾고, 후보자 중 먼저 봐야 할 사람을 설명해줘." />
        </div>
      </div>
    </main>
  )
}
