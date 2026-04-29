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
              CURATION FEED · WEEKLY
            </span>
          </div>

          <div className="max-w-[560px]">
            <h1 className="font-vcx-serif text-[34px] font-bold leading-tight text-vcx-beige sm:text-[42px]">
              어떤 시장이
              <br />
              궁금하신가요?
            </h1>

            <p className="mt-5 font-vcx-sans text-[15px] leading-8 text-vcx-sub-5 sm:text-[16px]">
              관심 분야를 선택하면 해당 시장의 핵심 포지션을
              <br />
              매주 직접 받아보실 수 있습니다.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-3 border border-vcx-gold/40 bg-vcx-gold/10 px-4 py-3 font-vcx-sans text-[13px] text-vcx-gold">
            <MailCheck className="h-4 w-4" aria-hidden="true" />
            <span>이 내용이 매주 이메일로 전송됩니다</span>
          </div>
        </div>
      </section>

      <FeedClient />
    </ProtectedPageWrapper>
  )
}
