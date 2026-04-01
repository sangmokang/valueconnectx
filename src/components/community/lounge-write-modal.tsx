'use client'

import { useState } from 'react'
import { LOUNGE_CATS, LoungeCatKey } from './lounge-sidebar'

interface WriteForm {
  cat: LoungeCatKey
  title: string
  body: string
  anon: boolean
}

interface LoungeWriteModalProps {
  onClose: () => void
  onSubmit: (form: WriteForm) => Promise<void>
}

export function LoungeWriteModal({ onClose, onSubmit }: LoungeWriteModalProps) {
  const [form, setForm] = useState<WriteForm>({
    cat: 'career',
    title: '',
    body: '',
    anon: true,
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!form.title.trim() || !form.body.trim()) return
    setSubmitting(true)
    try {
      await onSubmit(form)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const cats = LOUNGE_CATS.filter((c) => c.key !== 'all')

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '600px',
          position: 'relative',
        }}
      >
        {/* Gold top bar */}
        <div
          style={{
            height: '3px',
            background: 'linear-gradient(90deg, #c9a84c, #a07c2a)',
          }}
        />

        <div style={{ padding: '32px 36px' }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#aaa',
              lineHeight: 1,
            }}
          >
            ✕
          </button>

          <h3
            style={{
              fontSize: '20px',
              fontWeight: 800,
              margin: '0 0 24px',
              fontFamily: 'Georgia, serif',
              color: '#1a1a1a',
            }}
          >
            라운지에 글 쓰기
          </h3>

          {/* Anon toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              padding: '12px 16px',
              background: '#f5f0e8',
            }}
          >
            <button
              onClick={() => setForm((p) => ({ ...p, anon: !p.anon }))}
              style={{
                width: '40px',
                height: '22px',
                background: form.anon ? '#1a1a1a' : '#ddd',
                borderRadius: '11px',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  background: '#ffffff',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '3px',
                  left: form.anon ? '20px' : '4px',
                  transition: 'left 0.2s',
                }}
              />
            </button>
            <span
              style={{
                fontSize: '13.5px',
                color: '#1a1a1a',
                fontWeight: 600,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              익명으로 작성
            </span>
            <span
              style={{
                fontSize: '12.5px',
                color: '#b0a898',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              — 멤버 인증은 유지됩니다
            </span>
          </div>

          {/* Category chips */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                fontSize: '11px',
                color: '#b0a898',
                fontWeight: 600,
                display: 'block',
                marginBottom: '8px',
                fontFamily: 'system-ui, sans-serif',
                letterSpacing: '0.05em',
              }}
            >
              카테고리
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {cats.map((cat) => {
                const isActive = form.cat === cat.key
                return (
                  <button
                    key={cat.key}
                    onClick={() => setForm((p) => ({ ...p, cat: cat.key }))}
                    style={{
                      padding: '6px 13px',
                      fontSize: '13px',
                      border: `1.5px solid ${isActive ? '#c9a84c' : 'rgba(0,0,0,0.1)'}`,
                      background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
                      color: isActive ? '#a07c2a' : '#666',
                      cursor: 'pointer',
                      borderRadius: '100px',
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    {cat.icon} {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                fontSize: '11px',
                color: '#b0a898',
                fontWeight: 600,
                display: 'block',
                marginBottom: '6px',
                fontFamily: 'system-ui, sans-serif',
                letterSpacing: '0.05em',
              }}
            >
              제목
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="어떤 이야기를 나누고 싶으신가요?"
              style={{
                width: '100%',
                padding: '11px 14px',
                border: '1px solid rgba(0,0,0,0.12)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'system-ui, sans-serif',
              }}
            />
          </div>

          {/* Body */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                fontSize: '11px',
                color: '#b0a898',
                fontWeight: 600,
                display: 'block',
                marginBottom: '6px',
                fontFamily: 'system-ui, sans-serif',
                letterSpacing: '0.05em',
              }}
            >
              내용
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              rows={6}
              placeholder="솔직하게 써주세요. 이 공간은 채용에 활용되지 않습니다."
              style={{
                width: '100%',
                padding: '11px 14px',
                border: '1px solid rgba(0,0,0,0.12)',
                fontSize: '14px',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.75,
                boxSizing: 'border-box',
                fontFamily: 'system-ui, sans-serif',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid rgba(0,0,0,0.12)',
                background: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.title.trim() || !form.body.trim()}
              style={{
                flex: 2,
                padding: '12px',
                background: '#1a1a1a',
                color: '#f5f0e8',
                border: 'none',
                fontSize: '14px',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {submitting ? '게시 중...' : '게시하기 →'}
            </button>
          </div>

          <div
            style={{
              marginTop: '14px',
              fontSize: '12px',
              color: '#b0a898',
              textAlign: 'center',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            🔒 커뮤니티 게시물은 채용 활동에 절대 활용되지 않습니다
          </div>
        </div>
      </div>
    </div>
  )
}
