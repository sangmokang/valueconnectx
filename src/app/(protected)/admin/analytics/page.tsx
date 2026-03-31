'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'

interface KPI {
  totalMembers: number
  newMembers: number
  totalCoffeechats: number
  newCoffeechats: number
  totalPosts: number
  newPosts: number
  totalPositions: number
  newPositions: number
}

interface DailyData {
  date: string
  label: string
  members: number
  coffeechats: number
}

interface FieldData {
  name: string
  value: number
}

interface AnalyticsData {
  kpi: KPI
  dailyChart: DailyData[]
  fieldDistribution: FieldData[]
}

const PIE_COLORS = ['#c9a84c', '#d4b06e', '#e0c890', '#a08040', '#7a6030', '#e8d4a8', '#b89050', '#f0e0c0']

function KpiCard({ label, total, weekly }: { label: string; total: number; weekly: number }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: '12px',
      padding: '24px',
      flex: '1 1 200px',
      minWidth: '160px',
    }}>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#888', margin: '0 0 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 6px', letterSpacing: '-1px' }}>
        {total.toLocaleString()}
      </p>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: weekly > 0 ? '#c9a84c' : '#888', margin: 0, fontWeight: 600 }}>
        이번 주 +{weekly}
      </p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('데이터를 불러오는 중 오류가 발생했습니다'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: 'system-ui, sans-serif', color: '#888' }}>
        데이터를 불러오는 중...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: 'system-ui, sans-serif', color: '#c00' }}>
        {error ?? '알 수 없는 오류가 발생했습니다'}
      </div>
    )
  }

  const { kpi, dailyChart, fieldDistribution } = data

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <KpiCard label="총 멤버" total={kpi.totalMembers} weekly={kpi.newMembers} />
        <KpiCard label="커피챗" total={kpi.totalCoffeechats} weekly={kpi.newCoffeechats} />
        <KpiCard label="커뮤니티 게시글" total={kpi.totalPosts} weekly={kpi.newPosts} />
        <KpiCard label="포지션" total={kpi.totalPositions} weekly={kpi.newPositions} />
      </div>

      {/* Line Chart */}
      <div style={{
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '12px',
        padding: '28px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '20px', height: '1.5px', background: '#c9a84c' }} />
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            최근 7일 일별 현황
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={dailyChart} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#888' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#888' }} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '13px' }}
              labelFormatter={(l) => `날짜: ${l}`}
            />
            <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }} />
            <Line type="monotone" dataKey="members" name="신규 멤버" stroke="#c9a84c" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="coffeechats" name="커피챗 생성" stroke="#1a1a1a" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div style={{
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '12px',
        padding: '28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '20px', height: '1.5px', background: '#c9a84c' }} />
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            멤버 분야별 분포
          </h2>
        </div>
        {fieldDistribution.length === 0 ? (
          <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
            분야 데이터가 없습니다
          </p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={fieldDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {fieldDistribution.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '13px' }}
                  formatter={(value) => [`${value}명`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, minWidth: '180px' }}>
              {fieldDistribution.map((item, index) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: PIE_COLORS[index % PIE_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: '#1a1a1a', flex: 1 }}>{item.name}</span>
                  <span style={{ fontSize: '13px', color: '#888', fontWeight: 600 }}>{item.value}명</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
