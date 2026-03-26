import Link from 'next/link'

interface PeerChatCardProps {
  id: string
  title: string
  content: string
  category: 'general' | 'career' | 'hiring' | 'mentoring'
  status: 'open' | 'matched' | 'closed'
  authorName: string
  authorTitle?: string | null
  authorCompany?: string | null
  createdAt: string
  applicationCount: number
}

const categoryLabel: Record<string, string> = {
  general: '일반',
  career: '커리어',
  hiring: '채용',
  mentoring: '멘토링',
}

const statusLabel: Record<string, string> = {
  open: '신청 받는 중',
  matched: '매칭 완료',
  closed: '마감',
}

export function PeerChatCard({
  id,
  title,
  content,
  category,
  status,
  authorName,
  authorTitle,
  authorCompany,
  createdAt,
  applicationCount,
}: PeerChatCardProps) {
  const dateStr = new Date(createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const excerpt = content.length > 120 ? content.slice(0, 120) + '…' : content

  return (
    <Link href={`/coffeechat/${id}`} className="block group">
      <div className="bg-white border border-[#1a1a1a] p-6 hover:bg-[#f7f3ed] transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="vcx-label px-2 py-1 bg-[#f0ebe2] text-vcx-sub-3">
              {categoryLabel[category]}
            </span>
            <span
              className={`vcx-label px-2 py-1 border ${
                status === 'open'
                  ? 'border-[#c9a84c] text-[#c9a84c]'
                  : 'border-[#999] text-[#999]'
              }`}
            >
              {statusLabel[status]}
            </span>
          </div>
          <span className="vcx-label text-vcx-sub-5 flex-shrink-0">{dateStr}</span>
        </div>

        {/* Title */}
        <h3 className="font-vcx-serif text-[18px] font-normal text-vcx-dark mb-2 leading-snug group-hover:text-[#c9a84c] transition-colors">
          {title}
        </h3>

        {/* Excerpt */}
        <p className="text-[13px] font-vcx-sans text-vcx-sub-3 leading-relaxed mb-4">
          {excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#e8e2d9]">
          <div>
            <p className="font-vcx-serif text-[13px] text-vcx-dark">{authorName}</p>
            {(authorTitle || authorCompany) && (
              <p className="text-[11px] font-vcx-sans text-vcx-sub-4 mt-0.5">
                {[authorTitle, authorCompany].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <span className="vcx-label text-vcx-sub-4">
            {applicationCount}명 신청
          </span>
        </div>
      </div>
    </Link>
  )
}
