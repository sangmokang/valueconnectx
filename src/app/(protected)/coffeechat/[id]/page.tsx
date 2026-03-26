import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { PeerApplyButton } from '@/components/coffeechat/peer-apply-button'
import { PeerApplicationList } from '@/components/coffeechat/peer-application-list'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

const categoryLabel: Record<string, string> = {
  general: '일반',
  career: '커리어',
  hiring: '채용',
  mentoring: '멘토링',
}

const statusLabel: Record<string, string> = {
  open: '신청 받는 중',
  matched: '매칭 완료',
  closed: '마감',
}

type ChatRow = {
  id: string
  author_id: string
  title: string
  content: string
  category: string
  status: string
  created_at: string
  updated_at: string
  author: {
    id: string
    name: string
    title: string | null
    current_company: string | null
    member_tier: string
    avatar_url: string | null
    email: string
  } | null
}

type PeerApplication = {
  id: string
  chat_id: string
  applicant_id: string
  applicant: {
    id: string
    name: string
    email: string
    title?: string | null
    current_company?: string | null
    member_tier: string
    avatar_url?: string | null
  }
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export default async function PeerChatDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return notFound()

  const { data: rawChat } = await supabase
    .from('peer_coffee_chats')
    .select(`
      *,
      author:vcx_members(id, name, title, current_company, member_tier, avatar_url, email)
    `)
    .eq('id', id)
    .single()

  if (!rawChat) return notFound()
  const chat = rawChat as unknown as ChatRow

  const isAuthor = chat.author_id === user.id

  // Check if current user already applied
  let hasApplied = false
  let applicationStatus: 'pending' | 'accepted' | 'rejected' | null = null
  let authorContactEmail: string | null = null
  if (!isAuthor) {
    const { data: existing } = await supabase
      .from('peer_coffee_applications')
      .select('id, status')
      .eq('chat_id', id)
      .eq('applicant_id', user.id)
      .single()
    hasApplied = !!existing
    applicationStatus = (existing?.status as 'pending' | 'accepted' | 'rejected') ?? null

    // Fetch author email for applicant when accepted
    if (existing?.status === 'accepted') {
      const adminClient = createAdminClient()
      const { data: authorMember } = await adminClient
        .from('vcx_members')
        .select('email')
        .eq('id', chat.author_id)
        .single()
      authorContactEmail = authorMember?.email ?? null
    }
  }

  // Application count (visible to all)
  const { count: applicationCount } = await supabase
    .from('peer_coffee_applications')
    .select('id', { count: 'exact', head: true })
    .eq('chat_id', id)

  // Author: fetch all applications
  let applications: PeerApplication[] = []
  if (isAuthor) {
    const { data: apps } = await supabase
      .from('peer_coffee_applications')
      .select(`
        *,
        applicant:vcx_members(id, name, email, title, current_company, member_tier, avatar_url)
      `)
      .eq('chat_id', id)
      .order('created_at', { ascending: true })
    applications = (apps ?? []) as unknown as PeerApplication[]
  }

  const dateStr = new Date(chat.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-vcx-beige">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link
            href="/coffeechat"
            className="vcx-label text-vcx-sub-4 hover:text-vcx-gold transition-colors"
          >
            ← 멤버 커피챗 보드
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Meta */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="vcx-label px-2 py-1 bg-[#f0ebe2] text-vcx-sub-3">
                {categoryLabel[chat.category] ?? chat.category}
              </span>
              <span
                className={`vcx-label px-2 py-1 border ${
                  chat.status === 'open'
                    ? 'border-[#c9a84c] text-[#c9a84c]'
                    : 'border-[#999] text-[#999]'
                }`}
              >
                {statusLabel[chat.status] ?? chat.status}
              </span>
              <span className="vcx-label text-vcx-sub-5">{dateStr}</span>
            </div>

            {/* Title */}
            <h1 className="font-vcx-serif text-[26px] sm:text-[32px] font-normal text-vcx-dark leading-snug mb-6">
              {chat.title}
            </h1>

            {/* Author info */}
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[#e8e2d9]">
              <div className="w-10 h-10 bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                <span className="font-vcx-serif text-[#f0ebe2] text-[14px]">
                  {chat.author?.name?.charAt(0) ?? '?'}
                </span>
              </div>
              <div>
                <p className="font-vcx-serif text-[14px] text-vcx-dark">{chat.author?.name}</p>
                <p className="text-[12px] font-vcx-sans text-vcx-sub-4">
                  {[chat.author?.title, chat.author?.current_company].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="font-vcx-sans text-[15px] text-vcx-dark leading-relaxed whitespace-pre-wrap">
              {chat.content}
            </div>

            {/* Application count */}
            <div className="mt-8 pt-6 border-t border-[#e8e2d9]">
              <p className="vcx-label text-vcx-sub-4">
                {applicationCount ?? 0}명이 신청했습니다
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {isAuthor ? (
                <div className="border border-[#1a1a1a] bg-white p-5">
                  <p className="vcx-section-label mb-3">작성자 관리</p>
                  <p className="text-[13px] font-vcx-sans text-vcx-sub-3 mb-4">
                    내가 작성한 글입니다
                  </p>
                  <div className="space-y-2">
                    <p className="text-[12px] font-vcx-sans text-vcx-sub-4">
                      신청자 목록은 아래에서 확인할 수 있습니다
                    </p>
                  </div>
                </div>
              ) : (
                <PeerApplyButton
                  chatId={id}
                  chatTitle={chat.title}
                  chatStatus={chat.status}
                  hasApplied={hasApplied}
                  applicationStatus={applicationStatus}
                  authorContactEmail={authorContactEmail}
                />
              )}

              {/* Info box */}
              <div className="border border-[#e8e2d9] bg-[#f7f3ed] p-4">
                <p className="vcx-section-label mb-2">ValueConnect X</p>
                <p className="text-[12px] font-vcx-sans text-vcx-sub-3 leading-relaxed">
                  커피챗을 통해 채용이 연결될 경우 ValueConnect 소개 수수료가 적용됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Author: applications section */}
        {isAuthor && (
          <div className="mt-12 pt-8 border-t border-[#1a1a1a]">
            <h2 className="font-vcx-serif text-[22px] font-normal text-vcx-dark mb-2">
              신청자 목록 ({applications.length}명)
            </h2>
            <p className="text-[13px] font-vcx-sans text-vcx-sub-4 mb-6">
              신청자 목록은 작성자에게만 공개됩니다. 수락 시 상대방 연락처가 공개됩니다.
            </p>
            <PeerApplicationList chatId={id} initialApplications={applications} />
          </div>
        )}
      </div>
    </div>
  )
}
