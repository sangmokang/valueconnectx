import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { SessionDetail } from '@/components/coffeechat/session-detail'
import { ApplicationList } from '@/components/coffeechat/application-list'
import { ApplyButton } from '@/components/coffeechat/apply-button'
import { PreBriefCard } from '@/components/coffeechat/pre-brief-card'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  type SessionRow = {
    id: string
    host_id: string
    title: string
    description: string
    session_date: string
    duration_minutes: number
    max_participants: number
    location_type: string
    location_detail: string | null
    status: string
    target_tier: string | null
    tags: string[]
    host: { id: string; name: string; title: string | null; company: string; role: string } | null
  }

  const { data: rawSession } = await supabase
    .from('vcx_ceo_coffee_sessions')
    .select(`
      *,
      host:vcx_corporate_users(id, name, title, company, role)
    `)
    .eq('id', id)
    .single()

  if (!rawSession) return notFound()
  const session = rawSession as unknown as SessionRow

  const { data: countData } = await supabase
    .rpc('vcx_coffee_application_count', { p_session_id: id })
  const applicationCount = (countData as number) ?? 0

  const isHost = session.host_id === user.id

  // Check if current user already applied
  let hasApplied = false
  let applicationStatus: 'pending' | 'accepted' | 'rejected' | null = null
  let hostContactEmail: string | null = null
  if (!isHost) {
    const { data: existing } = await supabase
      .from('vcx_coffee_applications')
      .select('id, status')
      .eq('session_id', id)
      .eq('applicant_id', user.id)
      .single()
    hasApplied = !!existing
    applicationStatus = (existing?.status as 'pending' | 'accepted' | 'rejected') ?? null

    // Fetch host email for applicant when accepted
    if (existing?.status === 'accepted') {
      const adminClient = createAdminClient()
      const { data: hostCorporate } = await adminClient
        .from('vcx_corporate_users')
        .select('email')
        .eq('id', session.host_id)
        .single()
      hostContactEmail = hostCorporate?.email ?? null
    }
  }

  // Host: fetch all applications
  let applications: Array<{
    id: string
    session_id: string
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
    message?: string | null
    status: 'pending' | 'accepted' | 'rejected'
    reviewed_at?: string | null
    created_at: string
  }> = []

  if (isHost) {
    const { data: apps } = await supabase
      .from('vcx_coffee_applications')
      .select(`
        *,
        applicant:vcx_members(id, name, email, title, current_company, member_tier, avatar_url)
      `)
      .eq('session_id', id)
      .order('created_at', { ascending: true })
    applications = (apps ?? []) as unknown as typeof applications
  }

  const host = (session.host ?? {}) as {
    id: string
    name: string
    title?: string
    company: string
    role: string
  }

  return (
    <div className="min-h-screen bg-vcx-beige">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link
            href="/ceo-coffeechat"
            className="vcx-label text-vcx-sub-4 hover:text-vcx-gold transition-colors"
          >
            ← CEO 커피챗 보드
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <SessionDetail
              title={session.title}
              description={session.description}
              sessionDate={session.session_date}
              durationMinutes={session.duration_minutes}
              locationType={session.location_type as 'online' | 'offline' | 'hybrid'}
              locationDetail={session.location_detail ?? undefined}
              status={session.status as 'open' | 'closed' | 'completed' | 'cancelled'}
              targetTier={session.target_tier ?? undefined}
              tags={session.tags ?? []}
              applicationCount={applicationCount}
              maxParticipants={session.max_participants}
              host={host}
            />
          </div>

          {/* Sidebar — apply / host actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {isHost ? (
                <>
                  <div className="border border-[#1a1a1a] bg-white p-5">
                    <p className="vcx-section-label mb-3">호스트 관리</p>
                    <p className="text-[13px] font-vcx-sans text-vcx-sub-3 mb-4">
                      이 세션의 호스트입니다
                    </p>
                    <Link
                      href={`/ceo-coffeechat/${id}/edit`}
                      className="block w-full text-center py-3 border border-[#1a1a1a] text-[13px] font-vcx-sans text-vcx-dark hover:bg-[#f0ebe2] transition-colors"
                    >
                      세션 수정
                    </Link>
                  </div>
                  <PreBriefCard sessionId={id} />
                </>
              ) : (
                <>
                  <ApplyButton
                    sessionId={id}
                    sessionTitle={session.title}
                    sessionStatus={session.status}
                    hasApplied={hasApplied}
                    applicationStatus={applicationStatus}
                    hostContactEmail={hostContactEmail}
                  />
                  {applicationStatus === 'accepted' && (
                    <PreBriefCard sessionId={id} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Host: applications section */}
        {isHost && (
          <div className="mt-12 pt-8 border-t border-[#1a1a1a]">
            <h2 className="font-vcx-serif text-[22px] font-normal text-vcx-dark mb-6">
              신청자 목록 ({applications.length}명)
            </h2>
            <ApplicationList sessionId={id} initialApplications={applications} />
          </div>
        )}
      </div>
    </div>
  )
}
