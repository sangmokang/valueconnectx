import { ServicePillar } from '@/types';

export const servicePillars: ServicePillar[] = [
  {
    number: '01',
    englishName: 'MEMBER DIRECTORY',
    koreanTitle: '검증된 핵심인재 디렉토리',
    description:
      'Core Member와 Endorsed Member로 구성된 폐쇄형 인재 네트워크. 이름, 직군, 전문 분야로 검색하고, Member Profile을 통해 커리어 신뢰를 확인할 수 있습니다.',
    insight:
      'Anti-Scraping 정책으로 멤버 정보를 보호합니다. 1분 내 10 프로필 조회 시 경고, 20 프로필 조회 시 세션 종료, 하루 50 프로필 조회 시 접근 제한.',
  },
  {
    number: '02',
    englishName: 'POSITION BOARD',
    koreanTitle: '검증된 포지션만 게시',
    description:
      '기업이 직접 포지션을 등록하지 않습니다. CEO/HR 구두 동의 후 ValueConnect Admin이 내부 검증을 거쳐 등록합니다. 검증되지 않은 포지션은 게시하지 않습니다.',
    insight:
      '멤버는 관심 있음 / 관심 없음 / 나중에 보기로 반응할 수 있습니다. 포지션 관심 데이터만 채용에 활용되며, 커뮤니티 활동 데이터는 채용에 절대 활용되지 않습니다.',
  },
  {
    number: '03',
    englishName: 'CEO COFFEE CHAT',
    koreanTitle: '의사결정자와의 직접 채널',
    description:
      'CEO/Founder/C-Level이 직접 세션을 생성하고, 멤버가 신청하며, CEO가 선택하는 1:1 Coffee Chat. 세션 생성 시 약식 헤드헌팅 계약 조건에 동의해야 합니다.',
    insight:
      'HR을 거치지 않고 의사결정자와 직접 대화하는 것만으로도, 조직 문화와 결의 수준을 서로 가늠할 수 있다.',
  },
  {
    number: '04',
    englishName: 'COMMUNITY BOARD',
    koreanTitle: '멤버 전용 익명 커뮤니티',
    description:
      "커리어 고민, 조직 고민·리더쉽, 연봉 협상, 번아웃, 생산성·News, '이 회사 어때요?' 등 6개 카테고리. CEO는 접근할 수 없습니다.",
    insight:
      '모든 커뮤니티 글은 채용 활용이 불가합니다(Privacy Model). 사실 기반 정보만 허용되며, 가이드라인 위반 글은 Admin이 즉시 삭제합니다.',
  },
  {
    number: '05',
    englishName: 'PEER COFFEE CHAT',
    koreanTitle: '멤버 간 신뢰 기반 연결',
    description:
      '사연을 올리면 비밀 댓글로 신청받고, 작성자가 직접 선택하는 P2P 연결. 커리어 대화뿐 아니라 채용을 전제로 한 Coffee Chat도 가능합니다.',
    insight:
      'Coffee Chat을 통해 채용으로 이어지는 경우, 해당 채용은 ValueConnect의 소개·알선 구조를 통해 진행됩니다. Self Introduction Reward 지급.',
  },
];
