'use client'

import { useState } from 'react'

const QUICK_EMOJIS = ['🤝', '💡', '🔥', '🧠', '🌱', '🎯']

export interface Reaction {
  e: string
  n: number
}

interface EmojiReactionsProps {
  reactions: Reaction[]
  onReact: (emoji: string) => void
}

export function EmojiReactions({ reactions, onReact }: EmojiReactionsProps) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', alignItems: 'center' }}>
      {reactions.map((r) => (
        <button
          key={r.e}
          onClick={() => onReact(r.e)}
          style={{
            padding: '5px 12px',
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '100px',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {r.e} {r.n}
        </button>
      ))}

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowPicker((v) => !v)}
          style={{
            padding: '5px 12px',
            background: 'none',
            border: '1px dashed rgba(0,0,0,0.15)',
            borderRadius: '100px',
            fontSize: '13px',
            cursor: 'pointer',
            color: '#b0a898',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          + 반응
        </button>

        {showPicker && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              padding: '10px',
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              width: '156px',
              zIndex: 10,
            }}
          >
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => {
                  onReact(e)
                  setShowPicker(false)
                }}
                style={{
                  fontSize: '18px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 4px',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
