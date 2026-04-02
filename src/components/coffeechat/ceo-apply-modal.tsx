'use client'

import { useState } from 'react'

interface CeoApplyModalProps {
  session: {
    id: string
    company: string
    hostName: string
    hostTitle: string
  }
  onClose: () => void
  onSubmit: (sessionId: string, message: string) => Promise<void>
}

export function CeoApplyModal({ session, onClose, onSubmit }: CeoApplyModalProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      await onSubmit(session.id, message)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '신청에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          width: '100%',
          maxWidth: 560,
          position: 'relative',
        }}
      >
        {/* Gold top bar */}
        <div
          style={{
            height: 3,
            background: 'linear-gradient(90deg, #c9a84c, #a8882d)',
          }}
        />

        <div style={{ padding: '32px 36px' }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 20,
              right: 24,
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#aaa',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            ✕
          </button>

          {/* Company · CEO */}
          <div
            style={{
              fontSize: 12,
              color: '#888',
              marginBottom: 6,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {session.company} · {session.hostName} {session.hostTitle}
          </div>

          <h3
            style={{
              fontSize: 20,
              fontWeight: 800,
              margin: '0 0 8px',
              fontFamily: 'Georgia, serif',
              color: '#1a1a1a',
            }}
          >
            커피챗 신청
          </h3>

          {/* Privacy notice */}
          <div
            style={{
              fontSize: 13,
              color: '#888',
              marginBottom: 24,
              padding: '10px 14px',
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.15)',
              fontFamily: 'system-ui, sans-serif',
              lineHeight: 1.6,
            }}
          >
            신청 내용은 CEO에게만 전달됩니다. 현 직장에는 일체 공개되지 않습니다.
          </div>

          {/* Message textarea */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 11,
                color: '#888',
                fontWeight: 600,
                display: 'block',
                marginBottom: 8,
                fontFamily: 'system-ui, sans-serif',
                letterSpacing: '0.05em',
              }}
            >
              어떤 이야기를 나누고 싶으신가요? (선택)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder={`${session.hostName} CEO와 어떤 대화를 나누고 싶으신지 자유롭게 적어주세요.`}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid rgba(0,0,0,0.12)',
                fontSize: 14,
                resize: 'none',
                outline: 'none',
                lineHeight: 1.75,
                boxSizing: 'border-box',
                fontFamily: 'system-ui, sans-serif',
                color: '#1a1a1a',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                fontSize: 13,
                color: '#e85555',
                marginBottom: 12,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '13px',
                border: '1px solid rgba(0,0,0,0.12)',
                background: 'none',
                fontSize: 14,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'system-ui, sans-serif',
                color: '#1a1a1a',
              }}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                flex: 2,
                padding: '13px',
                background: loading ? '#555' : '#1a1a1a',
                color: '#f5f0e8',
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {loading ? '신청 중...' : '대화 신청하기 →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
