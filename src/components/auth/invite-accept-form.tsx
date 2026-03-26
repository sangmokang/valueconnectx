'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface InviteInfo { email: string; invitedByName: string; memberTier: 'core' | 'endorsed' }

export function InviteAcceptForm({ initialToken }: { initialToken?: string }) {
  const [token, setToken] = useState(initialToken || '')
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'token' | 'form'>('token')
  const router = useRouter()

  useEffect(() => { if (initialToken) verifyToken(initialToken) }, [initialToken])

  async function verifyToken(t: string) {
    setVerifying(true); setError(null)
    try {
      const res = await fetch(`/api/invites/verify/${t}`)
      const data = await res.json()
      if (data.valid) { setInviteInfo({ email: data.email, invitedByName: data.invitedByName, memberTier: data.memberTier }); setStep('form') }
      else setError(data.reason || '유효하지 않은 초대 링크입니다')
    } catch { setError('초대 확인 중 오류가 발생했습니다') }
    finally { setVerifying(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    if (password !== confirmPassword) { setError('비밀번호가 일치하지 않습니다'); return }
    if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/invites/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password, name, linkedin_url: linkedinUrl }) })
      const data = await res.json()
      if (data.success) {
        if (data.session?.access_token && data.session?.refresh_token) {
          const supabase = createClient()
          await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token })
        }
        router.push('/onboarding'); router.refresh()
      }
      else { setError(data.error || '계정 생성에 실패했습니다'); setLoading(false) }
    } catch { setError('계정 생성 중 오류가 발생했습니다'); setLoading(false) }
  }

  const inputStyle = { width: '100%', padding: '14px 16px', fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#1a1a1a', background: '#f7f3ed', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 0, outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block' as const, fontFamily: 'system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888', marginBottom: '8px' }

  if (step === 'token' && !initialToken) {
    return (
      <div>
        {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px 16px', marginBottom: '16px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#EF4444', borderRadius: 0 }}>{error}</div>}
        <div style={{ marginBottom: '24px' }}><label style={labelStyle}>초대 코드</label><input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="초대 이메일의 링크를 붙여넣어 주세요" style={inputStyle} /></div>
        <button onClick={() => verifyToken(token)} disabled={verifying || !token} style={{ width: '100%', padding: '14px', fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontWeight: 600, color: '#f0ebe2', background: verifying ? '#444' : '#1a1a1a', border: 'none', borderRadius: 0, cursor: verifying ? 'not-allowed' : 'pointer' }}>
          {verifying ? '확인 중...' : '초대 확인하기'}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {inviteInfo && (
        <div style={{ background: '#e8e2d9', padding: '16px 20px', marginBottom: '24px', borderLeft: '2px solid #c9a84c', borderRadius: 0 }}>
          <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: '6px' }}>INVITED BY</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>{inviteInfo.invitedByName}님이 초대했습니다</div>
          <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#888' }}>{inviteInfo.email} · {inviteInfo.memberTier === 'core' ? 'Core Member' : 'Endorsed Member'}</div>
        </div>
      )}
      {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px 16px', marginBottom: '16px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#EF4444', borderRadius: 0 }}>{error}</div>}
      <div style={{ marginBottom: '16px' }}><label style={labelStyle}>이름 (실명)</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" required style={inputStyle} /></div>
      <div style={{ marginBottom: '16px' }}><label style={labelStyle}>비밀번호 (8자 이상)</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} style={inputStyle} /></div>
      <div style={{ marginBottom: '16px' }}><label style={labelStyle}>비밀번호 확인</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={8} style={inputStyle} /></div>
      <div style={{ marginBottom: '24px' }}><label style={labelStyle}>LinkedIn URL (선택)</label><input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/your-profile" style={inputStyle} /></div>
      <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontWeight: 600, color: '#f0ebe2', background: loading ? '#444' : '#1a1a1a', border: 'none', borderRadius: 0, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '계정 생성 중...' : '계정 생성하기'}
      </button>
    </form>
  )
}
