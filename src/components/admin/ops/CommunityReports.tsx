'use client'

import useSWR from 'swr'

interface Report {
  id: string
  reporter_id: string
  post_id: string | null
  comment_id: string | null
  reason: string
  status: 'pending' | 'reviewed' | 'action_taken'
  created_at: string
  community_posts: { id: string; title: string; status: string } | null
  community_comments: { id: string; content: string; status: string } | null
}

interface ApiResponse {
  data: Report[]
  total: number
  page: number
  limit: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: '#fef3c7', color: '#b45309', label: '대기 중' },
  reviewed: { bg: '#dbeafe', color: '#1e40af', label: '검토됨' },
  action_taken: { bg: '#dcfce7', color: '#15803d', label: '처리됨' },
}

export function CommunityReports() {
  const { data, error, isLoading } = useSWR<ApiResponse>('/api/community/reports?limit=10', fetcher, {
    revalidateOnFocus: false,
  })

  const total = data?.total ?? 0
  const reports = data?.data ?? []

  return (
    <div style={{ border: '1px solid rgba(0,0,0,0.08)', background: '#fff' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 700, color: 'var(--color-vcx-dark)', margin: 0 }}>
          커뮤니티 신고
        </h3>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: 'var(--color-vcx-sub-4)', marginTop: '4px', margin: '4px 0 0 0' }}>
          총 {total}건의 신고 · 최근 10건 표시
        </p>
      </div>

      {error && (
        <div style={{ padding: '16px 24px', background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#dc2626', margin: 0 }}>
            신고 데이터를 불러올 수 없습니다.
          </p>
        </div>
      )}

      {isLoading && !data && (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: 'var(--color-vcx-sub-4)' }}>로딩 중...</p>
        </div>
      )}

      {data && reports.length === 0 && (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: 'var(--color-vcx-sub-4)' }}>신고가 없습니다.</p>
        </div>
      )}

      {data && reports.length > 0 && (
        <div style={{ padding: '20px 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'system-ui, sans-serif', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--color-vcx-sub-4)', fontWeight: 500, fontSize: '12px' }}>
                  신고 대상
                </th>
                <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--color-vcx-sub-4)', fontWeight: 500, fontSize: '12px' }}>
                  사유
                </th>
                <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--color-vcx-sub-4)', fontWeight: 500, fontSize: '12px' }}>
                  상태
                </th>
                <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--color-vcx-sub-4)', fontWeight: 500, fontSize: '12px' }}>
                  신고일시
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const target = report.community_posts
                  ? `게시물: ${report.community_posts.title || `(ID: ${report.community_posts.id.slice(0, 8)})`}`
                  : report.community_comments
                    ? `댓글: ${report.community_comments.content.slice(0, 50)}${report.community_comments.content.length > 50 ? '...' : ''}`
                    : '(삭제됨)'

                const statusStyle = STATUS_BADGE[report.status] || STATUS_BADGE.pending
                const reportedAt = new Date(report.created_at).toLocaleString('ko-KR')

                return (
                  <tr key={report.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td style={{ padding: '10px 0', color: 'var(--color-vcx-dark)', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {target}
                    </td>
                    <td style={{ padding: '10px 0', color: 'var(--color-vcx-sub-3)', fontSize: '13px' }}>{report.reason}</td>
                    <td style={{ padding: '10px 0' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {statusStyle.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 0', color: 'var(--color-vcx-sub-4)', fontSize: '12px' }}>{reportedAt}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
