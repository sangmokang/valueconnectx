'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface PeerApplyButtonProps {
  chatId: string
  chatTitle: string
  chatStatus: string
  hasApplied: boolean
  applicationStatus?: 'pending' | 'accepted' | 'rejected' | null
  authorContactEmail?: string | null
}

export function PeerApplyButton({ chatId, chatTitle, chatStatus, hasApplied, applicationStatus, authorContactEmail }: PeerApplyButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [applied, setApplied] = useState(hasApplied)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const isOpen = chatStatus === 'open'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/peer-coffeechat/${chatId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '신청에 실패했습니다')
        return
      }
      setApplied(true)
      setModalOpen(false)
      router.refresh()
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="border border-[#1a1a1a] bg-white p-5">
        <p className="vcx-section-label mb-3">커피챗 신청</p>

        {applied ? (
          <div className="text-center py-3">
            <span className="vcx-label px-3 py-1.5 border border-[#c9a84c] text-[#c9a84c]">
              {applicationStatus === 'accepted' ? '수락됨' : applicationStatus === 'rejected' ? '거절됨' : '신청 완료'}
            </span>
            {applicationStatus === 'accepted' && authorContactEmail ? (
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-[#c9a84c]">📧</span>
                <a href={`mailto:${authorContactEmail}`} className="text-[13px] font-vcx-sans text-[#1a1a1a] underline">
                  {authorContactEmail}
                </a>
              </div>
            ) : (
              <p className="text-[12px] font-vcx-sans text-vcx-sub-4 mt-3">
                {applicationStatus === 'rejected' ? '이번에는 아쉽게도 거절되었습니다' : '작성자의 검토를 기다리고 있습니다'}
              </p>
            )}
          </div>
        ) : !isOpen ? (
          <div className="text-center py-3">
            <span className="vcx-label px-3 py-1.5 border border-[#999] text-vcx-sub-4">
              신청 마감
            </span>
          </div>
        ) : (
          <>
            <p className="text-[12px] font-vcx-sans text-vcx-sub-4 mb-4">
              이 신청은 다른 멤버에게 공개되지 않습니다
            </p>
            <Button
              variant="gold"
              className="w-full"
              onClick={() => setModalOpen(true)}
            >
              비밀 신청하기
            </Button>
          </>
        )}
      </div>

      {modalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setModalOpen(false)}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed z-50 bg-white border border-[#1a1a1a]
              bottom-0 inset-x-0
              sm:inset-0 sm:m-auto sm:max-w-lg sm:h-fit"
            role="dialog"
            aria-modal="true"
            aria-label="커피챗 신청"
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="vcx-section-label mb-1">비밀 신청하기</p>
                  <h2 className="font-vcx-serif text-[20px] text-vcx-dark leading-tight">{chatTitle}</h2>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-vcx-sub-4 hover:text-vcx-dark transition-colors p-1"
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>

              <div className="bg-[#f7f3ed] border border-[#e8e2d9] p-4 mb-5">
                <p className="text-[12px] font-vcx-sans text-vcx-sub-3">
                  이 신청은 다른 멤버에게 공개되지 않습니다. 작성자만 신청 내용을 확인할 수 있으며, 수락 시 연락처가 공개됩니다.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="vcx-label text-vcx-sub-3 block mb-2">
                    신청 메시지 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="간단한 자기소개나 신청 이유를 적어주세요"
                    maxLength={1000}
                    rows={4}
                    required
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
                    onClick={() => setModalOpen(false)}
                    disabled={loading}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    variant="gold"
                    disabled={loading || !message.trim()}
                    className="flex-1"
                  >
                    {loading ? '신청 중...' : '신청하기'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  )
}
