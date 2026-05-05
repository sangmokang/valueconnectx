'use client'

import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'

interface PreBriefCardProps {
  sessionId: string
  apiBasePath?: 'ceo-coffeechat' | 'peer-coffeechat'
}

interface BriefData {
  brief: string | null
  briefGeneratedAt: string | null
  applicationId: string
  isFallback?: boolean
}

export function PreBriefCard({ sessionId, apiBasePath = 'ceo-coffeechat' }: PreBriefCardProps) {
  const [data, setData] = useState<BriefData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/${apiBasePath}/${sessionId}/brief`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [apiBasePath, sessionId])

  if (loading) {
    return (
      <div data-testid="ai-brief-skeleton" className="border border-vcx-gold bg-vcx-beige-light p-4">
        <div className="flex min-w-0 items-center gap-2 text-vcx-gold text-sm">
          <RefreshCw size={14} className="animate-spin" />
          <span>AI Brief를 생성 중입니다</span>
        </div>
      </div>
    )
  }

  if (!data?.brief) {
    return (
      <div data-testid="ai-brief-skeleton" className="border border-vcx-gold bg-vcx-beige-light p-4">
        <div className="flex min-w-0 items-center gap-2 text-vcx-gold text-sm">
          <RefreshCw size={14} />
          <span>AI Brief를 생성 중입니다</span>
        </div>
      </div>
    )
  }

  const generatedAt = data.briefGeneratedAt
    ? new Date(data.briefGeneratedAt).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null
  const isFallback = data.isFallback ?? data.brief.includes('[AI 브리프 기본 안내]')

  return (
    <div
      data-testid="ai-brief-card"
      className="border border-vcx-gold bg-vcx-beige-light p-4 sm:p-5 space-y-3 overflow-hidden"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Sparkles size={15} className="text-vcx-gold flex-shrink-0" />
        <span className="text-xs font-semibold text-vcx-gold uppercase tracking-wider">
          AI Pre-Brief
        </span>
        {isFallback && (
          <span className="text-xs font-vcx-sans text-vcx-sub-4">기본 안내</span>
        )}
        {generatedAt && (
          <span className="text-xs text-vcx-sub-4 sm:ml-auto">{generatedAt} 생성</span>
        )}
      </div>
      <p className="text-sm font-vcx-sans text-vcx-dark leading-relaxed whitespace-pre-line break-words">
        {data.brief}
      </p>
      <p className="text-xs font-vcx-sans text-vcx-sub-4 leading-relaxed">
        {isFallback
          ? 'AI 생성이 제한되어 세션 정보 기반의 기본 브리프를 제공합니다.'
          : '이 브리프는 Claude AI가 세션 정보와 프로필을 분석해 자동 생성했습니다.'}
      </p>
    </div>
  )
}
