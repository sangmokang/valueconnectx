import { ProtectedPageWrapper } from '@/components/layout/protected-page-wrapper'
import { FeedClient } from '@/components/feed/feed-client'
import { MailCheck } from 'lucide-react'

export default function FeedPage() {
  return (
    <ProtectedPageWrapper currentPath="/feed">
      <section className="bg-vcx-dark text-vcx-beige">
        <div className="mx-auto flex max-w-[1000px] flex-col gap-8 px-5 py-12 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
          <div className="flex items-center gap-3">
            <div className="h-px w-7 bg-vcx-gold" />
            <span className="vcx-section-label">
              채용 기회 · AI 큐레이션
            </span>
          </div>

          <div className="max-w-[560px]">
            <h1 className="font-vcx-serif text-[34px] font-bold leading-tight text-vcx-beige sm:text-[42px]">
              지금 어디서
              <br />
              채용하고 있나요?
            </h1>

            <p className="mt-5 font-vcx-sans text-[15px] leading-8 text-vcx-sub-5 sm:text-[16px]">
              AI가 실시간으로 수집한 국내외 채용 기회와
              <br />
              CEO가 직접 올린 긴급 포지션을 확인하세요.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-3 border border-vcx-gold/40 bg-vcx-gold/10 px-4 py-3 font-vcx-sans text-[13px] text-vcx-gold">
            <MailCheck className="h-4 w-4" aria-hidden="true" />
            <span>관심 포지션은 매주 이메일로 알림을 드립니다</span>
          </div>
        </div>
      </section>

      <FeedClient />
    </ProtectedPageWrapper>
  )
}
