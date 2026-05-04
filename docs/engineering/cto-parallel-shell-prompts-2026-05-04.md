# CTO Parallel Shell Prompts — 2026-05-04

> 목적: 현재 구현 단계를 CTO 관점에서 점검하고, 다음 구현을 TDD 방식으로 2개 쉘에서 병렬 진행할 수 있도록 서로 간섭 없는 실행 프롬프트를 남긴다.
> 기준: `AGENTS.md`, `docs/plans/VERTICAL_SLICE_PHASE1.md`, `docs/sdd/FEATURE_MANIFEST.yaml`, `docs/roles/CTO.md`, `skills/SKILL-testing-vitest.md`

## 현재 구현 단계 점검

판단 요약:
- 현재 브랜치는 단일 기능 마감 단계가 아니라 `S2 Feed MVP`와 `S4~S5 Coffee Chat/Feedback`을 동시에 닫는 단계입니다.
- `S1 Auth/Onboarding`, `S3 Directory`는 독립 신규 구현보다 연동 보정 범위로 보입니다.
- `Community`, `Positions`도 변경 흔적은 있으나, Phase 1 SoT 기준으로 다음 병렬 구현의 주력 축으로 잡으면 스코프 오염 위험이 큽니다.

근거:
- Phase 1 SoT는 `S2`를 `stub`, `S4`를 `quality_check`, `S5`를 `instrumentation_needed`로 정의합니다. `F-FEED`, `F-PEER-COFFEECHAT`, `F-SESSION-FEEDBACK`가 아직 닫히지 않았습니다.
- 실제 E2E 슬라이스 파일이 `e2e/slice/s2-feed.spec.ts`, `e2e/slice/s4-coffeechat.spec.ts`, `e2e/slice/s5-feedback.spec.ts`로 존재합니다.
- 실제 코드에도 Feed 관심 태그 경로와 계측 흔적이 이미 있습니다.
  - `src/app/api/feed/interests/route.ts`
  - `src/components/feed/feed-client.tsx`
  - `src/__tests__/app/api/feed/interests/route.test.ts`
- Coffee Chat 쪽도 AI Brief, feedback, `/admin/ops` 관련 구현 흔적이 이미 있습니다.
  - `src/components/coffeechat/pre-brief-card.tsx`
  - `src/components/coffeechat/feedback-form.tsx`
  - `src/app/(protected)/coffeechat/[id]/page.tsx`
  - `e2e/slice/s4-coffeechat.spec.ts`
  - `e2e/slice/s5-feedback.spec.ts`
- 현재 dirty worktree는 광범위하지만, 변경 밀도는 Feed 축과 Coffee Chat 축이 가장 큽니다. `git diff --stat` 기준 135 files changed 입니다.

CTO 판단:
- 다음 병렬 작업은 `Shell 1 = Feed/Interests/Admin Feed`, `Shell 2 = Peer Coffee Chat/AI Brief/Feedback/Admin Ops`로 나누는 것이 맞습니다.
- 공용 인프라 파일과 범용 레이아웃은 어느 한 쉘도 건드리지 않도록 강하게 제한해야 합니다.
- TDD Iron Law를 적용합니다. 새 production code는 failing test 또는 명시적 검증 추가 없이 진행하지 않습니다.

## 공통 운영 규칙

- 응답, UI, 에러 메시지는 한국어로 유지합니다.
- `rounded-*` 사용 금지, `border-radius: 0` 규칙 유지합니다.
- Supabase DDL 변경은 `supabase/migrations/` 파일만 허용합니다.
- 기존 사용자 변경을 되돌리지 않습니다.
- `skills/SKILL-testing-vitest.md` 규칙을 반드시 따릅니다.
  - `lucide-react`는 완전 mock만 사용
  - `vi.hoisted()` 패턴 준수
  - `beforeEach(() => vi.clearAllMocks())` 준수
  - 테스트 파일당 `render()` 6회 이하
- TDD 순서:
  1. 현재 테스트/행동 갭 확인
  2. 실패 테스트 추가 또는 기존 테스트 강화
  3. production code 최소 수정
  4. 관련 범위 검증
  5. 최종 통합 전 공용 파일 충돌 체크

공용 금지 파일:
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/layout/gnb.tsx`
- `src/components/layout/gnb-dropdown.tsx`
- `src/components/layout/gnb-active-nav.tsx`
- `src/components/layout/protected-page-wrapper.tsx`
- `src/types/supabase.ts`
- `src/lib/analytics.ts`
- `instrumentation-client.ts`
- `middleware.ts`
- `playwright.config.ts`
- `e2e/global-setup.ts`

위 파일이 꼭 필요하면 두 쉘 중 한 곳이 아니라 통합 쉘에서만 처리합니다.

## Shell 1 Prompt

```text
당신은 ValueConnect X의 CTO 구현 Shell 1입니다.

목표:
Phase 1 S2 "큐레이션 피드 MVP"를 TDD 방식으로 닫습니다. 관심 태그 저장/조회, `/feed` 렌더링, `/api/feed`와 `/api/feed/interests`, admin feed 관리 흐름, `feed_item_click` 계측이 현재 코드와 테스트에서 일관되게 green 이어야 합니다.

먼저 읽을 파일:
- AGENTS.md
- docs/plans/VERTICAL_SLICE_PHASE1.md
- docs/sdd/FEATURE_MANIFEST.yaml
- docs/roles/CTO.md
- skills/SKILL-testing-vitest.md
- skills/SKILL-api-route-convention.md
- skills/SKILL-supabase-ssr.md
- skills/SKILL-vcx-design-system.md
- skills/SKILL-zod-validation.md

현재 우선 점검 대상:
- src/app/api/feed/route.ts
- src/app/api/feed/interests/route.ts
- src/app/api/admin/feed/route.ts
- src/app/api/admin/feed/items/route.ts
- src/components/feed/feed-client.tsx
- src/components/feed/interest-selector.tsx
- src/components/feed/feed-card.tsx
- src/components/feed/newsletter-bar.tsx
- src/app/(protected)/feed/page.tsx
- src/app/(protected)/onboarding/onboarding-client.tsx
- src/components/directory/profile-edit-form.tsx
- src/__tests__/app/api/feed/route.test.ts
- src/__tests__/app/api/feed/interests/route.test.ts
- src/__tests__/app/api/admin/feed/route.test.ts
- src/__tests__/app/api/admin/feed/items-route.test.ts
- src/__tests__/components/feed/feed-client.test.tsx
- src/__tests__/components/feed/newsletter-bar.test.tsx
- e2e/slice/s2-feed.spec.ts

소유 범위:
- src/app/(protected)/feed/**
- src/app/api/feed/**
- src/app/api/admin/feed/**
- src/components/feed/**
- src/components/admin/curation/**
- 관심 태그와 직접 연결된 onboarding/profile edit 범위
  - src/app/(protected)/onboarding/**
  - src/components/directory/profile-edit-form.tsx
- feed 관련 테스트
  - src/__tests__/app/api/feed/**
  - src/__tests__/app/api/admin/feed/**
  - src/__tests__/components/feed/**
  - e2e/slice/s2-feed.spec.ts

건드리지 말 것:
- src/app/(protected)/coffeechat/**
- src/app/api/peer-coffeechat/**
- src/components/coffeechat/**
- src/app/(protected)/admin/ops/**
- src/components/admin/ops/**
- e2e/slice/s4-coffeechat.spec.ts
- e2e/slice/s5-feedback.spec.ts

Acceptance Criteria:
- `/api/feed`가 limit/tags 입력을 검증하고 인증 상태별 응답을 일관되게 반환한다.
- `/api/feed/interests`가 저장된 관심 태그와 프로필 fallback을 일관되게 반환한다.
- `/feed`가 선택된 관심 태그와 실제 item 상태를 보여준다.
- admin feed 생성/수정 경로가 현재 테스트와 맞는다.
- `feed_item_click`가 analytics 미연결이어도 안전하게 기록된다.
- `e2e/slice/s2-feed.spec.ts`가 단순 스텁 검증이 아니라 관심 태그 저장, 피드 노출, 클릭 계측까지 의미 있게 검증한다.

TDD 작업 순서:
1. 관련 테스트를 먼저 읽고 실패해야 하는 빈 구간을 메모한다.
2. 필요한 테스트를 먼저 추가/강화한다.
3. API 수정, UI 수정, 계측 보강을 최소 범위로 수행한다.
4. onboarding/profile edit 와 feed interests 데이터 모델이 어긋나지 않는지 확인한다.
5. 공용 파일을 건드려야 하면 멈추고 통합 쉘 메모만 남긴다.

검증 명령:
- npx vitest run src/__tests__/app/api/feed/route.test.ts src/__tests__/app/api/feed/interests/route.test.ts src/__tests__/app/api/admin/feed/route.test.ts src/__tests__/app/api/admin/feed/items-route.test.ts
- npx vitest run src/__tests__/components/feed/feed-client.test.tsx src/__tests__/components/feed/newsletter-bar.test.tsx
- npx playwright test e2e/slice/s2-feed.spec.ts
- rg "rounded-[a-z]" src/app/\\(protected\\)/feed src/components/feed src/components/admin/curation src/app/\\(protected\\)/onboarding src/components/directory/profile-edit-form.tsx || true

완료 보고 형식:
- 변경 파일
- 추가/수정한 failing->passing 테스트
- 충족한 AC
- 실행한 검증과 결과
- 통합 쉘에 넘길 리스크
```

## Shell 2 Prompt

```text
당신은 ValueConnect X의 CTO 구현 Shell 2입니다.

목표:
Phase 1 S4~S5 "Peer Coffee Chat + AI Brief + Session Feedback"을 TDD 방식으로 닫습니다. 신청/수락 후 AI Brief, 실패 fallback, 피드백 제출, `/admin/ops` 집계, CEO coffeechat 카피 정렬이 green 이어야 합니다.

먼저 읽을 파일:
- AGENTS.md
- docs/plans/VERTICAL_SLICE_PHASE1.md
- docs/sdd/FEATURE_MANIFEST.yaml
- docs/roles/CTO.md
- docs/prd/ADR/ADR-0001-fee-structure-member-invisible.md
- docs/prd/ADR/ADR-0002-ceo-coffeechat-culture-fit.md
- docs/prd/ADR/ADR-0003-ai-brief-peer-subfeature.md
- skills/SKILL-testing-vitest.md
- skills/SKILL-api-route-convention.md
- skills/SKILL-supabase-ssr.md
- skills/SKILL-vcx-design-system.md
- skills/SKILL-zod-validation.md

현재 우선 점검 대상:
- src/app/api/peer-coffeechat/[id]/apply/route.ts
- src/app/api/peer-coffeechat/[id]/applications/route.ts
- src/app/api/peer-coffeechat/[id]/applications/[appId]/route.ts
- src/app/api/peer-coffeechat/[id]/brief/route.ts
- src/components/coffeechat/pre-brief-card.tsx
- src/components/coffeechat/feedback-form.tsx
- src/components/coffeechat/application-list.tsx
- src/components/coffeechat/peer-application-list.tsx
- src/components/coffeechat/session-detail.tsx
- src/app/(protected)/coffeechat/[id]/page.tsx
- src/app/(protected)/coffeechat/page.tsx
- src/app/(protected)/admin/ops/page.tsx
- src/__tests__/api/peer-coffeechat/apply-route.test.ts
- src/__tests__/api/peer-coffeechat/applications-route.test.ts
- src/__tests__/api/peer-coffeechat/appId-route.test.ts
- src/__tests__/api/peer-coffeechat/brief-route.test.ts
- src/__tests__/api/peer-coffeechat/feedback-route.test.ts
- src/__tests__/components/coffeechat/pre-brief-card.test.tsx
- src/__tests__/components/coffeechat/feedback-form.test.tsx
- src/__tests__/components/coffeechat/application-list.test.tsx
- e2e/slice/s4-coffeechat.spec.ts
- e2e/slice/s5-feedback.spec.ts
- scripts/check-fee-hidden.sh

소유 범위:
- src/app/(protected)/coffeechat/**
- src/app/api/peer-coffeechat/**
- src/components/coffeechat/**
- src/app/(protected)/admin/ops/**
- src/components/admin/ops/**
- coffeechat/feedback 관련 테스트
  - src/__tests__/api/peer-coffeechat/**
  - src/__tests__/components/coffeechat/**
  - e2e/slice/s4-coffeechat.spec.ts
  - e2e/slice/s5-feedback.spec.ts
- CEO coffeechat 카피 정렬의 최소 범위
  - src/app/(protected)/ceo-coffeechat/**
  - src/components/coffeechat/ceo-hero.tsx

건드리지 말 것:
- src/app/(protected)/feed/**
- src/app/api/feed/**
- src/app/api/admin/feed/**
- src/components/feed/**
- src/components/admin/curation/**
- e2e/slice/s2-feed.spec.ts

Acceptance Criteria:
- peer coffeechat 신청/수락 플로우가 유지된다.
- AI Brief 생성 성공과 실패 fallback이 테스트로 증명된다.
- `PreBriefCard`가 360px 모바일에서도 깨지지 않는다.
- 멤버용 수수료 문구 비노출이 유지된다.
- feedback 제출 시 `session_feedback_submit` 이벤트가 남고 analytics 미연결 시 안전한 fallback이 있다.
- `/admin/ops`가 feedback count와 최근 10건을 보여준다.
- CEO coffeechat은 "컬쳐핏 확인" 카피를 유지하되 신규 기능을 추가하지 않는다.

TDD 작업 순서:
1. 먼저 `bash scripts/check-fee-hidden.sh`로 수수료 문구 노출 여부를 확인한다.
2. AI Brief fallback, feedback submit, `/admin/ops` 집계를 검증하는 테스트를 먼저 보강한다.
3. 필요한 production code만 최소 수정한다.
4. 360px 기준 깨짐이 있으면 coffeechat 컴포넌트 범위 안에서만 수정한다.
5. 공용 파일이 필요하면 멈추고 통합 쉘 메모만 남긴다.

검증 명령:
- bash scripts/check-fee-hidden.sh
- npx vitest run src/__tests__/api/peer-coffeechat/apply-route.test.ts src/__tests__/api/peer-coffeechat/applications-route.test.ts src/__tests__/api/peer-coffeechat/appId-route.test.ts src/__tests__/api/peer-coffeechat/brief-route.test.ts src/__tests__/api/peer-coffeechat/feedback-route.test.ts
- npx vitest run src/__tests__/components/coffeechat/pre-brief-card.test.tsx src/__tests__/components/coffeechat/feedback-form.test.tsx src/__tests__/components/coffeechat/application-list.test.tsx
- npx playwright test e2e/slice/s4-coffeechat.spec.ts e2e/slice/s5-feedback.spec.ts
- rg "rounded-[a-z]" src/app/\\(protected\\)/coffeechat src/components/coffeechat src/app/\\(protected\\)/admin src/components/admin || true

완료 보고 형식:
- 변경 파일
- 추가/수정한 failing->passing 테스트
- 충족한 AC
- 실행한 검증과 결과
- 통합 쉘에 넘길 리스크
```

## 통합 순서

1. Shell 1 완료 후 feed 범위 검증 결과만 남깁니다.
2. Shell 2 완료 후 coffeechat 범위 검증 결과만 남깁니다.
3. 마지막 통합은 하나의 쉘에서만 수행합니다.

통합 검증:

```bash
npm run lint
npx vitest run
npx playwright test e2e/slice/s2-feed.spec.ts e2e/slice/s4-coffeechat.spec.ts e2e/slice/s5-feedback.spec.ts
npm run build
```

통합 판정 기준:
- 두 쉘이 공용 금지 파일을 침범하지 않았는가
- 각 쉘이 자기 AC를 테스트와 함께 증명했는가
- 전체 lint/test/e2e/build가 green 인가

