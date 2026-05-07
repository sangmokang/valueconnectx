import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { InterestButton } from '@/components/positions/interest-button'

export default async function PositionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = supabase as any

  const { data: { user } } = await supabase.auth.getUser()

  const { data: position, error } = await supa
    .from('positions')
    .select('id, company_name, title, team_size, role_description, salary_range, status, created_at, updated_at')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (error || !position) notFound()

  const pos = position as {
    id: string
    company_name: string
    title: string
    team_size: string | null
    role_description: string
    salary_range: string | null
    status: string
    created_at: string
    updated_at: string
  }

  // Fetch user's interest
  let myInterest: 'interested' | 'not_interested' | 'bookmark' | null = null
  if (user) {
    const { data: interest } = await supa
      .from('position_interests')
      .select('interest_type')
      .eq('position_id', id)
      .eq('user_id', user.id)
      .single()
    const interestType = (interest as { interest_type?: string } | null)?.interest_type ?? null
    myInterest = interestType as 'interested' | 'not_interested' | 'bookmark' | null
  }

  // Fetch interest counts
  const { data: interestRows } = await supa
    .from('position_interests')
    .select('interest_type')
    .eq('position_id', id)

  const counts = { interested: 0, not_interested: 0, bookmark: 0 }
  if (interestRows) {
    for (const row of interestRows as { interest_type: string }[]) {
      counts[row.interest_type as keyof typeof counts]++
    }
  }

  return (
    <div className="min-h-screen bg-vcx-beige">
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/positions"
          className="text-xs font-vcx-sans text-vcx-sub-4 hover:text-vcx-gold transition-colors"
        >
          ← 포지션 목록
        </Link>
      </div>

      {/* Main card */}
      <div className="bg-white border border-vcx-dark/10 p-8">
        {/* Company */}
        <p className="vcx-section-label mb-1">{pos.company_name}</p>

        {/* Title */}
        <h1 className="font-vcx-serif font-bold text-vcx-dark text-3xl mb-4">
          {pos.title}
        </h1>

        {/* Divider */}
        <div className="border-t border-vcx-gold mb-6" />

        {/* Meta */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {pos.team_size && (
            <div>
              <p className="vcx-label text-vcx-sub-4 mb-0.5">조직 규모</p>
              <p className="text-sm font-vcx-sans text-vcx-dark">{pos.team_size}</p>
            </div>
          )}
          {pos.salary_range && (
            <div>
              <p className="vcx-label text-vcx-sub-4 mb-0.5">연봉 밴드</p>
              <p className="text-sm font-vcx-sans text-vcx-gold font-medium">{pos.salary_range}</p>
            </div>
          )}
        </div>

        {/* Role description */}
        <div className="mb-8">
          <p className="vcx-label text-vcx-sub-4 mb-2">주요 역할</p>
          <p className="text-sm font-vcx-sans text-vcx-sub-1 leading-relaxed whitespace-pre-wrap">
            {pos.role_description}
          </p>
        </div>

        {/* Interest counts */}
        <div className="flex gap-4 mb-6 py-3 px-4 bg-vcx-beige-light border border-vcx-dark/10">
          <span className="text-xs font-vcx-sans text-vcx-sub-4">
            관심 있음 <span className="text-vcx-gold font-medium">{counts.interested}</span>
          </span>
          <span className="text-xs font-vcx-sans text-vcx-sub-4">
            나중에 보기 <span className="text-vcx-dark font-medium">{counts.bookmark}</span>
          </span>
        </div>

        {/* Interest buttons */}
        <div>
          <p className="vcx-label text-vcx-sub-4 mb-2">이 포지션에 대한 반응</p>
          <InterestButton positionId={pos.id} initialInterest={myInterest} />
        </div>
      </div>

      {/* Posted date */}
      <p className="text-xs font-vcx-sans text-vcx-sub-5 mt-4 text-right">
        등록일: {new Date(pos.created_at).toLocaleDateString('ko-KR')}
      </p>
    </div>
    </div>
  )
}
