import { InviteAcceptForm } from '@/components/auth/invite-accept-form'

export default async function InviteAcceptPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams
  return (
    <div style={{ maxWidth: '420px', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '24px', fontWeight: 800, color: '#f2f2f2' }}>ValueConnect</span>
        <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '24px', fontWeight: 800, color: '#00d992', filter: 'drop-shadow(0 0 6px rgba(0,217,146,0.45))' }}>X</span>
      </div>
      <div style={{ background: '#101010', padding: '40px 28px', border: '1px solid #3d3a39', borderRadius: 0 }}>
        <div style={{ width: '32px', height: '1.5px', background: '#00d992', margin: '0 auto 24px' }} />
        <h1 style={{ fontFamily: 'system-ui, sans-serif', fontSize: '22px', fontWeight: 700, color: '#f2f2f2', textAlign: 'center', margin: '0 0 10px', letterSpacing: 0 }}>초대를 수락하세요</h1>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#b8b3b0', textAlign: 'center', margin: '0 0 32px', lineHeight: 1.6 }}>ValueConnect X 네트워크에 오신 것을 환영합니다</p>
        <InviteAcceptForm initialToken={params.token} />
      </div>
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <a href="/login" style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#8b949e', textDecoration: 'none' }}>로그인으로 돌아가기</a>
      </div>
    </div>
  )
}
