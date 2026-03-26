'use client'

import { useState } from 'react'

interface ReportButtonProps {
  postId: string
  commentId?: string
}

export function ReportButton({ postId, commentId }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch(`/api/community/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, comment_id: commentId }),
      })
      setSubmitted(true)
      setOpen(false)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#888888' }}>
        신고 완료
      </span>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          color: '#bbbbbb',
          cursor: 'pointer',
          padding: '2px 4px',
        }}
      >
        신고
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '24px',
            zIndex: 10,
            background: '#ffffff',
            border: '1px solid #e0d9ce',
            padding: '12px',
            width: '240px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#555555', margin: 0 }}>
              신고 사유를 입력해주세요
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="신고 사유"
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #e0d9ce',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '12px',
                color: '#1a1a1a',
                resize: 'vertical',
                minHeight: '60px',
                boxSizing: 'border-box',
                outline: 'none',
                borderRadius: 0,
              }}
              maxLength={500}
              required
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  padding: '4px 10px',
                  border: '1px solid #e0d9ce',
                  background: 'transparent',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '12px',
                  color: '#555555',
                  cursor: 'pointer',
                  borderRadius: 0,
                }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading || !reason.trim()}
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  background: loading ? '#888888' : '#1a1a1a',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '12px',
                  color: '#c9a84c',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  borderRadius: 0,
                }}
              >
                {loading ? '...' : '신고'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
