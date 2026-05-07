'use client'

interface CheckResult {
  status: 'ok' | 'degraded' | 'error'
  latency_ms: number
  message?: string
}

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    supabase: CheckResult
    redis: CheckResult
    env_vars: { status: 'ok' | 'degraded' | 'error'; missing: string[] }
  }
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  healthy: { bg: '#f0fdf4', color: '#16a34a', label: '🟢 정상' },
  degraded: { bg: '#fefce8', color: '#ca8a04', label: '🟡 성능 저하' },
  unhealthy: { bg: '#fef2f2', color: '#dc2626', label: '🔴 장애' },
}

const CHECK_STYLES: Record<string, { color: string; label: string }> = {
  ok: { color: '#16a34a', label: '정상' },
  degraded: { color: '#ca8a04', label: '지연' },
  error: { color: '#dc2626', label: '오류' },
}

export function HealthStatus({ health }: { health: HealthData }) {
  const overall = STATUS_STYLES[health.status] || STATUS_STYLES.unhealthy

  return (
    <div style={{ border: '1px solid rgba(0,0,0,0.08)', background: '#fff' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 700, color: 'var(--color-vcx-dark)', margin: 0 }}>
          인프라 상태
        </h3>
        <div style={{ padding: '4px 16px', background: overall.bg, display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', fontWeight: 600, color: overall.color }}>
            {overall.label}
          </span>
        </div>
      </div>
      <div style={{ padding: '20px 24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'system-ui, sans-serif', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <th style={{ textAlign: 'left', padding: '8px 0', color: '#888', fontWeight: 500, fontSize: '12px' }}>서비스</th>
              <th style={{ textAlign: 'left', padding: '8px 0', color: '#888', fontWeight: 500, fontSize: '12px' }}>상태</th>
              <th style={{ textAlign: 'left', padding: '8px 0', color: '#888', fontWeight: 500, fontSize: '12px' }}>응답 시간</th>
              <th style={{ textAlign: 'left', padding: '8px 0', color: '#888', fontWeight: 500, fontSize: '12px' }}>비고</th>
            </tr>
          </thead>
          <tbody>
            {(['supabase', 'redis'] as const).map((key) => {
              const check = health.checks[key]
              const style = CHECK_STYLES[check.status] || CHECK_STYLES.error
              return (
                <tr key={key} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td style={{ padding: '10px 0', fontWeight: 600, color: 'var(--color-vcx-dark)' }}>
                    {key === 'supabase' ? 'Supabase DB' : 'Upstash Redis'}
                  </td>
                  <td style={{ padding: '10px 0', color: style.color, fontWeight: 500 }}>{style.label}</td>
                  <td style={{ padding: '10px 0', color: '#555' }}>{check.latency_ms}ms</td>
                  <td style={{ padding: '10px 0', color: '#888', fontSize: '13px' }}>{check.message || '—'}</td>
                </tr>
              )
            })}
            <tr>
              <td style={{ padding: '10px 0', fontWeight: 600, color: 'var(--color-vcx-dark)' }}>환경변수</td>
              <td style={{ padding: '10px 0', color: health.checks.env_vars.missing.length > 0 ? '#dc2626' : '#16a34a', fontWeight: 500 }}>
                {health.checks.env_vars.missing.length > 0 ? '누락 있음' : '정상'}
              </td>
              <td style={{ padding: '10px 0', color: '#555' }}>—</td>
              <td style={{ padding: '10px 0', color: '#888', fontSize: '13px' }}>
                {health.checks.env_vars.missing.length > 0 ? health.checks.env_vars.missing.join(', ') : '필수 변수 모두 설정됨'}
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: '16px', display: 'flex', gap: '24px', fontSize: '12px', color: '#888', fontFamily: 'system-ui, sans-serif' }}>
          <span>버전: {health.version}</span>
          <span>체크 시각: {new Date(health.timestamp).toLocaleString('ko-KR')}</span>
        </div>
      </div>
    </div>
  )
}
