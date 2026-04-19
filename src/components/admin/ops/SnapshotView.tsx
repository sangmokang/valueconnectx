'use client'

interface Snapshot {
  timestamp: string
  deployment: {
    env: string
    commitSha: string
    region: string
  }
  database: {
    tables: Record<string, number>
  }
  security: {
    envVarsPresent: Record<string, boolean>
  }
}

const TABLE_LABELS: Record<string, string> = {
  vcx_members: '멤버',
  vcx_corporate_users: '기업 사용자',
  vcx_invites: '초대',
  vcx_recommendations: '추천',
  vcx_positions: '포지션',
  vcx_community_posts: '커뮤니티 게시글',
  vcx_ceo_coffeechat_sessions: 'CEO 커피챗',
  vcx_peer_coffeechat_stories: '피어 커피챗',
  vcx_notifications: '알림',
}

export function SnapshotView({ snapshot }: { snapshot: Snapshot }) {
  return (
    <div style={{ border: '1px solid rgba(0,0,0,0.08)', background: '#fff' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          환경 스냅샷
        </h3>
      </div>
      <div style={{ padding: '20px 24px' }}>
        {/* 배포 정보 */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', fontWeight: 600, color: '#888', marginBottom: '8px', letterSpacing: '0.05em' }}>
            배포 정보
          </h4>
          <div style={{ display: 'flex', gap: '32px', fontSize: '14px', fontFamily: 'system-ui, sans-serif' }}>
            <div><span style={{ color: '#888' }}>환경:</span> <span style={{ color: '#1a1a1a', fontWeight: 500 }}>{snapshot.deployment.env}</span></div>
            <div><span style={{ color: '#888' }}>커밋:</span> <span style={{ color: '#1a1a1a', fontFamily: 'monospace' }}>{snapshot.deployment.commitSha}</span></div>
            <div><span style={{ color: '#888' }}>리전:</span> <span style={{ color: '#1a1a1a' }}>{snapshot.deployment.region}</span></div>
          </div>
        </div>

        {/* DB 레코드 수 */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', fontWeight: 600, color: '#888', marginBottom: '8px', letterSpacing: '0.05em' }}>
            데이터베이스
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
            {Object.entries(snapshot.database.tables).map(([table, count]) => (
              <div key={table} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f5f0e8', fontSize: '13px', fontFamily: 'system-ui, sans-serif' }}>
                <span style={{ color: '#555' }}>{TABLE_LABELS[table] || table}</span>
                <span style={{ fontWeight: 600, color: count === -1 ? '#dc2626' : '#1a1a1a' }}>
                  {count === -1 ? '오류' : count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 환경변수 상태 */}
        <div>
          <h4 style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', fontWeight: 600, color: '#888', marginBottom: '8px', letterSpacing: '0.05em' }}>
            환경변수
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.entries(snapshot.security.envVarsPresent).map(([key, present]) => (
              <span key={key} style={{
                padding: '4px 10px', fontSize: '12px', fontFamily: 'monospace',
                background: present ? '#f0fdf4' : '#fef2f2',
                color: present ? '#16a34a' : '#dc2626',
                border: `1px solid ${present ? '#bbf7d0' : '#fecaca'}`,
              }}>
                {present ? '✓' : '✗'} {key}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
