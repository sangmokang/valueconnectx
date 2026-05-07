'use client'

import useSWR from 'swr'
import Link from 'next/link'
import type { FeedItem } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}시간 전`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}일 전`
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export function IndustryNewsFeed() {
  const { data, isLoading } = useSWR<{ data: FeedItem[] }>('/api/feed?limit=40', fetcher)
  const items = data?.data ?? []

  if (isLoading) {
    return (
      <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: '100px', margin: '0 0 1px', background: '#f5f0e8', opacity: 0.4 }} />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.08)',
          padding: '72px 0',
          textAlign: 'center',
          color: '#b0a898',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: '28px', marginBottom: '12px' }}>📰</div>
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-vcx-dark)', marginBottom: '6px' }}>
          업계 뉴스가 아직 없습니다
        </div>
        <div style={{ fontSize: '13.5px', color: 'var(--color-vcx-sub-4)' }}>
          곧 최신 업계 소식이 업데이트됩니다
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      {items.map((item, idx) => (
        <NewsRow key={item.id} item={item} isLast={idx === items.length - 1} />
      ))}
    </div>
  )
}

function NewsRow({ item, isLast }: { item: FeedItem; isLast: boolean }) {
  const sourceDisplay = item.company_tag ?? item.source_name ?? item.company
  const pubAt = item.published_at ?? ''

  return (
    <div
      style={{
        padding: '16px 20px',
        borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
      }}
    >
      {/* Source initial */}
      <div
        style={{
          width: '36px',
          height: '36px',
          background: 'var(--color-vcx-dark)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: 'var(--color-vcx-gold)', fontSize: '13px', fontWeight: 700, fontFamily: 'Georgia, serif' }}>
          {(sourceDisplay ?? 'N').charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-vcx-dark)', fontFamily: 'system-ui, sans-serif' }}>
            {item.company}
          </span>
          {sourceDisplay && sourceDisplay !== item.company && (
            <span style={{ fontSize: '12px', color: '#b0a898', fontFamily: 'system-ui, sans-serif' }}>
              {sourceDisplay}
            </span>
          )}
          {pubAt && (
            <span style={{ fontSize: '11.5px', color: '#c0b9af', fontFamily: 'system-ui, sans-serif', marginLeft: 'auto' }}>
              {timeAgo(pubAt)}
            </span>
          )}
        </div>

        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-vcx-dark)', fontFamily: 'system-ui, sans-serif', marginBottom: '6px', lineHeight: 1.5 }}>
          {item.role}
        </div>

        {item.summary && (
          <p style={{ fontSize: '13px', color: 'var(--color-vcx-sub-3)', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.summary}
          </p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {item.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  color: 'var(--color-vcx-sub-4)',
                  fontFamily: 'system-ui, sans-serif',
                  background: '#faf8f4',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link
            href={`/feed/${item.id}`}
            style={{ fontSize: '12.5px', color: 'var(--color-vcx-gold)', fontWeight: 600, fontFamily: 'system-ui, sans-serif', textDecoration: 'none' }}
          >
            자세히 보기 →
          </Link>
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px', color: '#b0a898', fontFamily: 'system-ui, sans-serif', textDecoration: 'none' }}
            >
              원문 ↗
            </a>
          )}
          {(item.interest_count ?? 0) > 0 && (
            <span style={{ fontSize: '11.5px', color: '#b0a898', fontFamily: 'system-ui, sans-serif', marginLeft: 'auto' }}>
              관심 {item.interest_count}명
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
