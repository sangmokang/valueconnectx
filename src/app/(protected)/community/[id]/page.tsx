import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProtectedPageWrapper } from '@/components/layout/protected-page-wrapper'
import { CATEGORIES, CategoryKey } from '@/components/community/category-tabs'
import { CommentList, CommunityComment } from '@/components/community/comment-list'
import { CommentForm } from '@/components/community/comment-form'
import { ReportButton } from '@/components/community/report-button'
import { LikeButton } from '@/components/community/like-button'

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Determine if current user is a corporate user (for privacy enforcement)
  const { data: { user: authUser } } = await supabase.auth.getUser()
  const isCorporateUser = authUser
    ? !!(await supabase.from('vcx_corporate_users').select('id').eq('id', authUser.id).single()).data
    : false

  const { data: post, error } = await supabase
    .from('community_posts')
    .select('id, author_id, category, title, content, is_anonymous, status, created_at, updated_at, likes_count, comments_count')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (error || !post) notFound()

  // Mask author_id: anonymous posts always masked; company_review masked for corporate users
  const maskedPost = {
    ...post!,
    author_id:
      post!.is_anonymous || (post!.category === 'company_review' && isCorporateUser)
        ? null
        : post!.author_id,
  }

  const { data: commentsData } = await supabase
    .from('community_comments')
    .select('id, post_id, author_id, content, is_anonymous, status, created_at')
    .eq('post_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })

  const comments: CommunityComment[] = (commentsData ?? []).map((c) => ({
    id: c.id,
    post_id: c.post_id ?? id,
    author_id: c.is_anonymous ? null : c.author_id,
    content: c.content,
    is_anonymous: c.is_anonymous,
    status: c.status,
    created_at: c.created_at,
  }))

  const categoryLabel = CATEGORIES[maskedPost.category as CategoryKey] ?? maskedPost.category
  const isCompanyReview = maskedPost.category === 'company_review'

  return (
    <ProtectedPageWrapper currentPath={`/community/${id}`}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 40px 60px' }}>
        {/* Back */}
        <Link
          href="/community"
          style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#888888', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '24px' }}
        >
          ← 커뮤니티
        </Link>

        {/* Post */}
        <div style={{ background: '#ffffff', border: '1px solid #e0d9ce', padding: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'system-ui, sans-serif',
                padding: '2px 8px',
                background: isCompanyReview ? '#fff8e6' : '#f5f0eb',
                color: isCompanyReview ? '#c9a84c' : '#888888',
                border: `1px solid ${isCompanyReview ? '#c9a84c' : '#e0d9ce'}`,
              }}
            >
              {categoryLabel}
            </span>
            {maskedPost.is_anonymous || (isCompanyReview && isCorporateUser) ? (
              <span style={{ fontSize: '11px', fontFamily: 'system-ui, sans-serif', color: '#aaaaaa' }}>익명</span>
            ) : null}
          </div>

          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 800, color: '#1a1a1a', marginBottom: '12px', lineHeight: '1.4' }}>
            {maskedPost.title}
          </h1>

          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#aaaaaa', marginBottom: '24px' }}>
            {formatDate(maskedPost.created_at)}
          </p>

          {isCompanyReview && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fff8e6',
                border: '1px solid #c9a84c',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '12px',
                color: '#7a6020',
                marginBottom: '20px',
                lineHeight: '1.5',
              }}
            >
              이 게시글은 사실 기반 정보만 허용됩니다. 허위 정보나 감정적 비방이 포함된 경우 신고해 주세요.
            </div>
          )}

          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '15px',
              color: '#333333',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {maskedPost.content}
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f0ebe2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <LikeButton postId={maskedPost.id} />
            <ReportButton postId={maskedPost.id} />
          </div>
        </div>

        {/* Comments */}
        <div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '16px' }}>
            댓글 {comments.length > 0 && `(${comments.length})`}
          </h2>

          <CommentList comments={comments} postId={id} />

          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e0d9ce' }}>
            <CommentForm postId={id} />
          </div>
        </div>
      </div>
    </ProtectedPageWrapper>
  )
}
