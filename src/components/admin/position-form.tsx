'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface PositionFormData {
  company_name: string
  title: string
  team_size: string
  role_description: string
  salary_range: string
  location: string
  requirements: string
  benefits: string
  required_fields: string
  min_experience: number
  status: 'active' | 'draft' | 'closed'
}

interface PositionFormProps {
  initialData?: PositionFormData
  positionId?: string
}

const EMPTY_FORM: PositionFormData = {
  company_name: '',
  title: '',
  team_size: '',
  role_description: '',
  salary_range: '',
  location: '',
  requirements: '',
  benefits: '',
  required_fields: '',
  min_experience: 0,
  status: 'active',
}

function splitComma(val: string): string[] {
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function PositionForm({ initialData, positionId }: PositionFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<PositionFormData>(initialData ?? EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!positionId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const body = {
      company_name: form.company_name,
      title: form.title,
      team_size: form.team_size || undefined,
      role_description: form.role_description,
      salary_range: form.salary_range || undefined,
      location: form.location || undefined,
      requirements: splitComma(form.requirements),
      benefits: splitComma(form.benefits),
      required_fields: splitComma(form.required_fields),
      min_experience: form.min_experience,
      status: form.status,
    }

    const url = isEdit ? `/api/positions/${positionId}` : '/api/positions'
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        router.push('/admin/positions')
      } else {
        const json = await res.json()
        setError(json.error ?? '오류가 발생했습니다')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다')
    }
    setSubmitting(false)
  }

  const inputCls =
    'w-full px-3 py-2 text-sm font-vcx-sans bg-[#f7f3ed] border border-[#e0d9ce] text-[#1a1a1a] outline-none focus:border-[#c9a84c]'
  const labelCls = 'block text-xs font-vcx-sans text-[#666666] mb-1'

  const set = (key: keyof PositionFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <div className="bg-white border border-[#e0d9ce] p-6">
      <h3 className="font-vcx-serif font-bold text-[#1a1a1a] text-lg mb-6">
        {isEdit ? '포지션 수정' : '포지션 등록'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>회사명 *</label>
            <input
              required
              value={form.company_name}
              onChange={set('company_name')}
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
              onChange={set('title')}
              className={inputCls}
              style={{ borderRadius: 0 }}
              placeholder="직무명"
            />
          </div>
          <div>
            <label className={labelCls}>조직 규모</label>
            <input
              value={form.team_size}
              onChange={set('team_size')}
              className={inputCls}
              style={{ borderRadius: 0 }}
              placeholder="예: 10-30명"
            />
          </div>
          <div>
            <label className={labelCls}>연봉 밴드</label>
            <input
              value={form.salary_range}
              onChange={set('salary_range')}
              className={inputCls}
              style={{ borderRadius: 0 }}
              placeholder="예: 7,000만 ~ 1억"
            />
          </div>
          <div>
            <label className={labelCls}>근무지</label>
            <input
              value={form.location}
              onChange={set('location')}
              className={inputCls}
              style={{ borderRadius: 0 }}
              placeholder="예: 서울 강남구"
            />
          </div>
          <div>
            <label className={labelCls}>최소 경력 (년)</label>
            <input
              type="number"
              min={0}
              value={form.min_experience}
              onChange={(e) =>
                setForm((f) => ({ ...f, min_experience: parseInt(e.target.value) || 0 }))
              }
              className={inputCls}
              style={{ borderRadius: 0 }}
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>주요 역할 *</label>
          <textarea
            required
            rows={5}
            value={form.role_description}
            onChange={set('role_description')}
            className={inputCls}
            style={{ borderRadius: 0 }}
            placeholder="주요 역할 및 업무 내용을 입력하세요"
          />
        </div>

        <div>
          <label className={labelCls}>자격 요건 (쉼표로 구분)</label>
          <input
            value={form.requirements}
            onChange={set('requirements')}
            className={inputCls}
            style={{ borderRadius: 0 }}
            placeholder="예: 5년 이상 경력, React 숙련, 팀 리딩 경험"
          />
        </div>

        <div>
          <label className={labelCls}>혜택/복리후생 (쉼표로 구분)</label>
          <input
            value={form.benefits}
            onChange={set('benefits')}
            className={inputCls}
            style={{ borderRadius: 0 }}
            placeholder="예: 스톡옵션, 유연근무, 자기계발비 지원"
          />
        </div>

        <div>
          <label className={labelCls}>필수 전문 분야 (쉼표로 구분)</label>
          <input
            value={form.required_fields}
            onChange={set('required_fields')}
            className={inputCls}
            style={{ borderRadius: 0 }}
            placeholder="예: 프론트엔드, 백엔드, DevOps"
          />
        </div>

        <div>
          <label className={labelCls}>상태</label>
          <select
            value={form.status}
            onChange={set('status')}
            className={inputCls}
            style={{ borderRadius: 0 }}
          >
            <option value="active">공개</option>
            <option value="draft">임시저장</option>
            <option value="closed">마감</option>
          </select>
        </div>

        {error && <p className="text-xs font-vcx-sans text-red-600">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-vcx-sans bg-[#1a1a1a] text-[#c9a84c] hover:bg-[#333333] transition-colors disabled:opacity-50"
            style={{ borderRadius: 0 }}
          >
            {submitting ? '저장 중...' : isEdit ? '수정' : '등록'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/positions')}
            className="px-4 py-2 text-sm font-vcx-sans text-[#666666] border border-[#e0d9ce] hover:border-[#888888] transition-colors"
            style={{ borderRadius: 0 }}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
