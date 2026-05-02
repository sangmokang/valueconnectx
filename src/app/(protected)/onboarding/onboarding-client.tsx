'use client'

import { useState, useEffect, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  CURATION_INTEREST_TAGS,
  INTEREST_TAG_LIMIT,
  normalizeInterestTag,
} from '@/constants/profile'

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
  const [fieldInput, setFieldInput] = useState('')

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
          if (data?.name && data?.current_company && data?.title && data?.linkedin_url && data?.bio) {
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

  function addField(rawField: string) {
    const field = normalizeInterestTag(rawField)
    if (!field) return
    setForm((prev) => ({
      ...prev,
      professional_fields: prev.professional_fields.includes(field) || prev.professional_fields.length >= INTEREST_TAG_LIMIT
        ? prev.professional_fields
        : [...prev.professional_fields, field],
    }))
    setFieldInput('')
  }

  function removeField(field: string) {
    setForm((prev) => ({
      ...prev,
      professional_fields: prev.professional_fields.filter((f) => f !== field),
    }))
  }

  function handleFieldKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' && e.key !== ',') return
    e.preventDefault()
    addField(fieldInput)
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof ProfileSnapshot, string>> = {}
    if (!form.name.trim()) errors.name = '이름을 입력해주세요'
    if (!form.linkedin_url.trim()) errors.linkedin_url = 'LinkedIn URL을 입력해주세요'
    if (!form.current_company.trim()) errors.current_company = '현재 회사를 입력해주세요'
    if (!form.title.trim()) errors.title = '직함을 입력해주세요'
    if (!form.bio.trim()) errors.bio = '자기소개를 입력해주세요'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function syncFeedInterests(chips: string[]) {
    try {
      await fetch('/api/feed/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chips }),
      })
    } catch {
      // 온보딩 완료는 유지하고, 프로필/피드 진입 시 다시 동기화한다.
    }
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
          name: form.name.trim(),
          current_company: form.current_company.trim(),
          title: form.title.trim(),
          linkedin_url: form.linkedin_url.trim(),
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

      await syncFeedInterests(form.professional_fields)
      router.push('/directory')
    } catch {
      setError('네트워크 오류가 발생했습니다')
      setLoading(false)
    }
  }

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-vcx-beige flex items-center justify-center">
        <p className="font-vcx-sans text-[14px] text-vcx-sub-4">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-vcx-beige px-4 pt-12 pb-20">
      <div className="max-w-[560px] mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <p className="vcx-label text-vcx-gold tracking-[0.2em] mb-3">
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
              <span className="font-vcx-sans text-[11px] font-semibold text-vcx-gold">{completion}%</span>
            </div>
            <div className="w-full h-1.5 bg-vcx-beige-dark">
              <div
                className="h-full bg-vcx-gold transition-all duration-300"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── 섹션 1: 당신의 이야기 (필수) ── */}
          <div className="bg-white border border-vcx-beige-dark px-6 py-7">
            <div className="mb-5">
              <p className="vcx-label tracking-[0.12em] text-vcx-gold border-b border-vcx-beige-dark pb-2">
                당신의 이야기
              </p>
            </div>

            {/* 읽기 전용 카드 — 초대 시 입력됨 */}
            {(readOnlyName || readOnlyLinkedin) && (
              <div className="mb-5 bg-vcx-beige-light border border-vcx-beige-dark px-4 py-3">
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
                      className="font-vcx-sans text-[12px] text-vcx-gold hover:underline truncate block mt-0.5"
                    >
                      {readOnlyLinkedin}
                    </a>
                  )}
                </div>
              </div>
            )}

            {!readOnlyName && (
              <div className="mb-4">
                <label className="vcx-label text-vcx-sub-4 block mb-1.5">이름 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="예: 김가치"
                  className={`w-full px-3.5 py-3 font-vcx-sans text-[14px] text-vcx-dark bg-vcx-beige-light border outline-none focus:border-vcx-gold ${
                    fieldErrors.name ? 'border-red-500' : 'border-black/[0.08]'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="font-vcx-sans text-[12px] text-red-500 mt-1">{fieldErrors.name}</p>
                )}
              </div>
            )}

            {!readOnlyLinkedin && (
              <div className="mb-4">
                <label className="vcx-label text-vcx-sub-4 block mb-1.5">LinkedIn URL *</label>
                <input
                  type="url"
                  value={form.linkedin_url}
                  onChange={(e) => setForm((p) => ({ ...p, linkedin_url: e.target.value }))}
                  placeholder="https://www.linkedin.com/in/yourprofile"
                  className={`w-full px-3.5 py-3 font-vcx-sans text-[14px] text-vcx-dark bg-vcx-beige-light border outline-none focus:border-vcx-gold ${
                    fieldErrors.linkedin_url ? 'border-red-500' : 'border-black/[0.08]'
                  }`}
                />
                {fieldErrors.linkedin_url && (
                  <p className="font-vcx-sans text-[12px] text-red-500 mt-1">{fieldErrors.linkedin_url}</p>
                )}
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
                className={`w-full px-3.5 py-3 font-vcx-serif text-[15px] text-vcx-dark bg-vcx-beige-light border outline-none focus:border-vcx-gold resize-none leading-relaxed ${
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
          <div className="bg-white border border-vcx-beige-dark px-6 py-7">
            <div className="mb-5">
              <p className="vcx-label tracking-[0.12em] text-vcx-gold border-b border-vcx-beige-dark pb-2">
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
                className={`w-full px-3.5 py-3 font-vcx-sans text-[14px] text-vcx-dark bg-vcx-beige-light border outline-none focus:border-vcx-gold ${
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
                placeholder="예: 시니어 백엔드 엔지니어"
                className={`w-full px-3.5 py-3 font-vcx-sans text-[14px] text-vcx-dark bg-vcx-beige-light border outline-none focus:border-vcx-gold ${
                  fieldErrors.title ? 'border-red-500' : 'border-black/[0.08]'
                }`}
              />
              {fieldErrors.title && (
                <p className="font-vcx-sans text-[12px] text-red-500 mt-1">{fieldErrors.title}</p>
              )}
            </div>
          </div>

          {/* ── 섹션 3: 관심 분야 (선택) ── */}
          <div className="bg-white border border-vcx-beige-dark px-6 py-7">
            <div className="mb-5">
              <p className="vcx-label tracking-[0.12em] text-vcx-sub-4 border-b border-vcx-beige-dark pb-2">
                관심 분야 <span className="text-[10px] font-normal normal-case tracking-normal ml-1">(선택)</span>
              </p>
            </div>

            <p className="font-vcx-sans text-[13px] text-vcx-sub-4 mb-3">
              보고 싶은 기회와 연결 주제를 자유롭게 태그로 남겨주세요.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={fieldInput}
                onChange={(e) => setFieldInput(e.target.value)}
                onKeyDown={handleFieldKeyDown}
                placeholder="예: B2B 소프트웨어, 조직문화, 글로벌 채용"
                className="min-w-0 flex-1 px-3.5 py-3 font-vcx-sans text-[14px] text-vcx-dark bg-vcx-beige-light border border-black/[0.08] outline-none focus:border-vcx-gold"
              />
              <button
                type="button"
                onClick={() => addField(fieldInput)}
                disabled={form.professional_fields.length >= 10}
                className="px-4 py-3 font-vcx-sans text-[12px] font-semibold bg-vcx-dark text-vcx-beige disabled:opacity-40"
              >
                추가
              </button>
            </div>
            <p className="font-vcx-sans text-[11px] text-vcx-sub-5 mt-1">
              Enter 또는 쉼표로 추가할 수 있습니다. 최대 {INTEREST_TAG_LIMIT}개까지 저장됩니다.
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              {CURATION_INTEREST_TAGS.filter((field) => !form.professional_fields.includes(field)).map((field) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => addField(field)}
                  className="px-3 py-1.5 font-vcx-sans text-[12px] border border-vcx-beige-dark bg-white text-vcx-sub-3 hover:border-vcx-gold hover:text-vcx-gold transition-colors"
                >
                  + {field}
                </button>
              ))}
            </div>

            {form.professional_fields.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {form.professional_fields.map((field) => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => removeField(field)}
                    className="px-3 py-1.5 font-vcx-sans text-[12px] border border-vcx-gold bg-[#fdf9f2] text-vcx-gold transition-colors"
                    aria-label={`${field} 태그 제거`}
                  >
                    {field} ×
                  </button>
                ))}
              </div>
            )}
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
