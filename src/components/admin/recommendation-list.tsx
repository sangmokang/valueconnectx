'use client'

import { useState, useEffect, useCallback } from 'react'
import { StatusBadge } from './status-badge'

interface Recommendation {
  id: string; recommended_email: string; recommended_name: string; reason: string | null
  member_tier: string; status: string; created_at: string
}

export function RecommendationList() {
  const [data, setData] = useState<Recommendation[]>([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (filter !== 'all') params.set('status', filter)
      const res = await fetch(`/api/recommendations/list?${params}`)
      const json = await res.json()
      setData(json.data || []); setTotal(json.total || 0)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [filter, page])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setActionLoading(id)
    try { const res = await fetch(`/api/recommendations/${id}/${action}`, { method: 'POST' }); if (res.ok) fetchData() }
    catch (err) { console.error(err) }
    finally { setActionLoading(null) }
  }

  const filters = [{ value: 'all', label: '전체' }, { value: 'pending', label: '대기' }, { value: 'approved', label: '승인' }, { value: 'rejected', label: '거절' }]

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {filters.map((f) => (
          <button key={f.value} onClick={() => { setFilter(f.value); setPage(1) }} style={{
            padding: '8px 16px', fontFamily: 'system-ui, sans-serif', fontSize: '13px',
            fontWeight: filter === f.value ? 600 : 400, color: filter === f.value ? '#c9a84c' : '#666',
            background: filter === f.value ? 'rgba(201,168,76,0.1)' : 'transparent',
            border: filter === f.value ? '1px solid #c9a84c' : '1px solid rgba(0,0,0,0.08)', borderRadius: 0, cursor: 'pointer',
          }}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#888' }}>불러오는 중...</p>
      ) : data.length === 0 ? (
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#888' }}>추천이 없습니다</p>
      ) : (
        <div>
          {data.map((rec) => (
            <div key={rec.id} style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: 700, color: '#1a1a1a' }}>{rec.recommended_name}</span>
                  <StatusBadge status={rec.status} />
                  <span style={{ fontSize: '11px', fontFamily: 'system-ui, sans-serif', color: '#c9a84c', border: '1px solid #c9a84c', padding: '2px 8px' }}>{rec.member_tier === 'core' ? 'CORE' : 'ENDORSED'}</span>
                </div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#666' }}>{rec.recommended_email}</div>
                {rec.reason && <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#888', marginTop: '6px' }}>&ldquo;{rec.reason}&rdquo;</div>}
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#999', marginTop: '4px' }}>{new Date(rec.created_at).toLocaleDateString('ko-KR')}</div>
              </div>
              {rec.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleAction(rec.id, 'approve')} disabled={actionLoading === rec.id} style={{ padding: '8px 20px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', fontWeight: 600, color: '#f0ebe2', background: '#1a1a1a', border: 'none', borderRadius: 0, cursor: 'pointer' }}>승인</button>
                  <button onClick={() => handleAction(rec.id, 'reject')} disabled={actionLoading === rec.id} style={{ padding: '8px 20px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', fontWeight: 600, color: '#888', background: 'transparent', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 0, cursor: 'pointer' }}>거절</button>
                </div>
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
