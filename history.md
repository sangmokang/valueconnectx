# ValueConnect X — 변경 이력 (History)

> 서비스 요구사항·기능·코드·프롬프팅 변경을 시간 역순(최신 → 과거)으로 누적 기록합니다.
> 커밋 단위뿐 아니라 의미 있는 프롬프트, 의사결정, 방향 전환도 함께 적습니다.

## 작성 규칙
- **정렬**: 최신이 위 (desc by date)
- **포맷**: `## YYYY-MM-DD` 헤더 → 항목별 `- [type] 내용 (commit-hash | source)`
- **type**: `feat` 신규기능 / `fix` 버그수정 / `refactor` 리팩터 / `docs` 문서 / `chore` 잡무 / `test` 테스트 / `prompt` AI 프롬프팅·요구사항 변경 / `decision` 의사결정 / `infra` 인프라
- **source**: `commit:해시` 또는 `chat:세션설명` 또는 `manual:작성자`
- 커밋 없는 변경(프롬프트, 결정사항)도 반드시 기록

---

## 2026-05-08

- [design] **브랜드 일관성 전면 정비 — 하드코딩 hex → VCX 디자인 토큰 전환 (Multi-Agent, commit:8051d28)**
  - `globals.css`: `--color-vcx-cream/off-white/error` 토큰 3건 신규 추가
  - `layout.tsx`: background hex → `var(--color-vcx-beige)` 전환
  - `global-error.tsx`: CSS var 폴백 hex 추가 (globals.css 미로드 환경 안전성)
  - `gnb-dropdown.tsx`: 16건 arbitrary hex → `vcx-gold/dark/beige` Tailwind 유틸
  - `position-card.tsx`: 17건 hex 전환 + `MATCH→매치` 한국어 통일
  - coffeechat 4파일 (`ceo-session-card`, `peer-hero`, `peer-session-card`, `peer-write-modal`): ~56건 전환
  - `member-profile.tsx`: 13건 / `member-card.tsx`: 12건 — arbitrary Tailwind 전량 vcx-* 유틸로 전환
  - `page.tsx`: 히어로 카피 Community 프레이밍 업데이트
  - vitest 785/785 PASS, npm run build (clean) exit 0
- [fix] feed-card EXCLUSIVE→HOT LINE + D-0002 CLOSED (commit:7888c45)
- [chore] HUD state + history 업데이트 (commit:40a64a0)
- [chore] design(brand): 하드코딩 hex → VCX 디자인 토큰 전환 (L-Std) (commit:8051d28)
- [chore] design(brand): 2차 VCX 토큰 전환 — gnb/auth/coffeechat/admin/ui (L-Std) (commit:b8ba106)
- [chore] CSS 토큰 정리 + Sprint 4 Go/No-Go + ADR-0010 Phase2 착수 (L-Std) (commit:73a85cb)
- [chore] design(brand): 3차 VCX 토큰 전환 — coffeechat 잔여 4파일 (L-Std) (commit:5ed142f)
- [docs] VERTICAL_SLICE_PHASE2.md 초안 — ADR-0010 착수 조건 #2 충족 (L-Std) (commit:e725f18)
- [chore] 완료 플랜 아카이브 → 활성 2건 (ADR-0010 M3 ≤3 충족) (commit:c623d64)
- [docs] ADR-0010 2차 서명 완료 — Phase 2 착수 승인 (소유자 지시로 쿨다운 면제) (commit:4d509e6)
- [style] VCX 토큰 전환 — coffeechat/positions/directory 컴포넌트 (16파일) (commit:89c40c8)
- [fix] peer-session-card text-sub-N → text-vcx-sub-N (vcx- 접두사 누락 수정) (commit:e8b3edb)
- [style] --color-vcx-sub-* CSS 변수 + border-vcx-sub-* 유틸리티 추가 (commit:ffcae94)
- [feat] 초대 시 인재 정보 pre-seed (invitee_name/company/title) (commit:fd15573)
- [feat] Cold Start 자동화 — 초대 시 name/company/title pre-seed (L-Std) (commit:3b2476c)
- [style] VCX 토큰 전환 — auth/admin/community/coffeechat/positions/directory (51파일) (commit:a13cd39)
- [style] 인라인 스타일 hex → CSS 변수 전환 완료 (commit:06f1b58)
- [feat] AI Brief V2 — 수수료 필터 + CEO 컬쳐핏 프롬프트 + 샘플 15건 (L-Std) (commit:0b45d32)
- [feat] Community 강화 — rate-limit + admin CommunityReports + E2E spec (commit:f93905c)
- [feat] Onboarding V2 — 전문 분야 프리셋 칩 + 프로필 편집 칩 UI (commit:f1ca462)
- [fix] 031 — vcx_consume_invite에 invitee_name/company/title 반환 추가 (commit:a8a5569)
- [chore] 계획 아카이브와 QA 증거를 Phase 2 추적 가능 상태로 남김 (commit:415c087)
- [chore] 계획 아카이브와 QA 증거를 Phase 2 추적 가능 상태로 남김 (commit:415c087)
- [feat] 서비스 소개 페이지 '관찰/검증/연결' 3단계 카드 추가 (commit:75601b9)

## 2026-05-07

- [fix] feed-card EXCLUSIVE→HOT LINE + D-0002 CLOSED (L-Std) (commit:7888c45)

## 2026-05-05

- [fix] **S1 버그 3종 수정 + D-0004 CLOSED + D-0005 CLOSED (Multi-Agent, commit:90e831f)**
  - GNB visibility 매처 강화 — `/onboarding` 경로 숨김 보장 (`gnb-visibility.tsx`)
  - Progress bar 0% 버그 수정 — `useMemo` 기반 재계산 (`onboarding-client.tsx`)
  - D-0004 CLOSED: `linkedin_url` optional 구현 (`optionalLinkedinUrlSchema`, middleware, API route, 라벨 변경)
  - D-0005 CLOSED: Newsletter API `any` 타입 이미 해소 확인 — DEBT_LEDGER 업데이트
  - **영향 파일**: `src/components/layout/gnb-visibility.tsx`, `src/app/(protected)/onboarding/onboarding-client.tsx`, `src/lib/validation/linkedin.ts`, `src/app/api/directory/me/route.ts`, `src/middleware.ts`, `src/__tests__/api/directory/me.test.ts`, `docs/sdd/DEBT_LEDGER.md`
- [test] **E2E Slice spec 정비 (Multi-Agent, commit:90e831f)**
  - `e2e/slice/s1-invite-onboarding.spec.ts` 신규 (8 tests — AC1~6 + D-0001·D-0004 regression)
  - `e2e/slice/s5-feedback.spec.ts` AC5 추가 (`session_feedback_submit` console.info 검증)
  - `e2e/slice/s2-feed.spec.ts` 기존 spec AC1~5 + 모바일 완비 확인 (중복 파일 제거)
  - E2E 현황: S1(spec완성) S2(spec완성) S3✅ S4✅ S5(spec완성)
  - **영향 파일**: `e2e/slice/s1-invite-onboarding.spec.ts`, `e2e/slice/s5-feedback.spec.ts`
- [chore] **feed-client.tsx 헤딩 텍스트 S2 E2E 정합** — `이번 주 채용 기회` → `이번 주 큐레이션` (commit:90e831f)
- [prompt] **Standup Meeting + Vertical Slice 검증 기획 요청** — Sprint 3 Week 2 스탠드업 + 당면 과제 정리 + Vertical Slice 제품 검증 기획 문서 작성 요청 (source:chat:2dc6379e)
  - **요청**: 스탠드업 형식으로 현재 상태 점검, 당면 과제 가시화, Vertical Slice 기반 제품 검증 기획 .md 파일 작성
  - **개선**: 반영 완료 — `docs/plans/vcx-vertical-slice-validation.md` 신규 생성
  - **영향 파일**: `history.md`, `docs/plans/vcx-vertical-slice-validation.md`
- [prompt] **Standup Meeting + Lastmile 점검 요청** — 서비스 전체 상태 점검 및 Phase 1 DoD 달성 가능성 브리핑 요청 (source:chat:f7ec7e08)
  - **요청**: 현재 서비스 상태를 스탠드업 형식으로 점검하고 Lastmile(Phase 1 DoD 달성) 가능 여부 종합 브리핑 요청
  - **개선**: 브리핑 문서 작성 + 미해결 이슈 가시화
  - **영향 파일**: `history.md`, 브리핑 내용은 대화 응답으로 전달
- [feat] **LinkedIn AI 경력 요약 + 피드 외부 소스 크롤러** — OpenAI gpt-4o-mini 전환 (commit:3319efb, 9002d9d)
  - **요청**: LinkedIn URL → AI 경력 자동 요약 파이프라인 구현 (최초 Anthropic → OpenAI gpt-4o-mini 전환), Reddit/X.com/TechCrunch 외부 소스 크롤러 구현
  - **개선**: 반영 완료 — `openai` SDK 설치, career-summary API 전환, 크롤러 구현
  - **영향 파일**: `src/app/api/career-summary/`, `src/lib/feed-crawler.ts` 계열
- [prompt] **이력서 템플릿 선택 UI 변경** — 미리보기 영역 제거, 업로드 버튼 위에 미니멀/임팩트/사이드바/컴팩트/크리에이티브 5종 옵션 배치 요청 (source:chat:9c5ed4b4)
  - **요청**: 이력서 양식 미리보기 영역 불필요 판단, 업로드 버튼 위에 템플릿 스타일 선택 옵션 추가하여 하단 콘텐츠 가시성 확보
  - **개선**: 반영 완료 (세션 내 즉시 변경 지시)
  - **영향 파일**: 이력서 관련 컴포넌트 (onboarding resume upload 영역)
- [prompt] **중간 점검 요청** — PRD 6.0 대비 구현 상태 종합 분석 + 브라우저 로그인 실증 요청 (source:chat:450d16e1)
- [fix] **기술 부채 + ADR 수정 요청** — `.env.local` ValueHire 오염, ADR 미작성(수수료 비노출·CEO 커피챗 정체성), `FEATURE_MANIFEST.yaml` 미생성, 온보딩 중복 입력/progress 0% 버그 (source:chat:66dbcf29, 미반영 — 대기 중)
- [chore] Prevent notification policy migrations from failing on reapply (commit:e8ef54d)
- [chore] Prevent notification policy migrations from failing on reapply (commit:e8ef54d)
- [chore] S4/S5 TDD checkpoint + migration cleanup + E2E hardening (commit:75bb722)
- [fix] remove erroneous src/pages/_error.tsx (App Router project) (commit:18f2cf6)
- [fix] add missing timeouts to S5 feedback spec + feed/community UI polish (commit:c914bd6)
- [feat] Feed 뉴스 타입 확장 — migration 029 + 상세 페이지 + admin 큐레이션 API (L-Std) (commit:c4eb1e7)
- [fix] 중복 제출 방지 + progress 0% 버그 수정 (L-Std) (commit:4284f7f)
- [feat] auth 페이지 + 랜딩 디자인 토큰 Hardening — inline style → VCX 유틸 클래스 전환 (L-Std) (commit:c15091d)
- [chore] merge Track C — onboarding 중복 제출 방지 (4284f7f) (commit:cc580e5)
- [feat] LinkedIn AI 경력 요약 + 피드 외부 소스 크롤러 (L-Std) (commit:9002d9d)
- [feat] career-summary OpenAI 전환 (gpt-4o-mini) + openai SDK 설치 (commit:3319efb)
- [test] S3·S4 E2E 구현 + D-0001 CLOSED + D-0002 verify 스크립트 (L-Std) (commit:c0d487f)
- [chore] Prevent notification policy migrations from failing on reapply (commit:e8ef54d)
- [chore] S4/S5 TDD checkpoint + migration cleanup + E2E hardening (commit:75bb722)
- [fix] remove erroneous src/pages/_error.tsx (App Router project) (commit:18f2cf6)
- [fix] add missing timeouts to S5 feedback spec + feed/community UI polish (commit:c914bd6)
- [feat] Feed 뉴스 타입 확장 — migration 029 + 상세 페이지 + admin 큐레이션 API (L-Std) (commit:c4eb1e7)
- [fix] 중복 제출 방지 + progress 0% 버그 수정 (L-Std) (commit:4284f7f)
- [feat] auth 페이지 + 랜딩 디자인 토큰 Hardening — inline style → VCX 유틸 클래스 전환 (L-Std) (commit:c15091d)
- [chore] merge Track C — onboarding 중복 제출 방지 (4284f7f) (commit:cc580e5)
- [feat] LinkedIn AI 경력 요약 + 피드 외부 소스 크롤러 (L-Std) (commit:9002d9d)
- [feat] career-summary OpenAI 전환 (gpt-4o-mini) + openai SDK 설치 (commit:3319efb)
- [test] S3·S4 E2E 구현 + D-0001 CLOSED + D-0002 verify 스크립트 (L-Std) (commit:c0d487f)
- [fix] PreBriefCard 로딩·null 상태 skeleton fallback 통일 (L-Std) (commit:f2d5aff)
- [fix] S3·S4 E2E 13/13 통과 — selector 및 locator 수정 (L-Std) (commit:ee237b4)
- [docs] 2026-05-05 작업 이력 업데이트 (commit:ab52366)
- [fix] GNB+Progress0%+D-0004 버그 수정 + E2E spec + D-0005 CLOSED (L-Std) (commit:90e831f)
- [docs] 2026-05-05 Multi-Agent 작업 이력 업데이트 (commit:e6d48fa)

## 2026-05-03

- [chore] Close the Feed MVP vertical slice (commit:a72637d)
- [chore] Close the Feed MVP vertical slice (commit:a72637d)
- [chore] Close the Feed MVP vertical slice (commit:a72637d)

## 2026-05-02

- [chore] Recenter VCX on invite-only member network (commit:0159dd1)
- [chore] Recenter VCX on invite-only member network (commit:0159dd1)
- [chore] Recenter VCX on invite-only member network (commit:0159dd1)

## 2026-05-01

- [chore] DEBT-0005 등재 — newsletter API explicit-any 10건 (Sprint 3 타입 regen 후 정리) (commit:4ed30fc)
- [feat] ValueHire 및 B2B 인텔리전스 슬라이스 추가 (commit:078d859)
- [feat] ValueHire 및 B2B 인텔리전스 슬라이스 추가 (commit:078d859)
- [feat] ValueHire 및 B2B 인텔리전스 슬라이스 추가 (commit:078d859)

## 2026-04-30

- [prompt] **디자인 시스템 전면 재정렬 요청** — Airbnb 디자인 시스템 기준 적용, S1~S5 전 페이지 폰트·레이아웃 일관성 재정렬, CTO/Chief Designer 협업 지시 (/ralph 모드) (source:chat:4117b1e3)
  - **요청**: 하위 페이지 폰트 크기·레이아웃·디자인 시스템 붕괴 현상 지적, Airbnb 디자인 시스템 참조 적용으로 전 페이지 기준 통일
  - **개선**: S1~S5 + 랜딩 전 페이지 감사 리포트 생성 완료, 옵션 A(토큰 Hardening ~85%) 범위 확정. 실제 파일 수정은 미반영 — 대기 중
  - **영향 파일**: `src/app/(auth)/login/`, `src/app/(auth)/invite/`, `src/app/(protected)/feed/`, `src/app/(protected)/directory/`, `src/app/(protected)/coffeechat/`, `src/app/page.tsx`
- [feat] **Feed UI 1차 구현** — VCX 디자인 토큰 기반 피드 레이아웃 전면 정리 (미커밋, S2)
  - 히어로 섹션 VCX 토큰 재구성 (`feed/page.tsx`)
  - 관심사 초기 로드/저장 연동 + empty/loading/error 상태 (`feed-client.tsx`)
  - 반응형 Feed 카드 + `data-testid="feed-card"` (`feed-card.tsx`)
  - 관심사 칩/직접 입력 UI 정리 (`interest-selector.tsx`)
  - 상세 모달 + 구독 바 UI 정리 (`feed-detail-modal.tsx`, `newsletter-bar.tsx`)
  - 검증: ESLint pass · `npm run build` pass · `/feed` 200 OK
  - **영향 파일**: `src/app/(protected)/feed/page.tsx` · `src/components/feed/feed-{card,client,detail-modal}.tsx` · `src/components/feed/{interest-selector,newsletter-bar}.tsx`
- [docs] 컨퍼런스 부스 대화 플레이북 작성 — 손님 응대 스크립트·FAQ·꼬리 질문 포함 (source:chat) → `docs/marketing/booth-conversation-playbook.md` 생성 (미커밋)
- [docs] 대외 공표용 PRD + 제품 브리프 작성 — 보안 사항 제거한 공개 버전 `docs/prd.md` + `docs/marketing/public-product-brief-1.0.md` 생성 요청 (/ralph 모드) (source:chat) (미커밋)
- [decision] 티셔츠 마케팅 캐치프레이즈 탐색 — 컨퍼런스 부스 기업 홍보 문구 방향 논의 (아이디어 수준, 별도 파일 미생성) (source:chat)
- [feat] Feed MVP API + 온보딩 V2 + 어드민 큐레이션 + E2E 슬라이스 + 마케팅 문서 (L-Std) (commit:6a9c109)
- [feat] Feed UI 1차 + 버그 수정 3건 + analytics 이벤트 6건 연동 (L-Std) (commit:9f0b5ee)
- [chore] Stibee 뉴스레터 1차 발송 준비물 — HTML 템플릿 + 구독자 추출 SQL (L-Std) (commit:20b14dd)
- [docs] ADR-0009 뉴스레터 자체 구현 — Resend 채택, Stibee 대체 (L-High, 48h 쿨다운 시작) (commit:7d4eb76)
- [feat] newsletter 자체 호스팅 인프라 — 023 migration + track/unsubscribe API (L-Std, ADR-0009 의존) (commit:ffc99d7)

## 2026-04-24

- [chore] L4 secret-scan 배선 + Phase 0 영수증 + 워크트리 훅 근거 명시 (L-Std) (commit:2cefd09)

## 2026-04-22

- [feat] valuehire_v2 하네스 → valueconnectx 도메인 이식 (commit:d92b921)
- [docs] PRD v6.0 단일 SoT 확정 + ADR-0001~0007 서명 (L-High, S1 scheduled) (commit:7a590d4)
- [chore] PRD freeze pre-commit guard 배선 — ADR-0004 Enforcement (L-Std) (commit:8166eaa)
- [docs] 문서 트리 재분류 + 구 PRD·booth·brand 자료 archive (L-Std) (commit:fee94e7)

## 2026-04-21

- [docs] CLAUDE.md를 VH v2 구조 규율로 재작성 (L-High, 48h 쿨다운 waive) (commit:0711e3a)

## 2026-04-20

- [fix] border-radius 글로벌 !important 제거 — 원형 아바타/배지/알약 복구 (commit:c08c32c)
- [feat] public /api/health 엔드포인트 추가 — uptime 프로브용 (commit:a544e3d)

## 2026-04-19 (현재)

- [docs] history.md 생성 — 요구사항·기능·프롬프팅 변경 통합 추적 시작 (manual:setup)

---
- [feat] 관리자 운영 대시보드 추가 — 헬스체크 API + 어드민 탭 (commit:3068dd6)
- [feat] CLI 스크립트 + wiki 문서 구조 추가 (commit:394ee84)
- [docs] PRD 6.0/6.1, 부스 데모 스크립트, 프로세스/운영 문서 추가 (commit:e85fa3c)
- [chore] QA 스크립트 + UI 스크린샷 + 히스토리 기록 추가 (commit:5fc0ded)
- [chore] 세션 상태 + 플랜 업데이트 (commit:b352dac)
- [chore] .claude/worktrees를 gitignore에 추가하고 임베드 저장소 추적 해제 (commit:c601a03)

## 2026-04-03

- [fix] 모듈 레벨에서 `ANTHROPIC_API_KEY` 누락 시 throw 제거 — 빌드 차단 방지 (commit:eab4597)
- [feat] **AI Brief 시스템 4종 동시 추가** — 커피챗 도메인에 AI 사전 브리핑 레이어 도입
  - 사후 피드백 폼 + API + Supabase 타입 캐스트 (commit:f904d70)
  - PreBriefCard UI 컴포넌트 → 커피챗 상세 페이지 연동 (commit:3a3712c)
  - Brief 조회 API endpoint (commit:9788e7a)
  - 커피챗 수락 시 AI brief 생성 트리거 (commit:f807e4f)
- [test] AI brief 생성 단위 테스트 추가 (commit:e08956b)
- [feat] Claude AI 클라이언트 + brief 생성 로직 추가 (commit:4b9ee4e)
- [feat] AI brief 컬럼 + feedback 테이블 — migration 021 (commit:f6c8452)
- [fix] Peer 커피챗 인사이트에서 수수료 구조 언급 제거 (commit:78c6d4f)
- [fix] 서비스 전반 감사 — BM(Business Model) 노출 제거, UX 문구 개선, 라우트·테스트 수정 (commit:17297f0)

## 2026-04-02

- [docs] **PRD v6.0 서비스 변경사항 전면 반영** — 요구사항 메이저 업데이트 (commit:9baeee9)
- [fix] 서비스 문구 전면 개선 — 모순 제거, 차별화, 위화감 완화 (commit:bcae642)
- [refactor] **CEO 커피챗 컨셉 전환: "역방향 채용" → "컬쳐핏 확인"** — 핵심 포지셔닝 변경 (commit:f0bbc91)
- [fix] Benefit 페이지 수수료 노출 제거 + 빈 상태 메시지 6건 개선 (commit:8da76a0)
- [fix] 온보딩 UX 개선 — 라벨 가독성, 중복 입력 방지, 닉네임 필드 추가 (commit:916a1c7)
- [fix] **코드 리뷰 보안 이슈 3건 수정** — Open Redirect 방지 + 미들웨어 리팩터 + LinkedIn regex 강화 (commit:e7c320c)
- [feat] 주요 페이지 클라이언트 컴포넌트 분리 및 신규 기능 추가 (commit:9f23323)

## 2026-04-01

- [chore] `.gitignore`에 `.worktrees/` 추가 (commit:dcd3ba4)
- [chore] `.gitignore`에 E2E 산출물 추가 + 기존 추적 해제 (commit:c9fc757)
- [chore] **데모 시딩 자동화** + Playwright 글로벌 셋업 추가, 로그인 a11y 라벨 연결 (commit:73474a4)

## 2026-03-31

- [test] 로그인 리다이렉트 테스트 설명을 `/directory`로 업데이트 (commit:401854b)
- [fix] 코드 리뷰 피드백 — login/page.tsx 리다이렉트 일관성 + SQL `search_path` 보안 강화 (commit:74c7f34)
- [feat] **Agent Skill 방법론 적용** — `SKILL.md` 6종 + `AGENTS.md` + deprecated 패턴 수정 (commit:b6b5813)
- [fix] **로그인 후 인증 파이프라인 P0 버그 3건 수정** — RPC 프로필 필드 누락 + 리다이렉트 오류 (commit:22d3706)

## 2026-03-30

- [feat] **E2E 시나리오 15종 추가** — 인증·커피챗·알림 플로우 (Sprint 1-C #12) (commit:fe410c9)
- [feat] E2E 인프라 강화 — playwright 타임아웃·스크린샷 + auth 헬퍼 리팩터 (commit:669cbb4)
- [docs] **비즈니스 모델 계획서 v2.1** — ValueHire 시너지 + 멀티 버티컬 확장 비전 (commit:1a523ba)

## 2026-03-29

- [fix] 미들웨어 테스트 — 온보딩 리다이렉트 우회용 완전한 프로필 mock 필드 추가 (commit:520e27b)
- [feat] **디렉토리 스크래핑 방지** — 3단계 rate limiter + CSP 헤더 (Sprint 1-B) (commit:eb98927)
- [feat] **Sentry 클라이언트 에러 모니터링** — 세션 리플레이 on-error 활성화 (commit:1465138)
- [feat] **Phase 1 온보딩 플로우** — 강제 온보딩 + 2단계 스텝 폼 + 미들웨어 보호 (테스트 612→618) (commit:ff1c1d5)

## 2026-03-27

- [fix] **Sprint 6 품질 안정화** — 보안 하드닝 + 린트 정리 + dynamic route 설정 (commit:72384df)
- [feat] **Sprint 5** — Peer 커피챗 편집/테스트 + 알림 시스템 통합 확장 (537→612 테스트) (commit:17a3897)
- [feat] **Sprint 4** — Position Board 확장 + Community 카운트 + Admin UI (490→537) (commit:f2b6c83)
- [feat] **Sprint 3** — CEO 커피챗 DELETE/편집 + 컴포넌트 테스트 (413→490) (commit:0f1c105)
- [feat] **Sprint 2** — `profile_visibility` 강제 + 디렉토리 컴포넌트 테스트 (344→413) (commit:003e4bf)
- [test] 4개 도메인 API 테스트 추가 — 커피챗·디렉토리·커뮤니티·포지션 (162→344) (commit:cc59ed6)
- [fix] **Sprint 1 Auth 하드닝** — RLS 정책 + 서버사이드 쿠키 + 에러메시지 통합 (commit:788a427)
- [chore] 개발 계획 문서 + DB 마이그레이션 + 커피챗 추천 컴포넌트 추가 (commit:67c1eef)
- [feat] **Phase 3 완료** — AI 포지션 매칭 + VCX CLI Interface (#23, #24) (commit:610a1e9)
- [feat] **Phase 3** — 매칭 추천 알고리즘 + 수수료 시스템 + 분석 대시보드 (#21, #22, #25) (commit:ccc5730)
- [feat] **Mixpanel Analytics 통합** + Privacy Model 기술 강제 (Phase 2 #13, #17) (commit:ebe4920)
- [feat] **Phase 1-C + Phase 2 로드맵 실행** — 테스트·보안·커피챗·커뮤니티·어드민 고도화 (commit:a767680)

## 2026-03-25

- [feat] **모바일 반응형 전면 개편** — Galaxy 360px 기준 UX 최적화 (commit:d799ff5)
- [docs] BMplan.md v2.0 — ValueHire Intelligence 시너지 반영 (commit:5b1e8ab)
- [chore] crawler 디렉토리 전체 삭제 — 방향 전환 (commit:f3c627d)
- [chore] 불필요 문서/임시 파일 정리 (commit:d000e23)
- [chore] `.gitignore`에 `.playwright-mcp/` 추가 + 추적 로그 제거 (commit:d9ee846)

## 2026-03-24

- [feat] **공통 레이아웃(GNB) + 디자인 시스템 + 서비스 소개 페이지** 구현 — 디자인 토큰 정립 (commit:1582886)

## 2026-03-13

- [infra] **Next.js 14 App Router 프로젝트 초기화** (P0-01) (commit:e7bdeee)
- [feat] initial commit (commit:0a2f0f9)
- [chore] Initial commit from Create Next App (commit:3cadd91)

---

## 향후 기록 가이드

### 무엇을 기록할 것인가
1. **커밋된 코드 변경** — 모든 feat/fix/refactor (자동 후보)
2. **요구사항 변화** — PRD/BM 문서 업데이트, 컨셉 전환
3. **의미 있는 프롬프팅** — AI 응답 품질·방향에 영향을 주는 시스템 프롬프트, 사용자 페르소나, 톤 변경
4. **의사결정** — 기술 선택, 도메인 모델 변경, 외부 서비스 도입/제거
5. **운영 인사이트** — 사용자 피드백 반영, A/B 테스트 결과, 성능 이슈

### 무엇을 기록하지 않을 것인가
- 단순 리네이밍/포매팅
- WIP 커밋, 세이브 포인트
- 자동 의존성 업데이트 (단, 메이저 버전은 기록)

### 자동화 아이디어 (선택)
- Stop hook으로 새 커밋을 자동 prepend (`reference_obsidian_changelog` 패턴 참고)
- 또는 주 1회 `git log` diff를 수동 정리
