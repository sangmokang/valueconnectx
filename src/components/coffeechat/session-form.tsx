'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { z } from 'zod'

const sessionSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  description: z.string().min(1, '설명을 입력해주세요'),
  session_date: z.string().min(1, '날짜와 시간을 입력해주세요'),
  duration_minutes: z.number().int().min(15, '최소 15분').max(480, '최대 480분'),
  max_participants: z.number().int().min(1, '최소 1명').max(50, '최대 50명'),
  location_type: z.enum(['online', 'offline', 'hybrid']),
  location_detail: z.string().optional(),
  target_tier: z.enum(['core', 'endorsed', 'all']).optional(),
  tags: z.array(z.string()),
  agreement_accepted: z.boolean().refine((v) => v === true, '헤드헌팅 수수료 원칙에 동의해야 합니다'),
})

type SessionFormData = z.infer<typeof sessionSchema>

interface SessionFormProps {
  initialData?: Partial<SessionFormData>
  sessionId?: string // if provided, we're editing
}

export function SessionForm({ initialData, sessionId }: SessionFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<Partial<SessionFormData>>({
    title: '',
    description: '',
    session_date: '',
    duration_minutes: 60,
    max_participants: 5,
    location_type: undefined,
    location_detail: '',
    target_tier: undefined,
    tags: [],
    agreement_accepted: false,
    ...initialData,
  })
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function setField<K extends keyof SessionFormData>(key: K, value: SessionFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next })
  }

  function addTag() {
    const trimmed = tagInput.trim()
    if (!trimmed) return
    const current = form.tags ?? []
    if (!current.includes(trimmed)) {
      setField('tags', [...current, trimmed])
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setField('tags', (form.tags ?? []).filter((t) => t !== tag))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const parsed = sessionSchema.safeParse({
      ...form,
      duration_minutes: Number(form.duration_minutes),
      max_participants: Number(form.max_participants),
    })

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      const issues: Array<{ path: (string | number)[]; message: string }> =
        (parsed.error as unknown as { issues: Array<{ path: (string | number)[]; message: string }> }).issues ?? []
      issues.forEach((err) => {
        if (err.path[0]) fieldErrors[String(err.path[0])] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      const url = sessionId ? `/api/ceo-coffeechat/${sessionId}` : '/api/ceo-coffeechat'
      const method = sessionId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error ?? '저장에 실패했습니다')
        return
      }
      router.push(`/ceo-coffeechat/${data.data.id}`)
      router.refresh()
    } catch {
      setSubmitError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <label className="vcx-label text-vcx-sub-3 block mb-2">제목 *</label>
        <input
          type="text"
          value={form.title ?? ''}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="커피챗 제목을 입력해주세요"
          className="w-full border border-[#1a1a1a] bg-white px-4 py-3 text-[14px] font-vcx-sans text-vcx-dark placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]"
          disabled={loading}
        />
        {errors.title && <p className="text-[12px] text-red-500 mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="vcx-label text-vcx-sub-3 block mb-2">설명 *</label>
        <textarea
          value={form.description ?? ''}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="커피챗에 대해 설명해주세요"
          rows={6}
          className="w-full border border-[#1a1a1a] bg-white px-4 py-3 text-[14px] font-vcx-sans text-vcx-dark placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c] resize-vertical"
          disabled={loading}
        />
        {errors.description && <p className="text-[12px] text-red-500 mt-1">{errors.description}</p>}
      </div>

      {/* Date/Time */}
      <div>
        <label htmlFor="session_date" className="vcx-label text-vcx-sub-3 block mb-2">날짜 및 시간 *</label>
        <input
          id="session_date"
          type="datetime-local"
          value={form.session_date ?? ''}
          onChange={(e) => setField('session_date', e.target.value)}
          className="w-full border border-[#1a1a1a] bg-white px-4 py-3 text-[14px] font-vcx-sans text-vcx-dark focus:outline-none focus:border-[#c9a84c]"
          disabled={loading}
        />
        {errors.session_date && <p className="text-[12px] text-red-500 mt-1">{errors.session_date}</p>}
      </div>

      {/* Duration + Max participants */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="duration_minutes" className="vcx-label text-vcx-sub-3 block mb-2">소요 시간 (분) *</label>
          <input
            id="duration_minutes"
            type="number"
            min={15}
            max={480}
            value={form.duration_minutes ?? 60}
            onChange={(e) => setField('duration_minutes', Number(e.target.value))}
            className="w-full border border-[#1a1a1a] bg-white px-4 py-3 text-[14px] font-vcx-sans text-vcx-dark focus:outline-none focus:border-[#c9a84c]"
            disabled={loading}
          />
          {errors.duration_minutes && <p className="text-[12px] text-red-500 mt-1">{errors.duration_minutes}</p>}
        </div>
        <div>
          <label htmlFor="max_participants" className="vcx-label text-vcx-sub-3 block mb-2">최대 참가 인원 *</label>
          <input
            id="max_participants"
            type="number"
            min={1}
            max={50}
            value={form.max_participants ?? 5}
            onChange={(e) => setField('max_participants', Number(e.target.value))}
            className="w-full border border-[#1a1a1a] bg-white px-4 py-3 text-[14px] font-vcx-sans text-vcx-dark focus:outline-none focus:border-[#c9a84c]"
            disabled={loading}
          />
          {errors.max_participants && <p className="text-[12px] text-red-500 mt-1">{errors.max_participants}</p>}
        </div>
      </div>

      {/* Location type */}
      <div>
        <label className="vcx-label text-vcx-sub-3 block mb-2">장소 유형 *</label>
        <div className="flex gap-3">
          {(['online', 'offline', 'hybrid'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setField('location_type', type)}
              className={`flex-1 py-3 text-[13px] font-vcx-sans border transition-colors ${
                form.location_type === type
                  ? 'bg-[#1a1a1a] text-[#f0ebe2] border-[#1a1a1a]'
                  : 'bg-white text-vcx-dark border-[#1a1a1a] hover:bg-[#f0ebe2]'
              }`}
              disabled={loading}
            >
              {type === 'online' ? '온라인' : type === 'offline' ? '오프라인' : '하이브리드'}
            </button>
          ))}
        </div>
        {errors.location_type && <p className="text-[12px] text-red-500 mt-1">{errors.location_type}</p>}
      </div>

      {/* Location detail */}
      <div>
        <label className="vcx-label text-vcx-sub-3 block mb-2">장소 상세 (선택)</label>
        <input
          type="text"
          value={form.location_detail ?? ''}
          onChange={(e) => setField('location_detail', e.target.value)}
          placeholder="Zoom 링크, 주소 등"
          className="w-full border border-[#1a1a1a] bg-white px-4 py-3 text-[14px] font-vcx-sans text-vcx-dark placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]"
          disabled={loading}
        />
      </div>

      {/* Target tier */}
      <div>
        <label className="vcx-label text-vcx-sub-3 block mb-2">대상 멤버 (선택)</label>
        <div className="flex gap-3">
          {[
            { value: 'all', label: '전체' },
            { value: 'core', label: 'Core' },
            { value: 'endorsed', label: 'Endorsed' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setField('target_tier', value as 'all' | 'core' | 'endorsed')}
              className={`flex-1 py-2.5 text-[13px] font-vcx-sans border transition-colors ${
                form.target_tier === value
                  ? 'bg-[#1a1a1a] text-[#f0ebe2] border-[#1a1a1a]'
                  : 'bg-white text-vcx-dark border-[#ccc] hover:border-[#1a1a1a]'
              }`}
              disabled={loading}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="vcx-label text-vcx-sub-3 block mb-2">태그 (선택)</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            placeholder="태그 입력 후 Enter"
            className="flex-1 border border-[#1a1a1a] bg-white px-4 py-2.5 text-[14px] font-vcx-sans text-vcx-dark placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]"
            disabled={loading}
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={loading}>
            추가
          </Button>
        </div>
        {(form.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(form.tags ?? []).map((tag) => (
              <span key={tag} className="vcx-label px-2.5 py-1 bg-[#f0ebe2] border border-[#e8e2d9] text-vcx-sub-3 flex items-center gap-1.5">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-vcx-sub-4 hover:text-vcx-dark"
                  aria-label={`${tag} 제거`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Head Hunting Agreement */}
      <div className="border border-[#e0d9ce] bg-[#fdf9f2] p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.agreement_accepted ?? false}
            onChange={(e) => setField('agreement_accepted', e.target.checked)}
            disabled={loading}
            className="mt-0.5 flex-shrink-0 w-4 h-4 accent-[#c9a84c]"
          />
          <span className="text-[13px] font-vcx-sans text-[#1a1a1a] leading-relaxed">
            헤드헌팅 수수료 원칙에 동의합니다. ValueConnect X를 통한 채용 성사 시 수수료 정책이 적용됩니다.
          </span>
        </label>
        {errors.agreement_accepted && (
          <p className="text-[12px] text-red-500 mt-2 pl-7">{errors.agreement_accepted}</p>
        )}
      </div>

      {submitError && (
        <p className="text-[13px] text-red-600 font-vcx-sans">{submitError}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={loading}
        >
          취소
        </Button>
        <Button type="submit" variant="gold" disabled={loading}>
          {loading ? '저장 중...' : sessionId ? '세션 수정' : '세션 만들기'}
        </Button>
      </div>
    </form>
  )
}
