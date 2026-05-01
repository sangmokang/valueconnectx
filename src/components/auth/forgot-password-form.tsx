'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
      if (error) setError('오류가 발생했습니다. 잠시 후 다시 시도해주세요'); else setSent(true)
    } catch { setError('오류가 발생했습니다') }
    finally { setLoading(false) }
  }

  if (sent) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '17px', color: '#f2f2f2', margin: '0 0 8px', fontWeight: 700 }}>이메일을 확인해주세요</p>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#b8b3b0', margin: 0, lineHeight: 1.6 }}>입력하신 이메일로 비밀번호 재설정 링크를 전송했습니다</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ background: 'rgba(251,86,91,0.12)', border: '1px solid rgba(251,86,91,0.45)', padding: '12px 16px', marginBottom: '16px', fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#fd9c9f', borderRadius: 0 }}>{error}</div>}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: '14px', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#b8b3b0', marginBottom: '8px' }}>이메일</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required style={{ width: '100%', padding: '15px 16px', fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#f2f2f2', background: '#050507', border: '1px solid #3d3a39', borderRadius: 0, outline: 'none', boxSizing: 'border-box' }} />
      </div>
      <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', fontFamily: 'system-ui, sans-serif', fontSize: '16px', fontWeight: 700, color: loading ? '#8b949e' : '#2fd6a1', background: '#101010', border: '1px solid #3d3a39', borderRadius: 0, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '전송 중...' : '재설정 링크 보내기'}
      </button>
    </form>
  )
}
