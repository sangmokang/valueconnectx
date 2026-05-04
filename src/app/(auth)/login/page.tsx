import { LoginForm } from '@/components/auth/login-form'

export const dynamic = 'force-dynamic'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string; error?: string }> }) {
  const params = await searchParams

  return (
    <div style={{ maxWidth: '420px', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 800, color: '#f0ebe2' }}>ValueConnect</span>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 800, color: '#c9a84c' }}>X</span>
      </div>
      <div style={{ background: '#f0ebe2', padding: '48px 36px', borderRadius: 0 }}>
        <div style={{ width: '32px', height: '1.5px', background: '#c9a84c', margin: '0 auto 24px' }} />
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 800, color: '#1a1a1a', textAlign: 'center', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          당신은 이미 검증되었습니다
        </h1>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#888', textAlign: 'center', margin: '0 0 32px' }}>
          초대된 멤버만 접근할 수 있습니다
        </p>
        <LoginForm redirectTo={params.redirect} />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <a href="/forgot-password" style={{ display: 'inline-flex', minHeight: '36px', alignItems: 'center', fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#999', textDecoration: 'none' }}>비밀번호를 잊으셨나요?</a>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: 'rgba(240,235,226,0.5)' }}>초대 코드가 있으신가요? </span>
        <a href="/invite/accept" style={{ display: 'inline-flex', minHeight: '36px', alignItems: 'center', fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#c9a84c', textDecoration: 'none', fontWeight: 600 }}>초대 수락하기 →</a>
      </div>
    </div>
  )
}
