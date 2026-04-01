'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { InterestSelector } from './interest-selector'
import { FeedCard, type FeedItem } from './feed-card'
import { FeedDetailModal } from './feed-detail-modal'
import { NewsletterBar } from './newsletter-bar'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function FeedClient() {
  const [selectedChips, setSelectedChips] = useState<string[]>([])
  const [showDetail, setShowDetail] = useState<FeedItem | null>(null)

  const { data, mutate } = useSWR<{ data: FeedItem[]; total: number }>(
    '/api/feed',
    fetcher
  )

  const items: FeedItem[] = data?.data ?? []
  const visibleItems = items.filter((i) => i.user_response !== 'skip')
  const interestedCount = items.filter((i) => i.user_response === 'yes').length

  const handleChipsChange = useCallback(
    async (chips: string[]) => {
      setSelectedChips(chips)
      try {
        await fetch('/api/feed/interests', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chips }),
        })
      } catch (err) {
        console.error('관심 분야 저장 오류:', err)
      }
    },
    []
  )

  const handleResponse = useCallback(
    async (itemId: string, response: 'yes' | 'skip' | null) => {
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
        // 반응 제거는 별도 엔드포인트 없으므로 로컬 상태만 처리
        return
      }

      try {
        await fetch(`/api/feed/${itemId}/response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response }),
        })
      } catch (err) {
        console.error('피드 반응 저장 오류:', err)
        mutate()
      }
    },
    [mutate]
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

      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          padding: '48px 48px 80px',
        }}
      >
        {/* 피드 헤더 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 28,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: '#888',
                letterSpacing: '0.15em',
                fontWeight: 600,
                marginBottom: 6,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              THIS WEEK&#39;S FEED · {today} 기준
            </div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: '#1a1a1a',
                margin: 0,
                fontFamily: 'Georgia, serif',
              }}
            >
              이번 주 큐레이션 {visibleItems.length}건
            </h2>
          </div>
          {interestedCount > 0 && (
            <div
              style={{
                padding: '8px 16px',
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.25)',
                fontSize: 13,
                color: '#a8892e',
                fontWeight: 600,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              관심 포지션 {interestedCount}건
            </div>
          )}
        </div>

        {/* 뉴스레터 바 */}
        <NewsletterBar />

        {/* 피드 카드 목록 */}
        {visibleItems.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {visibleItems.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
                onInterest={(value) => handleResponse(item.id, value)}
                onSkip={() => handleResponse(item.id, 'skip')}
                onDetail={() => setShowDetail(item)}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 0',
              color: '#888',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#1a1a1a',
                marginBottom: 8,
                fontFamily: 'Georgia, serif',
              }}
            >
              {data === undefined
                ? '피드를 불러오는 중입니다...'
                : items.length === 0
                  ? '현재 등록된 포지션이 없습니다'
                  : '이번 주 피드를 모두 확인했습니다'}
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#888',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {data !== undefined && items.length > 0
                ? '다음 주 월요일에 새로운 포지션이 도착합니다'
                : ''}
            </div>
          </div>
        )}

        {/* 피드 안내 */}
        <div
          style={{
            marginTop: 40,
            padding: '20px 24px',
            background: 'rgba(0,0,0,0.03)',
            display: 'flex',
            gap: 24,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: '#888',
              fontWeight: 600,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            피드 안내
          </span>
          <span
            style={{
              fontSize: 12,
              color: '#888',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            관심 있음 — AI Match Engine의 학습 신호로 활용됩니다
          </span>
          <span
            style={{
              fontSize: 12,
              color: '#888',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            관심 없음 — 이 유형의 포지션 비중이 줄어듭니다
          </span>
        </div>
      </div>

      {/* 상세 모달 */}
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
