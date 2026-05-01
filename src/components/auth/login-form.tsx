'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { trackEvent } from '@/lib/analytics'
import { sanitizeRedirect } from '@/lib/auth/routes'
import { DEV_QA_COOKIE, DEV_QA_EMAIL, isDevQaEmail } from '@/lib/auth/dev-qa'

type MagicLinkMode = 'login' | 'signup'

type MagicLinkFormProps = {
  mode: MagicLinkMode
  redirectTo?: string
}

const copy = {
  login: {
    label: '이메일',
    button: '로그인 링크 받기',
    loading: '링크 전송 중...',
    successTitle: '로그인 링크를 보냈습니다',
    successBody: '이메일의 링크를 열면 바로 로그인됩니다. 링크는 같은 브라우저에서 여는 것이 가장 안정적입니다.',
    error: '로그인 링크를 보내지 못했습니다. 이메일 주소를 확인하고 다시 시도해주세요.',
    method: 'magic_link',
    fallback: '/directory',
  },
  signup: {
    label: '초대받은 이메일',
    button: '가입 링크 받기',
    loading: '가입 링크 전송 중...',
    successTitle: '가입 링크를 보냈습니다',
    successBody: '이메일의 링크를 열면 계정 확인이 완료됩니다. 이후 프로필을 완성하면 멤버 네트워크에 참여할 수 있습니다.',
    error: '가입 링크를 보내지 못했습니다. 초대받은 이메일 주소인지 확인해주세요.',
    method: 'magic_link',
    fallback: '/onboarding',
  },
} as const

function buildCallbackUrl(mode: MagicLinkMode, redirectTo?: string) {
  const next = sanitizeRedirect(redirectTo, copy[mode].fallback)
  const callbackUrl = new URL('/auth/callback', window.location.origin)
  callbackUrl.searchParams.set('next', next)
  callbackUrl.searchParams.set('type', mode)
  return callbackUrl.toString()
}

function MagicLinkForm({ mode, redirectTo }: MagicLinkFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const text = copy[mode]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = name.trim()

    if (mode === 'signup' && !normalizedName) {
      setError('이름을 입력해주세요.')
      setLoading(false)
      return
    }

    try {
      if (mode === 'login' && process.env.NODE_ENV !== 'production' && isDevQaEmail(normalizedEmail)) {
        document.cookie = `${DEV_QA_COOKIE}=${DEV_QA_EMAIL}; path=/; max-age=86400; samesite=lax`
        trackEvent('user_login', { method: 'dev_qa' })
        router.push(sanitizeRedirect(redirectTo))
        router.refresh()
        return
      }

      const supabase = createClient()
      const options = mode === 'signup'
        ? {
            emailRedirectTo: buildCallbackUrl(mode, redirectTo),
            shouldCreateUser: true,
            data: { name: normalizedName },
          }
        : {
            emailRedirectTo: buildCallbackUrl(mode, redirectTo),
            shouldCreateUser: false,
          }

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options,
      })

      if (signInError) {
        setError(text.error)
        setLoading(false)
        return
      }

      trackEvent(mode === 'signup' ? 'user_signup' : 'user_login', { method: text.method })
      setSentEmail(normalizedEmail)
    } catch {
      setError('요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      setLoading(false)
    }
  }

  if (sentEmail) {
    return (
      <div className="text-center" aria-live="polite">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center border border-vcx-emerald text-vcx-emerald">
          @
        </div>
        <h2 className="mb-2 font-vcx-sans text-[20px] font-bold leading-tight text-vcx-text">
          {text.successTitle}
        </h2>
        <p className="mb-2 break-words font-vcx-sans text-[15px] font-semibold text-vcx-emerald">
          {sentEmail}
        </p>
        <p className="mb-7 font-vcx-sans text-[14px] leading-[1.7] text-vcx-soft">
          {text.successBody}
        </p>
        <button
          type="button"
          onClick={() => {
            setSentEmail(null)
            setLoading(false)
          }}
          className="w-full border border-vcx-border bg-vcx-surface px-4 py-[14px] font-vcx-sans text-[15px] font-semibold text-vcx-emerald transition-colors hover:border-vcx-emerald"
        >
          다른 이메일로 받기
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="border border-vcx-danger/45 bg-vcx-danger/10 px-4 py-3 font-vcx-sans text-[14px] text-[#fd9c9f]">
          {error}
        </div>
      )}
      {mode === 'signup' && (
        <div>
          <label htmlFor="signup-name" className="vcx-label mb-2 block text-vcx-soft">
            이름
          </label>
          <input
            id="signup-name"
            aria-label="이름"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            required
            autoComplete="name"
            className="w-full border border-vcx-border bg-vcx-abyss px-4 py-[15px] font-vcx-sans text-[16px] text-vcx-text outline-none transition-colors placeholder:text-vcx-muted focus:border-vcx-emerald"
          />
        </div>
      )}
      <div>
        <label htmlFor={`${mode}-email`} className="vcx-label mb-2 block text-vcx-soft">
          {text.label}
        </label>
        <input
          id={`${mode}-email`}
          aria-label="이메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          required
          autoComplete="email"
          className="w-full border border-vcx-border bg-vcx-abyss px-4 py-[15px] font-vcx-sans text-[16px] text-vcx-text outline-none transition-colors placeholder:text-vcx-muted focus:border-vcx-emerald"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full border border-vcx-border bg-vcx-surface px-4 py-[15px] font-vcx-sans text-[16px] font-bold text-vcx-emerald transition-colors hover:border-vcx-emerald disabled:cursor-not-allowed disabled:text-vcx-muted"
      >
        {loading ? text.loading : text.button}
      </button>
    </form>
  )
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  return <MagicLinkForm mode="login" redirectTo={redirectTo} />
}

export function SignupForm({ redirectTo }: { redirectTo?: string }) {
  return <MagicLinkForm mode="signup" redirectTo={redirectTo} />
}
