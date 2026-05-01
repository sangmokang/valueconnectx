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

  const inputStyle = { width: '100%', padding: '15px 16px', fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#f2f2f2', background: '#050507', border: '1px solid #3d3a39', borderRadius: 0, outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block' as const, fontFamily: 'system-ui, sans-serif', fontSize: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' as const, color: '#b8b3b0', marginBottom: '8px' }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ background: 'rgba(251,86,91,0.12)', border: '1px solid rgba(251,86,91,0.45)', padding: '12px 16px', marginBottom: '16px', fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#fd9c9f', borderRadius: 0 }}>{error}</div>}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>새 비밀번호</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} style={inputStyle} />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>비밀번호 확인</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required minLength={8} style={inputStyle} />
      </div>
      <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', fontFamily: 'system-ui, sans-serif', fontSize: '16px', fontWeight: 700, color: loading ? '#8b949e' : '#2fd6a1', background: '#101010', border: '1px solid #3d3a39', borderRadius: 0, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '변경 중...' : '비밀번호 변경하기'}
      </button>
    </form>
  )
}
