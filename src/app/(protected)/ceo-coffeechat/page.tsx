import { createClient } from '@/lib/supabase/server'
import { SessionCard } from '@/components/coffeechat/session-card'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CeoCoffeechatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if current user is a CEO/Founder corporate user
  let isCeoOrFounder = false
  if (user) {
    const { data: corpUser } = await supabase
      .from('vcx_corporate_users')
      .select('id, role')
      .eq('id', user.id)
      .in('role', ['ceo', 'founder'])
      .single()
    isCeoOrFounder = !!corpUser
  }

  type SessionRow = {
    id: string
    host_id: string
    title: string
    description: string
    session_date: string
    duration_minutes: number
    max_participants: number
    location_type: 'online' | 'offline' | 'hybrid'
    location_detail: string | null
    status: 'open' | 'closed' | 'completed' | 'cancelled'
    target_tier: string | null
    tags: string[]
    host: { id: string; name: string; title: string | null; company: string; role: string } | null
    application_count: number
  }

  const { data: rawSessions } = await supabase
    .from('vcx_ceo_coffee_sessions')
    .select(`
      *,
      host:vcx_corporate_users(id, name, title, company, role)
    `)
    .order('session_date', { ascending: true })

  const sessions = (rawSessions ?? []) as unknown as SessionRow[]

  // Fetch application counts
  const sessionsWithCount = await Promise.all(
    sessions.map(async (session) => {
      const { data: countData } = await supabase
        .rpc('vcx_coffee_application_count', { p_session_id: session.id })
      return { ...session, application_count: (countData as number) ?? 0 }
    })
  )

  return (
    <div className="min-h-screen bg-vcx-beige">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Page header */}
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between mb-10 pb-6 border-b border-[#1a1a1a]">
          <div>
            <p className="vcx-section-label mb-2">CEO Coffee Chat</p>
            <h1 className="font-vcx-serif text-[32px] sm:text-[40px] font-normal text-vcx-dark leading-tight">
              CEO 커피챗 보드
            </h1>
            <p className="text-[14px] font-vcx-sans text-vcx-sub-3 mt-2">
              CEO/Founder와의 비밀 커피챗 세션을 신청하세요
            </p>
          </div>
          {isCeoOrFounder && (
            <Link
              href="/ceo-coffeechat/create"
              className="inline-flex items-center justify-center h-[46px] px-7 bg-[#1a1a1a] text-[#f0ebe2] text-[14px] font-vcx-sans hover:bg-[#333] transition-colors w-full sm:w-auto sm:flex-shrink-0"
            >
              세션 만들기
            </Link>
          )}
        </div>

        {/* Session grid */}
        {sessionsWithCount.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-vcx-serif text-[20px] text-vcx-sub-3 mb-2">아직 세션이 없습니다</p>
            <p className="text-[14px] font-vcx-sans text-vcx-sub-4">
              {isCeoOrFounder ? '첫 번째 커피챗 세션을 만들어보세요' : '곧 CEO 커피챗 세션이 열릴 예정입니다'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessionsWithCount.map((session) => (
              <SessionCard
                key={session.id}
                id={session.id}
                title={session.title}
                hostName={session.host?.name ?? ''}
                hostCompany={session.host?.company ?? ''}
                sessionDate={session.session_date}
                durationMinutes={session.duration_minutes}
                locationType={session.location_type as 'online' | 'offline' | 'hybrid'}
                tags={session.tags ?? []}
                applicationCount={session.application_count}
                status={session.status as 'open' | 'closed' | 'completed' | 'cancelled'}
                maxParticipants={session.max_participants}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
