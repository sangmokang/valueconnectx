import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ProtectedPageWrapper } from '@/components/layout/protected-page-wrapper'
import { PositionCard, PositionCardData } from '@/components/positions/position-card'
import { PositionFilters } from '@/components/positions/position-filters'
import { PositionMatchSection } from '@/components/positions/position-match-section'
import Link from 'next/link'

function escapeIlike(str: string): string {
  return str.replace(/%/g, '\\%').replace(/_/g, '\\_').replace(/,/g, '').replace(/\./g, '')
}

interface SearchParams {
  page?: string
  q?: string
  company?: string
}

async function PositionsContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = supabase as any

  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const limit = 20
  const offset = (page - 1) * limit

  let query = supa
    .from('positions')
    .select('id, company_name, title, team_size, role_description, salary_range, status, created_at', { count: 'exact' })
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (searchParams.q) {
    const eq = escapeIlike(searchParams.q)
    query = query.or(`company_name.ilike.%${eq}%,title.ilike.%${eq}%,role_description.ilike.%${eq}%`)
  }
  if (searchParams.company) {
    query = query.ilike('company_name', `%${escapeIlike(searchParams.company)}%`)
  }

  const { data: positions, count } = await query
  const total = count ?? 0
  const totalPages = Math.ceil(total / limit)

  // Fetch current user interests
  let interests: Record<string, string> = {}
  if (user && positions && positions.length > 0) {
    const ids = (positions as { id: string }[]).map((p) => p.id)
    const { data: interestData } = await supa
      .from('position_interests')
      .select('position_id, interest_type')
      .eq('user_id', user.id)
      .in('position_id', ids)
    if (interestData) {
      interests = Object.fromEntries(
        (interestData as { position_id: string; interest_type: string }[]).map((i) => [i.position_id, i.interest_type])
      )
    }
  }

  const enriched: PositionCardData[] = (positions ?? []).map((p: {
    id: string
    company_name: string
    title: string
    team_size: string | null
    role_description: string
    salary_range: string | null
    status: string
    created_at: string
  }) => ({
    ...p,
    my_interest: (interests[p.id] as PositionCardData['my_interest']) ?? null,
  }))

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-vcx-sans text-[#888888]">
          총 <span className="text-[#1a1a1a] font-medium">{total}</span>개 포지션
        </p>
      </div>

      {enriched.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {enriched.map((position) => (
            <PositionCard key={position.id} position={position} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-sm font-vcx-sans text-[#999999]">등록된 포지션이 없습니다</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <PaginationLink
              key={p}
              page={p}
              currentPage={page}
              searchParams={searchParams}
            />
          ))}
        </div>
      )}
    </>
  )
}

function PaginationLink({
  page,
  currentPage,
  searchParams,
}: {
  page: number
  currentPage: number
  searchParams: SearchParams
}) {
  const params = new URLSearchParams()
  if (searchParams.q) params.set('q', searchParams.q)
  if (searchParams.company) params.set('company', searchParams.company)
  params.set('page', String(page))

  return (
    <Link
      href={`/positions?${params.toString()}`}
      className={`w-8 h-8 flex items-center justify-center text-xs font-vcx-sans border transition-colors ${
        page === currentPage
          ? 'bg-[#1a1a1a] text-[#c9a84c] border-[#1a1a1a]'
          : 'bg-white text-[#666666] border-[#e0d9ce] hover:border-[#888888]'
      }`}
      style={{ borderRadius: 0 }}
    >
      {page}
    </Link>
  )
}

export default async function PositionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  return (
    <ProtectedPageWrapper currentPath="/positions">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <p className="vcx-section-label mb-1">포지션 보드</p>
          <h1 className="font-vcx-serif font-bold text-[#1a1a1a] text-3xl">Position Board</h1>
        </div>

        {/* AI 추천 포지션 */}
        <PositionMatchSection />

        {/* Filters */}
        <Suspense>
          <PositionFilters />
        </Suspense>

        {/* Grid */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-[#e0d9ce] p-5 h-48 animate-pulse" />
              ))}
            </div>
          }
        >
          <PositionsContent searchParams={params} />
        </Suspense>
      </div>
    </ProtectedPageWrapper>
  )
}
