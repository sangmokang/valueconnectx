'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'
import { linkedinUrlSchema } from '@/lib/validation/linkedin'

const INDUSTRIES = [
  'IT/소프트웨어',
  '금융/핀테크',
  '컨설팅',
  '마케팅/광고',
  '의료/헬스케어',
  '교육',
  '제조/하드웨어',
  '스타트업',
  '미디어/콘텐츠',
  '법률/회계',
  '부동산',
  '기타',
]

interface ProfileEditFormProps {
  initialData: {
    bio: string | null
    industry: string | null
    location: string | null
    is_open_to_chat: boolean
    profile_visibility: 'members_only' | 'corporate_only' | 'all'
    professional_fields: string[]
    linkedin_url: string | null
  }
}

export function ProfileEditForm({ initialData }: ProfileEditFormProps) {
  const [bio, setBio] = useState(initialData.bio ?? '')
  const [industry, setIndustry] = useState(initialData.industry ?? '')
  const [location, setLocation] = useState(initialData.location ?? '')
  const [isOpenToChat, setIsOpenToChat] = useState(initialData.is_open_to_chat)
  const [profileVisibility, setProfileVisibility] = useState(initialData.profile_visibility)
  const [fieldsInput, setFieldsInput] = useState(initialData.professional_fields.join(', '))
  const [linkedinUrl, setLinkedinUrl] = useState(initialData.linkedin_url ?? '')
  const [linkedinError, setLinkedinError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setLinkedinError(null)

    const linkedinResult = linkedinUrlSchema.safeParse(linkedinUrl)
    if (!linkedinResult.success) {
      setLinkedinError(linkedinResult.error.issues[0]?.message ?? 'LinkedIn URL이 올바르지 않습니다')
      setLoading(false)
      return
    }

    const professional_fields = fieldsInput
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean)

    try {
      const res = await fetch('/api/directory/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: bio || null,
          industry: industry || null,
          location: location || null,
          is_open_to_chat: isOpenToChat,
          profile_visibility: profileVisibility,
          professional_fields,
          linkedin_url: linkedinResult.data,
        }),
      })

      if (res.ok) {
        trackEvent('profile_updated', { fields_updated: ['bio', 'industry', 'location', 'is_open_to_chat', 'profile_visibility', 'professional_fields', 'linkedin_url'] })
        setMessage({ type: 'success', text: '프로필이 저장되었습니다.' })
      } else {
        const json = await res.json()
        setMessage({ type: 'error', text: json.error ?? '저장에 실패했습니다.' })
      }
    } catch {
      setMessage({ type: 'error', text: '네트워크 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 text-sm font-vcx-sans bg-[#f7f3ed] border border-[#e0d9ce] text-[#1a1a1a] placeholder-[#999999] outline-none focus:border-[#c9a84c]'
  const labelClass = 'vcx-section-label block mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* LinkedIn URL */}
      <div>
        <label className={labelClass}>LinkedIn URL *</label>
        <input
          type="url"
          value={linkedinUrl}
          onChange={(e) => {
            setLinkedinUrl(e.target.value)
            setLinkedinError(null)
          }}
          placeholder="https://www.linkedin.com/in/yourprofile"
          className={`${inputClass} ${linkedinError ? 'border-red-400' : ''}`}
          style={{ borderRadius: 0 }}
          disabled={loading}
        />
        {linkedinError && (
          <p className="text-xs font-vcx-sans text-red-500 mt-1">{linkedinError}</p>
        )}
        <p className="text-xs font-vcx-sans text-[#999999] mt-1">linkedin.com/in/ 형식의 URL을 입력하세요 (필수)</p>
      </div>

      {/* Bio */}
      <div>
        <label className={labelClass}>소개</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="자신을 소개해 주세요 (최대 1000자)"
          maxLength={1000}
          rows={5}
          className={inputClass}
          style={{ borderRadius: 0, resize: 'vertical' }}
        />
        <p className="text-xs font-vcx-sans text-[#999999] mt-1 text-right">{bio.length} / 1000</p>
      </div>

      {/* Professional fields */}
      <div>
        <label className={labelClass}>전문 분야</label>
        <input
          type="text"
          value={fieldsInput}
          onChange={(e) => setFieldsInput(e.target.value)}
          placeholder="예: Product, Engineering, Finance (쉼표로 구분)"
          className={inputClass}
          style={{ borderRadius: 0 }}
        />
        <p className="text-xs font-vcx-sans text-[#999999] mt-1">쉼표(,)로 구분하여 입력하세요</p>
      </div>

      {/* Industry */}
      <div>
        <label className={labelClass}>업종</label>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className={inputClass}
          style={{ borderRadius: 0 }}
        >
          <option value="">선택 안 함</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label className={labelClass}>위치</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="예: 서울, 성남"
          maxLength={100}
          className={inputClass}
          style={{ borderRadius: 0 }}
        />
      </div>

      {/* Open to chat */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isOpenToChat}
          onClick={() => setIsOpenToChat((v) => !v)}
          className={`w-10 h-5 relative transition-colors flex-shrink-0 ${
            isOpenToChat ? 'bg-[#c9a84c]' : 'bg-[#e0d9ce]'
          }`}
          style={{ borderRadius: 0 }}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 bg-white transition-transform ${
              isOpenToChat ? 'translate-x-5' : 'translate-x-0.5'
            }`}
            style={{ borderRadius: 0 }}
          />
        </button>
        <div>
          <p className="text-sm font-vcx-sans text-[#1a1a1a] font-medium">커피챗 가능</p>
          <p className="text-xs font-vcx-sans text-[#999999]">다른 멤버들이 커피챗 요청을 할 수 있습니다</p>
        </div>
      </div>

      {/* Profile visibility */}
      <div>
        <label className={labelClass}>프로필 공개 범위</label>
        <div className="space-y-2">
          {[
            { value: 'members_only', label: '멤버 전용', desc: 'VCX 멤버에게만 공개' },
            { value: 'corporate_only', label: '기업 회원 전용', desc: '기업 회원에게만 공개' },
            { value: 'all', label: '전체 공개', desc: '모든 사용자에게 공개' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                profileVisibility === opt.value
                  ? 'border-[#c9a84c] bg-[#fdf9f2]'
                  : 'border-[#e0d9ce] bg-white hover:border-[#888888]'
              }`}
              style={{ borderRadius: 0 }}
            >
              <input
                type="radio"
                name="profile_visibility"
                value={opt.value}
                checked={profileVisibility === opt.value}
                onChange={() => setProfileVisibility(opt.value as typeof profileVisibility)}
                className="mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-vcx-sans text-[#1a1a1a] font-medium">{opt.label}</p>
                <p className="text-xs font-vcx-sans text-[#999999]">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 text-sm font-vcx-sans ${
            message.type === 'success'
              ? 'bg-[#f0fdf4] border border-[#86efac] text-[#166534]'
              : 'bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b]'
          }`}
          style={{ borderRadius: 0 }}
        >
          {message.text}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 text-sm font-vcx-sans font-medium transition-colors ${
          loading
            ? 'bg-[#888888] text-white cursor-not-allowed'
            : 'bg-[#1a1a1a] text-[#c9a84c] hover:bg-[#333333]'
        }`}
        style={{ borderRadius: 0 }}
      >
        {loading ? '저장 중...' : '프로필 저장'}
      </button>
    </form>
  )
}
