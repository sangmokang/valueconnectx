'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PeerHero } from '@/components/coffeechat/peer-hero'
import { PeerSessionCard, type PeerSession } from '@/components/coffeechat/peer-session-card'
import { PeerWriteModal } from '@/components/coffeechat/peer-write-modal'

interface ApiChat {
  id: string
  title: string
  content: string
  category: string
  status: 'open' | 'matched' | 'closed'
  created_at: string
  author: {
    name: string
    title: string | null
    current_company: string | null
    member_tier: string
  } | null
  applicationCount?: number
}

function toRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '오늘'
  if (days === 1) return '1일 전'
  return `${days}일 전`
}

function toSession(chat: ApiChat): PeerSession {
  const tier = chat.author?.member_tier ?? 'core'
  const badge: 'Core' | 'Endorsed' =
    tier.toLowerCase() === 'endorsed' ? 'Endorsed' : 'Core'

  // title → want (first sentence or up to 50 chars), content → topic
  const want = chat.title.length > 60 ? chat.title.slice(0, 60) + '…' : chat.title
  const topic = chat.content

  // derive tags from category
  const categoryTagMap: Record<string, string[]> = {
    general: ['General'],
    career: ['Career'],
    hiring: ['Hiring'],
    mentoring: ['Mentoring'],
  }
  const tags = categoryTagMap[chat.category] ?? []

  return {
    id: chat.id,
    authorBadge: badge,
    role: [chat.author?.title, chat.author?.current_company].filter(Boolean).join(', ') || '멤버',
    want,
    topic,
    tags,
    applicants: chat.applicationCount ?? 0,
    posted: toRelativeDate(chat.created_at),
    status: chat.status,
  }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface PeerCoffeechatClientProps {
  initialSessions: PeerSession[]
  appliedIds: string[]
}

export function PeerCoffeechatClient({ initialSessions, appliedIds: initialApplied }: PeerCoffeechatClientProps) {
  const [showWrite, setShowWrite] = useState(false)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set(initialApplied))

  const { data, mutate } = useSWR<{ data: ApiChat[] }>(
    '/api/peer-coffeechat',
    fetcher,
    { fallbackData: undefined, revalidateOnFocus: false }
  )

  const sessions: PeerSession[] = data?.data
    ? data.data.map(toSession)
    : initialSessions

  async function handleApply(id: string) {
    // Optimistically mark as applied; redirect to detail page for message
    setAppliedIds((prev) => new Set([...prev, id]))
    // Navigate to detail page where PeerApplyButton handles the message flow
    window.location.href = `/coffeechat/${id}`
  }

  async function handleSubmitSession(want: string, topic: string) {
    const res = await fetch('/api/peer-coffeechat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: want, content: topic, category: 'general' }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? '사연 올리기에 실패했습니다')
    }
    await mutate()
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] font-vcx-sans">
      <PeerHero onWriteClick={() => setShowWrite(true)} />

      <div className="max-w-[1000px] mx-auto px-6 sm:px-12 pt-10 pb-20">
        {sessions.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-vcx-serif text-[20px] text-[#888] mb-2">첫 번째 커피챗 사연을 올려보세요</p>
            <p className="text-[14px] text-[#aaa] font-vcx-sans">
              사연을 올리면 나와 대화하고 싶은 멤버가 신청합니다
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sessions.map((s) => (
              <PeerSessionCard
                key={s.id}
                session={s}
                isApplied={appliedIds.has(s.id)}
                onApply={handleApply}
              />
            ))}
          </div>
        )}
      </div>

      {showWrite && (
        <PeerWriteModal
          onClose={() => setShowWrite(false)}
          onSubmit={handleSubmitSession}
        />
      )}
    </div>
  )
}
