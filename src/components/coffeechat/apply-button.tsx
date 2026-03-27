'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ApplyModal } from './apply-modal'
import { trackEvent } from '@/lib/analytics'

interface ApplyButtonProps {
  sessionId: string
  sessionTitle: string
  sessionStatus: string
  hasApplied: boolean
  applicationStatus?: 'pending' | 'accepted' | 'rejected' | null
  hostContactEmail?: string | null
}

export function ApplyButton({ sessionId, sessionTitle, sessionStatus, hasApplied, applicationStatus, hostContactEmail }: ApplyButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [applied, setApplied] = useState(hasApplied)
  const router = useRouter()

  function handleSuccess() {
    setApplied(true)
    setModalOpen(false)
    trackEvent('coffeechat_applied', { session_id: sessionId, session_title: sessionTitle, type: 'ceo' })
    router.refresh()
  }

  const isOpen = sessionStatus === 'open'

  return (
    <>
      <div className="border border-[#1a1a1a] bg-white p-5">
        <p className="vcx-section-label mb-3">커피챗 신청</p>

        {applied ? (
          <div className="text-center py-3">
            <span className="vcx-label px-3 py-1.5 border border-[#c9a84c] text-[#c9a84c]">
              {applicationStatus === 'accepted' ? '수락됨' : applicationStatus === 'rejected' ? '거절됨' : '신청 완료'}
            </span>
            {applicationStatus === 'accepted' && hostContactEmail ? (
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-[#c9a84c]">📧</span>
                <a href={`mailto:${hostContactEmail}`} className="text-[13px] font-vcx-sans text-[#1a1a1a] underline">
                  {hostContactEmail}
                </a>
              </div>
            ) : (
              <p className="text-[12px] font-vcx-sans text-vcx-sub-4 mt-3">
                {applicationStatus === 'rejected' ? '이번에는 아쉽게도 거절되었습니다' : '호스트의 검토를 기다리고 있습니다'}
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
        <ApplyModal
          sessionId={sessionId}
          sessionTitle={sessionTitle}
          onClose={() => setModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
