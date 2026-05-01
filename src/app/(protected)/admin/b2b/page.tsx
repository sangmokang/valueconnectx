'use client'

import { useState } from 'react'

type AnalyzeResult = {
  match: {
    overall_score: number
    jd_fit_percentile: number
    verdict: string
    score_breakdown: Record<string, number>
    reasons: string[]
    risks: string[]
  }
  assessment: {
    market_percentile: number
    structure_score: number
    ai_written_likelihood: number
    ai_written_label: string
    strengths: string[]
    improvements: string[]
  }
  market_jobs: Array<{
    signal: {
      id: string
      source?: string | null
      company_name: string
      title: string
      domain_sector?: string | null
      function_tags?: string[] | null
      seniority?: string | null
      location?: string | null
      salary_band?: string | null
      jd_text?: string | null
      url?: string | null
      published_at?: string | null
    }
    relevance_score: number
    relevance_reasons: string[]
  }>
  persisted: {
    jd_id: string | null
    resume_id: string | null
    match_run_id: string | null
  } | null
}

const SAMPLE_JD = `B2B SaaS 제품의 초기 GTM과 리텐션 개선을 주도할 Product Lead를 찾습니다.
주요 업무: 고객 인터뷰, 제품 전략, 데이터 기반 우선순위 설정, 세일즈 협업, 가격 정책 실험, 엔터프라이즈 고객 온보딩 개선.
필수 경험: product, b2b, gtm, retention, analytics. 리드급 경력과 cross-functional 협업 경험이 필요합니다.`

const SAMPLE_RESUME = `요약: 12년 경력의 Product Lead. B2B SaaS에서 온보딩 전환율 18% 개선, 리텐션 지표 12%p 개선, 신규 가격 정책 출시를 주도했습니다.

경력: Value Labs Head of Product로 고객 인터뷰, GTM, 세일즈 협업, 데이터 기반 제품 전략을 총괄했습니다. 엔터프라이즈 대시보드 출시 후 ARR 성장에 기여했고, PM 4명 채용과 멘토링을 맡았습니다.

프로젝트: 고객 세그먼트별 온보딩 재설계, 가격 실험, 세일즈 파이프라인 분석, 리텐션 개선 로드맵 수립.

스킬: product, strategy, b2b, gtm, retention, analytics, pricing.`

function splitTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function meterColor(score: number) {
  if (score >= 75) return 'bg-vcx-gold'
  if (score >= 45) return 'bg-vcx-dark'
  return 'bg-vcx-sub-4'
}

function ScoreBlock({ label, value, caption }: { label: string; value: number; caption?: string }) {
  return (
    <div className="border border-vcx-dark bg-white p-4">
      <div className="font-vcx-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-vcx-sub-3">{label}</div>
      <div className="mt-3 flex items-end gap-2">
        <span className="font-vcx-serif text-4xl font-bold text-vcx-dark">{value}</span>
        <span className="pb-1 font-vcx-sans text-sm text-vcx-sub-3">/ 100</span>
      </div>
      <div className="mt-4 h-1.5 bg-vcx-beige-dark">
        <div className={`h-full ${meterColor(value)}`} style={{ width: `${value}%` }} />
      </div>
      {caption && <p className="mt-3 font-vcx-sans text-xs leading-5 text-vcx-sub-2">{caption}</p>}
    </div>
  )
}

export default function AdminB2BPage() {
  const [companyName, setCompanyName] = useState('Acme Korea')
  const [title, setTitle] = useState('B2B SaaS Product Lead')
  const [domainSector, setDomainSector] = useState('B2B SaaS')
  const [seniority, setSeniority] = useState('Lead')
  const [requiredSkills, setRequiredSkills] = useState('product, b2b, gtm, retention')
  const [preferredSkills, setPreferredSkills] = useState('pricing, sales, analytics')
  const [jdText, setJdText] = useState(SAMPLE_JD)
  const [jdSourceType, setJdSourceType] = useState<'manual' | 'desktop' | 'gdrive'>('gdrive')
  const [jdSourceUri, setJdSourceUri] = useState('gdrive://sample/acme-product-lead-jd')

  const [candidateName, setCandidateName] = useState('김코어')
  const [currentTitle, setCurrentTitle] = useState('Head of Product')
  const [years, setYears] = useState('12')
  const [resumeSectors, setResumeSectors] = useState('B2B SaaS, Marketplace')
  const [resumeSkills, setResumeSkills] = useState('product, strategy, b2b, retention, analytics')
  const [resumeText, setResumeText] = useState(SAMPLE_RESUME)
  const [resumeSourceType, setResumeSourceType] = useState<'manual' | 'desktop' | 'gdrive'>('desktop')
  const [resumeSourceUri, setResumeSourceUri] = useState('desktop://sample/kim-core-resume.pdf')
  const [persist, setPersist] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AnalyzeResult | null>(null)

  async function analyze() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/b2b/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persist,
          jd: {
            company_name: companyName,
            title,
            domain_sector: domainSector,
            seniority,
            jd_text: jdText,
            required_skills: splitTags(requiredSkills),
            preferred_skills: splitTags(preferredSkills),
            source_type: jdSourceType,
            source_uri: jdSourceUri || null,
          },
          resume: {
            candidate_name: candidateName,
            current_title: currentTitle,
            years_of_experience: years ? Number(years) : null,
            domain_sectors: splitTags(resumeSectors),
            skills: splitTags(resumeSkills),
            resume_text: resumeText,
            source_type: resumeSourceType,
            source_uri: resumeSourceUri || null,
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? '분석에 실패했습니다')
        return
      }
      setResult(json.data)
    } catch {
      setError('분석 요청 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 font-vcx-sans">
      <section className="border-b border-vcx-dark pb-6">
        <div className="vcx-section-label">B2B INTELLIGENCE</div>
        <h2 className="mt-3 font-vcx-serif text-3xl font-bold text-vcx-dark">리크루터 큐레이션 분석</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-vcx-sub-2">
          기업 JD와 후보자 이력서를 매칭하고, Supabase에 저장된 포지션·피드·시장 시그널을 기준으로 직무 연관성과 시장 가치 신호를 함께 확인합니다.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 border border-vcx-dark bg-white p-5">
          <div>
            <div className="vcx-label text-vcx-gold">COMPANY JD</div>
            <h3 className="mt-2 font-vcx-serif text-xl font-bold text-vcx-dark">자사 JD</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="border border-vcx-dark bg-white px-3 py-2 text-sm" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="회사명" />
            <input className="border border-vcx-dark bg-white px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="직무명" />
            <input className="border border-vcx-dark bg-white px-3 py-2 text-sm" value={domainSector} onChange={(e) => setDomainSector(e.target.value)} placeholder="도메인 섹터" />
            <input className="border border-vcx-dark bg-white px-3 py-2 text-sm" value={seniority} onChange={(e) => setSeniority(e.target.value)} placeholder="시니어리티" />
          </div>
          <input className="w-full border border-vcx-dark bg-white px-3 py-2 text-sm" value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} placeholder="필수 스킬, 쉼표 구분" />
          <input className="w-full border border-vcx-dark bg-white px-3 py-2 text-sm" value={preferredSkills} onChange={(e) => setPreferredSkills(e.target.value)} placeholder="우대 스킬, 쉼표 구분" />
          <textarea className="min-h-[220px] w-full border border-vcx-dark bg-white px-3 py-2 text-sm leading-6" value={jdText} onChange={(e) => setJdText(e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <select className="border border-vcx-dark bg-white px-3 py-2 text-sm" value={jdSourceType} onChange={(e) => setJdSourceType(e.target.value as 'manual' | 'desktop' | 'gdrive')}>
              <option value="manual">수동 입력</option>
              <option value="desktop">데스크탑</option>
              <option value="gdrive">Google Drive</option>
            </select>
            <input className="border border-vcx-dark bg-white px-3 py-2 text-sm" value={jdSourceUri} onChange={(e) => setJdSourceUri(e.target.value)} placeholder="출처 URI" />
          </div>
        </div>

        <div className="space-y-4 border border-vcx-dark bg-white p-5">
          <div>
            <div className="vcx-label text-vcx-gold">CANDIDATE RESUME</div>
            <h3 className="mt-2 font-vcx-serif text-xl font-bold text-vcx-dark">지원자 이력서</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="border border-vcx-dark bg-white px-3 py-2 text-sm" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="후보자명" />
            <input className="border border-vcx-dark bg-white px-3 py-2 text-sm" value={currentTitle} onChange={(e) => setCurrentTitle(e.target.value)} placeholder="현재 직함" />
            <input className="border border-vcx-dark bg-white px-3 py-2 text-sm" value={years} onChange={(e) => setYears(e.target.value)} placeholder="총 경력 연차" inputMode="numeric" />
            <input className="border border-vcx-dark bg-white px-3 py-2 text-sm" value={resumeSectors} onChange={(e) => setResumeSectors(e.target.value)} placeholder="경험 도메인" />
          </div>
          <input className="w-full border border-vcx-dark bg-white px-3 py-2 text-sm" value={resumeSkills} onChange={(e) => setResumeSkills(e.target.value)} placeholder="보유 스킬, 쉼표 구분" />
          <textarea className="min-h-[286px] w-full border border-vcx-dark bg-white px-3 py-2 text-sm leading-6" value={resumeText} onChange={(e) => setResumeText(e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <select className="border border-vcx-dark bg-white px-3 py-2 text-sm" value={resumeSourceType} onChange={(e) => setResumeSourceType(e.target.value as 'manual' | 'desktop' | 'gdrive')}>
              <option value="manual">수동 입력</option>
              <option value="desktop">데스크탑</option>
              <option value="gdrive">Google Drive</option>
            </select>
            <input className="border border-vcx-dark bg-white px-3 py-2 text-sm" value={resumeSourceUri} onChange={(e) => setResumeSourceUri(e.target.value)} placeholder="출처 URI" />
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 border border-vcx-dark bg-vcx-beige-light p-5">
        <label className="flex items-center gap-3 text-sm text-vcx-dark">
          <input type="checkbox" checked={persist} onChange={(e) => setPersist(e.target.checked)} />
          분석 원문과 결과를 B2B Intelligence 테이블에 저장
        </label>
        <button
          onClick={analyze}
          disabled={loading}
          className="bg-vcx-dark px-6 py-3 text-sm font-semibold text-vcx-beige disabled:cursor-not-allowed disabled:bg-vcx-sub-4"
        >
          {loading ? '분석 중' : '매칭 분석 실행'}
        </button>
      </section>

      {error && <div className="border border-vcx-dark bg-white p-4 text-sm text-vcx-dark">{error}</div>}

      {result && (
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <ScoreBlock label="JD 적합도" value={result.match.overall_score} caption={result.match.verdict} />
            <ScoreBlock label="상위 인재 추정" value={result.assessment.market_percentile} caption={`시장 기준 상위 ${100 - result.assessment.market_percentile}%권`} />
            <ScoreBlock label="이력서 구조" value={result.assessment.structure_score} caption="섹션, 숫자 성과, 구체성 기준" />
            <ScoreBlock label="AI 작성 가능성" value={result.assessment.ai_written_likelihood} caption={`판별 신호: ${result.assessment.ai_written_label}`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-vcx-dark bg-white p-5">
              <h3 className="font-vcx-serif text-xl font-bold text-vcx-dark">매칭 근거</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-vcx-sub-1">
                {result.match.reasons.map((item) => <li key={item}>- {item}</li>)}
              </ul>
              {result.match.risks.length > 0 && (
                <>
                  <h4 className="mt-6 text-sm font-bold text-vcx-dark">리스크</h4>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-vcx-sub-2">
                    {result.match.risks.map((item) => <li key={item}>- {item}</li>)}
                  </ul>
                </>
              )}
            </div>

            <div className="border border-vcx-dark bg-white p-5">
              <h3 className="font-vcx-serif text-xl font-bold text-vcx-dark">이력서 품질 판단</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-vcx-sub-1">
                {result.assessment.strengths.map((item) => <li key={item}>- {item}</li>)}
              </ul>
              {result.assessment.improvements.length > 0 && (
                <>
                  <h4 className="mt-6 text-sm font-bold text-vcx-dark">개선 필요</h4>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-vcx-sub-2">
                    {result.assessment.improvements.map((item) => <li key={item}>- {item}</li>)}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="border border-vcx-dark bg-white p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="vcx-label text-vcx-gold">MARKET JOBS</div>
                <h3 className="mt-2 font-vcx-serif text-xl font-bold text-vcx-dark">자사 JD와 직결되는 시장 채용정보</h3>
              </div>
              <span className="text-xs text-vcx-sub-3">{result.market_jobs.length}건</span>
            </div>
            <div className="mt-5 divide-y divide-vcx-beige-dark border-t border-vcx-dark">
              {result.market_jobs.map((job) => (
                <article key={job.signal.id} className="grid gap-3 py-4 md:grid-cols-[1fr_120px]">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-vcx-gold">{job.signal.source ?? 'market'}</div>
                    <h4 className="mt-1 font-vcx-serif text-lg font-bold text-vcx-dark">{job.signal.company_name} · {job.signal.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-vcx-sub-2">{job.signal.jd_text ?? '설명 없음'}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(job.signal.function_tags ?? []).slice(0, 6).map((tag) => (
                        <span key={tag} className="border border-vcx-dark px-2 py-1 text-xs text-vcx-sub-1">{tag}</span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-vcx-sub-3">{job.relevance_reasons.join(' · ')}</p>
                  </div>
                  <div className="border-l border-vcx-beige-dark pl-4 md:text-right">
                    <div className="text-xs text-vcx-sub-3">연관성</div>
                    <div className="mt-1 font-vcx-serif text-3xl font-bold text-vcx-dark">{job.relevance_score}</div>
                    <div className="mt-3 text-xs leading-5 text-vcx-sub-3">{job.signal.domain_sector ?? '섹터 미분류'}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
