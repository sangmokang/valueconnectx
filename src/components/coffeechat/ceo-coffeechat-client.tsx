'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { CeoHero } from '@/components/coffeechat/ceo-hero'
import { CeoSessionCard, type CeoSession } from '@/components/coffeechat/ceo-session-card'
import { CeoApplyModal } from '@/components/coffeechat/ceo-apply-modal'

interface ApiResponse {
  data: CeoSession[]
  total: number
  page: number
  limit: number
}

async function fetcher(url: string): Promise<ApiResponse> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('세션 목록을 불러오지 못했습니다')
  return res.json()
}

export function CeoCoffeechatClient() {
  const { data, error, mutate } = useSWR<ApiResponse>(
    '/api/ceo-coffeechat?status=open&limit=50',
    fetcher
  )

  const [openSessionId, setOpenSessionId] = useState<string | null>(null)
  const [applyModal, setApplyModal] = useState<CeoSession | null>(null)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())

  const sessions = data?.data ?? []

  const totalApplicants = sessions.reduce((sum, s) => sum + (s.application_count ?? 0), 0)
  const totalSlots = sessions.reduce((sum, s) => sum + (s.max_participants ?? 0), 0)

  const handleToggle = useCallback(
    (id: string) => {
      setOpenSessionId((prev) => (prev === id ? null : id))
    },
    []
  )

  const handleApply = useCallback((session: CeoSession) => {
    setApplyModal(session)
  }, [])

  const handleSubmitApply = useCallback(
    async (sessionId: string, message: string) => {
      const res = await fetch(`/api/ceo-coffeechat/${sessionId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(
          (body as { message?: string }).message ?? '신청에 실패했습니다'
        )
      }

      setAppliedIds((prev) => new Set([...prev, sessionId]))
      await mutate()
    },
    [mutate]
  )

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f5f0e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          color: '#555',
        }}
      >
        세션 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
      </div>
    )
  }

  return (
    <div style={{ background: '#f5f0e8', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <CeoHero
        sessionCount={sessions.length}
        totalApplicants={totalApplicants}
        totalSlots={totalSlots}
      />

      {/* Sessions list */}
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          padding: '48px 24px 80px',
        }}
      >
        {!data ? (
          // Loading skeleton
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 120,
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.08)',
                  opacity: 0.5,
                }}
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div
            style={{
              padding: '96px 0',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 20,
                color: '#888',
                margin: '0 0 8px',
              }}
            >
              다음 CEO 커피챗 세션을 준비하고 있습니다. 곧 새로운 세션이 열립니다
            </p>
            <p
              style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: 14,
                color: '#b0a898',
                margin: 0,
              }}
            >
              곧 CEO 커피챗 세션이 열릴 예정입니다
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {sessions.map((session) => (
              <CeoSessionCard
                key={session.id}
                session={session}
                isOpen={openSessionId === session.id}
                onToggle={() => handleToggle(session.id)}
                isApplied={appliedIds.has(session.id)}
                onApply={() => handleApply(session)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Apply modal */}
      {applyModal && (
        <CeoApplyModal
          session={{
            id: applyModal.id,
            company: applyModal.host?.company ?? '',
            hostName: applyModal.host?.name ?? '',
            hostTitle: applyModal.host?.title ?? '',
          }}
          onClose={() => setApplyModal(null)}
          onSubmit={handleSubmitApply}
        />
      )}
    </div>
  )
}
