import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProtectedPageWrapper } from '@/components/layout/protected-page-wrapper'
import { CategoryTabs, CategoryKey, CATEGORIES } from '@/components/community/category-tabs'
import { PostCard, CommunityPost } from '@/components/community/post-card'

interface SearchParams {
  page?: string
  category?: CategoryKey
}

async function CommunityList({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()

  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const limit = 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('community_posts')
    .select('id, author_id, category, title, content, is_anonymous, status, created_at, updated_at', { count: 'exact' })
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (searchParams.category) {
    query = query.eq('category', searchParams.category)
  }

  const { data, count } = await query
  const total = count ?? 0
  const totalPages = Math.ceil(total / limit)

  const posts: CommunityPost[] = (data ?? []).map((p) => ({
    id: p.id,
    author_id: p.is_anonymous ? null : p.author_id,
    category: p.category as CommunityPost['category'],
    title: p.title,
    content: p.content,
    is_anonymous: p.is_anonymous,
    status: p.status,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }))

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#888888' }}>
          총 <strong style={{ color: '#1a1a1a' }}>{total}</strong>개의 글
        </p>
        <Link
          href="/community/create"
          style={{
            padding: '8px 18px',
            background: '#1a1a1a',
            color: '#c9a84c',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            textDecoration: 'none',
            borderRadius: 0,
          }}
        >
          글 작성
        </Link>
      </div>

      {posts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div style={{ padding: '64px 0', textAlign: 'center' }}>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#aaaaaa' }}>
            {searchParams.category
              ? `'${CATEGORIES[searchParams.category]}' 카테고리에 글이 없습니다`
              : '첫 번째 글을 작성해보세요'}
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams()
            if (searchParams.category) params.set('category', searchParams.category)
            params.set('page', String(p))
            return (
              <Link
                key={p}
                href={`/community?${params.toString()}`}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '12px',
                  textDecoration: 'none',
                  border: '1px solid',
                  borderColor: p === page ? '#1a1a1a' : '#e0d9ce',
                  background: p === page ? '#1a1a1a' : 'transparent',
                  color: p === page ? '#c9a84c' : '#666666',
                }}
              >
                {p}
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  return (
    <ProtectedPageWrapper currentPath="/community">
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 40px 60px' }}>
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.12em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: '8px' }}>
            Community
          </p>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 800, color: '#1a1a1a', marginBottom: '8px' }}>
            커뮤니티
          </h1>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#888888' }}>
            멤버들과 커리어, 조직, 일상의 이야기를 나눠보세요
          </p>
        </div>

        <Suspense>
          <CategoryTabs current={params.category} />
        </Suspense>

        <Suspense
          fallback={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ background: '#ffffff', border: '1px solid #e0d9ce', padding: '20px 24px', height: '96px', opacity: 0.5 }} />
              ))}
            </div>
          }
        >
          <CommunityList searchParams={params} />
        </Suspense>
      </div>
    </ProtectedPageWrapper>
  )
}
