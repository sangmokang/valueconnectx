'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('비밀번호가 일치하지 않습니다'); return }
    if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다'); return }
    setLoading(true); setError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) { setError('비밀번호 변경에 실패했습니다'); setLoading(false); return }
      router.push('/login')
    } catch { setError('오류가 발생했습니다'); setLoading(false) }
  }

  const inputStyle = { width: '100%', padding: '14px 16px', fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#1a1a1a', background: '#f7f3ed', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 0, outline: 'none', boxSizing: 'border-box' as const }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px 16px', marginBottom: '16px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#EF4444', borderRadius: 0 }}>{error}</div>}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>새 비밀번호</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} style={inputStyle} />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>비밀번호 확인</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required minLength={8} style={inputStyle} />
      </div>
      <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontWeight: 600, color: '#f0ebe2', background: loading ? '#444' : '#1a1a1a', border: 'none', borderRadius: 0, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '변경 중...' : '비밀번호 변경하기'}
      </button>
    </form>
  )
}
