'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { trackEvent } from '@/lib/analytics'
import { sanitizeRedirect } from '@/lib/auth/routes'

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError('이메일 또는 비밀번호가 올바르지 않습니다'); setLoading(false); return }
      trackEvent('user_login', { method: 'email' })
      router.push(sanitizeRedirect(redirectTo))
      router.refresh()
    } catch {
      setError('로그인 중 오류가 발생했습니다')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px', fontFamily: 'system-ui, sans-serif', fontSize: '14px',
    color: 'var(--color-vcx-dark)', background: 'var(--color-vcx-beige-light)', border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 0, outline: 'none', boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    display: 'block' as const, fontFamily: 'system-ui, sans-serif', fontSize: '12px',
    letterSpacing: '0.02em', color: 'var(--color-vcx-sub-4)', marginBottom: '8px',
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px 16px', marginBottom: '16px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#EF4444', borderRadius: 0 }}>
          {error}
        </div>
      )}
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="login-email" style={labelStyle}>이메일</label>
        <input
          id="login-email"
          aria-label="이메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          required
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label htmlFor="login-password" style={labelStyle}>비밀번호</label>
        <input
          id="login-password"
          aria-label="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={8}
          style={inputStyle}
        />
      </div>
      <button type="submit" disabled={loading} style={{
        width: '100%', padding: '14px', fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontWeight: 600,
        color: 'var(--color-vcx-beige)', background: loading ? 'var(--color-vcx-sub-1)' : 'var(--color-vcx-dark)', border: 'none', borderRadius: 0,
        cursor: loading ? 'not-allowed' : 'pointer',
      }}>
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  )
}
