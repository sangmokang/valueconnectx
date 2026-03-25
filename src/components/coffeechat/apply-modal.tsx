'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ApplyModalProps {
  sessionId: string
  sessionTitle: string
  onClose: () => void
  onSuccess: () => void
}

export function ApplyModal({ sessionId, sessionTitle, onClose, onSuccess }: ApplyModalProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/ceo-coffeechat/${sessionId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '신청에 실패했습니다')
        return
      }
      onSuccess()
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal — bottom sheet on mobile, centered on sm+ */}
      <div
        className="fixed z-50 bg-white border border-[#1a1a1a]
          bottom-0 inset-x-0
          sm:inset-0 sm:m-auto sm:max-w-lg sm:h-fit"
        role="dialog"
        aria-modal="true"
        aria-label="커피챗 신청"
      >
        <div className="p-5 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="vcx-section-label mb-1">비밀 신청하기</p>
              <h2 className="font-vcx-serif text-[20px] text-vcx-dark leading-tight">{sessionTitle}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-vcx-sub-4 hover:text-vcx-dark transition-colors p-1"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          <div className="bg-[#f7f3ed] border border-[#e8e2d9] p-4 mb-5">
            <p className="text-[12px] font-vcx-sans text-vcx-sub-3">
              이 신청은 다른 멤버에게 공개되지 않습니다. 호스트만 신청 내용을 확인할 수 있습니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="vcx-label text-vcx-sub-3 block mb-2">
                신청 메시지 (선택)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="간단한 자기소개나 신청 이유를 적어주세요"
                maxLength={1000}
                rows={3}
                className="w-full border border-[#1a1a1a] bg-white px-4 py-3 text-[14px] font-vcx-sans text-vcx-dark placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c] resize-none"
                disabled={loading}
              />
              <p className="text-[11px] text-vcx-sub-5 text-right mt-1">{message.length}/1000</p>
            </div>

            {error && (
              <p className="text-[13px] text-red-600 font-vcx-sans">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="gold"
                disabled={loading}
                className="flex-1"
              >
                {loading ? '신청 중...' : '신청하기'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
