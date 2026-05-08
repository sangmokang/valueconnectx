'use client'

import { useState } from 'react'

interface CeoApplyModalProps {
  session: {
    id: string
    company: string
    hostName: string
    hostTitle: string
  }
  onClose: () => void
  onSubmit: (sessionId: string, message: string) => Promise<void>
}

export function CeoApplyModal({ session, onClose, onSubmit }: CeoApplyModalProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      await onSubmit(session.id, message)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '신청에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/65 z-[300] flex items-center justify-center p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-[560px] relative"
      >
        {/* Gold top bar — linear-gradient retained as inline style (Tailwind cannot express) */}
        <div
          className="h-[3px]"
          style={{
            background: 'linear-gradient(90deg, var(--color-vcx-gold), #a8882d)',
          }}
        />

        <div className="px-9 py-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-6 bg-none border-none text-[20px] cursor-pointer text-vcx-sub-5 font-vcx-sans"
          >
            ✕
          </button>

          {/* Company · CEO */}
          <div className="font-vcx-sans text-[12px] text-vcx-sub-4 mb-1.5">
            {session.company} · {session.hostName} {session.hostTitle}
          </div>

          <h3 className="font-vcx-serif text-[20px] font-extrabold m-0 mb-2 text-vcx-dark">
            커피챗 신청
          </h3>

          {/* Privacy notice */}
          <div className="font-vcx-sans text-[13px] text-vcx-sub-4 mb-6 px-3.5 py-2.5 bg-vcx-gold/[0.06] border border-vcx-gold/15 leading-[1.6]">
            신청 내용은 CEO에게만 전달됩니다. 현 직장에는 일체 공개되지 않습니다.
          </div>

          {/* Message textarea */}
          <div className="mb-4">
            <label className="font-vcx-sans text-[11px] text-vcx-sub-4 font-semibold block mb-2 tracking-[0.05em]">
              어떤 이야기를 나누고 싶으신가요? (선택)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder={`${session.hostName} CEO와 어떤 대화를 나누고 싶으신지 자유롭게 적어주세요.`}
              className="font-vcx-sans w-full px-3.5 py-3 border border-black/10 text-[14px] resize-none outline-none leading-[1.75] box-border text-vcx-dark"
            />
          </div>

          {error && (
            <div className="font-vcx-sans text-[13px] text-vcx-error mb-3">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              disabled={loading}
              className={`font-vcx-sans flex-1 py-3 border border-black/10 bg-transparent text-[14px] text-vcx-dark ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`font-vcx-sans flex-[2] py-3 text-[14px] font-bold border-none ${loading ? 'bg-vcx-sub-3 cursor-not-allowed' : 'bg-vcx-dark cursor-pointer'}`}
              style={{ color: '#f5f0e8' }}
            >
              {loading ? '신청 중...' : '대화 신청하기 →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
