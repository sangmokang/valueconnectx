import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보처리방침 | ValueConnect X',
  description: '밸류커넥트 주식회사가 운영하는 ValueConnect X의 개인정보처리방침입니다.',
}

const SECTIONS = [
  {
    no: 1,
    title: '수집하는 개인정보 항목',
    body: [
      'ValueConnect X(이하 "서비스")는 회원가입, 디렉토리 노출, 매칭, 커피챗 운영을 위해 다음 항목을 수집합니다.',
      '필수: 이름, 이메일 주소, LinkedIn URL, 회사·직책, 자기소개(프로필 본문).',
      '자동 수집: 접속 IP, 브라우저 정보, 서비스 이용 로그.',
    ],
  },
  {
    no: 2,
    title: '개인정보의 수집 및 이용 목적',
    body: [
      '회원 식별 및 초대 수락 절차 진행.',
      '디렉토리·피드·커피챗·포지션·커뮤니티 등 서비스 제공.',
      '멤버 간 매칭 및 추천 알고리즘 운영, AI Brief 생성을 위한 입력 데이터 활용.',
      '서비스 개선을 위한 통계 분석 및 보안·부정이용 방지.',
    ],
  },
  {
    no: 3,
    title: '개인정보의 보유 및 이용 기간',
    body: [
      '회원 탈퇴 시 모든 개인정보를 즉시 파기합니다.',
      '단, 관련 법령에서 정한 보유 기간(전자상거래법 등)이 있는 경우 해당 기간 동안 보관합니다.',
      '백업본은 정기 폐기 주기에 따라 분리 보관 후 영구 삭제됩니다.',
    ],
  },
  {
    no: 4,
    title: '개인정보의 제3자 제공',
    body: [
      '회사는 원칙적으로 정보주체의 개인정보를 외부에 제공하지 않습니다.',
      '예외: 멤버가 디렉토리 노출에 동의한 경우 다른 멤버에게 프로필 정보가 표시될 수 있습니다.',
      '법령에 따른 수사기관 요청 등 의무 제공이 발생한 경우 해당 절차에 따릅니다.',
    ],
  },
  {
    no: 5,
    title: '개인정보 처리 위탁',
    body: [
      '서비스 운영을 위해 다음 수탁자에게 개인정보 처리를 위탁합니다.',
      'Supabase Inc. — 데이터베이스, 인증, 스토리지.',
      'Vercel Inc. — 웹 호스팅 및 서버리스 인프라.',
      'Resend Inc. — 트랜잭션 이메일 발송.',
      'Anthropic, PBC — AI Brief 생성을 위한 LLM 추론.',
    ],
  },
  {
    no: 6,
    title: '정보주체의 권리',
    body: [
      '정보주체는 언제든지 본인의 개인정보에 대한 열람, 정정, 삭제, 처리정지를 요구할 수 있습니다.',
      '권리 행사는 아래 개인정보 보호책임자 이메일로 요청 가능합니다.',
      '회사는 정보주체의 요청에 대해 지체 없이 조치하며, 처리 결과를 통지합니다.',
    ],
  },
  {
    no: 7,
    title: '개인정보의 안전성 확보 조치',
    body: [
      '저장 데이터 암호화 및 전송 구간 TLS 적용.',
      'Supabase Row-Level Security(RLS)를 통한 멤버별 데이터 접근 통제.',
      '관리자 접근 로그 보관 및 최소 권한 원칙 적용.',
    ],
  },
  {
    no: 8,
    title: '개인정보 보호책임자',
    body: [
      '책임자: 강상모',
      '이메일: sangmokang@valueconnect.kr',
      '소속: 밸류커넥트 주식회사',
    ],
  },
] as const

export default function PrivacyPage() {
  return (
    <main className="min-h-[calc(100svh-60px)] bg-vcx-beige text-vcx-dark">
      <article className="mx-auto max-w-[820px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
        <header className="border-b border-black/[0.08] pb-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-vcx-dark/60">
            VALUECONNECT X · POLICY
          </p>
          <h1 className="mt-3 font-[Georgia,serif] text-[32px] font-bold leading-tight text-vcx-dark sm:text-[40px]">
            개인정보처리방침
          </h1>
          <p className="mt-3 text-[13px] leading-6 text-vcx-dark/70">시행일: 2026년 5월 15일</p>
        </header>

        <p className="mt-8 text-[14px] leading-7 text-vcx-dark/80">
          밸류커넥트 주식회사(이하 &lsquo;회사&rsquo;)는 개인정보 보호법을 준수하며, 정보주체의 권리를 보호하기 위해 본
          개인정보처리방침을 수립·공개합니다.
        </p>

        <div className="mt-10 flex flex-col gap-10">
          {SECTIONS.map(section => (
            <section key={section.no} aria-labelledby={`privacy-section-${section.no}`}>
              <h2
                id={`privacy-section-${section.no}`}
                className="font-[Georgia,serif] text-[20px] font-bold leading-tight text-vcx-dark sm:text-[22px]"
              >
                제{section.no}조 ({section.title})
              </h2>
              <ul className="mt-4 flex flex-col gap-2 text-[14px] leading-7 text-vcx-dark/80">
                {section.body.map((line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span aria-hidden="true" className="mt-2 inline-block h-1 w-1 shrink-0 bg-vcx-dark/50" />
                    <span className="min-w-0">{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="mt-12 border-t border-black/[0.08] pt-6 text-[12px] leading-6 text-vcx-dark/60">
          <p>본 방침은 2026년 5월 15일부터 시행됩니다.</p>
          <p className="mt-1">문의: sangmokang@valueconnect.kr</p>
        </footer>
      </article>
    </main>
  )
}
