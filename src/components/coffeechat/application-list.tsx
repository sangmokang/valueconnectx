'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Applicant {
  id: string
  name: string
  email?: string | null
  title?: string | null
  current_company?: string | null
  member_tier: string
  avatar_url?: string | null
}

interface Application {
  id: string
  session_id: string
  applicant_id: string
  applicant: Applicant
  message?: string | null
  status: 'pending' | 'accepted' | 'rejected'
  reviewed_at?: string | null
  created_at: string
  contact_email?: string | null
}

interface ApplicationListProps {
  sessionId: string
  initialApplications: Application[]
}

const tierLabel: Record<string, string> = {
  core: '코어 멤버',
  endorsed: '추천 멤버',
}

const statusLabel: Record<string, string> = {
  pending: '검토중',
  accepted: '수락됨',
  rejected: '거절됨',
}

const statusStyle: Record<string, string> = {
  pending: 'border-vcx-dark/20 text-vcx-sub-4',
  accepted: 'border-vcx-gold text-vcx-gold',
  rejected: 'border-red-300 text-red-500',
}

export function ApplicationList({ sessionId, initialApplications }: ApplicationListProps) {
  const [applications, setApplications] = useState<Application[]>(initialApplications)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function updateStatus(appId: string, status: 'accepted' | 'rejected') {
    setLoadingId(appId)
    setError(null)
    try {
      const res = await fetch(`/api/ceo-coffeechat/${sessionId}/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '처리에 실패했습니다')
        return
      }
      const contactEmail: string | null = data.data?.contact_email ?? null
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId ? { ...a, status, contact_email: contactEmail } : a
        )
      )
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoadingId(null)
    }
  }

  if (applications.length === 0) {
    return (
      <div className="border border-vcx-dark/10 p-8 text-center">
        <p className="text-[14px] text-vcx-sub-4 font-vcx-sans">아직 신청자가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-[13px] text-red-600 font-vcx-sans mb-2">{error}</p>
      )}
      {applications.map((app) => {
        const acceptedContactEmail =
          app.status === 'accepted'
            ? app.contact_email ?? null
            : null

        return (
          <div key={app.id} className="border border-vcx-dark/10 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Avatar */}
              <div className="w-10 h-10 bg-vcx-dark flex items-center justify-center flex-shrink-0">
                <span className="font-vcx-serif text-vcx-beige text-[14px]">
                  {app.applicant.name.charAt(0)}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-vcx-serif text-[15px] text-vcx-dark">{app.applicant.name}</p>
                  <span className="vcx-label px-1.5 py-0.5 bg-vcx-beige text-vcx-sub-3">
                    {tierLabel[app.applicant.member_tier] ?? app.applicant.member_tier}
                  </span>
                  <span
                    data-testid={
                      app.status === 'accepted'
                        ? 'coffeechat-status-accepted'
                        : app.status === 'pending'
                          ? 'coffeechat-status-applied'
                          : undefined
                    }
                    className={`vcx-label px-1.5 py-0.5 border ${statusStyle[app.status]}`}
                  >
                    {statusLabel[app.status]}
                  </span>
                </div>
                <p className="text-[12px] text-vcx-sub-4 font-vcx-sans mt-0.5">
                  {[app.applicant.title, app.applicant.current_company].filter(Boolean).join(' · ')}
                </p>
                {app.message && (
                  <p className="text-[13px] font-vcx-sans text-vcx-sub-2 mt-2 leading-relaxed">
                    {app.message}
                  </p>
                )}
                {acceptedContactEmail && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-vcx-gold">📧</span>
                    <a href={`mailto:${acceptedContactEmail}`} className="text-vcx-dark underline font-vcx-sans text-[13px]">
                      {acceptedContactEmail}
                    </a>
                  </div>
                )}
                <p className="text-[11px] text-vcx-sub-5 font-vcx-sans mt-2">
                  {new Date(app.created_at).toLocaleDateString('ko-KR')} 신청
                </p>
              </div>
            </div>

            {/* Actions */}
            {app.status === 'pending' && (
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  data-testid="coffeechat-accept-btn"
                  size="xs"
                  variant="gold"
                  onClick={() => updateStatus(app.id, 'accepted')}
                  disabled={loadingId === app.id}
                >
                  수락
                </Button>
                <Button
                  size="xs"
                  variant="destructive"
                  onClick={() => updateStatus(app.id, 'rejected')}
                  disabled={loadingId === app.id}
                >
                  거절
                </Button>
              </div>
            )}
          </div>
        </div>
        )
      })}
    </div>
  )
}
