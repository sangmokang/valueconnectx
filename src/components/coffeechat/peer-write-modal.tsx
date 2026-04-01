'use client'

import { useState } from 'react'

interface PeerWriteModalProps {
  onClose: () => void
  onSubmit: (want: string, topic: string) => Promise<void>
}

export function PeerWriteModal({ onClose, onSubmit }: PeerWriteModalProps) {
  const [want, setWant] = useState('')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!want.trim() || !topic.trim()) return
    setLoading(true)
    setError(null)
    try {
      await onSubmit(want.trim(), topic.trim())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '사연 올리기에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-6"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white w-full max-w-[560px] relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gold top bar */}
          <div
            className="h-[3px]"
            style={{ background: 'linear-gradient(90deg, #c9a84c, #a07830)' }}
          />

          <div className="p-8 sm:p-9">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-6 text-[20px] text-[#aaa] hover:text-[#1a1a1a] transition-colors bg-none border-none cursor-pointer"
              aria-label="닫기"
            >
              ✕
            </button>

            <h3 className="font-vcx-serif text-[20px] font-extrabold text-[#1a1a1a] mb-6">
              커피챗 사연 올리기
            </h3>

            {/* Info box */}
            <div className="text-[13px] text-[#555] font-vcx-sans mb-5 px-4 py-3 bg-[#f5f0e8]">
              💡 사연을 올리면 멤버들이 신청을 보내옵니다. 당신이 직접 신청자를 선택합니다.
            </div>

            {/* Want input */}
            <div className="mb-4">
              <label className="block text-[11px] text-[#888] font-semibold font-vcx-sans mb-1.5">
                어떤 분을 찾으시나요?
              </label>
              <input
                value={want}
                onChange={(e) => setWant(e.target.value)}
                placeholder="예: 헬스케어 도메인 경험의 PM"
                className="w-full border border-black/12 px-3.5 py-2.5 text-[14px] font-vcx-sans text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]"
                disabled={loading}
              />
            </div>

            {/* Topic textarea */}
            <div className="mb-6">
              <label className="block text-[11px] text-[#888] font-semibold font-vcx-sans mb-1.5">
                이야기 나누고 싶은 주제
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="어떤 인사이트를 나누고 싶으신지 자유롭게..."
                rows={4}
                className="w-full border border-black/12 px-3.5 py-2.5 text-[14px] font-vcx-sans text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c] resize-none leading-[1.75]"
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-[13px] text-red-600 font-vcx-sans mb-4">{error}</p>
            )}

            {/* Buttons */}
            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 border border-black/12 bg-white text-[14px] font-vcx-sans text-[#1a1a1a] hover:bg-[#f5f0e8] transition-colors cursor-pointer disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !want.trim() || !topic.trim()}
                className="flex-[2] py-3 bg-[#1a1a1a] text-[#f5f0e8] text-[14px] font-bold font-vcx-sans hover:bg-[#333] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '올리는 중...' : '사연 올리기 →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
