'use client'

import { useEffect } from 'react'
import {
  BarChart3,
  BriefcaseBusiness,
  Check,
  MapPin,
  Users,
  X,
} from 'lucide-react'
import type { FeedItem } from './feed-card'
import { cn } from '@/lib/utils'

interface FeedDetailModalProps {
  item: FeedItem
  onClose: () => void
  onInterest: (value: 'yes' | null) => void
  onSkip: () => void
}

export function FeedDetailModal({ item, onClose, onInterest, onSkip }: FeedDetailModalProps) {
  const interested = item.user_response === 'yes'

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])
  const metaItems = [
    { label: '팀 규모', value: item.team_size, icon: Users },
    { label: '연봉 밴드', value: item.salary_band, icon: BriefcaseBusiness },
    { label: '위치', value: item.location, icon: MapPin },
    { label: '레벨', value: item.level, icon: BarChart3 },
  ].filter((meta) => meta.value)

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/65 p-4 sm:p-6"
      role="presentation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-[640px] overflow-auto bg-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feed-detail-title"
      >
        <div className="h-[3px] bg-vcx-gold" />
        <div className="p-5 sm:p-8">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center text-vcx-sub-4 hover:text-vcx-dark"
            aria-label="상세 보기 닫기"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          {item.exclusive && (
            <div className="mb-4 inline-flex bg-vcx-dark px-2.5 py-1 font-vcx-sans text-[10px] font-bold tracking-[0.1em] text-vcx-gold">
              EXCLUSIVE
            </div>
          )}

          <div className="mb-1.5 pr-10 font-vcx-sans text-[12px] text-vcx-sub-4">
            {item.company}
            {item.company_tag ? ` · ${item.company_tag}` : ''}
          </div>

          <h2
            id="feed-detail-title"
            className="mb-6 pr-10 font-vcx-serif text-[24px] font-bold leading-tight text-vcx-dark"
          >
            {item.role}
          </h2>

          <div className="mb-7 grid gap-3 bg-vcx-beige-light p-5 sm:grid-cols-2">
            {metaItems.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex gap-3">
                <Icon className="mt-1 h-4 w-4 shrink-0 text-vcx-gold" aria-hidden="true" />
                <div>
                  <div className="mb-1 font-vcx-sans text-[11px] font-semibold text-vcx-sub-4">
                    {label}
                  </div>
                  <div className="font-vcx-sans text-[14px] font-bold text-vcx-dark">
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {item.summary && (
            <p className="mb-7 font-vcx-sans text-[14.5px] leading-8 text-vcx-sub-2">
              {item.summary}
            </p>
          )}

          <div className="grid gap-2 border-t border-vcx-dark/10 pt-6 sm:grid-cols-[2fr_1fr]">
            <button
              onClick={() => onInterest(interested ? null : 'yes')}
              className={cn(
                'inline-flex min-h-12 items-center justify-center gap-2 px-4 py-3 font-vcx-sans text-[14px] font-bold',
                interested
                  ? 'bg-vcx-gold text-vcx-dark'
                  : 'bg-vcx-dark text-vcx-beige hover:bg-vcx-gold hover:text-vcx-dark'
              )}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {interested ? '관심 취소' : '관심 있음'}
            </button>
            <button
              onClick={() => {
                onSkip()
                onClose()
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-vcx-dark/15 bg-transparent px-4 py-3 font-vcx-sans text-[14px] text-vcx-sub-4 hover:text-vcx-dark"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              관심 없음
            </button>
          </div>

          <div className="mt-5 border border-vcx-gold/25 bg-vcx-gold/10 px-4 py-3">
            <div className="font-vcx-sans text-[12px] leading-6 text-vcx-dark">
              관심 있음을 클릭하면 ValueConnect 헤드헌터가 직접 연락드립니다.
              이 정보는 채용 목적으로만 사용됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
