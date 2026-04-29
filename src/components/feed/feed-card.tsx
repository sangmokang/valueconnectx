'use client'

import {
  BarChart3,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Eye,
  MapPin,
  Users,
  X,
} from 'lucide-react'
import type { FeedItem } from '@/types'
import { cn } from '@/lib/utils'

export type { FeedItem }

interface FeedCardProps {
  item: FeedItem
  onInterest: (value: 'yes' | null) => void
  onSkip: () => void
  onDetail: () => void
}

export function FeedCard({ item, onInterest, onSkip, onDetail }: FeedCardProps) {
  const interested = item.user_response === 'yes'
  const companyInitial = item.company.trim().charAt(0) || 'V'
  const metaItems = [
    { icon: Users, label: '팀 규모', value: item.team_size },
    { icon: BriefcaseBusiness, label: '연봉 밴드', value: item.salary_band },
    { icon: MapPin, label: '위치', value: item.location },
    { icon: BarChart3, label: '레벨', value: item.level },
  ].filter((meta) => meta.value)

  return (
    <div
      data-testid="feed-card"
      className="border border-vcx-dark/10 bg-white transition-colors hover:border-vcx-dark/20"
    >
      <div className="grid gap-5 p-5 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-6 sm:p-6 lg:grid-cols-[44px_minmax(0,1fr)_142px]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-vcx-dark">
          <span className="font-vcx-serif text-[14px] font-bold text-vcx-gold">
            {companyInitial}
          </span>
        </div>

        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-vcx-serif text-[15px] font-bold text-vcx-dark">
              {item.company}
            </span>
            {item.company_tag && (
              <span className="font-vcx-sans text-[11.5px] text-vcx-sub-4">
                {item.company_tag}
              </span>
            )}
            {item.exclusive && (
              <span className="bg-vcx-dark px-2 py-0.5 font-vcx-sans text-[10px] font-bold tracking-[0.05em] text-vcx-gold">
                EXCLUSIVE
              </span>
            )}
          </div>

          <h3 className="mb-2 font-vcx-sans text-[16px] font-bold leading-6 text-vcx-dark">
            {item.role}
          </h3>

          {item.summary && (
            <p className="mb-4 font-vcx-sans text-[13.5px] leading-7 text-vcx-sub-2">
              {item.summary}
            </p>
          )}

          <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2">
            {metaItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-vcx-sub-4" aria-hidden="true" />
                <span className="font-vcx-sans text-[11.5px] text-vcx-sub-4">
                  {label}
                </span>
                <span className="font-vcx-sans text-[13px] font-semibold text-vcx-dark">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-vcx-dark/10 bg-vcx-beige-light px-2.5 py-1 font-vcx-sans text-[11.5px] text-vcx-sub-3"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-2 sm:col-start-2 sm:grid-cols-3 lg:col-start-auto lg:flex lg:flex-col lg:items-stretch">
          <button
            onClick={() => onInterest(interested ? null : 'yes')}
            className={cn(
              'inline-flex min-h-10 items-center justify-center gap-1.5 border px-4 py-2 font-vcx-sans text-[13px] font-bold transition-colors',
              interested
                ? 'border-vcx-gold bg-vcx-gold text-vcx-dark'
                : 'border-vcx-dark/15 bg-transparent text-vcx-sub-2 hover:border-vcx-gold hover:text-vcx-dark'
            )}
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            관심 있음
          </button>
          <button
            onClick={onSkip}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 border border-vcx-dark/10 bg-transparent px-4 py-2 font-vcx-sans text-[13px] text-vcx-sub-4 transition-colors hover:border-vcx-dark/20 hover:text-vcx-sub-2"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            관심 없음
          </button>
          <button
            onClick={onDetail}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 border border-transparent px-4 py-2 font-vcx-sans text-[12.5px] font-semibold text-vcx-gold transition-colors hover:border-vcx-gold/30"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            상세 보기
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
