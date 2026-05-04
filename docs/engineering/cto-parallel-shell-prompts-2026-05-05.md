# CTO Parallel Shell Prompts — 2026-05-05

> 목적: 2026-05-05 기준 현재 구현 단계를 CTO 관점에서 점검하고, 다음 구현을 2개 쉘에서 TDD 방식으로 병렬 진행할 수 있도록 간섭 없는 실행 프롬프트를 남긴다.

## 현황 수치 브리핑 (2026-05-05 업데이트)

| 항목 | 현재 | 목표 | 상태 |
|---|---|---|---|
| Phase 1 마감 D-Day | **D-10** (2026-05-15) | — | ⚠️ |
| Sprint 3 잔여 | **3일** (05-08 종료) | — | 진행중 |
| ADR 완료 | **10/5** | 5 | ✅ 초과 달성 |
| E2E 슬라이스 스펙 | **5/5** | 5 | 파일 존재 |
| E2E 슬라이스 녹색 | **0/5 확인** | 5 | ❌ 미검증 |
| Migrations | **28개** | — | ✅ |
| FEATURE_MANIFEST | **존재** | 1 | ✅ |
| 미커밋 변경 파일 | **138개** | 0 | 🔴 긴급 |
| npm build | **미확인** | green | ❓ |

### Git 형상 브리핑

```
브랜치: main (origin/main 대비 커밋 상태 미확인)
최신 커밋: e8ef54d — "Prevent notification policy migrations from failing on reapply"
미커밋 M: 138파일 (+1454 / -582 라인)
미커밋 D: sentry.client.config.ts (deleted)
미추적 UT: 026~028 migrations, 신규 테스트 파일 다수
```

⚠️ **138개 미커밋은 가장 큰 리스크.** Shell 실행 전 반드시 `git stash` 또는 커밋으로 베이스라인 확보 권장.

### 이상 체크

| 체크 | 결과 |
|---|---|
| ValueHire/B2B 오염 | ✅ `0159dd1`에서 전량 제거됨 |
| `rounded-*` 위반 | ❓ 미검증 (Shell 2 검증 포함) |
| 수수료 문구 노출 | ❓ `check-fee-hidden.sh` 미실행 |
| sentry.client.config.ts 삭제 | 🔴 의도된 삭제인지 확인 필요 |
| 온보딩 progress 0% 버그 | ❓ 수정 여부 미확인 |

---

## 현재 구현 단계 점검

오늘 기준 판단:
- 핵심 미완료 축은 여전히 `S2 Feed MVP`와 `S4~S5 Coffee Chat / Feedback`입니다.
- `S1 Auth`, `S3 Directory`는 독립 스프린트 축이라기보다 연동 보정 범위입니다.
- `Community`, `Positions`, `Notifications`, `Layout`까지 변경 흔적은 퍼져 있지만, 다음 구현 분할의 1순위 축으로 잡으면 충돌만 늘어납니다.

근거:
- Phase 1 SoT는 `docs/plans/VERTICAL_SLICE_PHASE1.md`, `docs/sdd/FEATURE_MANIFEST.yaml` 입니다.
- 실제 슬라이스 테스트 파일은 오늘도 동일하게 존재합니다.
  - `e2e/slice/s2-feed.spec.ts`
  - `e2e/slice/s4-coffeechat.spec.ts`
  - `e2e/slice/s5-feedback.spec.ts`
- 현재 워크트리는 `git diff --stat` 기준 `137 files changed, 1439 insertions, 587 deletions` 수준으로 넓습니다.
- Feed 축 구현 흔적:
  - `src/app/api/feed/interests/route.ts`
  - `src/components/feed/feed-client.tsx`
  - `src/__tests__/components/feed/feed-client.test.tsx`
  - `src/__tests__/components/feed/newsletter-bar.test.tsx`
- Coffee Chat 축 구현 흔적:
  - `src/app/api/peer-coffeechat/[id]/apply/route.ts`
  - `src/app/api/peer-coffeechat/[id]/brief/route.ts`
  - `src/components/coffeechat/pre-brief-card.tsx`
  - `src/components/coffeechat/feedback-form.tsx`
  - `e2e/slice/s4-coffeechat.spec.ts`
  - `e2e/slice/s5-feedback.spec.ts`

CTO 결론:
- 오늘도 병렬 분할은 `Shell 1 = Feed`, `Shell 2 = Coffee Chat / Feedback`가 맞습니다.
- 공용 파일은 더 엄격하게 금지해야 합니다.
- TDD Iron Law 유지: 실패 테스트나 명시적 검증 없이 production code를 넓히지 않습니다.

## 공통 규칙

- 한국어 UI/메시지 유지
- `rounded-*` 금지, `border-radius: 0` 유지
- DDL은 `supabase/migrations/` 파일만 허용
- 기존 사용자 변경 revert 금지
- `skills/SKILL-testing-vitest.md` 준수
  - `lucide-react`는 완전 mock
  - `vi.hoisted()` 사용
  - `beforeEach(() => vi.clearAllMocks())`
  - 테스트 파일당 `render()` 6회 이하

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
- `e2e/helpers/auth.ts`

위 파일은 통합 쉘만 수정합니다.

## Shell 1 Prompt

```text
당신은 ValueConnect X의 CTO 구현 Shell 1입니다.

목표:
Phase 1 S2 Feed MVP를 TDD 방식으로 마감합니다. 관심 태그 저장/조회, `/feed`, `/api/feed`, `/api/feed/interests`, admin feed 관리, `feed_item_click` 계측을 green 으로 닫습니다.

반드시 먼저 읽을 것:
- AGENTS.md
- docs/plans/VERTICAL_SLICE_PHASE1.md
- docs/sdd/FEATURE_MANIFEST.yaml
- docs/roles/CTO.md
- skills/SKILL-testing-vitest.md
- skills/SKILL-api-route-convention.md
- skills/SKILL-supabase-ssr.md
- skills/SKILL-vcx-design-system.md
- skills/SKILL-zod-validation.md

핵심 점검 파일:
- src/app/api/feed/route.ts
- src/app/api/feed/interests/route.ts
- src/app/api/admin/feed/route.ts
- src/app/api/admin/feed/items/route.ts
- src/app/(protected)/feed/page.tsx
- src/app/(protected)/onboarding/onboarding-client.tsx
- src/components/feed/feed-client.tsx
- src/components/feed/interest-selector.tsx
- src/components/feed/feed-card.tsx
- src/components/feed/newsletter-bar.tsx
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
- 관심 태그 직접 연동 범위
  - src/app/(protected)/onboarding/**
  - src/components/directory/profile-edit-form.tsx
- 관련 테스트
  - src/__tests__/app/api/feed/**
  - src/__tests__/app/api/admin/feed/**
  - src/__tests__/components/feed/**
  - e2e/slice/s2-feed.spec.ts

절대 건드리지 말 것:
- src/app/(protected)/coffeechat/**
- src/app/api/peer-coffeechat/**
- src/components/coffeechat/**
- src/app/(protected)/admin/ops/**
- src/components/admin/ops/**
- e2e/slice/s4-coffeechat.spec.ts
- e2e/slice/s5-feedback.spec.ts
- 공용 금지 파일 목록 전체

Acceptance Criteria:
- `/api/feed`가 limit/tags 검증과 인증 분기를 일관되게 처리한다.
- `/api/feed/interests`가 저장 값과 profile fallback 을 일관되게 반환한다.
- `/feed`가 관심 태그 기준 상태를 표시한다.
- admin feed 생성/수정 흐름이 테스트와 맞다.
- `feed_item_click`가 analytics 미연결 상황에서도 안전하다.
- `s2-feed` E2E가 관심 태그 저장, 아이템 노출, 클릭 흐름을 검증한다.

TDD 순서:
1. 현재 테스트를 읽고 빠진 실패 케이스를 먼저 추가한다.
2. 테스트를 red 로 만든다.
3. production code를 최소 수정해 green 으로 만든다.
4. 중복 추상화 없이 정리한다.
5. 공용 파일 필요 시 메모만 남기고 중단한다.

검증:
- npx vitest run src/__tests__/app/api/feed/route.test.ts src/__tests__/app/api/feed/interests/route.test.ts src/__tests__/app/api/admin/feed/route.test.ts src/__tests__/app/api/admin/feed/items-route.test.ts
- npx vitest run src/__tests__/components/feed/feed-client.test.tsx src/__tests__/components/feed/newsletter-bar.test.tsx
- npx playwright test e2e/slice/s2-feed.spec.ts
- rg "rounded-[a-z]" src/app/\\(protected\\)/feed src/components/feed src/components/admin/curation src/app/\\(protected\\)/onboarding src/components/directory/profile-edit-form.tsx || true

완료 보고:
- 변경 파일
- failing -> passing 테스트
- 충족한 AC
- 실행한 검증 결과
- 통합 쉘 리스크
```

## Shell 2 Prompt

```text
당신은 ValueConnect X의 CTO 구현 Shell 2입니다.

목표:
Phase 1 S4~S5 Coffee Chat / AI Brief / Feedback 을 TDD 방식으로 마감합니다. 신청/수락, brief 성공/실패 fallback, feedback 제출, `/admin/ops` 집계, CEO coffeechat 카피 정렬을 green 으로 닫습니다.

반드시 먼저 읽을 것:
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

핵심 점검 파일:
- src/app/api/peer-coffeechat/[id]/apply/route.ts
- src/app/api/peer-coffeechat/[id]/applications/route.ts
- src/app/api/peer-coffeechat/[id]/applications/[appId]/route.ts
- src/app/api/peer-coffeechat/[id]/brief/route.ts
- src/app/(protected)/coffeechat/page.tsx
- src/app/(protected)/coffeechat/[id]/page.tsx
- src/app/(protected)/admin/ops/page.tsx
- src/components/coffeechat/pre-brief-card.tsx
- src/components/coffeechat/feedback-form.tsx
- src/components/coffeechat/application-list.tsx
- src/components/coffeechat/peer-application-list.tsx
- src/components/coffeechat/session-detail.tsx
- src/components/coffeechat/ceo-hero.tsx
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
- 최소 CEO 카피 정렬 범위
  - src/app/(protected)/ceo-coffeechat/**
  - src/components/coffeechat/ceo-hero.tsx
- 관련 테스트
  - src/__tests__/api/peer-coffeechat/**
  - src/__tests__/components/coffeechat/**
  - e2e/slice/s4-coffeechat.spec.ts
  - e2e/slice/s5-feedback.spec.ts

절대 건드리지 말 것:
- src/app/(protected)/feed/**
- src/app/api/feed/**
- src/app/api/admin/feed/**
- src/components/feed/**
- src/components/admin/curation/**
- e2e/slice/s2-feed.spec.ts
- 공용 금지 파일 목록 전체

Acceptance Criteria:
- peer coffeechat 신청/수락 플로우가 유지된다.
- AI Brief 성공과 실패 fallback 이 테스트로 증명된다.
- `PreBriefCard`가 360px에서도 깨지지 않는다.
- 수수료 문구 비노출이 유지된다.
- feedback 제출 시 `session_feedback_submit` 기록이 남고 analytics 미연결 fallback 이 있다.
- `/admin/ops`가 feedback count 와 최근 10건을 보여준다.
- CEO coffeechat은 컬쳐핏 카피만 정렬하고 신규 기능을 추가하지 않는다.

TDD 순서:
1. `bash scripts/check-fee-hidden.sh` 실행으로 현재 상태를 확인한다.
2. brief fallback, feedback submit, ops dashboard 테스트를 먼저 red 로 만든다.
3. production code를 최소 수정해 green 으로 만든다.
4. 360px 깨짐은 coffeechat 범위 안에서만 수정한다.
5. 공용 파일 필요 시 메모만 남기고 중단한다.

검증:
- bash scripts/check-fee-hidden.sh
- npx vitest run src/__tests__/api/peer-coffeechat/apply-route.test.ts src/__tests__/api/peer-coffeechat/applications-route.test.ts src/__tests__/api/peer-coffeechat/appId-route.test.ts src/__tests__/api/peer-coffeechat/brief-route.test.ts src/__tests__/api/peer-coffeechat/feedback-route.test.ts
- npx vitest run src/__tests__/components/coffeechat/pre-brief-card.test.tsx src/__tests__/components/coffeechat/feedback-form.test.tsx src/__tests__/components/coffeechat/application-list.test.tsx
- npx playwright test e2e/slice/s4-coffeechat.spec.ts e2e/slice/s5-feedback.spec.ts
- rg "rounded-[a-z]" src/app/\\(protected\\)/coffeechat src/components/coffeechat src/app/\\(protected\\)/admin src/components/admin || true

완료 보고:
- 변경 파일
- failing -> passing 테스트
- 충족한 AC
- 실행한 검증 결과
- 통합 쉘 리스크
```

## 통합 순서

1. Shell 1이 Feed 범위 검증 결과만 남긴다.
2. Shell 2가 Coffee Chat 범위 검증 결과만 남긴다.
3. 통합은 마지막에 한 쉘에서만 수행한다.

통합 검증:

```bash
npm run lint
npx vitest run
npx playwright test e2e/slice/s2-feed.spec.ts e2e/slice/s4-coffeechat.spec.ts e2e/slice/s5-feedback.spec.ts
npm run build
```

