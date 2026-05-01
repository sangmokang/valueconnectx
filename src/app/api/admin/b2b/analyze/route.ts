import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getVcxUser, isAdmin } from '@/lib/auth/get-vcx-user'
import { forbidden, serverError, unauthorized } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'
import {
  assessResumeAgainstMarket,
  matchResumeToJD,
  rankMarketJobsForJD,
  type CandidateResumeInput,
  type CompanyJDInput,
  type MarketJobSignalInput,
} from '@/lib/b2b-intelligence'

export const dynamic = 'force-dynamic'

const sourceTypeSchema = z.enum(['manual', 'desktop', 'gdrive', 'supabase', 'sqlite'])

const jdSchema = z.object({
  id: z.string().uuid('JD ID 형식이 올바르지 않습니다').optional(),
  company_name: z.string().min(1, '회사명을 입력해주세요'),
  title: z.string().min(1, '직무명을 입력해주세요'),
  domain_sector: z.string().min(1, '도메인 섹터를 입력해주세요'),
  seniority: z.string().nullish(),
  jd_text: z.string().min(30, 'JD 본문은 최소 30자 이상 입력해주세요'),
  required_skills: z.array(z.string()).default([]),
  preferred_skills: z.array(z.string()).default([]),
  source_type: sourceTypeSchema.default('manual'),
  source_uri: z.string().nullish(),
})

const resumeSchema = z.object({
  id: z.string().uuid('이력서 ID 형식이 올바르지 않습니다').optional(),
  candidate_name: z.string().nullish(),
  current_title: z.string().nullish(),
  years_of_experience: z.number().int('경력 연차는 정수로 입력해주세요').min(0, '경력 연차는 0 이상이어야 합니다').nullish(),
  domain_sectors: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  resume_text: z.string().min(50, '이력서 본문은 최소 50자 이상 입력해주세요'),
  source_type: sourceTypeSchema.default('manual'),
  source_uri: z.string().nullish(),
})

const analyzeSchema = z.object({
  jd: jdSchema,
  resume: resumeSchema,
  persist: z.boolean().default(false),
})

type MarketSignalRow = {
  id: string
  source: string | null
  company_name: string
  title: string
  domain_sector: string | null
  function_tags: string[] | null
  seniority: string | null
  location: string | null
  salary_band: string | null
  jd_text: string | null
  url: string | null
  published_at: string | null
}

type PositionRow = {
  id: string
  company_name: string
  title: string
  team_size: string | null
  role_description: string
  salary_range: string | null
  status: string
}

type FeedItemRow = {
  id: string
  company: string
  role: string
  company_tag: string | null
  level: string | null
  location: string | null
  salary_band: string | null
  tags: string[] | null
  summary: string | null
  published_at: string | null
}

function mapMarketSignal(row: MarketSignalRow): MarketJobSignalInput {
  return {
    id: row.id,
    source: row.source ?? 'market',
    company_name: row.company_name,
    title: row.title,
    domain_sector: row.domain_sector,
    function_tags: row.function_tags ?? [],
    seniority: row.seniority,
    location: row.location,
    salary_band: row.salary_band,
    jd_text: row.jd_text,
    url: row.url,
    published_at: row.published_at,
  }
}

function mapPosition(row: PositionRow): MarketJobSignalInput {
  return {
    id: `position:${row.id}`,
    source: 'positions',
    company_name: row.company_name,
    title: row.title,
    domain_sector: null,
    function_tags: [],
    seniority: null,
    location: null,
    salary_band: row.salary_range,
    jd_text: row.role_description,
    url: null,
    published_at: null,
  }
}

function mapFeedItem(row: FeedItemRow): MarketJobSignalInput {
  return {
    id: `feed:${row.id}`,
    source: 'feed',
    company_name: row.company,
    title: row.role,
    domain_sector: row.company_tag,
    function_tags: row.tags ?? [],
    seniority: row.level,
    location: row.location,
    salary_band: row.salary_band,
    jd_text: row.summary,
    url: null,
    published_at: row.published_at,
  }
}

async function fetchMarketSignals(domainSector: string): Promise<MarketJobSignalInput[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const [marketResult, positionResult, feedResult] = await Promise.all([
    supabase
      .from('vcx_b2b_market_job_signals')
      .select('id, source, company_name, title, domain_sector, function_tags, seniority, location, salary_band, jd_text, url, published_at')
      .limit(80),
    supabase
      .from('positions')
      .select('id, company_name, title, team_size, role_description, salary_range, status')
      .in('status', ['active', 'open'])
      .limit(80),
    supabase
      .from('vcx_feed_items')
      .select('id, company, role, company_tag, level, location, salary_band, tags, summary, published_at')
      .limit(80),
  ])

  const marketRows: MarketSignalRow[] = marketResult.error ? [] : marketResult.data ?? []
  const positionRows: PositionRow[] = positionResult.error ? [] : positionResult.data ?? []
  const feedRows: FeedItemRow[] = feedResult.error ? [] : feedResult.data ?? []
  const lowerSector = domainSector.toLowerCase()

  return [
    ...marketRows.map(mapMarketSignal),
    ...positionRows.map(mapPosition),
    ...feedRows.map(mapFeedItem),
  ].filter((signal) => {
    if (!domainSector) return true
    return (
      signal.domain_sector?.toLowerCase().includes(lowerSector) ||
      signal.jd_text?.toLowerCase().includes(lowerSector) ||
      signal.title.toLowerCase().includes(lowerSector) ||
      signal.function_tags?.some((tag) => tag.toLowerCase().includes(lowerSector))
    )
  })
}

async function persistAnalysis(
  jd: CompanyJDInput,
  resume: CandidateResumeInput,
  match: ReturnType<typeof matchResumeToJD>,
  assessment: ReturnType<typeof assessResumeAgainstMarket>,
  userId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const { data: jdRow } = await supabase
    .from('vcx_company_jds')
    .insert({
      company_name: jd.company_name,
      title: jd.title,
      domain_sector: jd.domain_sector,
      seniority: jd.seniority ?? null,
      jd_text: jd.jd_text,
      required_skills: jd.required_skills ?? [],
      preferred_skills: jd.preferred_skills ?? [],
      source_type: jd.source_type ?? 'manual',
      source_uri: jd.source_uri ?? null,
      created_by: userId,
    })
    .select('id')
    .single()

  const { data: resumeRow } = await supabase
    .from('vcx_candidate_resumes')
    .insert({
      candidate_name: resume.candidate_name ?? null,
      current_title: resume.current_title ?? null,
      years_of_experience: resume.years_of_experience ?? null,
      domain_sectors: resume.domain_sectors ?? [],
      skills: resume.skills ?? [],
      resume_text: resume.resume_text,
      source_type: resume.source_type ?? 'manual',
      source_uri: resume.source_uri ?? null,
      created_by: userId,
    })
    .select('id')
    .single()

  const { data: runRow } = await supabase
    .from('vcx_b2b_match_runs')
    .insert({
      jd_id: jdRow?.id ?? null,
      resume_id: resumeRow?.id ?? null,
      overall_score: match.overall_score,
      jd_fit_percentile: match.jd_fit_percentile,
      market_percentile: assessment.market_percentile,
      structure_score: assessment.structure_score,
      ai_written_likelihood: assessment.ai_written_likelihood,
      verdict: match.verdict,
      reasons: match.reasons,
      risks: match.risks,
      created_by: userId,
    })
    .select('id')
    .single()

  return {
    jd_id: jdRow?.id ?? null,
    resume_id: resumeRow?.id ?? null,
    match_run_id: runRow?.id ?? null,
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getVcxUser()
    if (!user) return unauthorized()
    if (!isAdmin(user)) return forbidden('관리자 권한이 필요합니다')

    const parsed = await parseBody(request, analyzeSchema)
    if (parsed.error) return parsed.error

    const { jd, resume, persist } = parsed.data
    const marketSignals = await fetchMarketSignals(jd.domain_sector)
    const market_jobs = rankMarketJobsForJD(jd, marketSignals).slice(0, 12)
    const match = matchResumeToJD(jd, resume)
    const assessment = assessResumeAgainstMarket(resume, marketSignals)
    const persisted = persist ? await persistAnalysis(jd, resume, match, assessment, user.id) : null

    return NextResponse.json({
      data: {
        match,
        assessment,
        market_jobs,
        persisted,
      },
    })
  } catch (error) {
    console.error('B2B analyze error:', error)
    return serverError()
  }
}
