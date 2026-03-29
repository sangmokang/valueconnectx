'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PROFESSIONAL_FIELDS = [
  'Engineering', 'Product', 'Design', 'Data', 'Marketing',
  'Sales', 'Operations', 'Finance', 'HR', 'Legal', 'Other',
]

const INDUSTRIES = [
  'IT/소프트웨어', '금융/핀테크', '컨설팅', '마케팅/광고',
  '의료/헬스케어', '교육', '제조/하드웨어', '스타트업',
  '미디어/콘텐츠', '법률/회계', '부동산', '기타',
]

const linkedinSchema = z
  .string()
  .url('올바른 URL 형식이어야 합니다')
  .regex(/linkedin\.com\/in\//i, 'LinkedIn 프로필 URL이어야 합니다 (linkedin.com/in/...)')

interface ProfileData {
  name: string
  current_company: string
  title: string
  linkedin_url: string
  professional_fields: string[]
  years_of_experience: string
  bio: string
  industry: string
  location: string
}

// Weights must sum to 100
const FIELD_WEIGHTS: Record<keyof ProfileData, number> = {
  name: 10,
  current_company: 15,
  title: 15,
  linkedin_url: 20,
  professional_fields: 15,
  years_of_experience: 10,
  bio: 15,
  industry: 0,
  location: 0,
}

function calcCompletion(form: ProfileData): number {
  let total = 0
  if (form.name.trim()) total += FIELD_WEIGHTS.name
  if (form.current_company.trim()) total += FIELD_WEIGHTS.current_company
  if (form.title.trim()) total += FIELD_WEIGHTS.title
  if (form.linkedin_url.trim()) total += FIELD_WEIGHTS.linkedin_url
  if (form.professional_fields.length > 0) total += FIELD_WEIGHTS.professional_fields
  if (form.years_of_experience !== '') total += FIELD_WEIGHTS.years_of_experience
  if (form.bio.trim()) total += FIELD_WEIGHTS.bio
  return total
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileData, string>>>({})

  const [form, setForm] = useState<ProfileData>({
    name: '',
    current_company: '',
    title: '',
    linkedin_url: '',
    professional_fields: [],
    years_of_experience: '',
    bio: '',
    industry: '',
    location: '',
  })

  const completion = calcCompletion(form)

  // Check if profile is already complete — redirect to /directory if so
  useEffect(() => {
    async function checkProfile() {
      try {
        const res = await fetch('/api/directory/me')
        if (res.ok) {
          const { data } = await res.json()
          if (data?.name && data?.current_company && data?.title && data?.linkedin_url) {
            router.replace('/directory')
            return
          }
          // Pre-fill whatever is already there
          setForm((prev) => ({
            ...prev,
            name: data?.name ?? '',
            current_company: data?.current_company ?? '',
            title: data?.title ?? '',
            linkedin_url: data?.linkedin_url ?? '',
            professional_fields: data?.professional_fields ?? [],
            years_of_experience: data?.years_of_experience ? String(data.years_of_experience) : '',
            bio: data?.bio ?? '',
            industry: data?.industry ?? '',
            location: data?.location ?? '',
          }))
        }
      } catch {
        // ignore — unauthenticated users are handled by ProtectedPageWrapper
      } finally {
        setCheckingProfile(false)
      }
    }
    checkProfile()
  }, [router])

  function toggleField(field: string) {
    setForm((prev) => ({
      ...prev,
      professional_fields: prev.professional_fields.includes(field)
        ? prev.professional_fields.filter((f) => f !== field)
        : [...prev.professional_fields, field],
    }))
  }

  function validateStep1(): boolean {
    const errors: Partial<Record<keyof ProfileData, string>> = {}
    if (!form.name.trim()) errors.name = '이름을 입력해주세요'
    if (!form.current_company.trim()) errors.current_company = '현재 회사를 입력해주세요'
    if (!form.title.trim()) errors.title = '직함을 입력해주세요'
    if (!form.linkedin_url.trim()) {
      errors.linkedin_url = 'LinkedIn URL을 입력해주세요'
    } else {
      const result = linkedinSchema.safeParse(form.linkedin_url.trim())
      if (!result.success) errors.linkedin_url = result.error.issues[0].message
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleNextStep() {
    if (validateStep1()) {
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handlePrevStep() {
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateStep1()) { setStep(1); return }

    setLoading(true)
    setError(null)

    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        current_company: form.current_company.trim(),
        title: form.title.trim(),
        linkedin_url: form.linkedin_url.trim(),
        bio: form.bio || null,
        industry: form.industry || null,
        location: form.location || null,
        professional_fields: form.professional_fields,
        years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience, 10) : null,
      }

      const res = await fetch('/api/directory/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? '저장에 실패했습니다')
        setLoading(false)
        return
      }

      router.push('/directory')
    } catch {
      setError('네트워크 오류가 발생했습니다')
      setLoading(false)
    }
  }

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-[#f0ebe2] flex items-center justify-center">
        <p className="font-vcx-sans text-[14px] text-vcx-sub-4">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0ebe2] px-4 pt-12 pb-20">
      <div className="max-w-[560px] mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="vcx-label text-[#c9a84c] tracking-[0.2em] mb-2.5">
            Welcome
          </p>
          <h1 className="font-vcx-serif text-[26px] font-extrabold text-vcx-dark mb-2.5">
            프로필 완성하기
          </h1>
          <p className="font-vcx-sans text-[14px] text-vcx-sub-4 leading-relaxed">
            네트워크에 참여하기 전에 프로필을 완성해주세요
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-5 flex items-center justify-center gap-0">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => step === 2 && setStep(1)}
            className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0"
          >
            <div
              className={`w-7 h-7 flex items-center justify-center text-[12px] font-semibold font-vcx-sans border transition-all ${
                step === 1
                  ? 'bg-[#c9a84c] border-[#c9a84c] text-white'
                  : 'bg-[#c9a84c]/10 border-[#c9a84c] text-[#c9a84c]'
              }`}
            >
              {step === 2 ? <Check size={14} strokeWidth={2.5} /> : '1'}
            </div>
            <span
              className={`font-vcx-sans text-[12px] tracking-wide ${
                step === 1 ? 'text-[#c9a84c] font-semibold' : 'text-vcx-sub-4'
              }`}
            >
              필수 정보
            </span>
          </button>

          {/* Connector */}
          <div className="w-10 h-px bg-[#e0d9ce] mx-3" />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 flex items-center justify-center text-[12px] font-semibold font-vcx-sans border transition-all ${
                step === 2
                  ? 'bg-[#c9a84c] border-[#c9a84c] text-white'
                  : 'bg-white border-[#e0d9ce] text-vcx-sub-4'
              }`}
            >
              2
            </div>
            <span
              className={`font-vcx-sans text-[12px] tracking-wide ${
                step === 2 ? 'text-[#c9a84c] font-semibold' : 'text-vcx-sub-4'
              }`}
            >
              선택 정보
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-vcx-sans text-[11px] text-vcx-sub-4">프로필 완성도</span>
            <span className="font-vcx-sans text-[11px] font-semibold text-[#c9a84c]">{completion}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#e0d9ce]">
            <div
              className="h-full bg-[#c9a84c] transition-all duration-300"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#e0d9ce] px-6 py-7">
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                {/* Required section label */}
                <div className="mb-5">
                  <p className="vcx-label tracking-[0.12em] text-[#c9a84c] border-b border-[#e0d9ce] pb-2">
                    필수 정보
                  </p>
                </div>

                {/* Name */}
                <div className="mb-4">
                  <label className="vcx-label text-vcx-sub-4 block mb-1.5">이름 (실명) *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="홍길동"
                    className={`w-full px-3.5 py-3 font-vcx-sans text-[14px] text-vcx-dark bg-[#f7f3ed] border outline-none ${fieldErrors.name ? 'border-red-500' : 'border-black/[0.08]'} focus:border-[#c9a84c]`}
                  />
                  {fieldErrors.name && <p className="font-vcx-sans text-[12px] text-red-500 mt-1">{fieldErrors.name}</p>}
                </div>

                {/* Current company */}
                <div className="mb-4">
                  <label className="vcx-label text-vcx-sub-4 block mb-1.5">현재 회사 *</label>
                  <input
                    type="text"
                    value={form.current_company}
                    onChange={(e) => setForm((p) => ({ ...p, current_company: e.target.value }))}
                    placeholder="회사명"
                    className={`w-full px-3.5 py-3 font-vcx-sans text-[14px] text-vcx-dark bg-[#f7f3ed] border outline-none ${fieldErrors.current_company ? 'border-red-500' : 'border-black/[0.08]'} focus:border-[#c9a84c]`}
                  />
                  {fieldErrors.current_company && <p className="font-vcx-sans text-[12px] text-red-500 mt-1">{fieldErrors.current_company}</p>}
                </div>

                {/* Title */}
                <div className="mb-4">
                  <label className="vcx-label text-vcx-sub-4 block mb-1.5">직함 *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="예: Senior Software Engineer"
                    className={`w-full px-3.5 py-3 font-vcx-sans text-[14px] text-vcx-dark bg-[#f7f3ed] border outline-none ${fieldErrors.title ? 'border-red-500' : 'border-black/[0.08]'} focus:border-[#c9a84c]`}
                  />
                  {fieldErrors.title && <p className="font-vcx-sans text-[12px] text-red-500 mt-1">{fieldErrors.title}</p>}
                </div>

                {/* LinkedIn URL */}
                <div className="mb-7">
                  <label className="vcx-label text-vcx-sub-4 block mb-1.5">LinkedIn URL *</label>
                  <input
                    type="url"
                    value={form.linkedin_url}
                    onChange={(e) => setForm((p) => ({ ...p, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/your-profile"
                    className={`w-full px-3.5 py-3 font-vcx-sans text-[14px] text-vcx-dark bg-[#f7f3ed] border outline-none ${fieldErrors.linkedin_url ? 'border-red-500' : 'border-black/[0.08]'} focus:border-[#c9a84c]`}
                  />
                  {fieldErrors.linkedin_url && <p className="font-vcx-sans text-[12px] text-red-500 mt-1">{fieldErrors.linkedin_url}</p>}
                </div>

                {/* Next button */}
                <Button
                  type="button"
                  variant="gold"
                  onClick={handleNextStep}
                  className="w-full py-3.5 text-[14px] font-semibold"
                >
                  다음 — 선택 정보 입력
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                {/* Optional section label */}
                <div className="mb-5">
                  <p className="vcx-label tracking-[0.12em] text-vcx-sub-4 border-b border-[#e0d9ce] pb-2">
                    선택 정보
                  </p>
                </div>

                {/* Professional fields */}
                <div className="mb-4">
                  <label className="vcx-label text-vcx-sub-4 block mb-1.5">전문 분야</label>
                  <div className="flex flex-wrap gap-2">
                    {PROFESSIONAL_FIELDS.map((field) => {
                      const selected = form.professional_fields.includes(field)
                      return (
                        <button
                          key={field}
                          type="button"
                          onClick={() => toggleField(field)}
                          className={`px-3 py-1.5 font-vcx-sans text-[12px] border cursor-pointer transition-all ${
                            selected
                              ? 'border-[#c9a84c] bg-[#fdf9f2] text-[#c9a84c]'
                              : 'border-[#e0d9ce] bg-white text-[#666]'
                          }`}
                        >
                          {field}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Years of experience */}
                <div className="mb-4">
                  <label className="vcx-label text-vcx-sub-4 block mb-1.5">경력 (년)</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={form.years_of_experience}
                    onChange={(e) => setForm((p) => ({ ...p, years_of_experience: e.target.value }))}
                    placeholder="예: 8"
                    className="w-full px-3.5 py-3 font-vcx-sans text-[14px] text-vcx-dark bg-[#f7f3ed] border border-black/[0.08] outline-none focus:border-[#c9a84c]"
                  />
                </div>

                {/* Industry */}
                <div className="mb-4">
                  <label className="vcx-label text-vcx-sub-4 block mb-1.5">산업</label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
                    className="w-full px-3.5 py-3 font-vcx-sans text-[14px] text-vcx-dark bg-[#f7f3ed] border border-black/[0.08] outline-none focus:border-[#c9a84c]"
                  >
                    <option value="">선택 안 함</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="mb-4">
                  <label className="vcx-label text-vcx-sub-4 block mb-1.5">위치</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="예: 서울, 성남"
                    maxLength={100}
                    className="w-full px-3.5 py-3 font-vcx-sans text-[14px] text-vcx-dark bg-[#f7f3ed] border border-black/[0.08] outline-none focus:border-[#c9a84c]"
                  />
                </div>

                {/* Bio */}
                <div className="mb-7">
                  <label className="vcx-label text-vcx-sub-4 block mb-1.5">자기소개</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="자신을 소개해 주세요 (최대 1000자)"
                    maxLength={1000}
                    rows={4}
                    className="w-full px-3.5 py-3 font-vcx-sans text-[14px] text-vcx-dark bg-[#f7f3ed] border border-black/[0.08] outline-none focus:border-[#c9a84c] resize-vertical"
                  />
                  <p className="font-vcx-sans text-[11px] text-vcx-sub-5 mt-1 text-right">
                    {form.bio.length} / 1000
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-500/[0.08] border border-red-500/20 px-4 py-3 mb-4 font-vcx-sans text-[13px] text-red-500">
                    {error}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-none px-5 py-3.5 font-vcx-sans text-[13px] text-vcx-sub-4 bg-transparent border border-[#e0d9ce] cursor-pointer hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all"
                  >
                    이전
                  </button>
                  <Button
                    type="submit"
                    variant="gold"
                    disabled={loading}
                    className="flex-1 py-3.5 text-[14px] font-semibold"
                  >
                    {loading ? '저장 중...' : '프로필 완성하고 입장하기'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* 강제 온보딩 — 스킵 불가 (미들웨어에서 미완성 프로필 리다이렉트) */}
      </div>
    </div>
  )
}
