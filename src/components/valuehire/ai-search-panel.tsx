'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface AiSearchPanelProps {
  defaultQuery: string
}

interface SearchResult {
  mode: 'openai' | 'heuristic'
  answer: string
  top_jobs: Array<{
    company_name: string
    title: string
    relevance_score: number
  }>
}

export function AiSearchPanel({ defaultQuery }: AiSearchPanelProps) {
  const [query, setQuery] = useState(defaultQuery)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runSearch() {
    setIsLoading(true)
    setError(null)

    const response = await fetch('/api/valuehire/ai-search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query }),
    })

    const payload = await response.json()
    setIsLoading(false)

    if (!response.ok) {
      setError(payload?.error ?? 'AI Search를 실행할 수 없습니다')
      return
    }

    setResult(payload)
  }

  return (
    <section className="border border-vcx-border bg-vcx-surface p-5 sm:p-6">
      <div className="flex items-center gap-2 text-vcx-emerald">
        <Search className="size-4" aria-hidden="true" />
        <p className="vcx-section-label">AI Search</p>
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-normal text-vcx-text">
        채용담당자 검색 프롬프트
      </h2>
      <textarea
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mt-5 min-h-[132px] w-full border border-vcx-border bg-vcx-abyss p-4 text-[15px] leading-7 text-vcx-text outline-none focus:border-vcx-emerald"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant="gold" onClick={runSearch} disabled={isLoading}>
          {isLoading ? '분석 중' : 'AI Search 실행'}
        </Button>
        <p className="text-sm text-vcx-muted">
          OpenAI 키가 없으면 로컬 매칭 로직으로 즉시 응답합니다.
        </p>
      </div>
      {error ? <p className="mt-4 text-sm text-vcx-danger">{error}</p> : null}
      {result ? (
        <div className="mt-5 border border-vcx-border bg-vcx-abyss p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-vcx-emerald">
              {result.mode === 'openai' ? 'OpenAI 응답' : '로컬 휴리스틱 응답'}
            </p>
            <p className="text-xs text-vcx-muted">Sprint 0 Preview</p>
          </div>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-vcx-soft">
            {result.answer}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {result.top_jobs.map((job) => (
              <div key={`${job.company_name}-${job.title}`} className="border border-vcx-border p-3">
                <p className="text-sm font-semibold text-vcx-text">{job.title}</p>
                <p className="mt-1 text-xs text-vcx-muted">{job.company_name}</p>
                <p className="mt-2 font-vcx-mono text-sm text-vcx-emerald">
                  {job.relevance_score}점
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
