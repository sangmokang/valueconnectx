import { createClient } from '@/lib/supabase/server'
import { ProtectedPageWrapper } from '@/components/layout/protected-page-wrapper'
import { PeerCoffeechatClient } from '@/components/coffeechat/peer-coffeechat-client'
import type { PeerSession } from '@/components/coffeechat/peer-session-card'

export const dynamic = 'force-dynamic'

type ChatRow = {
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
}

function toRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '오늘'
  if (days === 1) return '1일 전'
  return `${days}일 전`
}

function toSession(chat: ChatRow & { applicationCount: number }): PeerSession {
  const tier = chat.author?.member_tier ?? 'core'
  const badge: 'Core' | 'Endorsed' =
    tier.toLowerCase() === 'endorsed' ? 'Endorsed' : 'Core'

  const want = chat.title.length > 60 ? chat.title.slice(0, 60) + '…' : chat.title
  const topic = chat.content

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
    role:
      [chat.author?.title, chat.author?.current_company].filter(Boolean).join(', ') || '멤버',
    want,
    topic,
    tags,
    applicants: chat.applicationCount,
    posted: toRelativeDate(chat.created_at),
    status: chat.status,
  }
}

export default async function CoffeeChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: rawChats } = await supabase
    .from('peer_coffee_chats')
    .select(`*, author:vcx_members(name, title, current_company, member_tier)`)
    .order('created_at', { ascending: false })

  const chats = (rawChats ?? []) as unknown as ChatRow[]

  const chatsWithCount = await Promise.all(
    chats.map(async (chat) => {
      const { count } = await supabase
        .from('peer_coffee_applications')
        .select('id', { count: 'exact', head: true })
        .eq('chat_id', chat.id)
      return { ...chat, applicationCount: count ?? 0 }
    })
  )

  const initialSessions: PeerSession[] = chatsWithCount.map(toSession)

  let appliedIds: string[] = []
  if (user) {
    const { data: applications } = await supabase
      .from('peer_coffee_applications')
      .select('chat_id')
      .eq('applicant_id', user.id)
    appliedIds = (applications ?? []).map((a: { chat_id: string }) => a.chat_id)
  }

  return (
    <ProtectedPageWrapper currentPath="/coffeechat">
      <PeerCoffeechatClient
        initialSessions={initialSessions}
        appliedIds={appliedIds}
      />
    </ProtectedPageWrapper>
  )
}
