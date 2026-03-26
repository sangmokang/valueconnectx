import { ReportButton } from './report-button'

export interface CommunityComment {
  id: string
  post_id: string
  author_id: string | null
  content: string
  is_anonymous: boolean
  status: string
  created_at: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function CommentList({ comments, postId }: { comments: CommunityComment[]; postId: string }) {
  if (comments.length === 0) {
    return (
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#aaaaaa', textAlign: 'center', padding: '32px 0' }}>
        첫 번째 댓글을 작성해보세요
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      {comments.map((comment) => (
        <div
          key={comment.id}
          style={{
            padding: '16px 20px',
            background: '#faf8f5',
            borderBottom: '1px solid #e0d9ce',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#888888' }}>
                {comment.is_anonymous ? '익명' : '멤버'}
              </span>
              <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#bbbbbb' }}>
                {formatDate(comment.created_at)}
              </span>
            </div>
            <ReportButton postId={postId} commentId={comment.id} />
          </div>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: 0 }}>
            {comment.content}
          </p>
        </div>
      ))}
    </div>
  )
}
