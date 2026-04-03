'use client'

import { useState } from 'react'
import { Star, CheckCircle } from 'lucide-react'

interface FeedbackFormProps {
  sessionId: string
  applicationId: string
  onSubmitted?: () => void
}

const TAGS = [
  '인사이트 풍부', '실질적 조언', '업계 전문성', '문화 공유',
  '네트워킹 확장', '기대 미충족', '시간 부족', '방향성 불일치',
]

export function FeedbackForm({ sessionId, applicationId, onSubmitted }: FeedbackFormProps) {
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
      const res = await fetch(`/api/ceo-coffeechat/${sessionId}/feedback`, {
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
      <div className="flex items-center gap-2 text-sm text-neutral-400 py-4">
        <CheckCircle size={16} className="text-[#c9a84c]" />
        <span>피드백이 제출되었습니다. 감사합니다.</span>
      </div>
    )
  }

  return (
    <div className="space-y-5 border border-neutral-800 p-5">
      <h3 className="text-sm font-semibold text-neutral-200">커피챗 피드백</h3>

      {/* 별점 */}
      <div className="space-y-1">
        <p className="text-xs text-neutral-500">전체 만족도</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} type="button">
              <Star
                size={22}
                className={n <= rating ? 'text-[#c9a84c] fill-[#c9a84c]' : 'text-neutral-700'}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 태그 */}
      <div className="space-y-2">
        <p className="text-xs text-neutral-500">키워드 (복수 선택)</p>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-xs px-3 py-1 border transition-colors ${
                selectedTags.includes(tag)
                  ? 'border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10'
                  : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 재연결 */}
      <div className="space-y-2">
        <p className="text-xs text-neutral-500">다시 만나고 싶으신가요?</p>
        <div className="flex gap-3">
          {[{ v: true, label: '네' }, { v: false, label: '아니오' }].map(({ v, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setWouldConnect(v)}
              className={`text-xs px-4 py-1.5 border transition-colors ${
                wouldConnect === v
                  ? 'border-[#c9a84c] text-[#c9a84c]'
                  : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 브리프 유용성 */}
      <div className="space-y-2">
        <p className="text-xs text-neutral-500">AI 브리프가 도움이 되었나요?</p>
        <div className="flex gap-3">
          {[{ v: true, label: '도움됨' }, { v: false, label: '별로' }].map(({ v, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setBriefHelpful(v)}
              className={`text-xs px-4 py-1.5 border transition-colors ${
                briefHelpful === v
                  ? 'border-[#c9a84c] text-[#c9a84c]'
                  : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 코멘트 */}
      <div className="space-y-1">
        <p className="text-xs text-neutral-500">한 줄 코멘트 (선택)</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="자유롭게 남겨주세요"
          className="w-full bg-neutral-900 border border-neutral-800 text-sm text-neutral-300 px-3 py-2 resize-none focus:outline-none focus:border-neutral-600 placeholder:text-neutral-700"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 text-sm font-medium bg-[#c9a84c] text-black hover:bg-[#d4b05a] disabled:opacity-50 transition-colors"
      >
        {loading ? '제출 중...' : '피드백 제출'}
      </button>
    </div>
  )
}
