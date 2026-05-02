import { InviteAcceptForm } from '@/components/auth/invite-accept-form'

export default async function InviteAcceptPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams
  return (
    <div style={{ maxWidth: '420px', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 800, color: '#f0ebe2' }}>ValueConnect</span>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 800, color: '#c9a84c' }}>X</span>
      </div>
      <div style={{ background: '#f0ebe2', padding: '48px 36px', borderRadius: 0 }}>
        <div style={{ width: '32px', height: '1.5px', background: '#c9a84c', margin: '0 auto 24px' }} />
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 800, color: '#1a1a1a', textAlign: 'center', margin: '0 0 8px', letterSpacing: '-0.5px' }}>초대를 수락하세요</h1>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#888', textAlign: 'center', margin: '0 0 32px' }}>ValueConnect X 네트워크에 오신 것을 환영합니다</p>
        <InviteAcceptForm initialToken={params.token} />
      </div>
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <a href="/login" style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: 'rgba(240,235,226,0.5)', textDecoration: 'none' }}>← 로그인으로 돌아가기</a>
      </div>
    </div>
  )
}
