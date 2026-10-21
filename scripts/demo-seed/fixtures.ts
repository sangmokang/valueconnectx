export const SEED_PASSWORD = 'VcxSeed2026!'
export const SEED_EMAIL_DOMAIN = 'vcx-seed.com'

// 멤버 프로필 (한국 IT 업계 실제와 유사한 이름/회사/직함)
export const MEMBERS_DATA = [
  // super_admin
  {
    name: '강상모', email: `admin@${SEED_EMAIL_DOMAIN}`, tier: 'core', role: 'super_admin',
    company: 'ValueConnect', title: 'CTO & Co-founder',
    fields: ['Engineering', 'Product'], years: 15, industry: 'IT/소프트웨어', location: '서울 강남',
    bio: 'ValueConnect X를 만들고 있습니다. 핵심 인재와 기업 리더를 연결하는 것이 미션입니다. 전 카카오, 네이버 출신.',
    visibility: 'all', openToChat: true,
  },
  // admin
  {
    name: '김서연', email: `seoyeon@${SEED_EMAIL_DOMAIN}`, tier: 'core', role: 'admin',
    company: 'ValueConnect', title: 'Head of Operations',
    fields: ['Operations', 'HR'], years: 12, industry: 'IT/소프트웨어', location: '서울 강남',
    bio: '커뮤니티 운영과 인재 검증을 책임지고 있습니다. 전 리멤버, 원티드 커뮤니티 매니저 출신.',
    visibility: 'all', openToChat: true,
  },
  // core members
  {
    name: '박지훈', email: `jihoon.park@${SEED_EMAIL_DOMAIN}`, tier: 'core', role: 'member',
    company: '토스', title: 'VP of Engineering',
    fields: ['Engineering', 'Product'], years: 14, industry: 'IT/소프트웨어', location: '서울 강남',
    bio: '토스에서 결제 플랫폼 엔지니어링을 리드하고 있습니다. 대규모 트래픽 처리와 마이크로서비스 아키텍처 전문. 전 네이버페이, 삼성전자 출신.',
    visibility: 'all', openToChat: true,
  },
  {
    name: '이현아', email: `hyuna.lee@${SEED_EMAIL_DOMAIN}`, tier: 'core', role: 'member',
    company: '쿠팡', title: 'Director of Data Science',
    fields: ['Data', 'Engineering'], years: 11, industry: 'IT/소프트웨어', location: '서울 송파',
    bio: '쿠팡 추천 알고리즘과 검색 랭킹을 총괄하고 있습니다. Stanford CS PhD, 전 Google Research 출신.',
    visibility: 'all', openToChat: true,
  },
  {
    name: '정민수', email: `minsu.jung@${SEED_EMAIL_DOMAIN}`, tier: 'core', role: 'member',
    company: '크래프톤', title: 'Head of Product',
    fields: ['Product', 'Design'], years: 13, industry: 'IT/소프트웨어', location: '서울 강남',
    bio: '배틀그라운드 글로벌 프로덕트를 리드했습니다. B2C 프로덕트 매니지먼트 10년+. 전 라인, NHN 출신.',
    visibility: 'members_only', openToChat: true,
  },
  {
    name: '한소희', email: `sohee.han@${SEED_EMAIL_DOMAIN}`, tier: 'core', role: 'member',
    company: '당근', title: 'Head of Design',
    fields: ['Design', 'Product'], years: 10, industry: 'IT/소프트웨어', location: '서울 서초',
    bio: '당근마켓의 디자인 시스템과 UX를 총괄합니다. 사용자 중심 설계와 디자인 리더십에 관심이 많습니다. 전 카카오, 삼성전자 출신.',
    visibility: 'all', openToChat: false,
  },
  {
    name: '최우진', email: `woojin.choi@${SEED_EMAIL_DOMAIN}`, tier: 'core', role: 'member',
    company: '두나무', title: 'CTO',
    fields: ['Engineering', 'Data'], years: 16, industry: '금융/핀테크', location: '서울 강남',
    bio: '업비트의 거래 엔진과 인프라를 설계했습니다. 블록체인, 분산 시스템, 고성능 금융 시스템 전문. 전 삼성 SDS, Goldman Sachs 출신.',
    visibility: 'all', openToChat: true,
  },
  {
    name: '윤채원', email: `chaewon.yoon@${SEED_EMAIL_DOMAIN}`, tier: 'core', role: 'member',
    company: '뱅크샐러드', title: 'CPO',
    fields: ['Product', 'Data'], years: 12, industry: '금융/핀테크', location: '서울 강남',
    bio: '데이터 기반 금융 상품 추천 프로덕트를 만듭니다. 핀테크 업계에서 PO/PM 커리어 10년+. 전 카카오뱅크, 토스 출신.',
    visibility: 'corporate_only', openToChat: true,
  },
  // endorsed members
  {
    name: '김태영', email: `taeyoung.kim@${SEED_EMAIL_DOMAIN}`, tier: 'endorsed', role: 'member',
    company: '네이버', title: 'Senior Software Engineer',
    fields: ['Engineering'], years: 7, industry: 'IT/소프트웨어', location: '성남 분당',
    bio: '네이버 검색 백엔드를 담당하고 있습니다. 대규모 분산 시스템과 검색 엔진에 관심이 많습니다.',
    visibility: 'all', openToChat: true,
  },
  {
    name: '이수빈', email: `subin.lee@${SEED_EMAIL_DOMAIN}`, tier: 'endorsed', role: 'member',
    company: '카카오', title: 'Product Manager',
    fields: ['Product', 'Marketing'], years: 6, industry: 'IT/소프트웨어', location: '성남 판교',
    bio: '카카오톡 비즈니스 기능 PM을 맡고 있습니다. 사용자 리텐션과 그로스 해킹에 관심이 많습니다.',
    visibility: 'all', openToChat: true,
  },
  {
    name: '박준혁', email: `junhyuk.park@${SEED_EMAIL_DOMAIN}`, tier: 'endorsed', role: 'member',
    company: '리디', title: 'Frontend Lead',
    fields: ['Engineering', 'Design'], years: 8, industry: '미디어/콘텐츠', location: '서울 강남',
    bio: '리디의 웹/앱 프론트엔드를 리드합니다. React, Next.js, 디자인 시스템 구축 전문. 오픈소스 기여 활발.',
    visibility: 'all', openToChat: true,
  },
  {
    name: '신예린', email: `yerin.shin@${SEED_EMAIL_DOMAIN}`, tier: 'endorsed', role: 'member',
    company: '마이리얼트립', title: 'Data Analyst',
    fields: ['Data', 'Marketing'], years: 5, industry: '스타트업', location: '서울 마포',
    bio: '여행 플랫폼의 데이터 분석과 마케팅 최적화를 담당합니다. SQL, Python, Tableau 활용 능력.',
    visibility: 'members_only', openToChat: false,
  },
  {
    name: '오동현', email: `donghyun.oh@${SEED_EMAIL_DOMAIN}`, tier: 'endorsed', role: 'member',
    company: '번개장터', title: 'Backend Engineer',
    fields: ['Engineering'], years: 4, industry: 'IT/소프트웨어', location: '서울 성수',
    bio: '중고거래 플랫폼의 결제/정산 시스템을 개발하고 있습니다. Kotlin, Spring Boot, AWS 스택.',
    visibility: 'all', openToChat: true,
  },
  {
    name: '장하은', email: `haeun.jang@${SEED_EMAIL_DOMAIN}`, tier: 'endorsed', role: 'member',
    company: '센드버드', title: 'DevRel Engineer',
    fields: ['Engineering', 'Marketing'], years: 6, industry: 'IT/소프트웨어', location: '서울 강남',
    bio: '개발자 경험(DX)과 기술 커뮤니티 성장에 집중합니다. API 설계, 기술 문서, 개발자 교육 전문.',
    visibility: 'all', openToChat: true,
  },
  {
    name: '류성준', email: `sungjun.ryu@${SEED_EMAIL_DOMAIN}`, tier: 'endorsed', role: 'member',
    company: '힐링페이퍼', title: 'iOS Developer',
    fields: ['Engineering', 'Design'], years: 5, industry: '의료/헬스케어', location: '서울 역삼',
    bio: '강남언니 iOS 앱을 개발합니다. Swift, SwiftUI, 접근성에 관심이 많습니다.',
    visibility: 'all', openToChat: true,
  },
]

// 기업 사용자
export const CORPORATE_USERS_DATA = [
  {
    name: '이재용', email: `jaeyong.lee@${SEED_EMAIL_DOMAIN}`,
    company: '퓨처밸리 벤처스', corpRole: 'ceo', title: 'CEO & Managing Partner',
  },
  {
    name: '김수진', email: `sujin.kim@${SEED_EMAIL_DOMAIN}`,
    company: '스타트업얼라이언스', corpRole: 'founder', title: 'Founder & CEO',
  },
  {
    name: '박현우', email: `hyunwoo.park@${SEED_EMAIL_DOMAIN}`,
    company: '카카오엔터프라이즈', corpRole: 'c_level', title: 'CHRO (Chief HR Officer)',
  },
  {
    name: '정은지', email: `eunji.jung@${SEED_EMAIL_DOMAIN}`,
    company: '야놀자', corpRole: 'ceo', title: 'CEO',
  },
  {
    name: '홍길동', email: `gildong.hong@${SEED_EMAIL_DOMAIN}`,
    company: '무신사', corpRole: 'hr_leader', title: 'Head of People & Culture',
  },
  {
    name: '서민재', email: `minjae.seo@${SEED_EMAIL_DOMAIN}`,
    company: '비바리퍼블리카', corpRole: 'founder', title: 'Co-founder & CPO',
  },
]
