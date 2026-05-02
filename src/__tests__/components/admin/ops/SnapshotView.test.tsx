import { render, screen } from '@testing-library/react'
import { SnapshotView } from '@/components/admin/ops/SnapshotView'

describe('SnapshotView', () => {
  it('피드백 전체 row count와 최근 피드백을 표시한다', () => {
    render(
      <SnapshotView
        snapshot={{
          timestamp: '2026-05-01T12:00:00.000Z',
          deployment: {
            env: 'test',
            commitSha: 'local',
            region: 'local',
          },
          database: {
            tables: {
              peer_coffeechat_feedback: 12,
              vcx_coffeechat_feedback: 3,
            },
          },
          feedback: {
            total: 15,
            recent: [
              {
                id: 'feedback-1',
                session_id: 'chat-1',
                source: 'peer',
                reviewer_role: 'applicant',
                overall_rating: 5,
                feedback_tags: ['인사이트 풍부'],
                comment: '다음 액션이 명확했습니다.',
                created_at: '2026-05-01T11:00:00.000Z',
              },
            ],
          },
          security: {
            envVarsPresent: {
              NEXT_PUBLIC_SUPABASE_URL: true,
            },
          },
        }}
      />
    )

    expect(screen.getByText('전체 피드백 수')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('Peer · 참여자 · 5/5')).toBeInTheDocument()
    expect(screen.getByText('다음 액션이 명확했습니다.')).toBeInTheDocument()
  })
})
