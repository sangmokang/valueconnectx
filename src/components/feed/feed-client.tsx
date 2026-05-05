'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { InterestSelector } from './interest-selector'
import { FeedCard, type FeedItem } from './feed-card'
import { FeedDetailModal } from './feed-detail-modal'
import { NewsletterBar } from './newsletter-bar'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(json.error ?? '요청에 실패했습니다')
  }
  return json
}

export function FeedClient() {
  const [selectedChipsOverride, setSelectedChipsOverride] = useState<string[] | null>(null)
  const [showDetail, setShowDetail] = useState<FeedItem | null>(null)
  const [interestError, setInterestError] = useState('')
  const [responseError, setResponseError] = useState('')

  const {
    data: interestsData,
    error: interestsLoadError,
    mutate: mutateInterests,
  } = useSWR<{ chips: string[] }>(
    '/api/feed/interests',
    fetcher
  )
  const selectedChips = selectedChipsOverride ?? interestsData?.chips ?? []
  const feedReady = selectedChipsOverride !== null || interestsData !== undefined || interestsLoadError
  const feedKey = feedReady
    ? selectedChips.length > 0
      ? `/api/feed?limit=10&tags=${encodeURIComponent(selectedChips.join(','))}`
      : '/api/feed?limit=10'
    : null

  const { data, error, mutate } = useSWR<{ data: FeedItem[]; total: number }>(
    feedKey,
    fetcher
  )

  const items: FeedItem[] = data?.data ?? []
  const visibleItems = items.filter((i) => i.user_response !== 'skip')
  const hotLineItems = visibleItems.filter((i) => i.exclusive)
  const regularItems = visibleItems.filter((i) => !i.exclusive)
  const interestedCount = items.filter((i) => i.user_response === 'yes').length

  useEffect(() => {
    if (data !== undefined) {
      trackEvent('feed_viewed', { item_count: items.length })
    }
  // 최초 데이터 로드 1회만 발화
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data !== undefined])

  const handleChipsChange = useCallback(
    async (chips: string[]) => {
      setInterestError('')
      setResponseError('')
      setSelectedChipsOverride(chips)
      mutateInterests({ chips }, { revalidate: false })
      trackEvent('interests_saved', { chips, count: chips.length })

      try {
        const response = await fetch('/api/feed/interests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chips }),
        })
        if (!response.ok) throw new Error('관심 분야 저장 실패')
        await mutate()
      } catch (err) {
        console.error('관심 분야 저장 오류:', err)
        setInterestError('관심 분야를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.')
      }
    },
    [mutate, mutateInterests]
  )

  const handleResponse = useCallback(
    async (itemId: string, response: 'yes' | 'skip' | null) => {
      setResponseError('')
      const item = data?.data.find((i) => i.id === itemId)
      const previousData = data

      if (item) {
        if (response === 'yes') {
          trackEvent('feed_interested', { item_id: itemId, role: item.role, company: item.company })
        } else if (response === 'skip') {
          trackEvent('feed_skipped', { item_id: itemId, role: item.role, company: item.company })
        }
      }

      // 낙관적 업데이트
      mutate(
        (prev) => {
          if (!prev) return prev
          return {
            ...prev,
            data: prev.data.map((item) =>
              item.id === itemId ? { ...item, user_response: response } : item
            ),
          }
        },
        { revalidate: false }
      )

      // 모달 내 아이템 업데이트
      setShowDetail((prev) =>
        prev && prev.id === itemId ? { ...prev, user_response: response } : prev
      )

      if (response === null) {
        try {
          const result = await fetch(`/api/feed/${itemId}/response`, { method: 'DELETE' })
          if (!result.ok) throw new Error('반응 삭제 실패')
        } catch (err) {
          console.error('피드 반응 삭제 오류:', err)
          setResponseError('선택을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.')
          mutate(previousData, { revalidate: false })
        }
        return
      }

      try {
        const result = await fetch(`/api/feed/${itemId}/response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response }),
        })
        if (!result.ok) throw new Error('반응 저장 실패')
      } catch (err) {
        console.error('피드 반응 저장 오류:', err)
        setResponseError('선택을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.')
        mutate(previousData, { revalidate: false })
      }
    },
    [mutate, data]
  )

  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <InterestSelector
        selectedChips={selectedChips}
        onChange={handleChipsChange}
      />

      <section className="mx-auto max-w-[1000px] px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:pb-20">
        {interestError && (
          <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 font-vcx-sans text-[13px] text-red-700">
            {interestError}
          </div>
        )}
        {interestsLoadError && !interestError && (
          <NoticeBanner tone="warning">
            관심 분야를 불러오지 못했습니다. 우선 전체 큐레이션을 보여드립니다.
          </NoticeBanner>
        )}
        {responseError && (
          <NoticeBanner tone="error">
            {responseError}
          </NoticeBanner>
        )}

        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1.5 font-vcx-sans text-[12px] font-semibold text-vcx-sub-4">
              채용 기회 · {today} 기준
            </div>
            <h2 className="font-vcx-serif text-[22px] font-bold text-vcx-dark">
              이번 주 큐레이션 {visibleItems.length}건
            </h2>
          </div>
          {interestedCount > 0 && (
            <div className="border border-vcx-gold/30 bg-vcx-gold/10 px-4 py-2 font-vcx-sans text-[13px] font-semibold text-vcx-dark">
              관심 포지션 {interestedCount}건
            </div>
          )}
        </div>

        <NewsletterBar />

        {!feedReady ? (
          <EmptyState
            icon="loading"
            title="피드를 준비하는 중입니다"
            description="관심 분야를 먼저 확인하고 있습니다."
          />
        ) : error ? (
          <EmptyState
            title="피드를 불러오지 못했습니다"
            description="잠시 후 다시 시도해주세요."
          />
        ) : data === undefined ? (
          <EmptyState
            icon="loading"
            title="피드를 불러오는 중입니다"
            description="이번 주 큐레이션을 확인하고 있습니다."
          />
        ) : (
          <>
            {hotLineItems.length > 0 && (
              <div className="mb-8">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="inline-block h-2.5 w-2.5 animate-pulse bg-red-500" />
                  <span className="font-vcx-sans text-[13px] font-bold tracking-[0.08em] text-red-600">
                    HOT LINE
                  </span>
                  <span className="font-vcx-sans text-[12px] text-vcx-sub-4">
                    — CEO가 직접 등록한 긴급 채용 공고
                  </span>
                </div>
                <div className="grid gap-3 border-l-2 border-red-500 pl-4">
                  {hotLineItems.map((item) => (
                    <FeedCard
                      key={item.id}
                      item={item}
                      onInterest={(value) => handleResponse(item.id, value)}
                      onSkip={() => handleResponse(item.id, 'skip')}
                      onDetail={() => {
                        trackEvent('feed_item_click', {
                          item_id: item.id,
                          role: item.role,
                          company: item.company,
                          surface: 'card_detail',
                        })
                        trackEvent('feed_detail_opened', { item_id: item.id, role: item.role, company: item.company })
                        setShowDetail(item)
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {regularItems.length > 0 ? (
              <div className="grid gap-4">
                {regularItems.map((item) => (
                  <FeedCard
                    key={item.id}
                    item={item}
                    onInterest={(value) => handleResponse(item.id, value)}
                    onSkip={() => handleResponse(item.id, 'skip')}
                    onDetail={() => {
                      trackEvent('feed_item_click', {
                        item_id: item.id,
                        role: item.role,
                        company: item.company,
                        surface: 'card_detail',
                      })
                      trackEvent('feed_detail_opened', { item_id: item.id, role: item.role, company: item.company })
                      setShowDetail(item)
                    }}
                  />
                ))}
              </div>
            ) : hotLineItems.length === 0 ? (
              <EmptyState
                title={
                  items.length === 0
                    ? '이번 주 큐레이션이 준비 중입니다'
                    : '이번 주 피드를 모두 확인했습니다'
                }
                description={
                  items.length === 0
                    ? '매주 월요일에 새로운 포지션이 도착합니다.'
                    : '다음 주 월요일에 새로운 포지션이 도착합니다.'
                }
              />
            ) : null}
          </>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 bg-vcx-beige-dark px-5 py-4">
          <span className="inline-flex items-center gap-1.5 font-vcx-sans text-[12px] font-semibold text-vcx-sub-3">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            피드 안내
          </span>
          <span className="font-vcx-sans text-[12px] text-vcx-sub-4">
            관심 있음 — 다음 추천을 더 정교하게 만드는 신호로 활용됩니다
          </span>
          <span className="font-vcx-sans text-[12px] text-vcx-sub-4">
            관심 없음 — 이 유형의 포지션 비중이 줄어듭니다
          </span>
        </div>
      </section>

      {showDetail && (
        <FeedDetailModal
          item={showDetail}
          onClose={() => setShowDetail(null)}
          onInterest={(value) => handleResponse(showDetail.id, value)}
          onSkip={() => handleResponse(showDetail.id, 'skip')}
        />
      )}
    </>
  )
}

function NoticeBanner({
  tone,
  children,
}: {
  tone: 'warning' | 'error'
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'mb-5 flex items-start gap-2 border px-4 py-3 font-vcx-sans text-[13px]',
        tone === 'warning'
          ? 'border-vcx-gold/30 bg-vcx-gold/10 text-vcx-dark'
          : 'border-red-200 bg-red-50 text-red-700'
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}

function EmptyState({
  title,
  description,
  icon = 'check',
}: {
  title: string
  description: string
  icon?: 'check' | 'loading'
}) {
  return (
    <div className="border border-vcx-dark/10 bg-white px-5 py-16 text-center">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center border border-vcx-dark/10 bg-vcx-beige-light text-vcx-gold">
        {icon === 'loading' ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        )}
      </div>
      <div className="mb-2 font-vcx-serif text-[17px] font-bold text-vcx-dark">
        {title}
      </div>
      <div className="font-vcx-sans text-[14px] text-vcx-sub-4">
        {description}
      </div>
    </div>
  )
}
