import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SessionForm } from '@/components/coffeechat/session-form'

export default async function CreateSessionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Only CEO/Founder can create sessions
  const { data: corpUser } = await supabase
    .from('vcx_corporate_users')
    .select('id, role')
    .eq('id', user.id)
    .in('role', ['ceo', 'founder'])
    .single()

  if (!corpUser) {
    redirect('/ceo-coffeechat')
  }

  return (
    <div className="min-h-screen bg-vcx-beige">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10 pb-6 border-b border-[#1a1a1a]">
          <p className="vcx-section-label mb-2">CEO Coffee Chat</p>
          <h1 className="font-vcx-serif text-[28px] font-normal text-vcx-dark">
            새 커피챗 세션 만들기
          </h1>
        </div>
        <SessionForm />
      </div>
    </div>
  )
}
