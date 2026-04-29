'use client'

import { useState } from 'react'
import { z } from 'zod'

export const feedItemSchema = z.object({
  company: z.string().min(1, '회사명을 입력해주세요'),
  company_tag: z.string().optional().nullable(),
  role: z.string().min(1, '역할을 입력해주세요'),
  level: z.string().optional().nullable(),
  team_size: z.string().optional().nullable(),
  salary_band: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  summary: z.string().optional().nullable(),
  exclusive: z.boolean().default(false),
  published_at: z.string().optional().nullable(),
})

export type FeedItemFormData = z.infer<typeof feedItemSchema>

export type FeedItem = FeedItemFormData & {
  id: string
  created_by: string | null
  created_at: string
}

interface CurationFormProps {
  item?: FeedItem
  onSuccess: () => void
  onCancel: () => void
}

const emptyForm: FeedItemFormData = {
  company: '',
  company_tag: '',
  role: '',
  level: '',
  team_size: '',
  salary_band: '',
  location: '',
  tags: [],
  summary: '',
  exclusive: false,
  published_at: new Date().toISOString().slice(0, 16),
}

export function CurationForm({ item, onSuccess, onCancel }: CurationFormProps) {
  const isEdit = !!item
  const [form, setForm] = useState<FeedItemFormData>(
    item
      ? {
          company: item.company,
          company_tag: item.company_tag ?? '',
          role: item.role,
          level: item.level ?? '',
          team_size: item.team_size ?? '',
          salary_band: item.salary_band ?? '',
          location: item.location ?? '',
          tags: item.tags ?? [],
          summary: item.summary ?? '',
          exclusive: item.exclusive ?? false,
          published_at: item.published_at
            ? new Date(item.published_at).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
        }
      : emptyForm
  )
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  function handleChange(field: keyof FeedItemFormData, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function addTag() {
    const tag = tagInput.trim()
    if (!tag || form.tags.includes(tag)) return
    handleChange('tags', [...form.tags, tag])
    setTagInput('')
  }

  function removeTag(tag: string) {
    handleChange('tags', form.tags.filter((t) => t !== tag))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')

    const result = feedItemSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string
        fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...result.data,
        published_at: form.published_at
          ? new Date(form.published_at).toISOString()
          : new Date().toISOString(),
      }

      const url = isEdit ? `/api/admin/feed/${item!.id}` : '/api/admin/feed'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setServerError(json.error ?? '요청에 실패했습니다')
        return
      }

      onSuccess()
    } catch {
      setServerError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '14px',
    border: '1px solid rgba(0,0,0,0.15)',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: '#555',
    marginBottom: '6px',
    fontFamily: 'system-ui, sans-serif',
  }

  const fieldStyle: React.CSSProperties = { marginBottom: '20px' }

  const errorStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#c0392b',
    marginTop: '4px',
    fontFamily: 'system-ui, sans-serif',
  }

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        {/* 회사명 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>회사명 *</label>
          <input
            style={inputStyle}
            value={form.company}
            onChange={(e) => handleChange('company', e.target.value)}
            placeholder="예: 토스"
          />
          {errors.company && <p style={errorStyle}>{errors.company}</p>}
        </div>

        {/* 회사 태그 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>회사 태그</label>
          <input
            style={inputStyle}
            value={form.company_tag ?? ''}
            onChange={(e) => handleChange('company_tag', e.target.value)}
            placeholder="예: 핀테크"
          />
        </div>

        {/* 역할 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>역할 *</label>
          <input
            style={inputStyle}
            value={form.role}
            onChange={(e) => handleChange('role', e.target.value)}
            placeholder="예: Head of Product"
          />
          {errors.role && <p style={errorStyle}>{errors.role}</p>}
        </div>

        {/* 레벨 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>레벨</label>
          <input
            style={inputStyle}
            value={form.level ?? ''}
            onChange={(e) => handleChange('level', e.target.value)}
            placeholder="예: C-Level, Director"
          />
        </div>

        {/* 팀 규모 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>팀 규모</label>
          <input
            style={inputStyle}
            value={form.team_size ?? ''}
            onChange={(e) => handleChange('team_size', e.target.value)}
            placeholder="예: 10-30명"
          />
        </div>

        {/* 연봉 밴드 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>연봉 밴드</label>
          <input
            style={inputStyle}
            value={form.salary_band ?? ''}
            onChange={(e) => handleChange('salary_band', e.target.value)}
            placeholder="예: 1억 이상"
          />
        </div>

        {/* 위치 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>위치</label>
          <input
            style={inputStyle}
            value={form.location ?? ''}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="예: 서울 강남"
          />
        </div>

        {/* 게시일시 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>게시 일시</label>
          <input
            type="datetime-local"
            style={inputStyle}
            value={form.published_at ?? ''}
            onChange={(e) => handleChange('published_at', e.target.value)}
          />
        </div>
      </div>

      {/* 태그 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>태그</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {form.tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', background: '#f5f0e8', border: '1px solid rgba(201,168,76,0.4)',
                fontSize: '12px', fontFamily: 'system-ui, sans-serif', color: '#1a1a1a',
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0, lineHeight: 1 }}
              >×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            placeholder="태그 입력 후 Enter 또는 추가 버튼"
          />
          <button
            type="button"
            onClick={addTag}
            style={{
              padding: '10px 16px', background: '#1a1a1a', color: '#fff',
              border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'system-ui, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >추가</button>
        </div>
      </div>

      {/* 요약 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>요약 설명</label>
        <textarea
          style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
          value={form.summary ?? ''}
          onChange={(e) => handleChange('summary', e.target.value)}
          placeholder="포지션에 대한 간략한 설명을 입력하세요"
        />
      </div>

      {/* 익스클루시브 */}
      <div style={{ ...fieldStyle, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="checkbox"
          id="exclusive"
          checked={form.exclusive}
          onChange={(e) => handleChange('exclusive', e.target.checked)}
          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#c9a84c' }}
        />
        <label htmlFor="exclusive" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>
          익스클루시브 포지션
        </label>
      </div>

      {serverError && (
        <div style={{
          padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5',
          marginBottom: '20px', fontSize: '14px', color: '#c0392b',
          fontFamily: 'system-ui, sans-serif',
        }}>
          {serverError}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '12px 24px', background: 'transparent', border: '1px solid rgba(0,0,0,0.2)',
            cursor: 'pointer', fontSize: '14px', fontFamily: 'system-ui, sans-serif',
            fontWeight: 600,
          }}
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px', background: loading ? '#999' : '#c9a84c', color: '#fff',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px', fontFamily: 'system-ui, sans-serif', fontWeight: 600,
          }}
        >
          {loading ? '저장 중...' : isEdit ? '수정 완료' : '아이템 생성'}
        </button>
      </div>
    </form>
  )
}
