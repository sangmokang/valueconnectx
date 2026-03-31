# ValueConnect X — 코드/UX 품질 점검 리포트 (2026-03-31)

본 리포트는 현재 레포 상태 기준으로, 사용자 경험(UX)과 코드 컨벤션/보안/설계 가이드를 10배 깐깐하게 점검한 결과입니다. 각 이슈는 심각도, 증상, 재현 절차, 기대 동작, 실제 동작, 코드 근거, 수정 제안 순서로 정리했습니다.

---

## TL;DR — 주요 요약
- 치명/높음 8건, 중간 7건, 경미/개선권장 6건 확인
- 디자인 시스템 위반(토큰 미사용, radius 사용), 사라진/잘못된 링크, 한국어 에러·UI 텍스트 일관성 위반, API 에러 헬퍼 미준수 등이 핵심
- 사용자 여정 기준으로는 GNB 링크 일부 404 위험, 프로필 이동 dead link, 비인증 시 일부 에러 카피 영어 노출 가능성 발견

---

## 치명/높음(Critical/High)

1) GNB 드롭다운 내 dead link(`/benefit`) 존재
- 심각도: High
- 증상: `멤버 혜택(/benefit)` 메뉴가 노출되지만 해당 페이지 라우트가 없음 → 404 위험
- 재현: 상단 GNB → 서비스 소개 드롭다운 → 멤버 혜택 클릭
- 기대: 유효한 혜택 소개 페이지로 이동
- 실제: 라우트 미구현으로 404 가능
- 코드 근거: `src/constants/navigation.ts:9`, `src/data/navigation.ts:10`에 `/benefit` 항목 존재. 실제 라우트 파일 미존재
- 수정 제안: (A) 라우트 구현 `src/app/benefit/page.tsx` 추가, (B) 임시로 메뉴 비노출 처리

2) 사용자 메뉴의 ‘프로필’ 링크 dead link(`/profile`)
- 심각도: High
- 증상: 로그인 후 우측 상단 사용자 메뉴 → ‘프로필’ 클릭 시 `/profile` 이동, 실제 라우트 없음
- 재현: 로그인 → GNB 우측 `UserMenu` → ‘프로필’ 클릭
- 기대: 내 프로필 편집 `/directory/me` 이동
- 실제: dead link 가능
- 코드 근거: `src/components/auth/user-menu.tsx:33`
- 수정 제안: 링크를 `/directory/me`로 교체

3) Middleware API 에러 메시지의 한국어/헬퍼 미준수 + 영어 노출
- 심각도: High
- 증상: 미들웨어의 API 보호 구간에서 에러가 영어로 반환되거나 에러 헬퍼 미사용
- 재현: 비인증 상태로 보호된 API(hit) → 401/403 에러 확인
- 기대: 한국어 메시지 + 프로젝트 표준 에러 헬퍼 사용
- 실제: `Unauthorized`, `Not a VCX member` 영어 문자열 사용, `NextResponse.json` 직접 생성
- 코드 근거: `src/middleware.ts:53`, `src/middleware.ts:61`
- 수정 제안: 한국어로 통일(예: ‘인증이 필요합니다’, ‘VCX 멤버만 접근할 수 있습니다’)하고, 가급적 라우트 핸들러에서와 동일한 에러 포맷 유지

4) Admin Analytics UI: radius 사용(디자인 시스템 위반) + 인라인 hex 남용
- 심각도: High
- 증상: 카드/툴팁/범례 점 등에서 `borderRadius: '12px' | '8px' | '3px'` 사용. 전역 원칙 `border-radius: 0` 위반
- 재현: `/admin/analytics` 방문 → 카드/툴팁 테두리 둥근 정도 확인(글로벌 강제 0이 덮일 수 있으나 코드 컨벤션 위반)
- 기대: rounded-* 금지, radius 0 유지(차트 내부 primitive만 예외)
- 실제: 여러 곳에서 radius 명시 사용
- 코드 근거: `src/app/(protected)/admin/analytics/page.tsx:54, 120, 136, 150, 181, 189`
- 수정 제안: 모든 `borderRadius` 제거. 차트 내부 점/도넛 모양 등만 예외적으로 둥글기를 허용하되, 컨테이너는 0 유지

5) 디자인 토큰 미사용(직접 hex 사용이 광범위)
- 심각도: High
- 증상: VCX 색상 유틸(`bg-vcx-*`, `text-vcx-*`) 대신 hex를 직접 사용하고 인라인 스타일이 곳곳에 존재
- 영향: 유지보수성 악화, 테마·브랜딩 변경 비용 증가, 디자인 시스템 일관성 저하
- 코드 근거 예시:
  - 버튼: `src/components/ui/button.tsx:14-27`
  - 배지: `src/components/ui/badge.tsx:12-14`
  - GNB: `src/components/layout/gnb.tsx:31-39, 59-60, 85`
  - 드롭다운: `src/components/layout/gnb-dropdown.tsx:31-39, 61-66, 145`
  - 전역 레이아웃: `src/app/layout.tsx:22`
- 수정 제안: 색상은 전부 `bg-vcx-*`/`text-vcx-*`/`border-vcx-*` 유틸로 치환. 인라인 색상/스타일 최소화, Tailwind v4 유틸 우선 적용

6) NotificationBell에서 rounded-* 클래스 사용(디자인 시스템 위반)
- 심각도: High (시각적 영향은 전역 강제 0으로 상쇄되더라도 컨벤션 위반)
- 증상: 뱃지/드롭다운에 `rounded-full`, `rounded-lg` 클래스 사용
- 코드 근거: `src/components/layout/notification-bell.tsx:102, 109`
- 수정 제안: rounded-* 제거(전역 `border-radius: 0 !important;`와 일관 유지)

7) Admin Analytics API: 에러 헬퍼 미사용
- 심각도: High(컨벤션 위반 + 일관성 저하)
- 증상: `NextResponse.json`으로 직접 에러 반환
- 코드 근거: `src/app/api/admin/analytics/route.ts:27, 37, 145`
- 수정 제안: `unauthorized()`, `forbidden()`, `serverError()`로 통일

8) 한국어 일관성: 온보딩/홈 일부 라벨이 영문
- 심각도: High(브랜드 톤앤매너 의도와 다르면 사용자 혼동)
- 증상: `Welcome`, `OUR THESIS`, `INSIGHT`, `WHY THIS EXISTS` 등 섹션 라벨 노출
- 코드 근거 예시: `src/app/(protected)/onboarding/page.tsx:146`, `src/app/page.tsx` 내 섹션 라벨
- 수정 제안: 한국어로 통일(예: Welcome → 환영합니다). 단, 용어 원문 유지 정책(예: Coffee Chat)은 그대로 유지

---

## 중간(Medium)

9) ‘Member Directory’, ‘Position Board’ 등 일부 헤더 영문 유지
- 맥락: 디자인 시스템 문서에 “영문 용어는 원문 유지” 명시되어 있어 허용 범주로 보이나, 페이지마다 혼용되면 일관성이 떨어질 수 있음
- 제안: 상단 H1/섹션 헤더의 한국어/영어 표기 원칙을 명문화하여 전역 통일(예: 한글 메인, 영문은 보조 라벨)

10) 인라인 스타일 과다 사용
- 영향: 다크모드/테마, 리뉴얼 시 비용 증가. Tailwind v4 유틸 우선 원칙 위배 경향
- 예시: `src/app/layout.tsx:19-24` 등 다수
- 제안: 인라인 → 유틸 클래스로 점진 치환, 재사용 컴포넌트화

11) 네비게이션 config 중복 및 드리프트 위험
- 증상: `src/data/navigation.ts`는 미사용, `src/constants/navigation.ts`가 실제 사용
- 리스크: 메뉴 수정 시 중복 파일 간 내용 불일치 발생 가능
- 제안: 단일 소스 유지(불필요 파일 제거 또는 주석 명시)

12) `publicRoutes`에 존재하지 않는 `/service-overview` 항목 포함
- 증상: 실제 라우트 미존재(현재 홈(`/`)이 서비스 소개 역할 수행)
- 코드 근거: `src/lib/auth/routes.ts:1`
- 제안: 의미 없는 엔트리 제거 또는 TODO 주석 추가

13) API 라우트 내 일관되지 않은 에러 처리 패턴 혼재
- 증상: 대부분은 에러 헬퍼 준수, 일부 파일은 직접 `NextResponse.json`
- 제안: Lint rule 또는 코드 모드로 일괄 교정

14) Placeholder 영문(예: `name@company.com`)
- 영향: 경미하나 한국어 톤에서 이질감 가능
- 제안: `name@company.com` → `name@company.co.kr` 또는 ‘회사 이메일’을 안내 문구로 한글화

15) UX Microcopy 세부 일관성
- 예: ‘초대 확인하기’ vs ‘초대 수락하기’ 표현 통일 필요(의도한 맥락에 맞춰 일관 적용)

---

## 경미/개선권장(Low)

16) 전역 CSS에서 shadcn 기본 CSS import 유지
- 맥락: 현재 토큰 오버라이드로 스타일 일관성은 확보된 것으로 보이나, 장기적으로 shadcn 의존 최소화 권장
- 코드 근거: `src/app/globals.css:3`

17) 타이포그래피/간격 인라인 수치
- 영향: 디자인 변경 시 유지보수 비용 증가
- 제안: 공통 유틸 클래스로 승격(예: `.vcx-section-label`, `.vcx-label`처럼)

18) 테스트에서 한국어 메시지/카피 변경 시 깨질 가능성
- 제안: 테스트에서 사용자 facing 카피는 data-testid 기반으로 검증하는 쪽 고려

19) 라우트 보호/리다이렉트 시 헤더만으로 상태 판단하는 컴포넌트 주석 보강
- 코드 근거: `src/components/layout/protected-page-wrapper.tsx`

20) Recharts 색상 팔레트 하드코딩
- 제안: 차트 전용 토큰/팔레트 유틸로 치환하여 테마 일관성 강화

---

## 사용자 여정 관점 점검(요약)
- 비로그인: 보호 페이지 접근 시 `LoginWall`로 유도 정상. 단, API 경로에서 영어 에러 노출 가능성 존재(미들웨어)
- 로그인: GNB 사용자 메뉴의 ‘프로필’ dead link로 흐름 단절(치명)
- 탐색: GNB의 ‘멤버 혜택’ dead link 위험
- 관리자: Analytics 화면은 기능 동작 OK로 보이나, 디자인 시스템 위반(rounded, hex)으로 UI 일관성 저하

---

## 제안하는 수정 우선순위 및 액션 플랜
- P0 (즉시):
  - ‘프로필’ dead link 수정(`/profile` → `/directory/me`)
  - GNB `/benefit` dead link 처리(페이지 추가 or 메뉴 숨김)
  - 미들웨어 에러 한국어화 및 형식 통일
- P1 (일주일 내):
  - Admin Analytics UI에서 radius 제거(컨테이너/툴팁 등), hex → VCX 토큰 치환
  - NotificationBell의 rounded-* 제거
  - Admin Analytics API 에러 헬퍼로 통일
- P2 (순차):
  - 전역적으로 인라인 hex/스타일 치환(토큰/유틸 사용)
  - 네비게이션 설정 단일 소스화, 불필요 파일 제거
  - 온보딩/홈 영문 라벨 한국어로 통일(용어 원문 유지 정책은 유지)

---

## 참고 — 관련 규칙
- 디자인 시스템: `skills/SKILL-vcx-design-system.md`
- API 컨벤션: `skills/SKILL-api-route-convention.md`
- Supabase SSR: `skills/SKILL-supabase-ssr.md`
- Zod 검증: `skills/SKILL-zod-validation.md`

---

## 긍정적 신호(좋았던 점)
- 전역 `border-radius: 0` 강제 및 Tailwind v4 기반 CSS-first 구성(`src/app/globals.css:135-139`)
- API 라우트 다수에서 인증 → 권한 → 검증 → 비즈니스 로직 → 에러 헬퍼 패턴 준수
- 디렉토리 스크래핑 방지(레이트리밋 + 미들웨어/서버 로직), 초대 수락의 원자적 처리(RPC) 등 보안 설계 성숙도 양호

---

필요 시 위 항목들에 대한 패치 적용을 순서대로 진행하겠습니다. 수정 우선순위(P0→P2)에 동의하시면, 각 항목별 커밋 계획과 변경 영향 범위를 더 구체화해 드리겠습니다.

