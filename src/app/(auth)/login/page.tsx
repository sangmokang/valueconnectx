import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/auth/login-form'
import { sanitizeRedirect } from '@/lib/auth/routes'
import { DEV_QA_COOKIE, isDevQaCookieValue, isDevQaEnabled } from '@/lib/auth/dev-qa'

export const dynamic = 'force-dynamic'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string; error?: string }> }) {
  const params = await searchParams
  const cookieStore = await cookies()
  if (isDevQaCookieValue(cookieStore.get(DEV_QA_COOKIE)?.value)) {
    redirect(sanitizeRedirect(params.redirect))
  }
  if (isDevQaEnabled()) {
    return (
      <div style={{ maxWidth: '420px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 800, color: '#f0ebe2' }}>ValueConnect</span>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 800, color: '#c9a84c' }}>X</span>
        </div>
        <div style={{ background: '#f0ebe2', padding: '48px 36px', borderRadius: 0 }}>
          <div style={{ width: '32px', height: '1.5px', background: '#c9a84c', margin: '0 auto 24px' }} />
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 800, color: '#1a1a1a', textAlign: 'center', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            반갑습니다. 최고 수준의 Professional Community, ValueConnect X입니다.
          </h1>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#888', textAlign: 'center', margin: '0 0 32px' }}>
            초대된 멤버만 접근할 수 있습니다
          </p>
          <LoginForm redirectTo={params.redirect} />
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <a href="/forgot-password" style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#999', textDecoration: 'none' }}>비밀번호를 잊으셨나요?</a>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: 'rgba(240,235,226,0.5)' }}>초대 코드가 있으신가요? </span>
          <a href="/invite/accept" style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#c9a84c', textDecoration: 'none', fontWeight: 600 }}>초대 수락하기 →</a>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: member } = await supabase.from('vcx_members').select('id').eq('id', user.id).single()
    if (member) redirect(sanitizeRedirect(params.redirect))
  }

  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-10 text-center">
        <span className="font-vcx-sans text-[24px] font-extrabold text-vcx-text">ValueConnect</span>
        <span className="font-vcx-sans text-[24px] font-extrabold text-vcx-emerald drop-shadow-[0_0_6px_rgba(0,217,146,0.45)]">X</span>
      </div>

      <div className="border border-vcx-border bg-vcx-surface px-7 py-10">
        <div className="mx-auto mb-6 h-[1.5px] w-8 bg-vcx-emerald" />
        <h1 className="mb-3 text-center font-vcx-sans text-[22px] font-bold leading-tight text-vcx-text">
          이메일 링크로 로그인하세요
        </h1>
        <p className="mb-8 text-center font-vcx-sans text-[15px] leading-[1.7] text-vcx-soft">
          비밀번호 없이 이메일로 받은 매직 링크를 열어 ValueConnect X에 접속합니다.
        </p>

        {params.error === 'magic-link' && (
          <div className="mb-5 border border-vcx-danger/45 bg-vcx-danger/10 px-4 py-3 font-vcx-sans text-[14px] text-[#fd9c9f]">
            로그인 링크가 만료되었거나 올바르지 않습니다. 새 링크를 요청해주세요.
          </div>
        )}

        <LoginForm redirectTo={params.redirect} />
      </div>

      <div className="mt-6 text-center">
        <span className="font-vcx-sans text-[14px] text-vcx-muted">아직 계정이 없으신가요? </span>
        <Link href="/signup" className="font-vcx-sans text-[14px] font-semibold text-vcx-emerald no-underline">
          회원가입
        </Link>
      </div>
      <div className="mt-3 text-center">
        <span className="font-vcx-sans text-[14px] text-vcx-muted">초대 링크가 있으신가요? </span>
        <Link href="/invite/accept" className="font-vcx-sans text-[14px] font-semibold text-vcx-emerald no-underline">
          초대 수락하기
        </Link>
      </div>
    </div>
  )
}
