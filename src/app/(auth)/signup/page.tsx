import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignupForm } from '@/components/auth/signup-form'
import { sanitizeRedirect } from '@/lib/auth/routes'

export const dynamic = 'force-dynamic'

const errorMessages: Record<string, string> = {
  'invite-required': '대기 중인 초대를 찾지 못했습니다. 초대받은 이메일 주소로 다시 시도해주세요.',
  profile: '멤버 프로필 생성 중 오류가 발생했습니다. 운영팀에 문의해주세요.',
  'magic-link': '가입 링크가 만료되었거나 올바르지 않습니다. 새 링크를 요청해주세요.',
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ redirect?: string; error?: string }> }) {
  const params = await searchParams
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
          초대받은 이메일로 가입하세요
        </h1>
        <p className="mb-8 text-center font-vcx-sans text-[15px] leading-[1.7] text-vcx-soft">
          ValueConnect X는 초대 전용 네트워크입니다. 이메일로 받은 매직 링크를 열어 계정을 확인합니다.
        </p>

        {params.error && errorMessages[params.error] && (
          <div className="mb-5 border border-vcx-danger/45 bg-vcx-danger/10 px-4 py-3 font-vcx-sans text-[14px] text-[#fd9c9f]">
            {errorMessages[params.error]}
          </div>
        )}

        <SignupForm redirectTo={params.redirect} />
      </div>

      <div className="mt-6 text-center">
        <span className="font-vcx-sans text-[14px] text-vcx-muted">이미 계정이 있으신가요? </span>
        <Link href="/login" className="font-vcx-sans text-[14px] font-semibold text-vcx-emerald no-underline">
          로그인
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
