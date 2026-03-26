import { redirect } from 'next/navigation'
import { getVcxUser, isAdmin } from '@/lib/auth/get-vcx-user'
import { AdminTabs } from '@/components/admin/admin-tabs'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getVcxUser()
  if (!user || !isAdmin(user)) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', background: '#f0ebe2' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 40px 80px' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '1.5px', background: '#c9a84c' }} />
            <span style={{ fontSize: '10px', fontFamily: 'system-ui, sans-serif', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c9a84c' }}>ADMIN · MANAGEMENT</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: 800, color: '#1a1a1a', margin: 0, letterSpacing: '-1px' }}>관리자 대시보드</h1>
        </div>
        <AdminTabs />
        {children}
      </div>
    </div>
  )
}
