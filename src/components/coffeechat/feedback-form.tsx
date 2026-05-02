'use client'

import { useState } from 'react'
import { Star, CheckCircle } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

interface FeedbackFormProps {
  sessionId: string
  applicationId: string
  apiBasePath?: 'ceo-coffeechat' | 'peer-coffeechat'
  onSubmitted?: () => void
}

const TAGS = [
  '인사이트 풍부', '실질적 조언', '업계 전문성', '문화 공유',
  '네트워킹 확장', '기대 미충족', '시간 부족', '방향성 불일치',
]

export function FeedbackForm({
  sessionId,
  applicationId,
  apiBasePath = 'ceo-coffeechat',
  onSubmitted,
}: FeedbackFormProps) {
  const [rating, setRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [wouldConnect, setWouldConnect] = useState<boolean | null>(null)
  const [briefHelpful, setBriefHelpful] = useState<boolean | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) { setError('전체 평점을 선택해주세요'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/${apiBasePath}/${sessionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          overallRating: rating,
          feedbackTags: selectedTags,
          wouldConnectAgain: wouldConnect ?? undefined,
          briefHelpful: briefHelpful ?? undefined,
          comment: comment || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? '피드백 제출에 실패했습니다')
      } else {
        trackEvent('session_feedback_submit', {
          session_id: sessionId,
          application_id: applicationId,
          type: apiBasePath === 'peer-coffeechat' ? 'peer' : 'ceo',
        })
        console.info('session_feedback_submit', { sessionId, applicationId })
        setSubmitted(true)
        onSubmitted?.()
      }
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm font-vcx-sans text-vcx-sub-3 py-4">
        <CheckCircle size={16} className="text-vcx-gold" />
        <span>피드백이 제출되었습니다. 감사합니다.</span>
      </div>
    )
  }

  return (
    <div className="space-y-5 border border-vcx-dark bg-white p-5">
      <h3 className="text-sm font-vcx-sans font-semibold text-vcx-dark">커피챗 피드백</h3>

      {/* 별점 */}
      <div className="space-y-1">
        <p className="text-xs font-vcx-sans text-vcx-sub-4">전체 만족도</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} type="button" aria-label={`${n}점`}>
              <Star
                size={22}
                className={n <= rating ? 'text-vcx-gold fill-vcx-gold' : 'text-vcx-sub-5'}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 태그 */}
      <div className="space-y-2">
        <p className="text-xs font-vcx-sans text-vcx-sub-4">키워드 (복수 선택)</p>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-xs px-3 py-1 border transition-colors ${
                selectedTags.includes(tag)
                  ? 'border-vcx-gold text-vcx-gold bg-[#fdf9f2]'
                  : 'border-vcx-beige-dark text-vcx-sub-4 hover:border-vcx-gold'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 재연결 */}
      <div className="space-y-2">
        <p className="text-xs font-vcx-sans text-vcx-sub-4">다시 만나고 싶으신가요?</p>
        <div className="flex gap-3">
          {[{ v: true, label: '네' }, { v: false, label: '아니오' }].map(({ v, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setWouldConnect(v)}
              className={`text-xs px-4 py-1.5 border transition-colors ${
                wouldConnect === v
                  ? 'border-vcx-gold text-vcx-gold'
                  : 'border-vcx-beige-dark text-vcx-sub-4 hover:border-vcx-gold'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 브리프 유용성 */}
      <div className="space-y-2">
        <p className="text-xs font-vcx-sans text-vcx-sub-4">AI 브리프가 도움이 되었나요?</p>
        <div className="flex gap-3">
          {[{ v: true, label: '도움됨' }, { v: false, label: '별로' }].map(({ v, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setBriefHelpful(v)}
              className={`text-xs px-4 py-1.5 border transition-colors ${
                briefHelpful === v
                  ? 'border-vcx-gold text-vcx-gold'
                  : 'border-vcx-beige-dark text-vcx-sub-4 hover:border-vcx-gold'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 코멘트 */}
      <div className="space-y-1">
        <p className="text-xs font-vcx-sans text-vcx-sub-4">한 줄 코멘트 (선택)</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="자유롭게 남겨주세요"
          className="w-full bg-vcx-beige-light border border-vcx-beige-dark text-sm font-vcx-sans text-vcx-dark px-3 py-2 resize-none focus:outline-none focus:border-vcx-gold placeholder:text-vcx-sub-5"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 text-sm font-vcx-sans font-medium bg-vcx-gold text-vcx-dark hover:bg-vcx-dark hover:text-vcx-beige disabled:opacity-50 transition-colors"
      >
        {loading ? '제출 중...' : '피드백 제출'}
      </button>
    </div>
  )
}
