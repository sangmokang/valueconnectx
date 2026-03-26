'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Applicant {
  id: string
  name: string
  email: string
  title?: string | null
  current_company?: string | null
  member_tier: string
  avatar_url?: string | null
}

interface PeerApplication {
  id: string
  chat_id: string
  applicant_id: string
  applicant: Applicant
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  contact_email?: string | null
}

interface PeerApplicationListProps {
  chatId: string
  initialApplications: PeerApplication[]
}

const tierLabel: Record<string, string> = {
  core: 'Core',
  endorsed: 'Endorsed',
}

const statusLabel: Record<string, string> = {
  pending: '검토중',
  accepted: '수락됨',
  rejected: '거절됨',
}

const statusStyle: Record<string, string> = {
  pending: 'border-[#ccc] text-vcx-sub-4',
  accepted: 'border-[#c9a84c] text-[#c9a84c]',
  rejected: 'border-red-300 text-red-500',
}

export function PeerApplicationList({ chatId, initialApplications }: PeerApplicationListProps) {
  const [applications, setApplications] = useState<PeerApplication[]>(initialApplications)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function updateStatus(appId: string, status: 'accepted' | 'rejected') {
    setLoadingId(appId)
    setError(null)
    try {
      const res = await fetch(`/api/peer-coffeechat/${chatId}/applications/${appId}`, {
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
      <div className="border border-[#e8e2d9] p-8 text-center">
        <p className="text-[14px] text-vcx-sub-4 font-vcx-sans">아직 신청자가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-[13px] text-red-600 font-vcx-sans mb-2">{error}</p>
      )}
      {applications.map((app) => (
        <div key={app.id} className="border border-[#e8e2d9] bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Avatar */}
              <div className="w-10 h-10 bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                <span className="font-vcx-serif text-[#f0ebe2] text-[14px]">
                  {app.applicant.name.charAt(0)}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-vcx-serif text-[15px] text-vcx-dark">{app.applicant.name}</p>
                  <span className="vcx-label px-1.5 py-0.5 bg-[#f0ebe2] text-vcx-sub-3">
                    {tierLabel[app.applicant.member_tier] ?? app.applicant.member_tier}
                  </span>
                  <span className={`vcx-label px-1.5 py-0.5 border ${statusStyle[app.status]}`}>
                    {statusLabel[app.status]}
                  </span>
                </div>
                <p className="text-[12px] text-vcx-sub-4 font-vcx-sans mt-0.5">
                  {[app.applicant.title, app.applicant.current_company].filter(Boolean).join(' · ')}
                </p>
                {app.status === 'accepted' && app.contact_email && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-[#c9a84c]">📧</span>
                    <a href={`mailto:${app.contact_email}`} className="text-[#1a1a1a] underline font-vcx-sans text-[13px]">
                      {app.contact_email}
                    </a>
                  </div>
                )}
                <p className="text-[13px] font-vcx-sans text-vcx-sub-2 mt-2 leading-relaxed">
                  {app.message}
                </p>
                <p className="text-[11px] text-vcx-sub-5 font-vcx-sans mt-2">
                  {new Date(app.created_at).toLocaleDateString('ko-KR')} 신청
                </p>
              </div>
            </div>

            {/* Actions */}
            {app.status === 'pending' && (
              <div className="flex gap-2 flex-shrink-0">
                <Button
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
      ))}
    </div>
  )
}
