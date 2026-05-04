import { InviteAcceptForm } from '@/components/auth/invite-accept-form'

export default async function InviteAcceptPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams
  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-10 text-center">
        <span className="font-vcx-serif text-[24px] font-extrabold text-vcx-beige">ValueConnect</span>
        <span className="font-vcx-serif text-[24px] font-extrabold text-vcx-gold">X</span>
      </div>
      <div className="bg-vcx-beige px-9 py-12">
        <div className="mx-auto mb-6 h-[1.5px] w-8 bg-vcx-gold" />
        <h1 className="font-vcx-serif text-[22px] font-extrabold text-vcx-dark text-center mt-0 mb-2 tracking-[-0.5px]">초대를 수락하세요</h1>
        <p className="font-vcx-sans text-[14px] text-vcx-sub-4 text-center mt-0 mb-8">ValueConnect X 네트워크에 오신 것을 환영합니다</p>
        <InviteAcceptForm initialToken={params.token} />
      </div>
      <div className="mt-6 text-center">
        <a href="/login" className="inline-flex min-h-[36px] items-center font-vcx-sans text-[13px] text-vcx-beige/50 no-underline">← 로그인으로 돌아가기</a>
      </div>
    </div>
  )
}
