# CTO Parallel Shell Prompts — 2026-05-01

> 작성자: CTO
> 용도: 두 개의 독립 Shell 창에서 Phase 1 구현을 병렬로 진행하기 위한 실행 프롬프트와 통합 기준
> 상태: 실행 지시서. 각 Shell은 자기 소유 범위 안에서만 구현하고, 통합 검증은 한 창에서만 수행한다.

## CTO Briefing

오늘의 목표는 Phase 1 vertical slice를 더 넓히는 것이 아니라, 이미 정한 두 축을 병렬로 닫는 것이다.

Shell 1은 Feed MVP를 맡는다. `/feed`, 관심 태그, admin feed, `feed_item_click` 계측을 하나의 흐름으로 연결한다. Shell 2는 Coffee Chat Loop를 맡는다. Peer Coffee Chat 신청/수락, AI Brief fallback, 세션 후 feedback, `/admin/ops` 집계를 닫는다.

두 Shell은 서로의 영역을 건드리지 않는다. 충돌 가능성이 큰 공용 파일은 통합 창이 최종 소유한다. 특히 `src/types/supabase.ts`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/layout/gnb.tsx`, `src/constants/navigation.ts`는 동시 수정 금지다.

완료 기준은 "코드가 있다"가 아니라 "각 Shell의 Acceptance Criteria가 테스트와 함께 증명됐다"이다. 각 Shell은 자기 범위의 단위/API/E2E 검증 결과를 남기고, 마지막에 한 창에서 lint, 전체 test, slice E2E, build를 순서대로 실행한다.

의사결정 원칙:
- Phase 1 Manifest 밖 신규 기능은 만들지 않는다.
- 새 페이지보다 기존 페이지와 API를 연결한다.
- production code 변경은 테스트나 최소 검증으로 고정한다.
- DDL은 migration 파일로만 남긴다.
- 사용자 변경과 다른 Shell 변경은 되돌리지 않는다.

## Purpose

CPO Sprint 기준의 다음 구현 범위를 CTO 실행 단위로 2개 Shell 창에 분리한다.

기준 문서:
- `docs/plans/VERTICAL_SLICE_PHASE1.md`
- `docs/sdd/FEATURE_MANIFEST.yaml`
- `docs/PROCESS.md`
- `docs/roles/CPO.md`
- `docs/roles/CTO.md`

현재 날짜 기준 다음 개발 초점:
- Sprint 2 잔여: Cold Start Feed MVP 마감
- Sprint 3 준비: Coffee Chat Loop + AI Brief Quality, post-session feedback 계측

공통 제약:
- Phase 1 slice 밖 신규 기능 금지
- 신규 페이지 추가 금지. 기존 페이지와 API를 PRD v6.0/Manifest에 연결
- 한국어 UI/에러 메시지
- `rounded-*` 금지, `border-radius: 0`
- DDL 변경은 `supabase/migrations/` 파일로만
- 기존 사용자 변경을 되돌리지 말 것
- production code 변경 시 관련 테스트를 먼저 확인하거나 추가

공통 시작 절차:
1. `git status --short`로 현재 변경 상태를 확인하고, 본인 작업 파일만 건드린다.
2. 관련 Skill을 읽는다.
   - 테스트: `skills/SKILL-testing-vitest.md`
   - API: `skills/SKILL-api-route-convention.md`
   - Supabase: `skills/SKILL-supabase-ssr.md`
   - UI: `skills/SKILL-vcx-design-system.md`
   - 검증 스키마: `skills/SKILL-zod-validation.md`
   - migration이 필요할 때만: `skills/SKILL-supabase-migration.md`
3. 아래 Shell별 소유 파일 범위를 벗어나야 하면 먼저 작업을 멈추고 충돌 가능성을 문서화한다.

공통 완료 절차:
1. Shell별 Acceptance Criteria 충족 여부를 체크한다.
2. Shell별 검증 명령과 결과를 기록한다.
3. 바꾼 파일 목록을 남긴다.
4. 통합 창에 넘길 리스크만 짧게 기록한다.

---

## Shell 1 Prompt — Feed MVP / Interests / Telemetry

```text
당신은 ValueConnect X의 CTO 구현 Shell 1입니다.

목표:
Sprint 2 "Cold Start Feed MVP"를 Phase 1 Manifest 기준으로 완성/정리합니다. 사용자가 로그인 후 `/feed`에서 관심 태그 기반 큐레이션 피드를 볼 수 있고, 온보딩/프로필에서 관심 태그를 관리할 수 있으며, admin feed 생성 경로와 테스트가 현재 코드 상태에 맞게 통과해야 합니다.

반드시 먼저 읽을 문서:
- AGENTS.md
- docs/plans/VERTICAL_SLICE_PHASE1.md
- docs/sdd/FEATURE_MANIFEST.yaml
- docs/PROCESS.md
- skills/SKILL-testing-vitest.md
- skills/SKILL-api-route-convention.md
- skills/SKILL-supabase-ssr.md
- skills/SKILL-vcx-design-system.md
- skills/SKILL-zod-validation.md
- migration 수정이 필요하면 skills/SKILL-supabase-migration.md

주요 Acceptance Criteria:
- `/api/feed?limit=&tags=`가 Zod 검증, 인증, 에러 헬퍼, Supabase SSR 패턴을 따른다.
- `/api/feed/interests`가 온보딩/프로필 관심 태그 저장 경로와 일관된다.
- `/feed`는 스텁이 아니라 실제 feed item과 관심 태그 필터를 표시한다.
- `/admin/feed` 생성/수정 API와 UI가 현재 테스트와 일치한다.
- `feed_item_click` 계측은 PostHog가 없으면 안전한 fallback으로 동작한다.
- `e2e/slice/s2-feed.spec.ts`가 현재 UX 기준으로 의미 있게 검증한다.

소유 파일 범위:
- `src/app/(protected)/feed/**`
- `src/app/api/feed/**`
- `src/app/api/admin/feed/**`
- `src/components/feed/**`
- `src/components/admin/curation/**`
- 관심 태그와 직접 관련된 `src/app/(protected)/onboarding/**`
- 관심 태그와 직접 관련된 `src/app/(protected)/directory/me/**`
- 관심 태그와 직접 관련된 `src/components/directory/profile-edit-form.tsx`
- feed/admin feed 관련 테스트:
  - `src/__tests__/app/api/feed/**`
  - `src/__tests__/app/api/admin/feed/**`
  - `e2e/slice/s2-feed.spec.ts`
- 필요한 경우에만 feed migration:
  - `supabase/migrations/020_vcx_curation_feed.sql`
  - `supabase/migrations/022_vcx_feed_admin_policies.sql`

건드리지 말 파일:
- `src/app/(protected)/coffeechat/**`
- `src/app/api/peer-coffeechat/**`
- `src/app/(protected)/admin/ops/**`
- `src/components/coffeechat/**`
- `e2e/slice/s4-coffeechat.spec.ts`
- `e2e/slice/s5-feedback.spec.ts`

작업 순서:
1. 현재 feed/API/UI/test 구현을 읽고 누락과 실패 가능성을 짧게 정리한다.
2. 가장 작은 단위로 테스트를 보강하거나 현재 테스트를 의도에 맞게 수정한다.
3. API와 UI를 기존 패턴에 맞게 수정한다.
4. 관심 태그 저장/조회 경로가 온보딩, 프로필, feed에서 같은 데이터 모델을 쓰는지 확인한다.
5. 불필요한 신규 추상화와 dependency 추가는 하지 않는다.

검증:
- `npm test -- src/__tests__/app/api/feed src/__tests__/app/api/admin/feed`
- `npx playwright test e2e/slice/s2-feed.spec.ts`
- 변경 범위가 넓으면 `npm run lint`
- 최종 전에 `rg "rounded-[a-z]" src/app/(protected)/feed src/components/feed src/components/admin/curation || true`

완료 보고:
- 변경 파일
- 구현된 AC
- 실행한 검증과 결과
- 남은 리스크
```

---

## Shell 2 Prompt — Coffee Chat Loop / AI Brief / Feedback

```text
당신은 ValueConnect X의 CTO 구현 Shell 2입니다.

목표:
Sprint 3 "Coffee Chat Loop + AI Brief Quality"를 Phase 1 Manifest 기준으로 완성/검증합니다. Peer Coffee Chat 신청/수락 후 AI Brief 확인, 실패 fallback, 세션 후 피드백 제출, `/admin/ops` 집계가 작동해야 합니다. CEO Coffee Chat은 Phase 1 신규 기능이 아니므로 ADR-0002 카피 정렬과 기본 플로우 유지에만 한정합니다.

반드시 먼저 읽을 문서:
- AGENTS.md
- docs/plans/VERTICAL_SLICE_PHASE1.md
- docs/sdd/FEATURE_MANIFEST.yaml
- docs/PROCESS.md
- docs/prd/ADR/ADR-0001-fee-structure-member-invisible.md
- docs/prd/ADR/ADR-0002-ceo-coffeechat-culture-fit.md
- docs/prd/ADR/ADR-0003-ai-brief-peer-subfeature.md
- skills/SKILL-testing-vitest.md
- skills/SKILL-api-route-convention.md
- skills/SKILL-supabase-ssr.md
- skills/SKILL-vcx-design-system.md
- skills/SKILL-zod-validation.md

주요 Acceptance Criteria:
- Peer Coffee Chat 생성/신청/수락 플로우가 유지된다.
- 수락 시 AI Brief 자동 생성 또는 안전한 fallback이 보인다.
- `PreBriefCard`가 모바일 360px에서 깨지지 않는다.
- 멤버에게 수수료 문구가 0건 노출된다.
- 완료된 커피챗에서 feedback 제출이 가능하다.
- `session_feedback_submit` 이벤트가 PostHog 미연결 시 `console.info` fallback으로라도 남는다.
- `/admin/ops`가 feedback row count와 최근 10건을 표시한다.
- CEO Coffee Chat 문구는 "컬쳐핏 확인" 프레이밍을 유지하되 신규 기능을 추가하지 않는다.

소유 파일 범위:
- `src/app/(protected)/coffeechat/**`
- `src/app/api/peer-coffeechat/**`
- `src/app/api/coffeechat/**`
- `src/app/(protected)/admin/ops/**`
- `src/components/coffeechat/**`
- `src/components/admin/ops/**`
- coffeechat/feedback 관련 테스트:
  - `src/__tests__/api/peer-coffeechat/**`
  - `src/__tests__/components/coffeechat/**`
  - `e2e/slice/s4-coffeechat.spec.ts`
  - `e2e/slice/s5-feedback.spec.ts`
- 필요한 경우에만 feedback/coffeechat migration:
  - `supabase/migrations/008_vcx_peer_coffeechat.sql`
  - `supabase/migrations/021_vcx_ai_brief_feedback.sql`
- ADR-0002 카피 정렬에 필요한 최소 CEO coffeechat UI 파일:
  - `src/app/(protected)/ceo-coffeechat/**`
  - `src/components/coffeechat/ceo-*.tsx`

건드리지 말 파일:
- `src/app/(protected)/feed/**`
- `src/app/api/feed/**`
- `src/app/api/admin/feed/**`
- `src/components/feed/**`
- `src/components/admin/curation/**`
- `e2e/slice/s2-feed.spec.ts`

작업 순서:
1. 현재 coffeechat/API/UI/test 구현을 읽고 AC 대비 누락과 실패 가능성을 짧게 정리한다.
2. 수수료 문구 비노출부터 `scripts/check-fee-hidden.sh`로 확인한다.
3. AI Brief 생성 성공/실패 fallback과 feedback 제출 경로의 테스트를 보강한다.
4. API와 UI를 기존 패턴에 맞게 수정한다.
5. 모바일 360px 기준으로 카드/폼 텍스트가 겹치지 않게 조정한다.
6. CEO Coffee Chat은 카피 정렬 외 기능 변경을 하지 않는다.

검증:
- `bash scripts/check-fee-hidden.sh`
- `npm test -- src/__tests__/api/peer-coffeechat src/__tests__/components/coffeechat`
- `npx playwright test e2e/slice/s4-coffeechat.spec.ts e2e/slice/s5-feedback.spec.ts`
- 변경 범위가 넓으면 `npm run lint`
- 최종 전에 `rg "rounded-[a-z]" src/app/(protected)/coffeechat src/components/coffeechat src/app/(protected)/admin/ops src/components/admin/ops || true`

완료 보고:
- 변경 파일
- 구현된 AC
- 실행한 검증과 결과
- 남은 리스크
```

---

## Integration Order

1. Shell 1 완료 후 feed 관련 테스트 결과를 기록한다.
2. Shell 2 완료 후 coffeechat/feedback 관련 테스트 결과를 기록한다.
3. 두 Shell 모두 완료되면 통합 검증을 한 창에서만 실행한다.

통합 검증:

```bash
npm run lint
npm test
npx playwright test e2e/slice/s2-feed.spec.ts e2e/slice/s4-coffeechat.spec.ts e2e/slice/s5-feedback.spec.ts
npm run build
```

통합 중 충돌 가능성이 높은 파일:
- `src/types/supabase.ts`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/layout/gnb.tsx`
- `src/constants/navigation.ts`

위 파일은 두 Shell이 동시에 수정하지 않는다. 꼭 필요하면 한 Shell만 소유하고 다른 Shell은 메모로 남긴다.

## Integration Owner Prompt

```text
당신은 ValueConnect X의 CTO 통합 Shell입니다.

목표:
Shell 1 Feed MVP 작업과 Shell 2 Coffee Chat Loop 작업을 통합하고, Phase 1 vertical slice 관점에서 merge 가능 여부를 판정합니다.

반드시 먼저 확인할 것:
- `git status --short`
- Shell 1 완료 보고
- Shell 2 완료 보고
- `docs/plans/VERTICAL_SLICE_PHASE1.md`
- `docs/sdd/FEATURE_MANIFEST.yaml`
- `docs/PROCESS.md`

통합 원칙:
- Shell 1 또는 Shell 2의 변경을 이유 없이 되돌리지 않는다.
- 공용 파일 충돌은 Phase 1 slice 기준으로 최소 수정한다.
- 새 기능을 추가하지 않는다.
- 테스트를 통과시키기 위한 의미 없는 테스트 완화는 하지 않는다.
- 실패가 발생하면 어느 Shell의 소유 범위인지 먼저 분류하고, 가장 작은 수정으로 해결한다.

필수 검증:
1. `npm run lint`
2. `npm test`
3. `npx playwright test e2e/slice/s2-feed.spec.ts e2e/slice/s4-coffeechat.spec.ts e2e/slice/s5-feedback.spec.ts`
4. `npm run build`

완료 보고:
- 통합 결과: merge 가능 / 보류
- 실패했던 검증과 수정 내용
- 최종 검증 결과
- 남은 release blocker
```

## CTO Closeout Checklist

- [ ] Shell 1이 Feed MVP Acceptance Criteria를 증명했다.
- [ ] Shell 2가 Coffee Chat Loop Acceptance Criteria를 증명했다.
- [ ] 두 Shell이 서로 금지 파일을 침범하지 않았다.
- [ ] 공용 파일 변경은 통합 창에서만 정리했다.
- [ ] `rounded-*` 금지 규칙을 변경 범위에서 확인했다.
- [ ] 수수료 문구 비노출 검증을 실행했다.
- [ ] slice E2E 3종이 통과했다.
- [ ] `npm run build`가 통과했다.
- [ ] 남은 리스크는 `docs/sdd/DEBT_LEDGER.md` 또는 완료 보고에 기록했다.
