'use client'

import { useState, useCallback } from 'react'
import useSWR, { mutate } from 'swr'
import { LoungeSidebar, LOUNGE_CATS, LoungeCatKey } from './lounge-sidebar'
import { LoungePostRow, LoungePost, LoungeComment } from './lounge-post-row'
import { LoungeWriteModal } from './lounge-write-modal'
import { Reaction } from './emoji-reactions'

// ─── Category key mapping: lounge UI key → DB category value ──────────────
// The DB uses the original category values; the new UI keys match or we map them.
// New lounge cats: all | reading | career | company | leadership | productivity | casual
// DB cats: career | leadership | salary | burnout | productivity | company_review
// We use the lounge keys as-is when posting; DB may not have reading/company/casual
// but we store them anyway via the POST (server accepts any non-empty string from client).
// For GET filtering we pass the key directly.

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface ApiPost {
  id: string
  author_id: string | null
  category: string
  title: string
  content: string
  is_anonymous: boolean
  status: string
  created_at: string
  updated_at: string
  likes_count: number
  comments_count: number
}

interface ApiComment {
  id: string
  post_id: string
  author_id: string | null
  content: string
  is_anonymous: boolean
  status: string
  created_at: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}시간 전`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}일 전`
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function toLoungeCat(cat: string): LoungeCatKey {
  const map: Record<string, LoungeCatKey> = {
    career: 'career',
    leadership: 'leadership',
    productivity: 'productivity',
    reading: 'reading',
    company: 'company',
    company_review: 'company',
    casual: 'casual',
    salary: 'casual',
    burnout: 'casual',
  }
  return map[cat] ?? 'casual'
}

function apiPostToLounge(p: ApiPost): LoungePost {
  return {
    id: p.id,
    cat: toLoungeCat(p.category),
    title: p.title,
    body: p.content,
    author: '익명 멤버',
    tier: 'Core',
    time: timeAgo(p.created_at),
    views: 0,
    reactions: p.likes_count > 0 ? [{ e: '🤝', n: p.likes_count }] : [],
    comments: [],
  }
}

export function LoungeFeed() {
  const [activeCat, setActiveCat] = useState<LoungeCatKey>('all')
  const [openPost, setOpenPost] = useState<string | null>(null)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [showWrite, setShowWrite] = useState(false)
  // Local state for optimistic posts (newly created + fetched)
  const [localPosts, setLocalPosts] = useState<LoungePost[]>([])
  const [localInited, setLocalInited] = useState(false)

  // Fetch posts
  const swrKey = activeCat === 'all' ? '/api/community' : `/api/community?category=${activeCat}`
  const { data, isLoading } = useSWR<{ data: ApiPost[]; total: number }>(swrKey, fetcher, {
    onSuccess(result) {
      const fetched = (result.data ?? []).map(apiPostToLounge)
      if (!localInited) {
        setLocalPosts(fetched)
        setLocalInited(true)
      } else {
        // Merge: keep local-only posts on top, update existing by id
        setLocalPosts((prev) => {
          const fetchedIds = new Set(fetched.map((p) => p.id))
          const localOnly = prev.filter((p) => !fetchedIds.has(p.id))
          return [...localOnly, ...fetched]
        })
      }
    },
  })

  // Fetch comments for open post
  const { data: commentsData } = useSWR<{ data: ApiComment[] }>(
    openPost ? `/api/community/${openPost}/comments` : null,
    fetcher
  )

  // Merge server comments into the open post
  const postsWithComments = localPosts.map((p) => {
    if (p.id !== openPost || !commentsData?.data) return p
    const serverComments: LoungeComment[] = commentsData.data.map((c) => ({
      id: c.id,
      author: c.is_anonymous ? '익명 멤버' : '멤버',
      time: timeAgo(c.created_at),
      content: c.content,
      reactions: [],
    }))
    return { ...p, comments: serverComments }
  })

  const filtered =
    activeCat === 'all' ? postsWithComments : postsWithComments.filter((p) => p.cat === activeCat)

  const activeCatObj = LOUNGE_CATS.find((c) => c.key === activeCat)

  // Count by category
  const counts = LOUNGE_CATS.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.key] =
      cat.key === 'all'
        ? postsWithComments.length
        : postsWithComments.filter((p) => p.cat === cat.key).length
    return acc
  }, {})

  const handleReact = useCallback(
    async (postId: string, emoji: string) => {
      // Optimistic update
      setLocalPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p
          const existing = p.reactions.find((r) => r.e === emoji)
          const reactions: Reaction[] = existing
            ? p.reactions.map((r) => (r.e === emoji ? { ...r, n: r.n + 1 } : r))
            : [...p.reactions, { e: emoji, n: 1 }]
          return { ...p, reactions }
        })
      )
      // Call API with 'like' reaction type (server-compatible)
      try {
        await fetch(`/api/community/${postId}/reaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reaction_type: 'like' }),
        })
        mutate(`/api/community/${postId}/reaction`)
      } catch {
        // silent
      }
    },
    []
  )

  const handleComment = useCallback(
    async (postId: string) => {
      const text = commentInputs[postId]?.trim()
      if (!text) return

      // Optimistic update
      const newComment: LoungeComment = {
        id: `local-${Date.now()}`,
        author: '나 (익명)',
        time: '방금',
        content: text,
        reactions: [],
      }
      setLocalPosts((prev) =>
        prev.map((p) =>
          p.id !== postId ? p : { ...p, comments: [...p.comments, newComment] }
        )
      )
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }))

      try {
        await fetch(`/api/community/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text, is_anonymous: true }),
        })
        mutate(`/api/community/${postId}/comments`)
      } catch {
        // silent
      }
    },
    [commentInputs]
  )

  const handleWrite = useCallback(
    async (form: { cat: LoungeCatKey; title: string; body: string; anon: boolean }) => {
      // Map lounge cat to DB category
      const catMap: Record<LoungeCatKey, string> = {
        all: 'career',
        reading: 'reading',
        career: 'career',
        company: 'company',
        leadership: 'leadership',
        productivity: 'productivity',
        casual: 'casual',
      }
      const category = catMap[form.cat]

      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title: form.title,
          content: form.body,
          is_anonymous: form.anon,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        const newPost: LoungePost = {
          id: json.data?.id ?? `local-${Date.now()}`,
          cat: form.cat === 'all' ? 'career' : form.cat,
          title: form.title,
          body: form.body,
          author: form.anon ? '익명 멤버' : '멤버',
          tier: 'Core',
          time: '방금',
          views: 1,
          reactions: [],
          comments: [],
        }
        setLocalPosts((prev) => [newPost, ...prev])
        mutate('/api/community')
      }
    },
    []
  )

  return (
    <>
      {/* Mobile category tabs */}
      <div
        style={{
          display: 'none',
          overflowX: 'auto',
          gap: '8px',
          padding: '0 16px 16px',
        }}
        className="lounge-mobile-tabs"
      >
        {LOUNGE_CATS.map((cat) => (
          <button
            key={cat.key}
            onClick={() => { setActiveCat(cat.key); setOpenPost(null) }}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              border: `1px solid ${activeCat === cat.key ? '#1a1a1a' : 'rgba(0,0,0,0.1)'}`,
              background: activeCat === cat.key ? '#1a1a1a' : 'transparent',
              color: activeCat === cat.key ? '#c9a84c' : '#555',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, sans-serif',
              flexShrink: 0,
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '32px 48px 80px',
          display: 'grid',
          gridTemplateColumns: '200px 1fr',
          gap: '24px',
          alignItems: 'start',
        }}
        className="lounge-grid"
      >
        {/* Sidebar */}
        <div className="lounge-sidebar-wrap">
          <LoungeSidebar
            active={activeCat}
            counts={counts}
            onSelect={(key) => { setActiveCat(key); setOpenPost(null) }}
          />
        </div>

        {/* Feed */}
        <div>
          {/* Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#1a1a1a',
                  fontFamily: 'Georgia, serif',
                  marginBottom: '2px',
                }}
              >
                {activeCatObj?.icon} {activeCatObj?.label}
              </div>
              <div
                style={{
                  fontSize: '12.5px',
                  color: '#b0a898',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {filtered.length}개의 대화
              </div>
            </div>
            <button
              onClick={() => setShowWrite(true)}
              style={{
                padding: '10px 20px',
                background: '#1a1a1a',
                color: '#f5f0e8',
                border: 'none',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              ✏️ 글 쓰기
            </button>
          </div>

          {/* Post list */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}
          >
            {isLoading && localPosts.length === 0 ? (
              <div style={{ padding: '48px 0', textAlign: 'center' }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: '80px',
                      margin: '0 24px 8px',
                      background: '#f5f0e8',
                      opacity: 0.5,
                    }}
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div
                style={{
                  padding: '72px 0',
                  textAlign: 'center',
                  color: '#b0a898',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>✍️</div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#1a1a1a',
                    marginBottom: '6px',
                  }}
                >
                  이 카테고리의 첫 번째 글을 남겨보세요
                </div>
                <div style={{ fontSize: '13.5px' }}>이 카테고리의 첫 번째 글을 남겨보세요</div>
              </div>
            ) : (
              filtered.map((post, idx) => (
                <LoungePostRow
                  key={post.id}
                  post={post}
                  showCatBadge={activeCat === 'all'}
                  isOpen={openPost === post.id}
                  isLast={idx === filtered.length - 1}
                  onToggle={() => setOpenPost(openPost === post.id ? null : post.id)}
                  onReact={(e) => handleReact(post.id, e)}
                  comment={commentInputs[post.id] ?? ''}
                  onCommentChange={(v) =>
                    setCommentInputs((prev) => ({ ...prev, [post.id]: v }))
                  }
                  onComment={() => handleComment(post.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Write modal */}
      {showWrite && (
        <LoungeWriteModal onClose={() => setShowWrite(false)} onSubmit={handleWrite} />
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .lounge-grid {
            grid-template-columns: 1fr !important;
            padding: 16px 16px 60px !important;
          }
          .lounge-sidebar-wrap {
            display: none !important;
          }
          .lounge-mobile-tabs {
            display: flex !important;
          }
        }
      `}</style>
    </>
  )
}
