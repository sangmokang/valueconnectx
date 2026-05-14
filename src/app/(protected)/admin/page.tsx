import { createClient } from '@/lib/supabase/server'
import { loadDashboardKpis } from '@/lib/admin/dashboard-kpis'

export const dynamic = 'force-dynamic'

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid rgba(0,0,0,0.08)',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minHeight: '140px',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'system-ui, sans-serif',
  fontSize: '11px',
  color: 'var(--color-vcx-sub-4)',
  margin: 0,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
}

const valueStyle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '36px',
  fontWeight: 800,
  color: 'var(--color-vcx-dark)',
  margin: 0,
  letterSpacing: '-1px',
  lineHeight: 1.1,
}

const subStyle: React.CSSProperties = {
  fontFamily: 'system-ui, sans-serif',
  fontSize: '13px',
  color: 'var(--color-vcx-sub-4)',
  margin: 0,
}

const placeholderStyle: React.CSSProperties = {
  ...valueStyle,
  fontSize: '20px',
  color: 'var(--color-vcx-sub-4)',
  fontWeight: 600,
}

function formatPercent(ratio: number | null): string {
  if (ratio === null) return '데이터 없음'
  return `${(ratio * 100).toFixed(1)}%`
}

function formatRating(value: number | null): string {
  if (value === null) return '데이터 없음'
  return value.toFixed(2)
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const kpis = await loadDashboardKpis(supabase)

  return (
    <section data-testid="admin-dashboard">
      <div
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        }}
      >
        <div style={cardStyle} data-testid="kpi-total-members">
          <p style={labelStyle}>누적 가입자</p>
          <p style={valueStyle}>{kpis.totalMembers.toLocaleString()}명</p>
          <p style={subStyle}>활성 멤버 기준</p>
        </div>

        <div style={cardStyle} data-testid="kpi-weekly-new-members">
          <p style={labelStyle}>이번 주 신규 가입</p>
          <p style={valueStyle}>+{kpis.weeklyNewMembers.toLocaleString()}</p>
          <p style={subStyle}>최근 7일</p>
        </div>

        <div style={cardStyle} data-testid="kpi-coffeechat">
          <p style={labelStyle}>커피챗 활동</p>
          <p style={valueStyle}>{kpis.coffeechat.total.toLocaleString()}건</p>
          <p style={subStyle}>
            수락률 {formatPercent(kpis.coffeechat.acceptedRate)} · 완료 {kpis.coffeechat.completed}건
          </p>
        </div>

        <div style={cardStyle} data-testid="kpi-community">
          <p style={labelStyle}>커뮤니티 (이번 주)</p>
          <p style={valueStyle}>{kpis.community.weeklyPosts.toLocaleString()}글</p>
          <p style={subStyle}>반응 {kpis.community.weeklyReactions.toLocaleString()}건</p>
        </div>

        <div style={cardStyle} data-testid="kpi-ai-brief">
          <p style={labelStyle}>AI Brief 생성률</p>
          <p style={valueStyle}>{formatPercent(kpis.aiBrief.ratio)}</p>
          <p style={subStyle}>
            {kpis.aiBrief.generated.toLocaleString()} / {kpis.aiBrief.total.toLocaleString()}건 생성
          </p>
        </div>

        <div style={cardStyle} data-testid="kpi-feedback">
          <p style={labelStyle}>세션 피드백 평균</p>
          {kpis.feedback.available ? (
            <>
              <p style={valueStyle}>{formatRating(kpis.feedback.averageRating)}</p>
              <p style={subStyle}>응답 {kpis.feedback.count.toLocaleString()}건 · 5점 만점</p>
            </>
          ) : (
            <>
              <p style={placeholderStyle}>측정 준비 중</p>
              <p style={subStyle}>피드백 데이터 누적 대기</p>
            </>
          )}
        </div>
      </div>

      <p
        style={{
          marginTop: '32px',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: 'var(--color-vcx-sub-4)',
        }}
      >
        세부 지표는 상단 탭에서 확인할 수 있습니다.
      </p>
    </section>
  )
}
