import Link from 'next/link'

interface SessionCardProps {
  id: string
  title: string
  hostName: string
  hostCompany: string
  sessionDate: string
  durationMinutes: number
  locationType: 'online' | 'offline' | 'hybrid'
  tags: string[]
  applicationCount: number
  status: 'open' | 'closed' | 'completed' | 'cancelled'
  maxParticipants: number
}

const locationLabel: Record<string, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '하이브리드',
}

export function SessionCard({
  id,
  title,
  hostName,
  hostCompany,
  sessionDate,
  durationMinutes,
  locationType,
  tags,
  applicationCount,
  status,
  maxParticipants,
}: SessionCardProps) {
  const date = new Date(sessionDate)
  const dateStr = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

  return (
    <Link href={`/ceo-coffeechat/${id}`} className="block group">
      <div className="bg-white border border-[#1a1a1a] p-4 sm:p-6 hover:bg-[#f7f3ed] transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <p className="vcx-section-label mb-1">{hostCompany}</p>
            <p className="font-vcx-serif text-[13px] text-vcx-sub-3">{hostName}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span
              className={`vcx-label px-2 py-1 border ${
                status === 'open'
                  ? 'border-[#c9a84c] text-[#c9a84c]'
                  : 'border-[#999] text-[#999]'
              }`}
            >
              {status === 'open' ? '모집중' : status === 'closed' ? '마감' : status === 'completed' ? '완료' : '취소'}
            </span>
            <span className="vcx-label text-vcx-sub-4 border border-[#ccc] px-2 py-1">
              {locationLabel[locationType]}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-vcx-serif text-[18px] font-normal text-vcx-dark mb-3 leading-snug group-hover:text-[#c9a84c] transition-colors">
          {title}
        </h3>

        {/* Date / Duration */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[13px] text-vcx-sub-4 font-vcx-sans mb-4">
          <span>{dateStr} {timeStr}</span>
          <span>·</span>
          <span>{durationMinutes}분</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#e8e2d9] gap-3">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="vcx-label px-2 py-0.5 bg-[#f0ebe2] text-vcx-sub-3">
                {tag}
              </span>
            ))}
          </div>
          {/* Application count (secret) */}
          <span className="vcx-label text-vcx-sub-4">
            {applicationCount}/{maxParticipants} 신청
          </span>
        </div>
      </div>
    </Link>
  )
}
