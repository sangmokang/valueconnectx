'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function CommentForm({ postId }: { postId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/community/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, is_anonymous: isAnonymous }),
        })

        if (!res.ok) {
          const json = await res.json()
          setError(json.error ?? '댓글 작성 중 오류가 발생했습니다')
          return
        }

        setContent('')
        setIsAnonymous(false)
        router.refresh()
      } catch {
        setError('댓글 작성 중 오류가 발생했습니다')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="댓글을 입력하세요"
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #e0d9ce',
          background: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          color: '#1a1a1a',
          outline: 'none',
          resize: 'vertical',
          minHeight: '80px',
          boxSizing: 'border-box',
          borderRadius: 0,
        }}
        maxLength={5000}
        required
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            style={{ accentColor: '#c9a84c', width: '14px', height: '14px' }}
          />
          <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#555555' }}>
            익명
          </span>
        </label>

        <button
          type="submit"
          disabled={isPending || !content.trim()}
          style={{
            padding: '8px 20px',
            border: 'none',
            background: isPending || !content.trim() ? '#cccccc' : '#1a1a1a',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            color: '#c9a84c',
            cursor: isPending || !content.trim() ? 'not-allowed' : 'pointer',
            borderRadius: 0,
          }}
        >
          {isPending ? '작성 중...' : '댓글 작성'}
        </button>
      </div>

      {error && (
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#cc0000' }}>
          {error}
        </p>
      )}
    </form>
  )
}
