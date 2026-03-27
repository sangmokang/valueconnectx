import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PeerChatForm } from '@/components/coffeechat/peer-chat-form'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditPeerChatPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: chat } = await supabase
    .from('peer_coffee_chats')
    .select('*')
    .eq('id', id)
    .single()

  if (!chat) {
    return notFound()
  }

  if (chat.author_id !== user.id) {
    redirect(`/coffeechat/${id}`)
  }

  const initialData = {
    title: chat.title ?? '',
    content: chat.content ?? '',
    category: chat.category as 'general' | 'career' | 'hiring' | 'mentoring',
  }

  return (
    <div className="min-h-screen bg-vcx-beige">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <nav className="mb-8">
          <Link
            href={`/coffeechat/${id}`}
            className="vcx-label text-vcx-sub-4 hover:text-vcx-gold transition-colors"
          >
            ← 글 상세로 돌아가기
          </Link>
        </nav>
        <div className="mb-10 pb-6 border-b border-[#1a1a1a]">
          <p className="vcx-section-label mb-2">Peer Coffee Chat</p>
          <h1 className="font-vcx-serif text-[28px] font-normal text-vcx-dark">
            글 수정
          </h1>
        </div>
        <PeerChatForm initialData={initialData} chatId={id} />
      </div>
    </div>
  )
}
