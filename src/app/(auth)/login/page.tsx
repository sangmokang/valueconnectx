import { LoginForm } from '@/components/auth/login-form'

export const dynamic = 'force-dynamic'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string; error?: string }> }) {
  const params = await searchParams

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-10 text-center">
        <span className="font-vcx-serif text-[24px] font-extrabold text-vcx-beige">ValueConnect</span>
        <span className="font-vcx-serif text-[24px] font-extrabold text-vcx-gold">X</span>
      </div>
      <div className="bg-vcx-beige px-9 py-12">
        <div className="mx-auto mb-6 h-[1.5px] w-8 bg-vcx-gold" />
        <h1 className="font-vcx-serif text-[22px] font-extrabold text-vcx-dark text-center mt-0 mb-2 tracking-[-0.5px]">
          당신은 이미 검증되었습니다
        </h1>
        <p className="font-vcx-sans text-[14px] text-vcx-sub-4 text-center mt-0 mb-8">
          초대된 멤버만 접근할 수 있습니다
        </p>
        <LoginForm redirectTo={params.redirect} />
        <div className="mt-5 text-center">
          <a href="/forgot-password" className="inline-flex min-h-[36px] items-center font-vcx-sans text-[12px] text-vcx-sub-5 no-underline">비밀번호를 잊으셨나요?</a>
        </div>
      </div>
      <div className="mt-6 text-center">
        <span className="font-vcx-sans text-[13px] text-vcx-beige/50">초대 코드가 있으신가요? </span>
        <a href="/invite/accept" className="inline-flex min-h-[36px] items-center font-vcx-sans text-[13px] font-semibold text-vcx-gold no-underline">초대 수락하기 →</a>
      </div>
    </div>
  )
}
