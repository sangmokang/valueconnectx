import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SessionForm } from '@/components/coffeechat/session-form'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditSessionPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: session } = await supabase
    .from('vcx_ceo_coffee_sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (!session) {
    return notFound()
  }

  if (session.host_id !== user.id) {
    redirect(`/ceo-coffeechat/${id}`)
  }

  // datetime-local input requires 'YYYY-MM-DDTHH:mm' format
  const sessionDateForInput = session.session_date
    ? session.session_date.slice(0, 16)
    : ''

  const initialData = {
    title: session.title ?? '',
    description: session.description ?? '',
    session_date: sessionDateForInput,
    duration_minutes: session.duration_minutes ?? 60,
    max_participants: session.max_participants ?? 5,
    location_type: session.location_type as 'online' | 'offline' | 'hybrid' | undefined,
    location_detail: session.location_detail ?? '',
    target_tier: session.target_tier as 'core' | 'endorsed' | 'all' | undefined,
    tags: session.tags ?? [],
    agreement_accepted: true,
  }

  return (
    <div className="min-h-screen bg-vcx-beige">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <nav className="mb-8">
          <Link
            href={`/ceo-coffeechat/${id}`}
            className="vcx-label text-vcx-sub-4 hover:text-vcx-gold transition-colors"
          >
            ← 세션 상세로 돌아가기
          </Link>
        </nav>
        <div className="mb-10 pb-6 border-b border-[#1a1a1a]">
          <p className="vcx-section-label mb-2">CEO Coffee Chat</p>
          <h1 className="font-vcx-serif text-[28px] font-normal text-vcx-dark">
            세션 수정
          </h1>
        </div>
        <SessionForm initialData={initialData} sessionId={id} />
      </div>
    </div>
  )
}
