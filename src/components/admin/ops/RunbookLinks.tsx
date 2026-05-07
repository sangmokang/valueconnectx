'use client'

const RUNBOOKS = [
  { id: '01', title: '장애 대응', description: 'Vercel/Supabase/Redis 장애 시 대응 절차', icon: '🚨' },
  { id: '02', title: '백업 검증', description: 'Supabase 백업 확인 및 데이터 무결성 체크', icon: '💾' },
  { id: '03', title: '보안 사고', description: 'API 키 유출, RLS 우회, 레이트리밋 돌파 대응', icon: '🔒' },
]

export function RunbookLinks() {
  return (
    <div style={{ border: '1px solid rgba(0,0,0,0.08)', background: '#fff' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 700, color: 'var(--color-vcx-dark)', margin: 0 }}>
          운영 런북
        </h3>
      </div>
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {RUNBOOKS.map((book) => (
            <div
              key={book.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 16px',
                background: '#f5f0e8',
                cursor: 'default',
              }}
            >
              <span style={{ fontSize: '20px' }}>{book.icon}</span>
              <div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontWeight: 600, color: 'var(--color-vcx-dark)' }}>
                  {book.id}. {book.title}
                </div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#888', marginTop: '2px' }}>
                  {book.description}
                </div>
              </div>
              <span style={{ marginLeft: 'auto', fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: 'var(--color-vcx-gold)', fontWeight: 500 }}>
                docs/ops/runbooks/{book.id}-*.md
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#888', marginTop: '12px' }}>
          런북 파일은 프로젝트 저장소의 docs/ops/runbooks/ 디렉토리에서 확인하세요.
        </p>
      </div>
    </div>
  )
}
