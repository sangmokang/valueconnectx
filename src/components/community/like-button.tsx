'use client'

import { useState, useEffect } from 'react'

interface LikeButtonProps {
  postId: string
  initialCount?: number
  initialLiked?: boolean
}

export function LikeButton({ postId, initialCount = 0, initialLiked = false }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/community/${postId}/reaction`)
      .then((r) => r.json())
      .then((data) => {
        setCount(data.counts?.like ?? 0)
        setLiked(data.userReactions?.includes('like') ?? false)
      })
      .catch(() => {})
  }, [postId])

  async function handleToggle() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/community/${postId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction_type: 'like' }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.action === 'added') {
          setLiked(true)
          setCount((c) => c + 1)
        } else {
          setLiked(false)
          setCount((c) => Math.max(0, c - 1))
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 12px',
        border: `1px solid ${liked ? '#c9a84c' : '#e0d9ce'}`,
        background: liked ? '#fff8e6' : 'transparent',
        color: liked ? '#c9a84c' : '#888888',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        cursor: loading ? 'not-allowed' : 'pointer',
        borderRadius: 0,
        transition: 'border-color 0.15s, background 0.15s, color 0.15s',
        opacity: loading ? 0.6 : 1,
      }}
      title={liked ? '공감 취소' : '공감'}
    >
      <span style={{ fontSize: '14px' }}>{liked ? '♥' : '♡'}</span>
      <span>{count > 0 ? count : '공감'}</span>
    </button>
  )
}
