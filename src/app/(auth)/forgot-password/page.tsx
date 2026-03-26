import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <div style={{ maxWidth: '420px', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 800, color: '#f0ebe2' }}>ValueConnect</span>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 800, color: '#c9a84c' }}>X</span>
      </div>
      <div style={{ background: '#f0ebe2', padding: '48px 36px', borderRadius: 0 }}>
        <div style={{ width: '32px', height: '1.5px', background: '#c9a84c', margin: '0 auto 24px' }} />
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 800, color: '#1a1a1a', textAlign: 'center', margin: '0 0 8px' }}>비밀번호 재설정</h1>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#888', textAlign: 'center', margin: '0 0 32px' }}>가입 시 사용한 이메일을 입력해주세요</p>
        <ForgotPasswordForm />
      </div>
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <a href="/login" style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: 'rgba(240,235,226,0.5)', textDecoration: 'none' }}>← 로그인으로 돌아가기</a>
      </div>
    </div>
  )
}
