'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/admin/recommendations', label: '추천 심사' },
  { href: '/admin/invites', label: '초대 관리' },
  { href: '/admin/corporate-users', label: '기업 사용자' },
  { href: '/admin/positions', label: '포지션 관리' },
  { href: '/admin/reports', label: '신고 관리' },
  { href: '/admin/analytics', label: '분석' },
  { href: '/admin/hiring', label: '수수료' },
]

export function AdminTabs() {
  const pathname = usePathname()
  return (
    <nav style={{ display: 'flex', gap: '0', borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: '32px' }}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link key={tab.href} href={tab.href} style={{
            padding: '12px 24px', fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontWeight: 600,
            color: isActive ? '#c9a84c' : '#1a1a1a', textDecoration: 'none',
            borderBottom: isActive ? '2px solid #c9a84c' : '2px solid transparent',
          }}>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
