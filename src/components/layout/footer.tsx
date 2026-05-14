import Link from 'next/link'

/**
 * 푸터 — 사업자정보 + 정책 링크.
 *
 * 사용자 명시 카피 (CLAUDE.md §3.0 보호 대상): 5필드 절대 변형 금지.
 *  - 회사명: 밸류커넥트 주식회사
 *  - 사업자등록번호: 646-87-02542
 *  - 대표: 강상모
 *  - 문의: sangmokang@valueconnect.kr
 *  - 주소: 서울시 서초구 사평대로335 3층 306-2호
 */
export default function Footer() {
  return (
    <footer
      className="border-t border-black/[0.08] bg-vcx-beige text-vcx-dark"
      aria-labelledby="vcx-footer-heading"
    >
      <h2 id="vcx-footer-heading" className="sr-only">
        밸류커넥트 사업자 정보 및 정책
      </h2>
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-10">
        <div className="grid gap-8 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:gap-12">
          <div className="min-w-0">
            <p className="font-[Georgia,serif] text-[15px] font-extrabold tracking-tight text-vcx-dark">
              밸류커넥트 주식회사
            </p>
            <dl className="mt-4 grid gap-2 text-[13px] leading-6 text-vcx-dark/80">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <dt className="min-w-[96px] font-semibold text-vcx-dark/60">사업자등록번호</dt>
                <dd>646-87-02542</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <dt className="min-w-[96px] font-semibold text-vcx-dark/60">대표</dt>
                <dd>강상모</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <dt className="min-w-[96px] font-semibold text-vcx-dark/60">문의</dt>
                <dd>
                  <a
                    href="mailto:sangmokang@valueconnect.kr"
                    className="underline-offset-2 hover:underline"
                  >
                    sangmokang@valueconnect.kr
                  </a>
                </dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <dt className="min-w-[96px] font-semibold text-vcx-dark/60">주소</dt>
                <dd>서울시 서초구 사평대로335 3층 306-2호</dd>
              </div>
            </dl>
          </div>

          <nav aria-label="정책" className="min-w-0">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-vcx-dark/50">
              정책
            </p>
            <ul className="mt-4 flex flex-col gap-3 text-[13px] leading-6">
              <li>
                <Link
                  href="/privacy"
                  className="text-vcx-dark underline-offset-2 hover:underline"
                >
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-vcx-dark underline-offset-2 hover:underline"
                >
                  이용약관
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-black/[0.08] pt-6">
          <p className="text-[12px] leading-5 text-vcx-dark/60">
            © 2026 밸류커넥트 주식회사. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
