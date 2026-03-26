import { createClient } from '@/lib/supabase/server'
import { ProtectedPageWrapper } from '@/components/layout/protected-page-wrapper'
import { PeerChatCard } from '@/components/coffeechat/peer-chat-card'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const categoryOptions = [
  { value: '', label: '전체' },
  { value: 'general', label: '일반' },
  { value: 'career', label: '커리어' },
  { value: 'hiring', label: '채용' },
  { value: 'mentoring', label: '멘토링' },
]

type ChatRow = {
  id: string
  author_id: string
  title: string
  content: string
  category: 'general' | 'career' | 'hiring' | 'mentoring'
  status: 'open' | 'matched' | 'closed'
  created_at: string
  author: {
    id: string
    name: string
    title: string | null
    current_company: string | null
    member_tier: string
    avatar_url: string | null
  } | null
}

interface PageProps {
  searchParams: Promise<{ category?: string; status?: string }>
}

export default async function CoffeeChatPage({ searchParams }: PageProps) {
  const { category, status } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('peer_coffee_chats')
    .select(`
      *,
      author:vcx_members(id, name, title, current_company, member_tier, avatar_url)
    `)
    .order('created_at', { ascending: false })

  if (category && ['general', 'career', 'hiring', 'mentoring'].includes(category)) {
    query = query.eq('category', category as 'general' | 'career' | 'hiring' | 'mentoring')
  }
  if (status && ['open', 'matched', 'closed'].includes(status)) {
    query = query.eq('status', status as 'open' | 'matched' | 'closed')
  }

  const { data: rawChats } = await query
  const chats = (rawChats ?? []) as unknown as ChatRow[]

  // Fetch application counts per chat
  const chatsWithCount = await Promise.all(
    chats.map(async (chat) => {
      const { count } = await supabase
        .from('peer_coffee_applications')
        .select('id', { count: 'exact', head: true })
        .eq('chat_id', chat.id)
      return { ...chat, applicationCount: count ?? 0 }
    })
  )

  return (
    <ProtectedPageWrapper currentPath="/coffeechat">
      <div className="min-h-screen bg-vcx-beige">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          {/* Page header */}
          <div className="flex items-end justify-between mb-10 pb-6 border-b border-[#1a1a1a]">
            <div>
              <p className="vcx-section-label mb-2">Peer Coffee Chat</p>
              <h1 className="font-vcx-serif text-[32px] sm:text-[40px] font-normal text-vcx-dark leading-tight">
                멤버 커피챗 보드
              </h1>
              <p className="text-[14px] font-vcx-sans text-vcx-sub-3 mt-2">
                멤버끼리 비밀 커피챗을 신청하고 연결되세요
              </p>
            </div>
            {user && (
              <Link
                href="/coffeechat/create"
                className="inline-flex items-center justify-center h-[46px] px-7 bg-[#1a1a1a] text-[#f0ebe2] text-[14px] font-vcx-sans hover:bg-[#333] transition-colors flex-shrink-0"
              >
                글 작성하기
              </Link>
            )}
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categoryOptions.map((opt) => {
              const isActive = (category ?? '') === opt.value
              const href = opt.value
                ? `/coffeechat?category=${opt.value}`
                : '/coffeechat'
              return (
                <Link
                  key={opt.value}
                  href={href}
                  className={`vcx-label px-4 py-2 border transition-colors ${
                    isActive
                      ? 'border-[#1a1a1a] text-vcx-dark bg-white'
                      : 'border-[#ccc] text-vcx-sub-4 hover:border-[#1a1a1a]'
                  }`}
                >
                  {opt.label}
                </Link>
              )
            })}
          </div>

          {/* Chat grid */}
          {chatsWithCount.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-vcx-serif text-[20px] text-vcx-sub-3 mb-2">아직 글이 없습니다</p>
              <p className="text-[14px] font-vcx-sans text-vcx-sub-4">
                첫 번째 커피챗 글을 작성해보세요
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {chatsWithCount.map((chat) => (
                <PeerChatCard
                  key={chat.id}
                  id={chat.id}
                  title={chat.title}
                  content={chat.content}
                  category={chat.category}
                  status={chat.status}
                  authorName={chat.author?.name ?? ''}
                  authorTitle={chat.author?.title}
                  authorCompany={chat.author?.current_company}
                  createdAt={chat.created_at}
                  applicationCount={chat.applicationCount}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedPageWrapper>
  )
}
