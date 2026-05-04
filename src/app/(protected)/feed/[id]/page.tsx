'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  Check,
  ExternalLink,
  Globe,
  MapPin,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'
import type { FeedItem } from '@/types'

interface FeedItemWithCount extends FeedItem {
  interest_count: number
}

export default function FeedDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { id } = params

  const [item, setItem] = useState<FeedItemWithCount | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/feed/${id}`)
        if (!res.ok) {
          if (!cancelled) setNotFound(true)
          return
        }
        const json = await res.json()
        if (!cancelled) {
          setItem(json.data)
          trackEvent('feed_detail_opened', {
            item_id: json.data.id,
            role: json.data.role,
            company: json.data.company,
          })
        }
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const handleInterest = useCallback(async () => {
    if (!item) return
    const isInterested = item.user_response === 'yes'
    const next = isInterested ? null : 'yes'

    setItem((prev) => prev ? { ...prev, user_response: next } : prev)

    if (next === null) {
      try {
        await fetch(`/api/feed/${id}/response`, { method: 'DELETE' })
      } catch {
        setItem((prev) => prev ? { ...prev, user_response: 'yes' } : prev)
      }
    } else {
      try {
        await fetch(`/api/feed/${id}/response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response: 'yes' }),
        })
        trackEvent('feed_interested', {
          item_id: item.id,
          role: item.role,
          company: item.company,
        })
      } catch {
        setItem((prev) => prev ? { ...prev, user_response: null } : prev)
      }
    }
  }, [id, item])

  const handleSkip = useCallback(async () => {
    if (!item) return
    setItem((prev) => prev ? { ...prev, user_response: 'skip' } : prev)
    try {
      await fetch(`/api/feed/${id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: 'skip' }),
      })
      trackEvent('feed_skipped', {
        item_id: item.id,
        role: item.role,
        company: item.company,
      })
    } catch {
      setItem((prev) => prev ? { ...prev, user_response: null } : prev)
    }
  }, [id, item])

  if (loading) {
    return (
      <div className="mx-auto max-w-[700px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="font-vcx-sans text-[14px] text-vcx-sub-4">불러오는 중...</div>
      </div>
    )
  }

  if (notFound || !item) {
    return (
      <div className="mx-auto max-w-[700px] px-5 py-8 sm:px-8 sm:py-12">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 font-vcx-sans text-[13px] text-vcx-sub-4 hover:text-vcx-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          피드로 돌아가기
        </button>
        <div className="font-vcx-sans text-[14px] text-vcx-sub-3">찾을 수 없습니다</div>
      </div>
    )
  }

  const interested = item.user_response === 'yes'
  const isNews = item.item_type === 'news'
  const interest_count = item.interest_count

  const metaItems = isNews
    ? [{ icon: Globe, label: '출처', value: item.source_name }].filter((m) => m.value)
    : [
        { icon: Users, label: '팀 규모', value: item.team_size },
        { icon: BriefcaseBusiness, label: '연봉 밴드', value: item.salary_band },
        { icon: MapPin, label: '위치', value: item.location },
        { icon: BarChart3, label: '레벨', value: item.level },
      ].filter((m) => m.value)

  return (
    <div className="mx-auto max-w-[700px] px-5 py-8 sm:px-8 sm:py-12">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 font-vcx-sans text-[13px] text-vcx-sub-4 hover:text-vcx-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        피드로 돌아가기
      </button>

      {isNews ? (
        <span className="mb-3 inline-block bg-vcx-dark px-2.5 py-1 font-vcx-sans text-[10px] font-bold tracking-[0.1em] text-vcx-gold">
          NEWS
        </span>
      ) : item.exclusive ? (
        <span className="mb-3 inline-block bg-vcx-dark px-2.5 py-1 font-vcx-sans text-[10px] font-bold tracking-[0.1em] text-vcx-gold">
          EXCLUSIVE
        </span>
      ) : null}

      <div className="mb-1.5 font-vcx-sans text-[13px] text-vcx-sub-4">
        {item.company}
        {item.company_tag ? ` · ${item.company_tag}` : ''}
      </div>

      <h1 className="mb-6 font-vcx-serif text-[26px] font-bold leading-tight text-vcx-dark sm:text-[30px]">
        {item.role}
      </h1>

      {interest_count > 0 && (
        <div className="mb-5 font-vcx-sans text-[13px] text-vcx-sub-3">
          멤버 {interest_count}명이 관심 있음
        </div>
      )}

      {metaItems.length > 0 && (
        <div className="mb-7 grid gap-3 bg-vcx-beige-light p-5 sm:grid-cols-2">
          {metaItems.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-vcx-sub-4" aria-hidden="true" />
              <span className="font-vcx-sans text-[12px] text-vcx-sub-4">{label}</span>
              <span className="font-vcx-sans text-[13px] font-semibold text-vcx-dark">
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {item.summary && (
        <p className="mb-8 font-vcx-sans text-[15px] leading-8 text-vcx-sub-2">
          {item.summary}
        </p>
      )}

      {item.tags && item.tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-1.5">
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

      {isNews && item.source_url && (
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 flex items-center gap-2 font-vcx-sans text-[13px] font-semibold text-vcx-sub-3 hover:text-vcx-dark"
        >
          <Globe className="h-4 w-4" />
          원문 보기 — {item.source_name}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      <div className="grid gap-2 border-t border-vcx-dark/10 pt-6 sm:grid-cols-[2fr_1fr]">
        <button
          onClick={handleInterest}
          className={cn(
            'inline-flex min-h-12 items-center justify-center gap-2 px-4 py-3 font-vcx-sans text-[14px] font-bold',
            interested
              ? 'bg-vcx-gold text-vcx-dark'
              : 'bg-vcx-dark text-vcx-beige hover:bg-vcx-gold hover:text-vcx-dark'
          )}
        >
          <Check className="h-4 w-4" />
          {interested ? '관심 취소' : '관심 있음'}
        </button>
        <button
          onClick={handleSkip}
          className="inline-flex min-h-12 items-center justify-center gap-2 border border-vcx-dark/15 bg-transparent px-4 py-3 font-vcx-sans text-[14px] text-vcx-sub-4 hover:text-vcx-dark"
        >
          <X className="h-4 w-4" />
          관심 없음
        </button>
      </div>

      <div className="mt-5 border border-vcx-gold/25 bg-vcx-gold/10 px-4 py-3">
        <div className="font-vcx-sans text-[12px] leading-6 text-vcx-dark">
          관심 있음을 클릭하면 ValueConnect 헤드헌터가 직접 연락드립니다.
        </div>
      </div>
    </div>
  )
}
