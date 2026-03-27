'use client'

import { useState, useEffect, useCallback } from 'react'

type HiringRecord = {
  id: string
  coffeechat_type: 'ceo' | 'peer'
  coffeechat_id: string | null
  candidate_id: string | null
  company_id: string | null
  introducer_id: string | null
  position_title: string
  annual_salary: number
  fee_percentage: number
  fee_amount: number
  reward_percentage: number
  reward_amount: number
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled'
  confirmed_at: string | null
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: '대기',
  confirmed: '확정',
  paid: '지급 완료',
  cancelled: '취소',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#c9a84c',
  confirmed: '#4c8dc9',
  paid: '#4caf50',
  cancelled: '#888888',
}

const STATUS_BG: Record<string, string> = {
  pending: '#fff8e6',
  confirmed: '#e6f0ff',
  paid: '#e6f7e6',
  cancelled: '#f5f5f5',
}

function formatKRW(amount: number) {
  return amount.toLocaleString('ko-KR') + '원'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const NEXT_STATUS: Record<string, string | null> = {
  pending: 'confirmed',
  confirmed: 'paid',
  paid: null,
  cancelled: null,
}

const NEXT_STATUS_LABEL: Record<string, string> = {
  pending: '확정으로 변경',
  confirmed: '지급 완료로 변경',
}

const EMPTY_FORM = {
  coffeechat_type: 'ceo' as 'ceo' | 'peer',
  coffeechat_id: '',
  candidate_id: '',
  company_id: '',
  introducer_id: '',
  position_title: '',
  annual_salary: '',
  fee_percentage: '10',
  reward_percentage: '1',
}

export default function AdminHiringPage() {
  const [records, setRecords] = useState<HiringRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/admin/hiring-records?${params}`)
      if (res.ok) {
        const json = await res.json()
        setRecords(json.data ?? [])
        setTotal(json.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  async function handleStatusChange(record: HiringRecord) {
    const next = NEXT_STATUS[record.status]
    if (!next) return
    setUpdatingId(record.id)
    try {
      const res = await fetch(`/api/admin/hiring-records/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (res.ok) {
        await fetchRecords()
      }
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleCancel(record: HiringRecord) {
    if (!confirm('이 채용 기록을 취소 처리하시겠습니까?')) return
    setUpdatingId(record.id)
    try {
      const res = await fetch(`/api/admin/hiring-records/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (res.ok) {
        await fetchRecords()
      }
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.position_title.trim()) { setFormError('포지션명을 입력하세요.'); return }
    const salary = parseInt(form.annual_salary, 10)
    if (!salary || salary <= 0) { setFormError('연봉을 올바르게 입력하세요.'); return }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        coffeechat_type: form.coffeechat_type,
        position_title: form.position_title.trim(),
        annual_salary: salary,
        fee_percentage: parseFloat(form.fee_percentage) || 10,
        reward_percentage: parseFloat(form.reward_percentage) || 1,
      }
      if (form.coffeechat_id.trim()) body.coffeechat_id = form.coffeechat_id.trim()
      if (form.candidate_id.trim()) body.candidate_id = form.candidate_id.trim()
      if (form.company_id.trim()) body.company_id = form.company_id.trim()
      if (form.introducer_id.trim()) body.introducer_id = form.introducer_id.trim()

      const res = await fetch('/api/admin/hiring-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setForm(EMPTY_FORM)
        setShowForm(false)
        await fetchRecords()
      } else {
        const json = await res.json()
        setFormError(json.error ?? '등록에 실패했습니다.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 800, color: '#1a1a1a', margin: 0, marginBottom: '4px' }}>
            수수료 관리
          </h2>
          <p style={{ fontSize: '13px', color: '#888888', margin: 0 }}>
            총 {total}건 · 커피챗 채용 성사 수수료 및 Self Introduction Reward 추적
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError('') }}
          style={{
            padding: '10px 20px', background: '#c9a84c', color: '#ffffff',
            border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {showForm ? '닫기' : '+ 채용 기록 등록'}
        </button>
      </div>

      {/* New Record Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#ffffff', border: '1px solid #c9a84c', padding: '24px',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 20px' }}>
            새 채용 기록 등록
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            <label style={labelStyle}>
              <span style={labelText}>커피챗 유형 *</span>
              <select
                value={form.coffeechat_type}
                onChange={e => setForm(f => ({ ...f, coffeechat_type: e.target.value as 'ceo' | 'peer' }))}
                style={inputStyle}
              >
                <option value="ceo">CEO 커피챗</option>
                <option value="peer">피어 커피챗</option>
              </select>
            </label>

            <label style={labelStyle}>
              <span style={labelText}>포지션명 *</span>
              <input
                type="text"
                value={form.position_title}
                onChange={e => setForm(f => ({ ...f, position_title: e.target.value }))}
                placeholder="예: Senior Software Engineer"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelText}>연봉 (원) *</span>
              <input
                type="number"
                value={form.annual_salary}
                onChange={e => setForm(f => ({ ...f, annual_salary: e.target.value }))}
                placeholder="예: 80000000"
                min={1}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelText}>수수료율 (%)</span>
              <input
                type="number"
                value={form.fee_percentage}
                onChange={e => setForm(f => ({ ...f, fee_percentage: e.target.value }))}
                min={0}
                max={100}
                step={0.01}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelText}>리워드율 (%) — Self Introduction</span>
              <input
                type="number"
                value={form.reward_percentage}
                onChange={e => setForm(f => ({ ...f, reward_percentage: e.target.value }))}
                min={0}
                max={100}
                step={0.01}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelText}>커피챗 ID (UUID, 선택)</span>
              <input
                type="text"
                value={form.coffeechat_id}
                onChange={e => setForm(f => ({ ...f, coffeechat_id: e.target.value }))}
                placeholder="UUID"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelText}>후보자 ID (UUID, 선택)</span>
              <input
                type="text"
                value={form.candidate_id}
                onChange={e => setForm(f => ({ ...f, candidate_id: e.target.value }))}
                placeholder="UUID"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelText}>기업 사용자 ID (UUID, 선택)</span>
              <input
                type="text"
                value={form.company_id}
                onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}
                placeholder="UUID"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelText}>소개자 ID (UUID, 선택)</span>
              <input
                type="text"
                value={form.introducer_id}
                onChange={e => setForm(f => ({ ...f, introducer_id: e.target.value }))}
                placeholder="UUID"
                style={inputStyle}
              />
            </label>
          </div>

          {/* Preview */}
          {form.annual_salary && !isNaN(parseInt(form.annual_salary, 10)) && (
            <div style={{ marginTop: '16px', padding: '12px 16px', background: '#fff8e6', border: '1px solid #e0d9ce', fontSize: '13px', color: '#555555' }}>
              예상 수수료:{' '}
              <strong style={{ color: '#1a1a1a' }}>
                {formatKRW(Math.round((parseInt(form.annual_salary, 10) * (parseFloat(form.fee_percentage) || 10)) / 100))}
              </strong>
              {' '}&nbsp;|&nbsp; Self Introduction Reward:{' '}
              <strong style={{ color: '#1a1a1a' }}>
                {formatKRW(Math.round((parseInt(form.annual_salary, 10) * (parseFloat(form.reward_percentage) || 1)) / 100))}
              </strong>
            </div>
          )}

          {formError && (
            <p style={{ marginTop: '12px', fontSize: '13px', color: '#cc3333' }}>{formError}</p>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 24px', background: submitting ? '#aaaaaa' : '#1a1a1a', color: '#ffffff',
                border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: 600, fontFamily: 'system-ui, sans-serif',
              }}
            >
              {submitting ? '등록 중...' : '등록'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError('') }}
              style={{
                padding: '10px 24px', background: 'transparent', color: '#555555',
                border: '1px solid #cccccc', cursor: 'pointer',
                fontSize: '13px', fontFamily: 'system-ui, sans-serif',
              }}
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['', 'pending', 'confirmed', 'paid', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 16px', fontSize: '12px', fontWeight: 600,
              border: '1px solid',
              borderColor: statusFilter === s ? '#c9a84c' : '#e0d9ce',
              background: statusFilter === s ? '#fff8e6' : '#ffffff',
              color: statusFilter === s ? '#c9a84c' : '#555555',
              cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
            }}
          >
            {s === '' ? '전체' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', fontSize: '14px', color: '#aaaaaa' }}>
          로딩 중...
        </div>
      ) : records.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', fontSize: '14px', color: '#aaaaaa' }}>
          채용 기록이 없습니다
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0d9ce', textAlign: 'left' }}>
                {['유형', '포지션', '연봉', '수수료', '리워드', '상태', '등록일', '액션'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', fontFamily: 'system-ui, sans-serif', fontWeight: 700, color: '#555555', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(record => {
                const nextStatus = NEXT_STATUS[record.status]
                const isUpdating = updatingId === record.id
                return (
                  <tr
                    key={record.id}
                    style={{ borderBottom: '1px solid #f0ebe2', background: '#ffffff' }}
                  >
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px',
                        background: record.coffeechat_type === 'ceo' ? '#fff8e6' : '#f0ebe2',
                        color: record.coffeechat_type === 'ceo' ? '#c9a84c' : '#555555',
                        border: '1px solid',
                        borderColor: record.coffeechat_type === 'ceo' ? '#c9a84c' : '#e0d9ce',
                      }}>
                        {record.coffeechat_type === 'ceo' ? 'CEO' : '피어'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#1a1a1a', fontWeight: 600, maxWidth: '180px' }}>
                      {record.position_title}
                    </td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap', color: '#1a1a1a' }}>
                      {formatKRW(record.annual_salary)}
                    </td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <div style={{ color: '#1a1a1a', fontWeight: 600 }}>{formatKRW(record.fee_amount)}</div>
                      <div style={{ color: '#aaaaaa', fontSize: '11px' }}>{record.fee_percentage}%</div>
                    </td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <div style={{ color: '#1a1a1a', fontWeight: 600 }}>{formatKRW(record.reward_amount)}</div>
                      <div style={{ color: '#aaaaaa', fontSize: '11px' }}>{record.reward_percentage}%</div>
                    </td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: '11px', padding: '3px 10px',
                        background: STATUS_BG[record.status] ?? '#f5f5f5',
                        color: STATUS_COLORS[record.status] ?? '#888888',
                        border: '1px solid',
                        borderColor: STATUS_COLORS[record.status] ?? '#e0d9ce',
                      }}>
                        {STATUS_LABELS[record.status] ?? record.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap', color: '#888888', fontSize: '12px' }}>
                      {formatDate(record.created_at)}
                    </td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {nextStatus && (
                          <button
                            onClick={() => handleStatusChange(record)}
                            disabled={isUpdating}
                            style={{
                              padding: '5px 12px', fontSize: '11px', fontWeight: 600,
                              background: '#c9a84c', color: '#ffffff',
                              border: 'none', cursor: isUpdating ? 'not-allowed' : 'pointer',
                              fontFamily: 'system-ui, sans-serif',
                              opacity: isUpdating ? 0.6 : 1,
                            }}
                          >
                            {NEXT_STATUS_LABEL[record.status] ?? ''}
                          </button>
                        )}
                        {record.status !== 'cancelled' && record.status !== 'paid' && (
                          <button
                            onClick={() => handleCancel(record)}
                            disabled={isUpdating}
                            style={{
                              padding: '5px 12px', fontSize: '11px', fontWeight: 600,
                              background: 'transparent', color: '#888888',
                              border: '1px solid #cccccc', cursor: isUpdating ? 'not-allowed' : 'pointer',
                              fontFamily: 'system-ui, sans-serif',
                              opacity: isUpdating ? 0.6 : 1,
                            }}
                          >
                            취소
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const labelText: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#555555',
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: '13px',
  border: '1px solid #e0d9ce',
  background: '#fafafa',
  color: '#1a1a1a',
  fontFamily: 'system-ui, sans-serif',
  width: '100%',
  boxSizing: 'border-box',
}
