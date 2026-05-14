import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '이용약관 | ValueConnect X',
  description: '밸류커넥트 주식회사가 운영하는 ValueConnect X의 이용약관입니다.',
}

export default function TermsPage() {
  return (
    <main className="min-h-[calc(100svh-60px)] bg-vcx-beige text-vcx-dark">
      <article className="mx-auto max-w-[820px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
        <header className="border-b border-black/[0.08] pb-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-vcx-dark/60">
            VALUECONNECT X · POLICY
          </p>
          <h1 className="mt-3 font-[Georgia,serif] text-[32px] font-bold leading-tight text-vcx-dark sm:text-[40px]">
            이용약관
          </h1>
          <p className="mt-3 text-[13px] leading-6 text-vcx-dark/70">시행일: 2026년 5월 15일</p>
        </header>

        <section className="mt-10 text-[14px] leading-7 text-vcx-dark/80">
          <p>이용약관은 준비 중입니다.</p>
          <p className="mt-3">시행일: 2026-05-15.</p>
          <p className="mt-3">
            문의:{' '}
            <a
              href="mailto:sangmokang@valueconnect.kr"
              className="underline-offset-2 hover:underline"
            >
              sangmokang@valueconnect.kr
            </a>
          </p>
        </section>
      </article>
    </main>
  )
}
