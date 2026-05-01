export type SourceType = 'manual' | 'desktop' | 'gdrive' | 'supabase' | 'sqlite'

export interface CompanyJDInput {
  id?: string
  company_name: string
  title: string
  domain_sector: string
  seniority?: string | null
  jd_text: string
  required_skills?: string[] | null
  preferred_skills?: string[] | null
  source_type?: SourceType | null
  source_uri?: string | null
}

export interface CandidateResumeInput {
  id?: string
  candidate_name?: string | null
  current_title?: string | null
  years_of_experience?: number | null
  domain_sectors?: string[] | null
  skills?: string[] | null
  resume_text: string
  source_type?: SourceType | null
  source_uri?: string | null
}

export interface MarketJobSignalInput {
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

export interface JDResumeMatchResult {
  overall_score: number
  jd_fit_percentile: number
  verdict: '강한 추천' | '검토 추천' | '보류' | '낮은 적합도'
  score_breakdown: {
    skills: number
    title: number
    sector: number
    seniority: number
    text: number
  }
  reasons: string[]
  risks: string[]
}

export interface ResumeAssessmentResult {
  market_percentile: number
  structure_score: number
  ai_written_likelihood: number
  ai_written_label: '낮음' | '중간' | '높음'
  strengths: string[]
  improvements: string[]
}

export interface RankedMarketJob {
  signal: MarketJobSignalInput
  relevance_score: number
  relevance_reasons: string[]
}

const IMPACT_TERMS = [
  '매출',
  '전환율',
  '리텐션',
  '성장',
  '절감',
  '자동화',
  '출시',
  '확장',
  '개선',
  'mrr',
  'arr',
  'retention',
  'conversion',
  'growth',
  'launched',
  'reduced',
  'improved',
]

const LEADERSHIP_TERMS = [
  '리드',
  '총괄',
  '관리',
  '채용',
  '멘토링',
  '조직',
  'lead',
  'managed',
  'hired',
  'mentored',
  'strategy',
  'cross-functional',
]

const AI_STYLE_TERMS = [
  '혁신적인',
  '탁월한',
  '열정적인',
  '다양한',
  '효율적인',
  '문제 해결 능력',
  '커뮤니케이션 능력',
  'innovative',
  'passionate',
  'dynamic',
  'proven track record',
  'results-driven',
  'detail-oriented',
]

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function tokenize(value: string): string[] {
  return Array.from(
    new Set(
      normalize(value)
        .split(/[^0-9a-z가-힣+#.]+/i)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2)
    )
  )
}

function textIncludes(text: string, term: string) {
  return normalize(text).includes(normalize(term))
}

function uniq(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))
  )
}

function overlapRatio(left: string[], right: string[]) {
  if (!left.length || !right.length) return 0
  const rightSet = new Set(right.map(normalize))
  const matches = left.filter((item) => rightSet.has(normalize(item)))
  return matches.length / Math.max(left.length, right.length)
}

function keywordOverlapRatio(leftText: string, rightText: string) {
  const left = tokenize(leftText)
  const right = new Set(tokenize(rightText))
  if (!left.length || !right.size) return { ratio: 0, matched: [] as string[] }
  const matched = left.filter((token) => right.has(token))
  return {
    ratio: matched.length / Math.max(left.length, right.size),
    matched: matched.slice(0, 5),
  }
}

function skillMatches(jd: CompanyJDInput, resume: CandidateResumeInput) {
  const jdSkills = uniq([...(jd.required_skills ?? []), ...(jd.preferred_skills ?? [])])
  const resumeSkills = uniq(resume.skills ?? [])

  const explicitRatio = overlapRatio(jdSkills, resumeSkills)
  const inferredMatches = jdSkills.filter((skill) => textIncludes(resume.resume_text, skill))
  const inferredRatio = jdSkills.length ? inferredMatches.length / jdSkills.length : 0
  const ratio = Math.max(explicitRatio, inferredRatio)

  return {
    score: clamp(ratio * 35, 0, 35),
    matches: uniq([...resumeSkills.filter((skill) => jdSkills.map(normalize).includes(normalize(skill))), ...inferredMatches]),
  }
}

function titleScore(jd: CompanyJDInput, resume: CandidateResumeInput) {
  const resumeTitle = resume.current_title ?? ''
  const titleOverlap = keywordOverlapRatio(jd.title, resumeTitle)
  const textOverlap = keywordOverlapRatio(jd.title, resume.resume_text)
  return clamp(Math.max(titleOverlap.ratio, textOverlap.ratio) * 20, 0, 20)
}

function sectorScore(jd: CompanyJDInput, resume: CandidateResumeInput) {
  const sectors = resume.domain_sectors ?? []
  if (sectors.some((sector) => normalize(sector) === normalize(jd.domain_sector))) return 15
  if (textIncludes(resume.resume_text, jd.domain_sector)) return 10
  return 0
}

function seniorityScore(jd: CompanyJDInput, resume: CandidateResumeInput) {
  const years = resume.years_of_experience ?? inferYearsOfExperience(resume.resume_text)
  const seniority = normalize(jd.seniority ?? jd.title)
  const expected = seniority.includes('head') || seniority.includes('lead') || seniority.includes('principal') || seniority.includes('senior') || seniority.includes('시니어') || seniority.includes('리드')
    ? 7
    : seniority.includes('manager') || seniority.includes('director') || seniority.includes('총괄')
      ? 10
      : 3

  if (years >= expected) return 15
  if (years >= expected - 2) return 9
  if (years > 0) return 4
  return 0
}

function inferYearsOfExperience(text: string) {
  const yearMatches = Array.from(text.matchAll(/(\d{1,2})\s*(?:년|years?|yrs?)/gi))
    .map((match) => Number(match[1]))
    .filter((year) => Number.isFinite(year))
  return yearMatches.length ? Math.max(...yearMatches) : 0
}

function verdict(score: number): JDResumeMatchResult['verdict'] {
  if (score >= 82) return '강한 추천'
  if (score >= 65) return '검토 추천'
  if (score >= 45) return '보류'
  return '낮은 적합도'
}

export function matchResumeToJD(
  jd: CompanyJDInput,
  resume: CandidateResumeInput
): JDResumeMatchResult {
  const skills = skillMatches(jd, resume)
  const title = titleScore(jd, resume)
  const sector = sectorScore(jd, resume)
  const seniority = seniorityScore(jd, resume)
  const textOverlap = keywordOverlapRatio(jd.jd_text, resume.resume_text)
  const text = clamp(textOverlap.ratio * 15, 0, 15)
  const overall = clamp(skills.score + title + sector + seniority + text)

  const reasons: string[] = []
  const risks: string[] = []

  if (skills.matches.length) reasons.push(`핵심 스킬 일치: ${skills.matches.slice(0, 5).join(', ')}`)
  if (sector >= 10) reasons.push(`도메인 섹터 관련성: ${jd.domain_sector}`)
  if (seniority >= 9) reasons.push('요구 시니어리티에 가까운 경력 신호가 있습니다')
  if (textOverlap.matched.length) reasons.push(`JD 키워드와 이력서 표현이 겹칩니다: ${textOverlap.matched.join(', ')}`)

  if (skills.score < 12) risks.push('필수 스킬과 이력서의 명시적 겹침이 낮습니다')
  if (sector === 0) risks.push('도메인 섹터 경험이 이력서에서 뚜렷하게 보이지 않습니다')
  if (title < 6) risks.push('현재 직무명과 JD 직무명의 연결성이 약합니다')
  if (resume.resume_text.length < 600) risks.push('이력서 원문이 짧아 판단 신뢰도가 낮습니다')

  return {
    overall_score: overall,
    jd_fit_percentile: clamp(50 + overall * 0.48),
    verdict: verdict(overall),
    score_breakdown: { skills: skills.score, title, sector, seniority, text },
    reasons: reasons.length ? reasons : ['정량 신호가 제한적입니다. 수동 검토가 필요합니다'],
    risks,
  }
}

export function assessResumeAgainstMarket(
  resume: CandidateResumeInput,
  marketSignals: MarketJobSignalInput[]
): ResumeAssessmentResult {
  const text = resume.resume_text
  const skills = uniq(resume.skills ?? [])
  const years = resume.years_of_experience ?? inferYearsOfExperience(text)
  const impactCount = IMPACT_TERMS.filter((term) => textIncludes(text, term)).length
  const leadershipCount = LEADERSHIP_TERMS.filter((term) => textIncludes(text, term)).length
  const metricCount = (text.match(/\d+[%억만kKmM]?/g) ?? []).length
  const sectionCount = ['경력', '성과', '프로젝트', '학력', '스킬', '요약', 'experience', 'project', 'education', 'skills'].filter((term) => textIncludes(text, term)).length
  const marketSkillDemand = marketSignals.flatMap((signal) => signal.function_tags ?? [])
  const demandRatio = overlapRatio(skills, marketSkillDemand)

  const marketPercentile = clamp(
    45 +
      Math.min(years, 15) * 2 +
      Math.min(skills.length, 12) * 1.2 +
      impactCount * 2.5 +
      leadershipCount * 2 +
      demandRatio * 18
  )
  const structureScore = clamp(28 + sectionCount * 9 + metricCount * 4 + impactCount * 3 + (text.length > 1200 ? 10 : 0))

  const aiTermCount = AI_STYLE_TERMS.filter((term) => textIncludes(text, term)).length
  const bulletLines = text.split('\n').filter((line) => /^\s*[-*•]/.test(line)).length
  const longSentenceCount = text.split(/[.!?。]|다\./).filter((sentence) => sentence.trim().length > 120).length
  const specificityPenalty = metricCount === 0 ? 18 : 0
  const aiWrittenLikelihood = clamp(aiTermCount * 9 + longSentenceCount * 4 + specificityPenalty + (bulletLines >= 8 && metricCount <= 1 ? 15 : 0))

  const strengths: string[] = []
  const improvements: string[] = []

  if (marketPercentile >= 80) strengths.push('시장 수요가 있는 스킬과 경력 신호가 강합니다')
  if (metricCount >= 3) strengths.push('성과를 숫자로 설명하는 문장이 포함되어 있습니다')
  if (leadershipCount >= 2) strengths.push('리더십과 조직 기여 신호가 보입니다')
  if (structureScore >= 75) strengths.push('섹션 구성과 정보 배열이 비교적 명확합니다')

  if (sectionCount < 4) improvements.push('경력, 핵심 성과, 프로젝트, 스킬 섹션을 더 명확히 분리해야 합니다')
  if (metricCount < 2) improvements.push('성과를 숫자, 기간, 규모 중심으로 보강해야 합니다')
  if (aiWrittenLikelihood >= 60) improvements.push('일반적인 수식어를 줄이고 실제 프로젝트 맥락과 증거를 늘려야 합니다')
  if (text.length < 900) improvements.push('판단 가능한 경력 서술량이 부족합니다')

  return {
    market_percentile: marketPercentile,
    structure_score: structureScore,
    ai_written_likelihood: aiWrittenLikelihood,
    ai_written_label: aiWrittenLikelihood >= 70 ? '높음' : aiWrittenLikelihood >= 40 ? '중간' : '낮음',
    strengths: strengths.length ? strengths : ['강점 신호가 제한적입니다. 원문 보강 후 재평가가 필요합니다'],
    improvements,
  }
}

export function rankMarketJobsForJD(
  jd: CompanyJDInput,
  signals: MarketJobSignalInput[]
): RankedMarketJob[] {
  return signals
    .map((signal) => {
      const sector = signal.domain_sector && normalize(signal.domain_sector) === normalize(jd.domain_sector) ? 25 : 0
      const title = keywordOverlapRatio(jd.title, signal.title)
      const jdToSignal = keywordOverlapRatio(jd.jd_text, signal.jd_text ?? signal.title)
      const jdSkills = uniq([...(jd.required_skills ?? []), ...(jd.preferred_skills ?? [])])
      const skillRatio = overlapRatio(jdSkills, signal.function_tags ?? [])
      const relevance = clamp(sector + title.ratio * 25 + jdToSignal.ratio * 25 + skillRatio * 25)
      const reasons: string[] = []

      if (sector) reasons.push(`동일 도메인: ${jd.domain_sector}`)
      if (title.matched.length) reasons.push(`직무명 키워드 일치: ${title.matched.join(', ')}`)
      if (skillRatio > 0) reasons.push('필요 스킬 태그가 겹칩니다')
      if (jdToSignal.matched.length) reasons.push(`JD 본문 유사 키워드: ${jdToSignal.matched.slice(0, 4).join(', ')}`)

      return {
        signal,
        relevance_score: relevance,
        relevance_reasons: reasons.length ? reasons : ['관련성 신호가 낮아 비교군으로만 참고하세요'],
      }
    })
    .sort((a, b) => b.relevance_score - a.relevance_score)
}
