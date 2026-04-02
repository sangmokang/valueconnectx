'use client'

import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'

interface PreBriefCardProps {
  sessionId: string
}

interface BriefData {
  brief: string | null
  briefGeneratedAt: string | null
  applicationId: string
}

export function PreBriefCard({ sessionId }: PreBriefCardProps) {
  const [data, setData] = useState<BriefData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/ceo-coffeechat/${sessionId}/brief`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="border border-[#c9a84c]/30 bg-[#c9a84c]/5 p-4">
        <div className="flex items-center gap-2 text-[#c9a84c] text-sm">
          <RefreshCw size={14} className="animate-spin" />
          <span>AI 브리프 생성 중...</span>
        </div>
      </div>
    )
  }

  if (!data?.brief) return null

  const generatedAt = data.briefGeneratedAt
    ? new Date(data.briefGeneratedAt).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="border border-[#c9a84c]/40 bg-[#c9a84c]/5 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={15} className="text-[#c9a84c]" />
        <span className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider">
          AI Pre-Brief
        </span>
        {generatedAt && (
          <span className="text-xs text-neutral-500 ml-auto">{generatedAt} 생성</span>
        )}
      </div>
      <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
        {data.brief}
      </p>
      <p className="text-xs text-neutral-600">
        이 브리프는 Claude AI가 세션 정보와 프로필을 분석해 자동 생성했습니다.
      </p>
    </div>
  )
}
