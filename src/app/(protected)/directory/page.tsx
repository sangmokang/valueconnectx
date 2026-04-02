import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ProtectedPageWrapper } from '@/components/layout/protected-page-wrapper'
import { MemberCard } from '@/components/directory/member-card'
import { MemberFilters } from '@/components/directory/member-filters'
import Link from 'next/link'

interface SearchParams {
  page?: string
  tier?: 'core' | 'endorsed'
  industry?: string
  q?: string
}

async function DirectoryContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()

  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const limit = 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('vcx_members')
    .select(
      'id, name, current_company, title, member_tier, professional_fields, industry, location, is_open_to_chat, avatar_url, join_date',
      { count: 'exact' }
    )
    .eq('is_active', true)
    .order('join_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (searchParams.tier) query = query.eq('member_tier', searchParams.tier)
  if (searchParams.industry) query = query.eq('industry', searchParams.industry)
  if (searchParams.q) {
    query = query.textSearch('fts', searchParams.q, { type: 'plain', config: 'simple' })
  }

  const { data: members, count } = await query
  const total = count ?? 0
  const totalPages = Math.ceil(total / limit)

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-vcx-sans text-[#888888]">
          총 <span className="text-[#1a1a1a] font-medium">{total}</span>명의 멤버
        </p>
        <Link
          href="/directory/me"
          className="px-3 py-1.5 text-xs font-vcx-sans bg-[#1a1a1a] text-[#c9a84c] hover:bg-[#333333] transition-colors"
          style={{ borderRadius: 0 }}
        >
          내 프로필 수정
        </Link>
      </div>

      {members && members.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-sm font-vcx-sans text-[#999999]">해당 조건의 멤버를 찾지 못했습니다. 다른 키워드로 검색해보세요.</p>
        </div>
      )}

      {/* Pagination */}
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
  if (searchParams.tier) params.set('tier', searchParams.tier)
  if (searchParams.industry) params.set('industry', searchParams.industry)
  if (searchParams.q) params.set('q', searchParams.q)
  params.set('page', String(page))

  return (
    <Link
      href={`/directory?${params.toString()}`}
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

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  return (
    <ProtectedPageWrapper currentPath="/directory">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <p className="vcx-section-label mb-1">멤버 디렉토리</p>
          <h1 className="font-vcx-serif font-bold text-[#1a1a1a] text-3xl">멤버 디렉토리</h1>
        </div>

        {/* Filters (client component) */}
        <Suspense>
          <MemberFilters />
        </Suspense>

        {/* Directory grid (server component, re-renders on param change) */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-[#e0d9ce] p-5 h-40 animate-pulse" />
              ))}
            </div>
          }
        >
          <DirectoryContent searchParams={params} />
        </Suspense>
      </div>
    </ProtectedPageWrapper>
  )
}
