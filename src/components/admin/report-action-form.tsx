'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ReportActionFormProps {
  reportId: string
  hasPost: boolean
  hasComment: boolean
}

export function ReportActionForm({ reportId, hasPost, hasComment }: ReportActionFormProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleAction(action: 'hide_post' | 'hide_comment' | 'dismiss') {
    setLoading(true)
    try {
      const res = await fetch('/api/community/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId, action }),
      })
      if (res.ok) {
        setDone(true)
        router.refresh()
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#888888', marginTop: '12px' }}>
        처리 완료
      </p>
    )
  }

  const btnBase: React.CSSProperties = {
    padding: '6px 14px',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '12px',
    cursor: loading ? 'not-allowed' : 'pointer',
    borderRadius: 0,
    opacity: loading ? 0.6 : 1,
  }

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
      {hasPost && (
        <button
          onClick={() => handleAction('hide_post')}
          disabled={loading}
          style={{ ...btnBase, background: '#1a1a1a', color: '#c9a84c', border: 'none' }}
        >
          게시글 숨김
        </button>
      )}
      {hasComment && (
        <button
          onClick={() => handleAction('hide_comment')}
          disabled={loading}
          style={{ ...btnBase, background: '#1a1a1a', color: '#c9a84c', border: 'none' }}
        >
          댓글 숨김
        </button>
      )}
      <button
        onClick={() => handleAction('dismiss')}
        disabled={loading}
        style={{ ...btnBase, background: 'transparent', color: '#888888', border: '1px solid #e0d9ce' }}
      >
        신고 무시
      </button>
    </div>
  )
}
