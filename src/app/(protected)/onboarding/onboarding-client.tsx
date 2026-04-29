'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { linkedinUrlSchema } from '@/lib/validation/linkedin'
import { PROFESSIONAL_FIELDS } from '@/constants/profile'

interface ProfileSnapshot {
  name: string
  current_company: string
  title: string
  linkedin_url: string
  bio: string
  professional_fields: string[]
}

// 완성도 가중치 (합계 100)
const WEIGHTS = {
  name: 10,
  current_company: 15,
  title: 15,
  linkedin_url: 20,
  bio: 25,
  professional_fields: 15,
}

function calcCompletion(data: ProfileSnapshot): number {
  let total = 0
  if (data.name.trim()) total += WEIGHTS.name
  if (data.current_company.trim()) total += WEIGHTS.current_company
  if (data.title.trim()) total += WEIGHTS.title
  if (data.linkedin_url.trim()) total += WEIGHTS.linkedin_url
  if (data.bio.trim()) total += WEIGHTS.bio
  if (data.professional_fields.length > 0) total += WEIGHTS.professional_fields
  return total
}

export default function OnboardingPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileSnapshot, string>>>({})

  // 읽기 전용 — 초대 시 입력된 값
  const [readOnlyName, setReadOnlyName] = useState('')
  const [readOnlyLinkedin, setReadOnlyLinkedin] = useState('')

  const [form, setForm] = useState<ProfileSnapshot>({
    name: '',
    current_company: '',
    title: '',
    linkedin_url: '',
    bio: '',
    professional_fields: [],
  })

  // 완성도는 로딩 중에는 숨김 — 깜빡임 방지
  const completion = checkingProfile ? null : calcCompletion(form)

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
          const name = data?.name ?? ''
          const linkedin_url = data?.linkedin_url ?? ''
          setReadOnlyName(name)
          setReadOnlyLinkedin(linkedin_url)
          setForm({
            name,
            current_company: data?.current_company ?? '',
            title: data?.title ?? '',
            linkedin_url,
            bio: data?.bio ?? '',
            professional_fields: data?.professional_fields ?? [],
          })
        }
      } catch {
        // unauthenticated — ProtectedPageWrapper handles redirect
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

  function validate(): boolean {
    const errors: Partial<Record<keyof ProfileSnapshot, string>> = {}
    if (!form.current_company.trim()) errors.current_company = '현재 회사를 입력해주세요'
    if (!form.title.trim()) errors.title = '직함을 입력해주세요'
    if (!form.bio.trim()) errors.bio = '자기소개를 입력해주세요'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/directory/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim() || null,
          current_company: form.current_company.trim(),
          title: form.title.trim(),
          linkedin_url: form.linkedin_url.trim() || null,
          bio: form.bio.trim() || null,
          professional_fields: form.professional_fields,
        }),
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
        <div className="mb-10 text-center">
          <p className="vcx-label text-[#c9a84c] tracking-[0.2em] mb-3">
            WELCOME
          </p>
          <h1 className="font-vcx-serif text-[28px] font-extrabold text-vcx-dark mb-3 leading-tight">
            당신의 이야기를 들려주세요
          </h1>
          <p className="font-vcx-sans text-[14px] text-vcx-sub-4 leading-relaxed">
            ValueConnect X는 검증된 핵심 인재들의 커뮤니티입니다.<br />
            프로필을 완성하고 네트워크에 참여하세요.
          </p>
        </div>

        {/* Progress bar — only shown after load */}
        {completion !== null && (
          <div className="mb-8">
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
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── 섹션 1: 당신의 이야기 (필수) ── */}
          <div className="bg-white border border-[#e0d9ce] px-6 py-7">
            <div className="mb-5">
              <p className="vcx-label tracking-[0.12em] text-[#c9a84c] border-b border-[#e0d9ce] pb-2">
                당신의 이야기
              </p>
            </div>

            {/* 읽기 전용 카드 — 초대 시 입력됨 */}
            {(readOnlyName || readOnlyLinkedin) && (
              <div className="mb-5 bg-[#f7f3ed] border border-[#e0d9ce] px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {readOnlyName && (
                    <p className="font-vcx-serif text-[16px] font-bold text-vcx-dark leading-tight">
                      {readOnlyName}
                    </p>
                  )}
                  {readOnlyLinkedin && (
                    <a
                      href={readOnlyLinkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-vcx-sans text-[12px] text-[#c9a84c] hover:underline truncate block mt-0.5"
                    >
                      {readOnlyLinkedin}
                    </a>
                  )}
                </div>
                <a
                  href="/directory/me"
                  className="flex-none font-vcx-sans text-[11px] text-vcx-sub-4 underline whitespace-nowrap mt-0.5 hover:text-vcx-dark"
                >
                  수정
                </a>
              </div>
            )}

            {/* Bio — 한 문장 자기소개 */}
            <div>
              <label className="vcx-label text-vcx-sub-4 block mb-1.5">
                당신을 한 문장으로 소개해주세요 *
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => {
                  if (e.target.value.length <= 150) {
                    setForm((p) => ({ ...p, bio: e.target.value }))
                  }
                }}
                placeholder="예: 10년차 백엔드 엔지니어. 대규모 시스템 설계에 관심이 많습니다."
                rows={3}
                className={`w-full px-3.5 py-3 font-vcx-serif text-[15px] text-vcx-dark bg-[#f7f3ed] border outline-none focus:border-[#c9a84c] resize-none leading-relaxed ${
                  fieldErrors.bio ? 'border-red-500' : 'border-black/[0.08]'
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {fieldErrors.bio
                  ? <p className="font-vcx-sans text-[12px] text-red-500">{fieldErrors.bio}</p>
                  : <span />
                }
                <p className="font-vcx-sans text-[11px] text-vcx-sub-5 text-right">
                  {form.bio.length} / 150
                </p>
              </div>
            </div>
          </div>

          {/* ── 섹션 2: 현재 (필수) ── */}
          <div className="bg-white border border-[#e0d9ce] px-6 py-7">
            <div className="mb-5">
              <p className="vcx-label tracking-[0.12em] text-[#c9a84c] border-b border-[#e0d9ce] pb-2">
                현재
              </p>
            </div>

            {/* Current company */}
            <div className="mb-4">
              <label className="vcx-label text-vcx-sub-4 block mb-1.5">현재 회사 *</label>
              <input
                type="text"
                value={form.current_company}
                onChange={(e) => setForm((p) => ({ ...p, current_company: e.target.value }))}
                placeholder="회사명"
                className={`w-full px-3.5 py-3 font-vcx-sans text-[14px] text-vcx-dark bg-[#f7f3ed] border outline-none focus:border-[#c9a84c] ${
                  fieldErrors.current_company ? 'border-red-500' : 'border-black/[0.08]'
                }`}
              />
              {fieldErrors.current_company && (
                <p className="font-vcx-sans text-[12px] text-red-500 mt-1">{fieldErrors.current_company}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="vcx-label text-vcx-sub-4 block mb-1.5">직함 *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="예: Senior Software Engineer"
                className={`w-full px-3.5 py-3 font-vcx-sans text-[14px] text-vcx-dark bg-[#f7f3ed] border outline-none focus:border-[#c9a84c] ${
                  fieldErrors.title ? 'border-red-500' : 'border-black/[0.08]'
                }`}
              />
              {fieldErrors.title && (
                <p className="font-vcx-sans text-[12px] text-red-500 mt-1">{fieldErrors.title}</p>
              )}
            </div>
          </div>

          {/* ── 섹션 3: 관심 분야 (선택) ── */}
          <div className="bg-white border border-[#e0d9ce] px-6 py-7">
            <div className="mb-5">
              <p className="vcx-label tracking-[0.12em] text-vcx-sub-4 border-b border-[#e0d9ce] pb-2">
                관심 분야 <span className="text-[10px] font-normal normal-case tracking-normal ml-1">(선택)</span>
              </p>
            </div>

            <p className="font-vcx-sans text-[13px] text-vcx-sub-4 mb-3">
              어떤 분야의 기회를 보고 싶으신가요?
            </p>

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

          {/* Error */}
          {error && (
            <div className="bg-red-500/[0.08] border border-red-500/20 px-4 py-3 font-vcx-sans text-[13px] text-red-500">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="gold"
            disabled={loading}
            className="w-full py-4 text-[14px] font-semibold"
          >
            {loading ? '저장 중...' : '네트워크 입장하기'}
          </Button>
        </form>
      </div>
    </div>
  )
}
