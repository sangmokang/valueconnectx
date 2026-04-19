'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { HealthStatus } from '@/components/admin/ops/HealthStatus'
import { SnapshotView } from '@/components/admin/ops/SnapshotView'
import { RunbookLinks } from '@/components/admin/ops/RunbookLinks'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function OpsPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/ops/health?snapshot=true', fetcher, {
    refreshInterval: 60000, // 1분마다 자동 갱신
  })
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await mutate()
    setRefreshing(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            서비스 운영 현황
          </h2>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#888', marginTop: '4px' }}>
            Sentry: 에러 추적 · 헬스체크: 인프라 가용성 · Discord: 장애 알림
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || isLoading}
          style={{
            padding: '8px 20px',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            color: '#fff',
            background: refreshing || isLoading ? '#ccc' : '#c9a84c',
            border: 'none',
            cursor: refreshing || isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {refreshing ? '갱신 중...' : '수동 체크'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', marginBottom: '24px' }}>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#dc2626', margin: 0 }}>
            헬스체크 데이터를 불러올 수 없습니다. 관리자 인증을 확인해주세요.
          </p>
        </div>
      )}

      {isLoading && !data && (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#888' }}>로딩 중...</p>
        </div>
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <HealthStatus health={data.health || data} />
          {data.snapshot && <SnapshotView snapshot={data.snapshot} />}
          <RunbookLinks />
        </div>
      )}
    </div>
  )
}
