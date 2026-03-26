'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'Georgia, serif',
            background: '#f0ebe2',
            color: '#1a1a1a',
            padding: '20px',
          }}
        >
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>
            문제가 발생했습니다
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '24px',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            일시적인 오류가 발생했습니다. 다시 시도해주세요.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#1a1a1a',
              color: '#f0ebe2',
              padding: '12px 24px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            다시 시도 →
          </button>
        </div>
      </body>
    </html>
  )
}
