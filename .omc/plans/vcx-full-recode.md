# VCX Full Recode Plan
## 프로토타입(260401vcx-complete.jsx) 기반 전체 서비스 리코딩

**참조 파일**: `docs/260401vcx-complete.jsx`
**범위**: UI 전체 + DB/API (풀스택)
**작성일**: 2026-04-02

---

## Phase 0: 디자인 시스템 & 인프라 업데이트

### 0-1. 디자인 토큰 업데이트
- **파일**: `src/app/globals.css`, `src/constants/site.ts`
- 프로토타입 색상 반영:
  - bg: `#f5f0e8` (현재 `#f0ebe2` → 약간 더 따뜻한 톤)
  - bgAlt: `#ebe5da`
  - gold: `#c9a84c` (유지)
  - goldDeep: `#b8902a` (추가)
  - body: `#555` (추가)
  - light: `#888` (추가)
  - serif: Georgia, 'Noto Serif KR', serif (현재 Georgia만)
  - sans: Pretendard, 'Apple SD Gothic Neo', sans-serif
- globals.css에 새 유틸리티 클래스 추가:
  - `.bg-vcx-bg` (#f5f0e8)
  - `.text-vcx-body` (#555)
  - `.text-vcx-light` (#888)
  - `.text-vcx-gold-deep` (#b8902a)

### 0-2. 네비게이션 상수 업데이트
- **파일**: `src/constants/navigation.ts`
- 새 구조:
  ```
  서비스 소개 (dropdown) → 서비스 소개, 멤버 소개, Benefit
  큐레이션 피드 (NEW, badge)
  커뮤니티 라운지
  커피챗 신청
  CEO Coffeechat
  채용 포지션
  ```

### 0-3. 타입 정의 추가
- **파일**: `src/types/index.ts`
- 추가할 타입:
  - `FeedItem` (curation feed 아이템)
  - `FeedInterest` (관심 분야 칩)
  - `FeedSubscription` (뉴스레터 구독)
  - `CommunityReaction` (이모지 반응 확장)
  - `MembershipTier` 상세 혜택 타입

---

## Phase 1: DB 마이그레이션 & API

### 1-1. 큐레이션 피드 테이블 (020_vcx_curation_feed.sql)
```sql
-- vcx_feed_items: 큐레이션 피드 아이템
CREATE TABLE vcx_feed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  company_tag text,
  role text NOT NULL,
  level text,
  team_size text,
  salary_band text,
  location text,
  tags text[] DEFAULT '{}',
  summary text,
  exclusive boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- vcx_feed_interests: 사용자 관심 분야
CREATE TABLE vcx_feed_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  chips text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- vcx_feed_responses: 피드 아이템에 대한 반응 (관심/스킵)
CREATE TABLE vcx_feed_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  feed_item_id uuid NOT NULL REFERENCES vcx_feed_items(id),
  response text CHECK (response IN ('yes', 'skip')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feed_item_id)
);

-- vcx_feed_subscriptions: 뉴스레터 구독
CREATE TABLE vcx_feed_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```
- RLS 정책: 멤버만 읽기, 본인 데이터만 쓰기

### 1-2. API Route 추가
- `src/app/api/feed/route.ts` — GET (피드 목록), POST (관리자 피드 생성)
- `src/app/api/feed/interests/route.ts` — GET/PUT (관심 분야)
- `src/app/api/feed/[id]/response/route.ts` — POST (관심/스킵)
- `src/app/api/feed/subscribe/route.ts` — POST (뉴스레터 구독)

---

## Phase 2: GNB 리코딩

### 2-1. GNB 컴포넌트 재작성
- **파일**: `src/components/layout/gnb.tsx`, `src/components/layout/gnb-dropdown.tsx`
- 프로토타입 구조:
  - 좌: 로고 "ValueConnect X" (serif, gold X)
  - 중: 네비게이션 (서비스 소개 드롭다운 + 5개 메뉴)
  - 우: 로그인 + 회원가입 버튼
  - 높이 60px, sticky top-0, 베이지 배경
  - 서비스 소개 드롭다운: 서비스 소개 / 멤버 소개 / Benefit (gold top bar)
  - 큐레이션 피드에 "NEW" 배지
  - 활성 메뉴: font-semibold + gold underline
- 모바일 대응: 기존 hamburger 패턴 유지하되 새 디자인 적용

---

## Phase 3: 서비스 소개 그룹 (3개 페이지)

### 3-1. 서비스 소개 페이지 (ServicePage)
- **파일**: `src/app/page.tsx` (기존 랜딩 페이지 대체)
- 구조:
  - Hero: 다크 배경, "시대의 인재를 모읍니다", 통계 3개 (초대 전용, 25%, CEO Direct)
  - Five Pillars: 2컬럼 그리드 (좌: 설명, 우: INSIGHT), 클릭시 해당 페이지로
  - CTA: 다크 배경 블록, "30명이 머무는 이유를 설계하는 것이다"

### 3-2. 멤버 소개 페이지 (MembersPage)
- **파일**: `src/app/(protected)/directory/page.tsx` (기존 디렉토리 리코딩)
- 구조:
  - Hero: 다크 배경, "멤버 소개", serif 제목
  - 검색 입력
  - 멤버 카드 리스트 (아바타 + 이름 + Core/Endorsed 배지 + 소개)
- 기존 Supabase vcx_members 연동 유지

### 3-3. 멤버십 혜택 페이지 (BenefitPage)
- **파일**: `src/app/benefit/page.tsx` (신규)
- 구조:
  - Hero: 다크 배경, "멤버십 혜택"
  - 2컬럼: Core (다크 배경) vs Endorsed (라이트 배경)
  - 보상 구조: 3컬럼 그리드 (성사 수수료, Self Referral, Peer Referral)
- 정적 페이지 (DB 불필요)

---

## Phase 4: 큐레이션 피드 (신규)

### 4-1. 피드 페이지
- **파일**: `src/app/(protected)/feed/page.tsx` (신규)
- **컴포넌트**:
  - `src/components/feed/feed-hero.tsx` — 다크 히어로 + 뉴스레터 배지
  - `src/components/feed/interest-selector.tsx` — 관심 분야 칩 + 직접 입력
  - `src/components/feed/feed-card.tsx` — 피드 카드 (회사 아바타, 메타, 태그, 관심 버튼)
  - `src/components/feed/feed-detail-modal.tsx` — 상세 모달
  - `src/components/feed/newsletter-bar.tsx` — 뉴스레터 구독 바
- SWR로 피드 데이터 fetch, 관심/스킵 POST

---

## Phase 5: 커뮤니티 라운지 리코딩

### 5-1. 커뮤니티 페이지 재작성
- **파일**: `src/app/(protected)/community/page.tsx`
- **컴포넌트**:
  - `src/components/community/lounge-hero.tsx` — 다크 히어로
  - `src/components/community/lounge-sidebar.tsx` — 카테고리 사이드바 (gold active bar)
  - `src/components/community/lounge-post-row.tsx` — 인라인 확장형 포스트 (접힘/펼침)
  - `src/components/community/lounge-write-modal.tsx` — 글쓰기 모달 (익명 토글)
  - `src/components/community/emoji-reactions.tsx` — 이모지 반응 시스템
- 카테고리 변경: reading, career, company, leadership, productivity, casual
- 기존 community_posts + community_comments 테이블 활용
- community_reactions 테이블(014 마이그레이션) 활용하여 이모지 반응

---

## Phase 6: 채용 포지션 리코딩

### 6-1. 포지션 페이지 재작성
- **파일**: `src/app/(protected)/positions/page.tsx`
- **컴포넌트**:
  - `src/components/positions/position-hero.tsx` — 다크 히어로
  - `src/components/positions/position-filter-bar.tsx` — 도메인 필터 탭
  - `src/components/positions/position-card.tsx` — 인라인 확장형 (MATCH 스코어, texture, 요건)
- positions 테이블에 texture, full_desc, reqs 컬럼 추가 필요 (021 마이그레이션)
- 기존 position_interests 활용

---

## Phase 7: CEO 커피챗 리코딩

### 7-1. CEO 커피챗 페이지 재작성
- **파일**: `src/app/(protected)/ceo-coffeechat/page.tsx`
- **컴포넌트**:
  - `src/components/coffeechat/ceo-hero.tsx` — 다크 히어로 + 통계
  - `src/components/coffeechat/ceo-session-card.tsx` — 인라인 확장형 카드
  - `src/components/coffeechat/ceo-apply-modal.tsx` — 신청 모달
- vcx_ceo_coffee_sessions에 signal, looking_for 컬럼 확인/추가
- 기존 vcx_coffee_applications 활용

---

## Phase 8: 피어 커피챗 리코딩

### 8-1. 피어 커피챗 페이지 재작성
- **파일**: `src/app/(protected)/coffeechat/page.tsx`
- **컴포넌트**:
  - `src/components/coffeechat/peer-hero.tsx` — 다크 히어로
  - `src/components/coffeechat/peer-session-card.tsx` — 간결한 카드
  - `src/components/coffeechat/peer-write-modal.tsx` — 사연 올리기 모달
- 기존 peer_coffee_chats + peer_coffee_applications 활용

---

## 실행 순서 및 의존성

```
Phase 0 (디자인 시스템) ──→ 모든 Phase의 전제조건
Phase 1 (DB/API) ──→ Phase 4 (피드)의 전제조건
Phase 2 (GNB) ──→ 독립 (Phase 0 이후)
Phase 3 (서비스 소개 그룹) ──→ 독립 (Phase 0 이후)
Phase 4 (큐레이션 피드) ──→ Phase 1 필요
Phase 5 (커뮤니티) ──→ 독립 (Phase 0 이후)
Phase 6 (포지션) ──→ 독립 (Phase 0 이후, DB 확장 포함)
Phase 7 (CEO 커피챗) ──→ 독립 (Phase 0 이후)
Phase 8 (피어 커피챗) ──→ 독립 (Phase 0 이후)
```

### 병렬 실행 가능 그룹:
- **Group A**: Phase 0 (선행)
- **Group B** (Phase 0 완료 후 병렬): Phase 1, Phase 2, Phase 3
- **Group C** (Phase 0 완료 후 병렬): Phase 5, Phase 6, Phase 7, Phase 8
- **Group D** (Phase 1 완료 후): Phase 4

---

## 검증 기준

1. `npm run build` 에러 0
2. `npm run lint` 에러 0
3. `npm test` 통과
4. 모든 페이지 한국어 UI
5. 모바일(360px) 반응형 동작
6. 프로토타입 디자인과 시각적 일치
7. 기존 Supabase 연동 유지 (로그인, 인증, RLS)

---

## 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| 기존 테스트 깨짐 | 컴포넌트 변경 시 테스트 동시 업데이트 |
| 마이그레이션 013/014 중복 | 020부터 새 번호 사용 |
| Tailwind v4 호환 | globals.css에서 @utility 사용 |
| 모바일 레이아웃 프로토타입 없음 | Galaxy 360px 기준 mobile-first 원칙 적용 |
