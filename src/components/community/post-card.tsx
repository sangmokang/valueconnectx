import Link from 'next/link'
import { CATEGORIES, CategoryKey } from './category-tabs'

export interface CommunityPost {
  id: string
  author_id: string | null
  category: CategoryKey
  title: string
  content: string
  is_anonymous: boolean
  status: string
  created_at: string
  updated_at: string
  likes_count: number
  comments_count: number
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function PostCard({ post }: { post: CommunityPost }) {
  const categoryLabel = CATEGORIES[post.category] ?? post.category
  const isCompanyReview = post.category === 'company_review'

  return (
    <Link
      href={`/community/${post.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e0d9ce',
          padding: '20px 24px',
          transition: 'border-color 0.15s',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = '#c9a84c'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = '#e0d9ce'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'system-ui, sans-serif',
              padding: '2px 8px',
              background: isCompanyReview ? '#fff8e6' : '#f5f0eb',
              color: isCompanyReview ? '#c9a84c' : '#888888',
              border: `1px solid ${isCompanyReview ? '#c9a84c' : '#e0d9ce'}`,
              letterSpacing: '0.02em',
            }}
          >
            {categoryLabel}
          </span>
          {post.is_anonymous && (
            <span style={{ fontSize: '11px', fontFamily: 'system-ui, sans-serif', color: '#aaaaaa' }}>
              익명
            </span>
          )}
        </div>

        <h3
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            fontWeight: 700,
            color: '#1a1a1a',
            marginBottom: '8px',
            lineHeight: '1.4',
          }}
        >
          {post.title}
        </h3>

        <p
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            color: '#666666',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: '12px',
          }}
        >
          {post.content}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '12px',
                color: post.likes_count > 0 ? '#c9a84c' : '#aaaaaa',
              }}
            >
              ♥ {post.likes_count}
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '12px',
                color: post.comments_count > 0 ? '#666666' : '#aaaaaa',
              }}
            >
              💬 {post.comments_count}
            </span>
          </div>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#aaaaaa', margin: 0 }}>
            {formatDate(post.created_at)}
          </p>
        </div>
      </div>
    </Link>
  )
}
