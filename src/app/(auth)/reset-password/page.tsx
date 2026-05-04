import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-10 text-center">
        <span className="font-vcx-serif text-[24px] font-extrabold text-vcx-beige">ValueConnect</span>
        <span className="font-vcx-serif text-[24px] font-extrabold text-vcx-gold">X</span>
      </div>
      <div className="bg-vcx-beige px-9 py-12">
        <div className="mx-auto mb-6 h-[1.5px] w-8 bg-vcx-gold" />
        <h1 className="font-vcx-serif text-[22px] font-extrabold text-vcx-dark text-center mt-0 mb-2">새 비밀번호 설정</h1>
        <p className="font-vcx-sans text-[14px] text-vcx-sub-4 text-center mt-0 mb-8">새로운 비밀번호를 입력해주세요</p>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
