'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminTabs } from '@/components/admin/admin-tabs'

interface Position {
  id: string
  company_name: string
  title: string
  team_size: string | null
  role_description: string
  salary_range: string | null
  status: 'active' | 'closed' | 'draft'
  created_at: string
}

type FormStatus = 'active' | 'closed' | 'draft'

const EMPTY_FORM = {
  company_name: '',
  title: '',
  team_size: '',
  role_description: '',
  salary_range: '',
  status: 'active' as FormStatus,
}

export default function AdminPositionsPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPositions = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/positions?limit=100')
    if (res.ok) {
      const json = await res.json()
      setPositions(json.data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPositions()
  }, [fetchPositions])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
    setShowForm(true)
  }

  const openEdit = (p: Position) => {
    setEditingId(p.id)
    setForm({
      company_name: p.company_name,
      title: p.title,
      team_size: p.team_size ?? '',
      role_description: p.role_description,
      salary_range: p.salary_range ?? '',
      status: p.status,
    })
    setError(null)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const body = {
      ...form,
      team_size: form.team_size || undefined,
      salary_range: form.salary_range || undefined,
    }

    const url = editingId ? `/api/positions/${editingId}` : '/api/positions'
    const method = editingId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setShowForm(false)
      setEditingId(null)
      await fetchPositions()
    } else {
      const json = await res.json()
      setError(json.error ?? '오류가 발생했습니다')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 포지션을 삭제하시겠습니까?')) return
    const res = await fetch(`/api/positions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPositions((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const inputCls = "w-full px-3 py-2 text-sm font-vcx-sans bg-[#f7f3ed] border border-[#e0d9ce] text-[#1a1a1a] outline-none focus:border-[#c9a84c]"
  const labelCls = "block text-xs font-vcx-sans text-[#666666] mb-1"

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="vcx-section-label mb-1">관리자</p>
        <h1 className="font-vcx-serif font-bold text-[#1a1a1a] text-3xl">Admin</h1>
      </div>

      <AdminTabs />

      <div className="flex items-center justify-between mb-6">
        <h2 className="font-vcx-serif font-bold text-[#1a1a1a] text-xl">포지션 관리</h2>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 text-sm font-vcx-sans bg-[#1a1a1a] text-[#c9a84c] hover:bg-[#333333] transition-colors"
          style={{ borderRadius: 0 }}
        >
          + 포지션 등록
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-[#c9a84c] p-6 mb-8">
          <h3 className="font-vcx-serif font-bold text-[#1a1a1a] text-lg mb-4">
            {editingId ? '포지션 수정' : '포지션 등록'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>회사명 *</label>
                <input
                  required
                  value={form.company_name}
                  onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                  className={inputCls}
                  style={{ borderRadius: 0 }}
                  placeholder="회사명"
                />
              </div>
              <div>
                <label className={labelCls}>포지션 *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputCls}
                  style={{ borderRadius: 0 }}
                  placeholder="직무명"
                />
              </div>
              <div>
                <label className={labelCls}>조직 규모</label>
                <input
                  value={form.team_size}
                  onChange={(e) => setForm((f) => ({ ...f, team_size: e.target.value }))}
                  className={inputCls}
                  style={{ borderRadius: 0 }}
                  placeholder="예: 10-30명"
                />
              </div>
              <div>
                <label className={labelCls}>연봉 밴드</label>
                <input
                  value={form.salary_range}
                  onChange={(e) => setForm((f) => ({ ...f, salary_range: e.target.value }))}
                  className={inputCls}
                  style={{ borderRadius: 0 }}
                  placeholder="예: 7,000만 ~ 1억"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>주요 역할 *</label>
              <textarea
                required
                rows={5}
                value={form.role_description}
                onChange={(e) => setForm((f) => ({ ...f, role_description: e.target.value }))}
                className={inputCls}
                style={{ borderRadius: 0 }}
                placeholder="주요 역할 및 업무 내용을 입력하세요"
              />
            </div>

            <div>
              <label className={labelCls}>상태</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof form.status }))}
                className={inputCls}
                style={{ borderRadius: 0 }}
              >
                <option value="active">공개</option>
                <option value="draft">임시저장</option>
                <option value="closed">마감</option>
              </select>
            </div>

            {error && (
              <p className="text-xs font-vcx-sans text-red-600">{error}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-vcx-sans bg-[#1a1a1a] text-[#c9a84c] hover:bg-[#333333] transition-colors disabled:opacity-50"
                style={{ borderRadius: 0 }}
              >
                {submitting ? '저장 중...' : editingId ? '수정' : '등록'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-vcx-sans text-[#666666] border border-[#e0d9ce] hover:border-[#888888] transition-colors"
                style={{ borderRadius: 0 }}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#e0d9ce] p-5 h-20 animate-pulse" />
          ))}
        </div>
      ) : positions.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm font-vcx-sans text-[#999999]">등록된 포지션이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-[#e0d9ce] p-5 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="vcx-section-label">{p.company_name}</p>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-vcx-sans border ${
                      p.status === 'active'
                        ? 'text-[#c9a84c] border-[#c9a84c] bg-[#fdf8ef]'
                        : p.status === 'draft'
                        ? 'text-[#888888] border-[#e0d9ce] bg-[#f7f3ed]'
                        : 'text-[#999999] border-[#dddddd] bg-[#f5f5f5]'
                    }`}
                    style={{ borderRadius: 0 }}
                  >
                    {p.status === 'active' ? '공개' : p.status === 'draft' ? '임시저장' : '마감'}
                  </span>
                </div>
                <p className="font-vcx-serif font-bold text-[#1a1a1a] text-base">{p.title}</p>
                {(p.team_size || p.salary_range) && (
                  <p className="text-xs font-vcx-sans text-[#888888] mt-1">
                    {[p.team_size, p.salary_range].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="px-3 py-1.5 text-xs font-vcx-sans text-[#666666] border border-[#e0d9ce] hover:border-[#888888] transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="px-3 py-1.5 text-xs font-vcx-sans text-red-600 border border-red-200 hover:border-red-400 transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
