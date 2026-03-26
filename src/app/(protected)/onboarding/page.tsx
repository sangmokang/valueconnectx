'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

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

export default function OnboardingPage() {
  const router = useRouter()
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

  function validate(): boolean {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '14px',
    color: '#1a1a1a',
    background: '#f7f3ed',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 0,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#888',
    marginBottom: '6px',
  }

  const fieldErrorStyle: React.CSSProperties = {
    fontFamily: 'system-ui, sans-serif',
    fontSize: '12px',
    color: '#EF4444',
    marginTop: '4px',
  }

  if (checkingProfile) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0ebe2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#888888' }}>로딩 중...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0ebe2', padding: '48px 16px 80px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: '10px' }}>
            Welcome
          </p>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: 800, color: '#1a1a1a', marginBottom: '10px' }}>
            프로필 완성하기
          </h1>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#888888', lineHeight: 1.6 }}>
            네트워크에 참여하기 전에 프로필을 완성해주세요
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e0d9ce', padding: '28px 24px' }}>
          <form onSubmit={handleSubmit}>
            {/* Required section label */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c9a84c', borderBottom: '1px solid #e0d9ce', paddingBottom: '8px' }}>
                필수 정보
              </p>
            </div>

            {/* Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>이름 (실명) *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="홍길동"
                style={{ ...inputStyle, borderColor: fieldErrors.name ? '#EF4444' : 'rgba(0,0,0,0.08)' }}
              />
              {fieldErrors.name && <p style={fieldErrorStyle}>{fieldErrors.name}</p>}
            </div>

            {/* Current company */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>현재 회사 *</label>
              <input
                type="text"
                value={form.current_company}
                onChange={(e) => setForm((p) => ({ ...p, current_company: e.target.value }))}
                placeholder="회사명"
                style={{ ...inputStyle, borderColor: fieldErrors.current_company ? '#EF4444' : 'rgba(0,0,0,0.08)' }}
              />
              {fieldErrors.current_company && <p style={fieldErrorStyle}>{fieldErrors.current_company}</p>}
            </div>

            {/* Title */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>직함 *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="예: Senior Software Engineer"
                style={{ ...inputStyle, borderColor: fieldErrors.title ? '#EF4444' : 'rgba(0,0,0,0.08)' }}
              />
              {fieldErrors.title && <p style={fieldErrorStyle}>{fieldErrors.title}</p>}
            </div>

            {/* LinkedIn URL */}
            <div style={{ marginBottom: '28px' }}>
              <label style={labelStyle}>LinkedIn URL *</label>
              <input
                type="url"
                value={form.linkedin_url}
                onChange={(e) => setForm((p) => ({ ...p, linkedin_url: e.target.value }))}
                placeholder="https://linkedin.com/in/your-profile"
                style={{ ...inputStyle, borderColor: fieldErrors.linkedin_url ? '#EF4444' : 'rgba(0,0,0,0.08)' }}
              />
              {fieldErrors.linkedin_url && <p style={fieldErrorStyle}>{fieldErrors.linkedin_url}</p>}
            </div>

            {/* Optional section label */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888888', borderBottom: '1px solid #e0d9ce', paddingBottom: '8px' }}>
                선택 정보
              </p>
            </div>

            {/* Professional fields */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>전문 분야</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PROFESSIONAL_FIELDS.map((field) => {
                  const selected = form.professional_fields.includes(field)
                  return (
                    <button
                      key={field}
                      type="button"
                      onClick={() => toggleField(field)}
                      style={{
                        padding: '6px 12px',
                        fontFamily: 'system-ui, sans-serif',
                        fontSize: '12px',
                        border: '1px solid',
                        borderColor: selected ? '#c9a84c' : '#e0d9ce',
                        background: selected ? '#fdf9f2' : '#ffffff',
                        color: selected ? '#c9a84c' : '#666666',
                        cursor: 'pointer',
                        borderRadius: 0,
                        transition: 'all 0.15s',
                      }}
                    >
                      {field}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Years of experience */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>경력 (년)</label>
              <input
                type="number"
                min={0}
                max={50}
                value={form.years_of_experience}
                onChange={(e) => setForm((p) => ({ ...p, years_of_experience: e.target.value }))}
                placeholder="예: 8"
                style={inputStyle}
              />
            </div>

            {/* Industry */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>산업</label>
              <select
                value={form.industry}
                onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
                style={inputStyle}
              >
                <option value="">선택 안 함</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>위치</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                placeholder="예: 서울, 성남"
                maxLength={100}
                style={inputStyle}
              />
            </div>

            {/* Bio */}
            <div style={{ marginBottom: '28px' }}>
              <label style={labelStyle}>자기소개</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="자신을 소개해 주세요 (최대 1000자)"
                maxLength={1000}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#999999', marginTop: '4px', textAlign: 'right' }}>
                {form.bio.length} / 1000
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px 16px', marginBottom: '16px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#EF4444', borderRadius: 0 }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#f0ebe2',
                background: loading ? '#444444' : '#1a1a1a',
                border: 'none',
                borderRadius: 0,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '저장 중...' : '프로필 완성하고 입장하기'}
            </button>
          </form>
        </div>

        {/* Skip link */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => router.push('/directory')}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '12px',
              color: '#aaaaaa',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            나중에 작성하기
          </button>
        </div>
      </div>
    </div>
  )
}
