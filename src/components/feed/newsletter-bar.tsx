'use client'

import { useState } from 'react'

interface NewsletterBarProps {
  defaultEmail?: string
}

export function NewsletterBar({ defaultEmail = '' }: NewsletterBarProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/feed/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSubscribed(true)
      }
    } catch (err) {
      console.error('구독 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  if (subscribed) {
    return (
      <div
        style={{
          marginBottom: 32,
          padding: '16px 24px',
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 18 }}>✓</span>
        <div>
          <span
            style={{
              fontSize: 13.5,
              color: '#a8892e',
              fontWeight: 700,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            구독 완료.
          </span>
          <span
            style={{
              fontSize: 13.5,
              color: '#666',
              marginLeft: 6,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {email} 으로 매주 월요일 발송됩니다.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        marginBottom: 32,
        padding: '20px 24px',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#f5f0e8',
            marginBottom: 4,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          매주 이메일로 받아보기
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: '#888',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          선택한 관심 분야의 포지션을 매주 월요일 발송합니다
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 주소"
          style={{
            padding: '9px 14px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.06)',
            color: '#ddd',
            fontSize: 13.5,
            outline: 'none',
            fontFamily: 'system-ui, sans-serif',
            width: 220,
          }}
        />
        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            padding: '9px 20px',
            background: '#c9a84c',
            color: '#1a1a1a',
            border: 'none',
            fontSize: 13.5,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'system-ui, sans-serif',
            opacity: loading ? 0.7 : 1,
          }}
        >
          구독 시작 →
        </button>
      </div>
    </div>
  )
}
