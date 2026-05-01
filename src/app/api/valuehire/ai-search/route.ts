import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { badRequest, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'
import { rankMarketJobsForJD } from '@/lib/b2b-intelligence'
import { demoCompanyJD, demoMarketJobSignals } from '@/data/valuehire-demo'

const searchSchema = z.object({
  query: z.string().min(2, '검색어를 2자 이상 입력해주세요').max(1200, '검색어는 1200자 이하로 입력해주세요'),
})

type OpenAIResponse = {
  output_text?: string
  output?: Array<{
    content?: Array<{
      text?: string
    }>
  }>
}

function getOutputText(payload: OpenAIResponse) {
  if (payload.output_text) return payload.output_text
  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter((text): text is string => Boolean(text))
    .join('\n')
}

export async function POST(request: NextRequest) {
  const parsed = await parseBody(request, searchSchema)
  if (parsed.error) return parsed.error

  const rankedJobs = rankMarketJobsForJD(demoCompanyJD, demoMarketJobSignals).slice(0, 3)
  const topJobs = rankedJobs.map(({ signal, relevance_score }) => ({
    company_name: signal.company_name,
    title: signal.title,
    relevance_score,
  }))

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      mode: 'heuristic',
      answer:
        `현재 JD는 ${demoCompanyJD.domain_sector} / ${demoCompanyJD.title} 기준입니다.\n` +
        `질문 "${parsed.data.query}"에 대해 동일 도메인과 직무 스킬이 겹치는 공고를 우선 정렬했습니다. ` +
        `상위 비교군은 ${topJobs.map((job) => `${job.company_name} ${job.title}`).join(', ')}입니다.`,
      top_jobs: topJobs,
    })
  }

  const model = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'
  const prompt = [
    '당신은 한국 B2B SaaS 채용 담당자를 돕는 ValueHire AI Search입니다.',
    '아래 자사 JD와 시장 채용공고 비교군을 기준으로 채용담당자의 질문에 한국어로 간결히 답하세요.',
    `질문: ${parsed.data.query}`,
    `자사 JD: ${JSON.stringify(demoCompanyJD)}`,
    `시장 채용공고 비교군: ${JSON.stringify(topJobs)}`,
  ].join('\n\n')

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: prompt,
      }),
    })

    if (!response.ok) {
      return badRequest('OpenAI API 응답을 받을 수 없습니다', await response.text())
    }

    const payload = (await response.json()) as OpenAIResponse
    return NextResponse.json({
      mode: 'openai',
      answer: getOutputText(payload) ?? '응답 텍스트를 파싱할 수 없습니다.',
      top_jobs: topJobs,
    })
  } catch (error) {
    console.error('ValueHire AI Search error:', error)
    return serverError('AI Search 실행 중 오류가 발생했습니다')
  }
}
