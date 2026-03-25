interface HostProfile {
  id: string
  name: string
  title?: string
  company: string
  role: string
}

interface SessionDetailProps {
  title: string
  description: string
  sessionDate: string
  durationMinutes: number
  locationType: 'online' | 'offline' | 'hybrid'
  locationDetail?: string
  status: 'open' | 'closed' | 'completed' | 'cancelled'
  targetTier?: string
  tags: string[]
  applicationCount: number
  maxParticipants: number
  host: HostProfile
}

const locationLabel: Record<string, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '하이브리드',
}

const roleLabel: Record<string, string> = {
  ceo: 'CEO',
  founder: 'Founder',
  c_level: 'C-Level',
  hr_leader: 'HR Leader',
}

const tierLabel: Record<string, string> = {
  core: 'Core Member',
  endorsed: 'Endorsed Member',
  all: '전체 멤버',
}

export function SessionDetail({
  title,
  description,
  sessionDate,
  durationMinutes,
  locationType,
  locationDetail,
  status,
  targetTier,
  tags,
  applicationCount,
  maxParticipants,
  host,
}: SessionDetailProps) {
  const date = new Date(sessionDate)
  const dateStr = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-8">
      {/* Host profile */}
      <div className="bg-[#f7f3ed] border border-[#e8e2d9] p-4 sm:p-6">
        <p className="vcx-section-label mb-3">Host</p>
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-12 h-12 bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
            <span className="font-vcx-serif text-[#f0ebe2] text-[18px]">
              {host.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-vcx-serif text-[20px] text-vcx-dark">{host.name}</p>
            <p className="text-[13px] text-vcx-sub-3 font-vcx-sans mt-0.5">
              {host.title && `${host.title} · `}{host.company}
            </p>
            <span className="vcx-label px-2 py-0.5 border border-[#c9a84c] text-[#c9a84c] mt-2 inline-block">
              {roleLabel[host.role] ?? host.role}
            </span>
          </div>
        </div>
      </div>

      {/* Session info */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="font-vcx-serif text-[22px] sm:text-[28px] font-normal text-vcx-dark leading-tight flex-1">
            {title}
          </h1>
          <span
            className={`vcx-label px-3 py-1.5 border flex-shrink-0 ${
              status === 'open'
                ? 'border-[#c9a84c] text-[#c9a84c]'
                : 'border-[#999] text-[#999]'
            }`}
          >
            {status === 'open' ? '모집중' : status === 'closed' ? '마감' : status === 'completed' ? '완료' : '취소'}
          </span>
        </div>

        {/* Meta info grid */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border border-[#e8e2d9] p-4 sm:p-5 mb-6">
          <div>
            <dt className="vcx-label text-vcx-sub-4 mb-1">날짜</dt>
            <dd className="text-[13px] font-vcx-sans text-vcx-dark">{dateStr}</dd>
          </div>
          <div>
            <dt className="vcx-label text-vcx-sub-4 mb-1">시간</dt>
            <dd className="text-[13px] font-vcx-sans text-vcx-dark">{timeStr} ({durationMinutes}분)</dd>
          </div>
          <div>
            <dt className="vcx-label text-vcx-sub-4 mb-1">장소</dt>
            <dd className="text-[13px] font-vcx-sans text-vcx-dark">
              {locationLabel[locationType]}
              {locationDetail && <span className="block text-vcx-sub-4">{locationDetail}</span>}
            </dd>
          </div>
          <div>
            <dt className="vcx-label text-vcx-sub-4 mb-1">신청 현황</dt>
            <dd className="text-[13px] font-vcx-sans text-vcx-dark">{applicationCount} / {maxParticipants}명</dd>
          </div>
          {targetTier && (
            <div>
              <dt className="vcx-label text-vcx-sub-4 mb-1">대상</dt>
              <dd className="text-[13px] font-vcx-sans text-vcx-dark">{tierLabel[targetTier] ?? targetTier}</dd>
            </div>
          )}
        </dl>

        {/* Description */}
        <div className="prose prose-sm max-w-none font-vcx-sans text-vcx-dark leading-relaxed whitespace-pre-wrap mb-6">
          {description}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="vcx-label px-3 py-1 bg-[#f0ebe2] border border-[#e8e2d9] text-vcx-sub-3">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
