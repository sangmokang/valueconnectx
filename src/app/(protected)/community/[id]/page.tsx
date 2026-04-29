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
      <div className="min-h-screen bg-vcx-beige">
        <div className="max-w-[720px] mx-auto px-4 sm:px-10 py-20">
          {/* Back */}
          <Link
            href="/community"
            className="font-vcx-sans text-[13px] text-[#888888] no-underline inline-flex items-center gap-1 mb-6 hover:text-[#1a1a1a] transition-colors"
          >
            ← 커뮤니티
          </Link>

          {/* Post */}
          <div className="bg-vcx-beige border border-[#e0d9ce] p-8 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`text-[11px] font-vcx-sans px-2 py-0.5 border ${
                  isCompanyReview
                    ? 'bg-[#fff8e6] text-[#c9a84c] border-[#c9a84c]'
                    : 'bg-[#f5f0eb] text-[#888888] border-[#e0d9ce]'
                }`}
              >
                {categoryLabel}
              </span>
              {maskedPost.is_anonymous || (isCompanyReview && isCorporateUser) ? (
                <span className="text-[11px] font-vcx-sans text-[#aaaaaa]">익명</span>
              ) : null}
            </div>

            <h1 className="font-vcx-serif text-[22px] font-bold text-[#1a1a1a] mb-3 leading-[1.4]">
              {maskedPost.title}
            </h1>

            <p className="font-vcx-sans text-[12px] text-[#aaaaaa] mb-6">
              {formatDate(maskedPost.created_at)}
            </p>

            {isCompanyReview && (
              <div className="px-3.5 py-2.5 bg-[#fff8e6] border border-[#c9a84c] font-vcx-sans text-[12px] text-[#7a6020] mb-5 leading-[1.5]">
                이 게시글은 사실 기반 정보만 허용됩니다. 허위 정보나 감정적 비방이 포함된 경우 신고해 주세요.
              </div>
            )}

            <div className="font-vcx-sans text-[15px] text-[#333333] leading-[1.8] whitespace-pre-wrap break-words">
              {maskedPost.content}
            </div>

            <div className="mt-6 pt-4 border-t border-[#f0ebe2] flex justify-between items-center">
              <LikeButton postId={maskedPost.id} />
              <ReportButton postId={maskedPost.id} />
            </div>
          </div>

          {/* Comments */}
          <div>
            <h2 className="font-vcx-serif text-[16px] font-bold text-[#1a1a1a] mb-4">
              댓글 {comments.length > 0 && `(${comments.length})`}
            </h2>

            <CommentList comments={comments} postId={id} />

            <div className="mt-6 pt-6 border-t border-[#e0d9ce]">
              <CommentForm postId={id} />
            </div>
          </div>
        </div>
      </div>
    </ProtectedPageWrapper>
  )
}
