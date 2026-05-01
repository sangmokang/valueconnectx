import { describe, expect, it } from 'vitest'
import {
  assessResumeAgainstMarket,
  matchResumeToJD,
  rankMarketJobsForJD,
  type CandidateResumeInput,
  type CompanyJDInput,
  type MarketJobSignalInput,
} from '@/lib/b2b-intelligence'

const jd: CompanyJDInput = {
  company_name: 'Acme Korea',
  title: 'B2B SaaS Product Lead',
  domain_sector: 'B2B SaaS',
  seniority: 'Lead',
  jd_text: 'B2B SaaS 제품의 GTM, retention, analytics, 고객 인터뷰를 리드할 Product Lead를 찾습니다.',
  required_skills: ['product', 'b2b', 'gtm', 'retention'],
  preferred_skills: ['analytics', 'pricing'],
  source_type: 'gdrive',
}

const strongResume: CandidateResumeInput = {
  candidate_name: '김코어',
  current_title: 'Head of Product',
  years_of_experience: 12,
  domain_sectors: ['B2B SaaS'],
  skills: ['product', 'b2b', 'retention', 'analytics', 'pricing'],
  resume_text:
    '요약: 12년 경력의 Product Lead. B2B SaaS에서 온보딩 전환율 18% 개선, 리텐션 지표 12%p 개선, 가격 정책 출시를 주도했습니다. 경력: 고객 인터뷰, GTM, analytics, 세일즈 협업, PM 채용과 멘토링을 리드했습니다. 프로젝트: 엔터프라이즈 대시보드 출시와 ARR 성장 기여.',
  source_type: 'desktop',
}

const weakResume: CandidateResumeInput = {
  current_title: 'Graphic Designer',
  years_of_experience: 2,
  domain_sectors: ['콘텐츠'],
  skills: ['illustration'],
  resume_text:
    '창의적이고 열정적인 인재입니다. 다양한 업무를 효율적으로 수행할 수 있으며 커뮤니케이션 능력이 좋습니다. 여러 디자인 작업을 했습니다.',
}

const marketSignals: MarketJobSignalInput[] = [
  {
    id: 'signal-1',
    source: 'wanted',
    company_name: 'Acme Korea',
    title: 'Product Lead',
    domain_sector: 'B2B SaaS',
    function_tags: ['product', 'b2b', 'gtm', 'retention'],
    jd_text: 'B2B SaaS product lead role for GTM and retention.',
  },
  {
    id: 'signal-2',
    source: 'linkedin',
    company_name: 'Studio One',
    title: 'Brand Designer',
    domain_sector: 'Creative',
    function_tags: ['design'],
    jd_text: 'Brand design and visual identity.',
  },
]

describe('b2b-intelligence', () => {
  it('JD와 강한 이력서의 적합도를 높게 계산한다', () => {
    const result = matchResumeToJD(jd, strongResume)

    expect(result.overall_score).toBeGreaterThanOrEqual(65)
    expect(result.verdict).toMatch(/추천/)
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it('도메인과 스킬이 다른 이력서는 낮은 적합도로 계산한다', () => {
    const result = matchResumeToJD(jd, weakResume)

    expect(result.overall_score).toBeLessThan(45)
    expect(result.risks).toContain('필수 스킬과 이력서의 명시적 겹침이 낮습니다')
  })

  it('시장 채용정보를 JD 관련성 순서로 정렬한다', () => {
    const ranked = rankMarketJobsForJD(jd, marketSignals)

    expect(ranked[0].signal.id).toBe('signal-1')
    expect(ranked[0].relevance_score).toBeGreaterThan(ranked[1].relevance_score)
  })

  it('이력서 구조와 AI 작성 가능성 신호를 산출한다', () => {
    const strongAssessment = assessResumeAgainstMarket(strongResume, marketSignals)
    const weakAssessment = assessResumeAgainstMarket(weakResume, marketSignals)

    expect(strongAssessment.market_percentile).toBeGreaterThan(weakAssessment.market_percentile)
    expect(strongAssessment.structure_score).toBeGreaterThan(weakAssessment.structure_score)
    expect(weakAssessment.ai_written_likelihood).toBeGreaterThan(strongAssessment.ai_written_likelihood)
  })
})
