import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProtectedPageWrapper } from '@/components/layout/protected-page-wrapper'
import { ReportActionForm } from '@/components/admin/report-action-form'

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABELS: Record<string, string> = {
  pending: '처리 대기',
  reviewed: '검토 완료',
  action_taken: '조치 완료',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#c9a84c',
  reviewed: '#888888',
  action_taken: '#1a1a1a',
}

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) notFound()

  const { data: member } = await supabase
    .from('vcx_members')
    .select('system_role')
    .eq('id', user.id)
    .in('system_role', ['super_admin', 'admin'])
    .single()

  if (!member) notFound()

  const adminSupabase = createAdminClient()
  const { data: reports } = await adminSupabase
    .from('community_reports')
    .select('id, reporter_id, post_id, comment_id, reason, status, created_at, community_posts(id, title, status), community_comments(id, content, status)')
    .order('created_at', { ascending: false })
    .limit(50)

  const pendingCount = (reports ?? []).filter((r) => r.status === 'pending').length

  return (
    <ProtectedPageWrapper currentPath="/admin/reports">
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 40px 60px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 800, color: '#1a1a1a', marginBottom: '8px' }}>
            신고 관리
          </h1>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#888888' }}>
            처리 대기 {pendingCount}건
          </p>
        </div>

        {(!reports || reports.length === 0) ? (
          <div style={{ padding: '48px 0', textAlign: 'center', fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#aaaaaa' }}>
            접수된 신고가 없습니다
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reports.map((report) => {
              const post = Array.isArray(report.community_posts) ? report.community_posts[0] : report.community_posts
              const comment = Array.isArray(report.community_comments) ? report.community_comments[0] : report.community_comments
              return (
                <div
                  key={report.id}
                  style={{
                    background: '#ffffff',
                    border: `1px solid ${report.status === 'pending' ? '#c9a84c' : '#e0d9ce'}`,
                    padding: '20px 24px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'system-ui, sans-serif',
                        padding: '2px 8px',
                        background: report.status === 'pending' ? '#fff8e6' : '#f5f0eb',
                        color: STATUS_COLORS[report.status] ?? '#888888',
                        border: `1px solid ${STATUS_COLORS[report.status] ?? '#e0d9ce'}`,
                      }}
                    >
                      {STATUS_LABELS[report.status] ?? report.status}
                    </span>
                    <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#aaaaaa' }}>
                      {formatDate(report.created_at)}
                    </span>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#555555', marginBottom: '4px' }}>
                      신고 사유
                    </p>
                    <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#1a1a1a', lineHeight: '1.5' }}>
                      {report.reason}
                    </p>
                  </div>

                  {post && (
                    <div style={{ marginBottom: '8px', padding: '10px 12px', background: '#f5f0eb', border: '1px solid #e0d9ce' }}>
                      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#888888', marginBottom: '4px' }}>
                        신고된 게시글 {post.status !== 'active' && `(${post.status})`}
                      </p>
                      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#1a1a1a' }}>
                        {post.title}
                      </p>
                    </div>
                  )}

                  {comment && (
                    <div style={{ marginBottom: '8px', padding: '10px 12px', background: '#f5f0eb', border: '1px solid #e0d9ce' }}>
                      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#888888', marginBottom: '4px' }}>
                        신고된 댓글 {comment.status !== 'active' && `(${comment.status})`}
                      </p>
                      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#1a1a1a', lineHeight: '1.5' }}>
                        {comment.content}
                      </p>
                    </div>
                  )}

                  {report.status === 'pending' && (
                    <ReportActionForm
                      reportId={report.id}
                      hasPost={!!post && post.status === 'active'}
                      hasComment={!!comment && comment.status === 'active'}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ProtectedPageWrapper>
  )
}
