import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <div style={{ maxWidth: '420px', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '24px', fontWeight: 800, color: '#f2f2f2' }}>ValueConnect</span>
        <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '24px', fontWeight: 800, color: '#00d992', filter: 'drop-shadow(0 0 6px rgba(0,217,146,0.45))' }}>X</span>
      </div>
      <div style={{ background: '#101010', padding: '40px 28px', border: '1px solid #3d3a39', borderRadius: 0 }}>
        <div style={{ width: '32px', height: '1.5px', background: '#00d992', margin: '0 auto 24px' }} />
        <h1 style={{ fontFamily: 'system-ui, sans-serif', fontSize: '22px', fontWeight: 700, color: '#f2f2f2', textAlign: 'center', margin: '0 0 10px' }}>새 비밀번호 설정</h1>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#b8b3b0', textAlign: 'center', margin: '0 0 32px', lineHeight: 1.6 }}>새로운 비밀번호를 입력해주세요</p>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
