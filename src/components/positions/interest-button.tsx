'use client'

import { useState, useTransition } from 'react'
import { trackEvent } from '@/lib/analytics'

type InterestType = 'interested' | 'not_interested' | 'bookmark'

interface InterestButtonProps {
  positionId: string
  initialInterest: InterestType | null
}

const INTEREST_OPTIONS: { type: InterestType; label: string }[] = [
  { type: 'interested', label: '관심 있음' },
  { type: 'bookmark', label: '나중에 보기' },
  { type: 'not_interested', label: '관심 없음' },
]

export function InterestButton({ positionId, initialInterest }: InterestButtonProps) {
  const [current, setCurrent] = useState<InterestType | null>(initialInterest)
  const [isPending, startTransition] = useTransition()

  const handleClick = (type: InterestType) => {
    startTransition(async () => {
      if (current === type) {
        // Toggle off
        const res = await fetch(`/api/positions/${positionId}/interest`, { method: 'DELETE' })
        if (res.ok) {
          setCurrent(null)
          trackEvent('position_interested', { position_id: positionId, interest_type: null })
        }
      } else {
        // Set interest
        const res = await fetch(`/api/positions/${positionId}/interest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interest_type: type }),
        })
        if (res.ok) {
          setCurrent(type)
          trackEvent('position_interested', { position_id: positionId, interest_type: type })
        }
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
                ? 'bg-vcx-dark text-vcx-gold border-vcx-dark'
                : 'bg-white text-vcx-sub-3 border-vcx-dark/10 hover:border-vcx-sub-4'
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
