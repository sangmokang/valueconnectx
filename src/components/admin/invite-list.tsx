'use client'

import { useState, useEffect, useCallback } from 'react'
import { StatusBadge } from './status-badge'

interface Invite {
  id: string; email: string; invited_by_name: string; member_tier: string
  status: string; created_at: string; expires_at: string
}

export function InviteList() {
  const [data, setData] = useState<Invite[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [createEmail, setCreateEmail] = useState('')
  const [createTier, setCreateTier] = useState<'core' | 'endorsed'>('endorsed')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (filter !== 'all') params.set('status', filter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/invites/list?${params}`)
      const json = await res.json()
      setData(json.data || []); setTotal(json.total || 0)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [filter, search, page])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleRevoke(id: string) {
    try { const res = await fetch(`/api/invites/${id}/revoke`, { method: 'POST' }); if (res.ok) fetchData() }
    catch (err) { console.error(err) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setCreateLoading(true); setCreateError(null)
    try {
      const res = await fetch('/api/invites/direct', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: createEmail, member_tier: createTier }) })
      const json = await res.json()
      if (res.ok) { setShowCreate(false); setCreateEmail(''); fetchData() }
      else setCreateError(json.error)
    } catch { setCreateError('오류가 발생했습니다') }
    finally { setCreateLoading(false) }
  }

  const filters = [{ value: 'all', label: '전체' }, { value: 'pending', label: '대기' }, { value: 'accepted', label: '수락' }, { value: 'expired', label: '만료' }, { value: 'revoked', label: '취소' }]
  const inputStyle = { padding: '10px 14px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 0, outline: 'none', background: '#f7f3ed' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {filters.map((f) => (
            <button key={f.value} onClick={() => { setFilter(f.value); setPage(1) }} style={{
              padding: '8px 16px', fontFamily: 'system-ui, sans-serif', fontSize: '13px',
              fontWeight: filter === f.value ? 600 : 400, color: filter === f.value ? '#c9a84c' : '#666',
              background: filter === f.value ? 'rgba(201,168,76,0.1)' : 'transparent',
              border: filter === f.value ? '1px solid #c9a84c' : '1px solid rgba(0,0,0,0.08)', borderRadius: 0, cursor: 'pointer',
            }}>{f.label}</button>
          ))}
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{ padding: '8px 20px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', fontWeight: 600, color: '#f0ebe2', background: '#1a1a1a', border: 'none', borderRadius: 0, cursor: 'pointer' }}>직접 초대</button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ padding: '20px 24px', background: '#e8e2d9', marginBottom: '24px', borderLeft: '2px solid #c9a84c' }}>
          {createError && <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#EF4444', marginBottom: '12px' }}>{createError}</div>}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '6px' }}>이메일</label>
              <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} required placeholder="name@company.com" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '6px' }}>등급</label>
              <select value={createTier} onChange={(e) => setCreateTier(e.target.value as 'core' | 'endorsed')} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="endorsed">Endorsed</option>
                <option value="core">Core</option>
              </select>
            </div>
            <button type="submit" disabled={createLoading} style={{ padding: '10px 20px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', fontWeight: 600, color: '#f0ebe2', background: '#1a1a1a', border: 'none', borderRadius: 0, cursor: 'pointer' }}>
              {createLoading ? '전송 중...' : '초대 전송'}
            </button>
          </div>
        </form>
      )}

      <div style={{ marginBottom: '16px' }}>
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="이메일로 검색..." style={{ ...inputStyle, width: '300px' }} />
      </div>

      {loading ? (
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#888' }}>불러오는 중...</p>
      ) : data.length === 0 ? (
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#888' }}>초대가 없습니다</p>
      ) : (
        <div>
          {data.map((inv) => (
            <div key={inv.id} style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>{inv.email}</span>
                  <StatusBadge status={inv.status} />
                  <span style={{ fontSize: '11px', fontFamily: 'system-ui, sans-serif', color: '#c9a84c', border: '1px solid #c9a84c', padding: '2px 8px' }}>{inv.member_tier === 'core' ? 'CORE' : 'ENDORSED'}</span>
                </div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#888' }}>
                  초대자: {inv.invited_by_name} · {new Date(inv.created_at).toLocaleDateString('ko-KR')} · 만료: {new Date(inv.expires_at).toLocaleDateString('ko-KR')}
                </div>
              </div>
              {inv.status === 'pending' && (
                <button onClick={() => handleRevoke(inv.id)} style={{ padding: '8px 16px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#888', background: 'transparent', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 0, cursor: 'pointer' }}>취소</button>
              )}
            </div>
          ))}
          {total > 20 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '8px 16px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', background: 'transparent', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 0, cursor: 'pointer', color: '#666' }}>이전</button>
              <span style={{ padding: '8px 16px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#888' }}>{page} / {Math.ceil(total / 20)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} style={{ padding: '8px 16px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', background: 'transparent', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 0, cursor: 'pointer', color: '#666' }}>다음</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
