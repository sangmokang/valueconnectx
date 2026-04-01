'use client'

import { LOUNGE_CATS, LoungeCatKey } from './lounge-sidebar'
import { EmojiReactions, Reaction } from './emoji-reactions'

export interface LoungeComment {
  id: string
  author: string
  time: string
  content: string
  reactions: Reaction[]
}

export interface LoungePost {
  id: string
  cat: LoungeCatKey
  title: string
  body: string
  author: string
  tier: 'Core' | 'Endorsed'
  time: string
  views: number
  reactions: Reaction[]
  comments: LoungeComment[]
}

interface LoungePostRowProps {
  post: LoungePost
  showCatBadge: boolean
  isOpen: boolean
  isLast: boolean
  onToggle: () => void
  onReact: (emoji: string) => void
  comment: string
  onCommentChange: (v: string) => void
  onComment: () => void
}

export function LoungePostRow({
  post,
  showCatBadge,
  isOpen,
  isLast,
  onToggle,
  onReact,
  comment,
  onCommentChange,
  onComment,
}: LoungePostRowProps) {
  const catObj = LOUNGE_CATS.find((c) => c.key === post.cat)

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.08)' }}>
      {/* Row header */}
      <div
        onClick={onToggle}
        style={{
          padding: '18px 24px',
          cursor: 'pointer',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
          background: isOpen ? '#faf8f4' : '#ffffff',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Meta row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '7px',
              flexWrap: 'wrap',
            }}
          >
            {showCatBadge && catObj && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  background: '#f5f0e8',
                  border: '1px solid rgba(0,0,0,0.08)',
                  color: '#b0a898',
                  borderRadius: '100px',
                  flexShrink: 0,
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {catObj.icon} {catObj.label}
              </span>
            )}
            <span
              style={{
                fontSize: '11px',
                padding: '1px 7px',
                background:
                  post.tier === 'Core' ? 'rgba(26,26,26,0.07)' : 'rgba(0,0,0,0.04)',
                color: post.tier === 'Core' ? '#1a1a1a' : '#b0a898',
                borderRadius: '3px',
                fontWeight: 600,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {post.tier}
            </span>
            <span
              style={{
                fontSize: '12px',
                color: '#b0a898',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {post.author}
            </span>
            <span style={{ fontSize: '12px', color: '#ccc' }}>·</span>
            <span
              style={{
                fontSize: '12px',
                color: '#b0a898',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {post.time}
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#1a1a1a',
              lineHeight: 1.45,
              fontFamily: 'Georgia, serif',
              marginBottom: '6px',
            }}
          >
            {post.title}
          </div>

          {/* Preview — collapsed only */}
          {!isOpen && (
            <div
              style={{
                fontSize: '13px',
                color: '#888',
                lineHeight: 1.6,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {post.body}
            </div>
          )}
        </div>

        {/* Right stats */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            <span
              style={{
                fontSize: '12px',
                color: '#b0a898',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              👁 {post.views}
            </span>
            <span
              style={{
                fontSize: '12px',
                color: '#b0a898',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              💬 {post.comments.length}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            {post.reactions.slice(0, 3).map((r) => (
              <span
                key={r.e}
                style={{
                  fontSize: '11.5px',
                  background: '#f5f0e8',
                  padding: '1px 7px',
                  borderRadius: '100px',
                  color: '#888',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {r.e} {r.n}
              </span>
            ))}
          </div>
          <span
            style={{
              fontSize: '12px',
              color: '#ccc',
              display: 'inline-block',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
              marginTop: '2px',
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Expanded body */}
      {isOpen && (
        <div
          style={{
            padding: '0 24px 24px',
            background: '#faf8f4',
            borderTop: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <p
            style={{
              fontSize: '14.5px',
              color: '#555',
              lineHeight: 1.9,
              padding: '20px 0',
              margin: 0,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {post.body}
          </p>

          {/* Reactions */}
          <div
            style={{
              paddingBottom: '20px',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <EmojiReactions reactions={post.reactions} onReact={onReact} />
          </div>

          {/* Comments */}
          {post.comments.length > 0 && (
            <div
              style={{
                paddingTop: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '14px',
              }}
            >
              {post.comments.map((c, i) => (
                <div key={c.id || i} style={{ display: 'flex', gap: '10px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      background: '#e8e2d9',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#1a1a1a',
                      flexShrink: 0,
                      marginTop: '1px',
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    {c.author[0]}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background: '#ffffff',
                      padding: '11px 14px',
                      border: '1px solid rgba(0,0,0,0.08)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '4px',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 700,
                          color: '#1a1a1a',
                          fontFamily: 'system-ui, sans-serif',
                        }}
                      >
                        {c.author}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#b0a898',
                          fontFamily: 'system-ui, sans-serif',
                        }}
                      >
                        {c.time}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '13.5px',
                        color: '#555',
                        lineHeight: 1.75,
                        margin: 0,
                        fontFamily: 'system-ui, sans-serif',
                      }}
                    >
                      {c.content}
                    </p>
                    {c.reactions.length > 0 && (
                      <div style={{ marginTop: '7px', display: 'flex', gap: '5px' }}>
                        {c.reactions.map((r) => (
                          <span
                            key={r.e}
                            style={{
                              fontSize: '12px',
                              fontFamily: 'system-ui, sans-serif',
                            }}
                          >
                            {r.e} {r.n}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                background: '#1a1a1a',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: 700,
                color: '#c9a84c',
                flexShrink: 0,
                marginTop: '3px',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              나
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
              <input
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onComment()}
                placeholder="익명으로 댓글 달기..."
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  border: '1px solid rgba(0,0,0,0.12)',
                  background: '#ffffff',
                  fontSize: '13.5px',
                  outline: 'none',
                  fontFamily: 'system-ui, sans-serif',
                }}
              />
              <button
                onClick={onComment}
                style={{
                  padding: '9px 16px',
                  background: '#1a1a1a',
                  color: '#f5f0e8',
                  border: 'none',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
