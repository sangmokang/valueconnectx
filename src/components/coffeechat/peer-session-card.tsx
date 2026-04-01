'use client'

import { useState } from 'react'
import type { PeerSession } from '@/types'

export type { PeerSession }

interface PeerSessionCardProps {
  session: PeerSession
  isApplied: boolean
  onApply: (id: string) => void
}

export function PeerSessionCard({ session, isApplied, onApply }: PeerSessionCardProps) {
  const [hovered, setHovered] = useState(false)
  const isOpen = session.status === 'open'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-white p-6 sm:p-7 transition-all duration-200"
      style={{
        border: `1px solid ${hovered ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.08)'}`,
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.05)' : 'none',
      }}
    >
      <div className="flex gap-5 items-start">
        {/* Left: content */}
        <div className="flex-1 min-w-0">
          {/* Badge + role + date */}
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <span
              className="text-[11px] px-2 py-0.5 font-bold tracking-[0.05em] font-vcx-sans"
              style={{
                background: session.authorBadge === 'Core' ? '#1a1a1a' : '#f5f0e8',
                color: session.authorBadge === 'Core' ? '#c9a84c' : '#777',
              }}
            >
              {session.authorBadge}
            </span>
            <span className="text-[13px] text-[#1a1a1a] font-semibold font-vcx-sans">
              {session.role}
            </span>
            <span className="text-[12px] text-[#888] font-vcx-sans">{session.posted}</span>
          </div>

          {/* Want */}
          <div className="text-[12px] text-[#888] mb-2 font-vcx-sans">
            <span className="font-bold text-[#1a1a1a]">찾는 분:</span> {session.want}
          </div>

          {/* Topic quote */}
          <p className="text-[14px] text-[#555] leading-[1.8] mb-4 italic font-vcx-serif">
            &ldquo;{session.topic}&rdquo;
          </p>

          {/* Tags */}
          <div className="flex gap-1.5 flex-wrap">
            {session.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11.5px] px-2.5 py-0.5 bg-[#f5f0e8] border border-black/8 text-[#777] font-vcx-sans rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right: action */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          {isApplied ? (
            <div className="px-4 py-2 text-[13px] font-bold font-vcx-sans text-[#16a34a] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)]">
              ✓ 신청 완료
            </div>
          ) : isOpen ? (
            <button
              onClick={() => onApply(session.id)}
              className="px-5 py-2.5 bg-[#1a1a1a] text-[#f5f0e8] text-[13.5px] font-bold font-vcx-sans hover:bg-[#333] transition-colors"
            >
              신청하기 →
            </button>
          ) : (
            <div className="px-4 py-2 text-[13px] font-vcx-sans text-[#999] border border-[#ddd]">
              마감
            </div>
          )}
          <span className="text-[12px] text-[#888] font-vcx-sans">{session.applicants}명 신청중</span>
        </div>
      </div>
    </div>
  )
}
