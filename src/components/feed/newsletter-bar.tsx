'use client'

import { useState, type FormEvent } from 'react'
import { Check, Mail, Send } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

interface NewsletterBarProps {
  defaultEmail?: string
}

export function NewsletterBar({ defaultEmail = '' }: NewsletterBarProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setError('이메일 주소를 입력해주세요.')
      return
    }

    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/feed/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      })
      const json = await res.json().catch(() => ({}))

      if (res.ok) {
        setSubscribed(true)
        setEmail(trimmedEmail)
        trackEvent('newsletter_subscribed', {})
        return
      }

      setError(json.error ?? '구독을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.')
    } catch (err) {
      console.error('구독 오류:', err)
      setError('네트워크 연결을 확인한 뒤 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  if (subscribed) {
    return (
      <div className="mb-8 flex items-start gap-3 border border-vcx-gold/30 bg-vcx-gold/10 px-5 py-4">
        <Check className="mt-0.5 h-4 w-4 text-vcx-gold" aria-hidden="true" />
        <div>
          <span className="font-vcx-sans text-[13.5px] font-bold text-vcx-dark">
            구독 완료.
          </span>
          <span className="ml-1.5 font-vcx-sans text-[13.5px] text-vcx-sub-3">
            {email} 으로 매주 월요일 발송됩니다.
          </span>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubscribe}
      className="mb-8 grid gap-4 bg-vcx-dark px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6"
    >
      <div className="flex min-w-0 gap-3">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-vcx-gold" aria-hidden="true" />
        <div>
          <div className="mb-1 font-vcx-sans text-[13px] font-bold text-vcx-beige">
            매주 이메일로 받아보기
          </div>
          <div className="font-vcx-sans text-[12.5px] text-vcx-sub-4">
            선택한 관심 분야의 포지션을 매주 월요일 발송합니다
          </div>
        </div>
      </div>
      <div className="grid gap-2 sm:flex">
        <div>
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            type="email"
            placeholder="이메일 주소"
            aria-label="뉴스레터 이메일 주소"
            className="min-h-10 w-full border border-white/15 bg-white/10 px-3.5 py-2 font-vcx-sans text-[13.5px] text-vcx-beige outline-none placeholder:text-vcx-sub-4 focus:border-vcx-gold sm:w-[220px]"
          />
          {error && (
            <p className="mt-2 font-vcx-sans text-[12px] text-red-300">
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-10 items-center justify-center gap-2 bg-vcx-gold px-5 py-2 font-vcx-sans text-[13.5px] font-bold text-vcx-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          {loading ? '저장 중' : '구독 시작'}
        </button>
      </div>
    </form>
  )
}
