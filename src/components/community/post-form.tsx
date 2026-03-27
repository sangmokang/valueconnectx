'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, CategoryKey } from './category-tabs'
import { trackEvent } from '@/lib/analytics'

export function PostForm({ defaultCategory }: { defaultCategory?: CategoryKey }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [category, setCategory] = useState<CategoryKey>(defaultCategory ?? 'career')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCompanyReview = category === 'company_review'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/community', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, title, content, is_anonymous: isAnonymous }),
        })

        if (!res.ok) {
          const json = await res.json()
          setError(json.error ?? '글 작성 중 오류가 발생했습니다')
          return
        }

        const json = await res.json()
        trackEvent('community_posted', { category, is_anonymous: isAnonymous })
        router.push(`/community/${json.data.id}`)
        router.refresh()
      } catch {
        setError('글 작성 중 오류가 발생했습니다')
      }
    })
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e0d9ce',
    background: '#ffffff',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '14px',
    color: '#1a1a1a',
    outline: 'none',
    boxSizing: 'border-box' as const,
    borderRadius: 0,
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Category */}
      <div>
        <label style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#555555', marginBottom: '8px' }}>
          카테고리 *
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryKey)}
          style={{ ...inputStyle, cursor: 'pointer' }}
          required
        >
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Company review notice */}
      {isCompanyReview && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fff8e6',
            border: '1px solid #c9a84c',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            color: '#7a6020',
            lineHeight: '1.6',
          }}
        >
          <strong style={{ display: 'block', marginBottom: '4px' }}>이 회사 어때요? 운영 정책</strong>
          사실 기반 정보만 허용됩니다. 감정적 비방, 채용 목적의 이용은 금지되며, 멤버 신고 및 Admin 즉시 삭제 대상이 될 수 있습니다. 반복 위반 시 작성 권한이 제한됩니다.
        </div>
      )}

      {/* Title */}
      <div>
        <label style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#555555', marginBottom: '8px' }}>
          제목 *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          style={inputStyle}
          maxLength={200}
          required
        />
      </div>

      {/* Content */}
      <div>
        <label style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#555555', marginBottom: '8px' }}>
          내용 *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요"
          style={{ ...inputStyle, minHeight: '200px', resize: 'vertical' }}
          maxLength={10000}
          required
        />
      </div>

      {/* Anonymous */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          style={{ accentColor: '#c9a84c', width: '16px', height: '16px' }}
        />
        <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#555555' }}>
          익명으로 작성
        </span>
      </label>

      {error && (
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#cc0000' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            padding: '10px 20px',
            border: '1px solid #e0d9ce',
            background: 'transparent',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
            color: '#555555',
            cursor: 'pointer',
            borderRadius: 0,
          }}
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '10px 28px',
            border: 'none',
            background: isPending ? '#888888' : '#1a1a1a',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
            color: '#c9a84c',
            cursor: isPending ? 'not-allowed' : 'pointer',
            borderRadius: 0,
          }}
        >
          {isPending ? '작성 중...' : '글 작성'}
        </button>
      </div>
    </form>
  )
}
