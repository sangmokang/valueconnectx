import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '이용약관 | ValueConnect X',
  description: '밸류커넥트 주식회사가 운영하는 ValueConnect X의 이용약관입니다.',
}

const ARTICLES: ReadonlyArray<{
  no: number
  title: string
  body: ReadonlyArray<string>
}> = [
  {
    no: 1,
    title: '목적',
    body: [
      '본 약관은 밸류커넥트 주식회사(이하 "회사")가 제공하는 ValueConnect X(이하 "서비스")의 이용 조건과 절차, 회사와 회원의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.',
    ],
  },
  {
    no: 2,
    title: '용어의 정의',
    body: [
      '"회원"이란 회사의 초대장 또는 추천을 통해 본 약관에 동의하고 서비스 이용 자격을 획득한 자를 말합니다.',
      '"초대 전용 네트워크"란 회사 또는 기존 회원의 검증·추천을 거쳐야만 가입할 수 있는 서비스 형태를 말합니다.',
      '"커피챗"이란 회원 간 또는 회원과 기업 의사결정권자 간 1:1 대화를 의미합니다.',
      '"디렉토리"란 회원 본인이 공개에 동의한 범위 내에서 다른 회원에게 노출되는 프로필을 의미합니다.',
    ],
  },
  {
    no: 3,
    title: '약관의 효력 및 변경',
    body: [
      '본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.',
      '회사는 합리적인 사유가 있을 경우 관련 법령에 위배되지 않는 범위에서 본 약관을 개정할 수 있습니다.',
      '약관이 변경되는 경우 적용 일자 7일 이전부터 공지하며, 회원에게 불리한 변경의 경우 30일 이전부터 공지합니다.',
    ],
  },
  {
    no: 4,
    title: '회원 가입 및 자격',
    body: [
      '서비스는 초대 전용으로 운영되며, 회사 또는 기존 회원의 추천을 통해 발송된 초대장(Magic Link)을 수신한 자에 한하여 가입이 가능합니다.',
      '회원은 가입 시 정확하고 최신의 정보를 제공해야 하며, 허위 정보를 제공한 경우 회사는 서비스 이용을 제한하거나 회원 자격을 해지할 수 있습니다.',
    ],
  },
  {
    no: 5,
    title: '서비스의 제공',
    body: [
      '회원 디렉토리 — 검증된 회원의 프로필 열람.',
      '커뮤니티 — 회원 간 정보 공유 및 토론.',
      '커피챗 매칭 — 회원 간 또는 의사결정권자와의 1:1 대화 주선.',
      '큐레이션 피드 — 회원에게 맞춤화된 정보 제공.',
      '기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스.',
    ],
  },
  {
    no: 6,
    title: '회원의 의무',
    body: [
      '타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.',
      '서비스를 통해 얻은 정보를 회사의 사전 승낙 없이 영리 또는 비영리 목적으로 무단 사용해서는 안 됩니다.',
      '다른 회원의 개인정보를 무단으로 수집·저장·공개해서는 안 됩니다.',
      '서비스의 안정적 운영을 방해하거나 비정상적인 방법으로 서비스를 이용해서는 안 됩니다.',
      '관계 법령, 본 약관, 공서양속에 반하는 행위를 해서는 안 됩니다.',
    ],
  },
  {
    no: 7,
    title: '서비스 이용 제한 및 해지',
    body: [
      '회사는 회원이 본 약관 또는 관계 법령을 위반한 경우 사전 통지 없이 서비스 이용을 제한하거나 회원 자격을 해지할 수 있습니다.',
      '회원은 언제든지 서비스 내 설정 또는 회사에 대한 이메일 요청을 통해 회원 탈퇴를 신청할 수 있으며, 회사는 관련 법령에서 정하는 바에 따라 즉시 처리합니다.',
    ],
  },
  {
    no: 8,
    title: '개인정보의 보호',
    body: [
      '회사는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력합니다.',
      '개인정보의 보호 및 처리에 관한 자세한 사항은 별도의 개인정보처리방침(/privacy)에 따릅니다.',
    ],
  },
  {
    no: 9,
    title: '지적재산권',
    body: [
      '서비스에 대한 저작권 및 지적재산권은 회사에 귀속됩니다.',
      '회원이 서비스 내에 게시한 콘텐츠의 저작권은 해당 회원에게 귀속되며, 회원은 회사가 서비스 운영·홍보 목적으로 해당 콘텐츠를 사용할 수 있는 비독점적 라이선스를 회사에 부여합니다.',
    ],
  },
  {
    no: 10,
    title: '책임의 제한',
    body: [
      '회사는 천재지변, 전쟁, 기간 통신 사업자의 서비스 중지 등 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 책임이 면제됩니다.',
      '회사는 회원 상호 간 또는 회원과 제3자 상호 간에 서비스를 매개로 발생한 분쟁에 대해서는 개입할 의무가 없으며, 이로 인한 손해를 배상할 책임도 지지 않습니다.',
    ],
  },
  {
    no: 11,
    title: '준거법 및 관할',
    body: [
      '본 약관과 관련된 분쟁에 대해서는 대한민국 법률을 준거법으로 합니다.',
      '서비스 이용과 관련하여 회사와 회원 사이에 분쟁이 발생한 경우, 회사의 본사 소재지를 관할하는 법원을 합의 관할로 합니다.',
    ],
  },
] as const

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

        <p className="mt-8 text-[14px] leading-7 text-vcx-dark/80">
          본 약관은 ValueConnect X 서비스를 이용하는 모든 회원에게 적용됩니다. 회원은 서비스에 가입함으로써 본 약관에
          동의한 것으로 간주됩니다.
        </p>

        <div className="mt-10 flex flex-col gap-10">
          {ARTICLES.map((article) => (
            <section key={article.no} aria-labelledby={`terms-section-${article.no}`}>
              <h2
                id={`terms-section-${article.no}`}
                className="font-[Georgia,serif] text-[20px] font-bold leading-tight text-vcx-dark sm:text-[22px]"
              >
                제{article.no}조 ({article.title})
              </h2>
              <ul className="mt-4 flex flex-col gap-2 text-[14px] leading-7 text-vcx-dark/80">
                {article.body.map((line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-2 inline-block h-1 w-1 shrink-0 bg-vcx-dark/50"
                    />
                    <span className="min-w-0">{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="mt-12 border-t border-black/[0.08] pt-6 text-[12px] leading-6 text-vcx-dark/60">
          <p>본 약관은 2026년 5월 15일부터 시행됩니다.</p>
          <p className="mt-1">문의: sangmokang@valueconnect.kr</p>
        </footer>
      </article>
    </main>
  )
}
