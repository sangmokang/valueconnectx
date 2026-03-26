import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PeerChatForm } from '@/components/coffeechat/peer-chat-form'

export default async function CreatePeerChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-vcx-beige">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10 pb-6 border-b border-[#1a1a1a]">
          <p className="vcx-section-label mb-2">Peer Coffee Chat</p>
          <h1 className="font-vcx-serif text-[28px] font-normal text-vcx-dark">
            커피챗 글 작성하기
          </h1>
          <p className="text-[14px] font-vcx-sans text-vcx-sub-3 mt-2">
            어떤 분과 커피챗을 하고 싶은지 작성하면, 관심 있는 멤버들이 비밀 신청을 보냅니다
          </p>
        </div>
        <PeerChatForm />
      </div>
    </div>
  )
}
