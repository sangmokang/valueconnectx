'use client'

import { useState, useEffect, useCallback } from 'react'

interface CorporateUserRow {
  id: string
  name: string
  email: string
  company: string
  title: string
  role: 'ceo' | 'founder' | 'c_level' | 'hr_leader'
  is_verified: boolean
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  ceo: 'CEO',
  founder: 'Founder',
  c_level: 'C-Level',
  hr_leader: 'HR Leader',
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontFamily: 'system-ui, sans-serif',
  fontSize: '13px',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 0,
  outline: 'none',
  background: '#f7f3ed',
}

export function CorporateUserList() {
  const [data, setData] = useState<CorporateUserRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    title: '',
    role: 'ceo' as 'ceo' | 'founder' | 'c_level' | 'hr_leader',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      const res = await fetch(`/api/corporate-users/list?${params}`)
      const json = await res.json()
      setData(json.data || [])
      setTotal(json.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleVerify(id: string) {
    try {
      const res = await fetch(`/api/corporate-users/${id}/verify`, { method: 'PUT' })
      if (res.ok) fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/corporate-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (res.ok) {
        setShowCreate(false)
        setForm({ name: '', email: '', company: '', title: '', role: 'ceo' })
        fetchData()
      } else {
        setCreateError(json.error)
      }
    } catch {
      setCreateError('오류가 발생했습니다')
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="이름 또는 회사로 검색..."
          style={{ ...inputStyle, width: '300px' }}
        />
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{ padding: '8px 20px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', fontWeight: 600, color: '#f0ebe2', background: '#1a1a1a', border: 'none', borderRadius: 0, cursor: 'pointer' }}
        >
          기업 사용자 추가
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ padding: '20px 24px', background: '#e8e2d9', marginBottom: '24px', borderLeft: '2px solid #c9a84c' }}>
          {createError && (
            <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#EF4444', marginBottom: '12px' }}>{createError}</div>
          )}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '6px' }}>이름</label>
              <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="홍길동" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '6px' }}>이메일</label>
              <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="name@company.com" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '6px' }}>회사</label>
              <input type="text" value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} required placeholder="회사명" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '6px' }}>직함</label>
              <input type="text" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="대표이사" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '6px' }}>역할</label>
              <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value as typeof form.role }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="ceo">CEO</option>
                <option value="founder">Founder</option>
                <option value="c_level">C-Level</option>
                <option value="hr_leader">HR Leader</option>
              </select>
            </div>
            <button type="submit" disabled={createLoading} style={{ padding: '10px 20px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', fontWeight: 600, color: '#f0ebe2', background: '#1a1a1a', border: 'none', borderRadius: 0, cursor: 'pointer' }}>
              {createLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#888' }}>불러오는 중...</p>
      ) : data.length === 0 ? (
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#888' }}>기업 사용자가 없습니다</p>
      ) : (
        <div>
          {data.map((cu) => (
            <div key={cu.id} style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>{cu.name}</span>
                  <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#888' }}>{cu.title}</span>
                  <span style={{ fontSize: '11px', fontFamily: 'system-ui, sans-serif', color: '#c9a84c', border: '1px solid #c9a84c', padding: '2px 8px' }}>
                    {ROLE_LABELS[cu.role] ?? cu.role}
                  </span>
                  <span style={{
                    fontSize: '11px', fontFamily: 'system-ui, sans-serif', padding: '2px 8px',
                    color: cu.is_verified ? '#16a34a' : '#888',
                    border: `1px solid ${cu.is_verified ? '#16a34a' : 'rgba(0,0,0,0.15)'}`,
                  }}>
                    {cu.is_verified ? '인증됨' : '미인증'}
                  </span>
                </div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#888' }}>
                  {cu.email} · {cu.company} · {new Date(cu.created_at).toLocaleDateString('ko-KR')}
                </div>
              </div>
              {!cu.is_verified && (
                <button
                  onClick={() => handleVerify(cu.id)}
                  style={{ padding: '8px 16px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', fontWeight: 600, color: '#c9a84c', background: 'transparent', border: '1px solid #c9a84c', borderRadius: 0, cursor: 'pointer' }}
                >
                  인증
                </button>
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
