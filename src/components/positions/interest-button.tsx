'use client'

import { useState, useTransition } from 'react'

type InterestType = 'interested' | 'not_interested' | 'bookmark'

interface InterestButtonProps {
  positionId: string
  initialInterest: InterestType | null
}

const INTEREST_OPTIONS: { type: InterestType; label: string; activeColor: string }[] = [
  { type: 'interested', label: '관심 있음', activeColor: '#c9a84c' },
  { type: 'bookmark', label: '나중에 보기', activeColor: '#4a7cc9' },
  { type: 'not_interested', label: '관심 없음', activeColor: '#888888' },
]

export function InterestButton({ positionId, initialInterest }: InterestButtonProps) {
  const [current, setCurrent] = useState<InterestType | null>(initialInterest)
  const [isPending, startTransition] = useTransition()

  const handleClick = (type: InterestType) => {
    startTransition(async () => {
      if (current === type) {
        // Toggle off
        const res = await fetch(`/api/positions/${positionId}/interest`, { method: 'DELETE' })
        if (res.ok) setCurrent(null)
      } else {
        // Set interest
        const res = await fetch(`/api/positions/${positionId}/interest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interest_type: type }),
        })
        if (res.ok) setCurrent(type)
      }
    })
  }

  return (
    <div className="flex gap-0 flex-wrap">
      {INTEREST_OPTIONS.map((opt) => {
        const isActive = current === opt.type
        return (
          <button
            key={opt.type}
            type="button"
            disabled={isPending}
            onClick={() => handleClick(opt.type)}
            className={`px-3 py-1.5 text-xs font-vcx-sans border transition-colors disabled:opacity-50 ${
              isActive
                ? 'bg-[#1a1a1a] text-[#c9a84c] border-[#1a1a1a]'
                : 'bg-white text-[#666666] border-[#e0d9ce] hover:border-[#888888]'
            }`}
            style={{ borderRadius: 0 }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
