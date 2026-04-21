---
name: vcx-tdd-gate
description: ValueConnect X TDD (Red → Green → Refactor) 강제. vitest (jsdom) + Playwright (e2e) 기준, AC 출처 = `.omc/plans/*.md` 또는 `docs/plans/VERTICAL_SLICE_PHASE1.md` S1~S5. 테스트 없는 구현 · 구현 없는 테스트 · 통과 없는 커밋 모두 차단. 트리거 — "TDD", "test first", "red green refactor", "vitest", "Playwright", "e2e AC", "테스트가 먼저", "회귀 방지", "Red phase", "Refactor", "코드 정리", "초대 플로우 테스트", "커피챗 테스트", "AI Brief 품질" 언급 시 필수 호출. vcx-orchestrator Phase 3-A · 3-B · 3-C 에서 필수.
---

# VCX-TDD-Gate · Red-Green-Refactor 강제

## Why

CLAUDE.md §2.2 기술 게이트 = `npm run build` / `lint` / `test` green + Playwright 5건 (`tests/e2e/slice/s{1,2,3,4,5}-*.spec.ts`) + a11y axe critical = 0 + Lighthouse mobile ≥ 70 (Galaxy 360px). §4.4 **Evidence Before Assertion** = "완료 주장 시 fresh 증거 필수".

TDD 는 이 두 원칙의 구현:
- **테스트 먼저** = AC 를 실행 가능한 형식으로 미리 고정 → "완료" 의 모호성 제거
- **Red → Green 전이** = fresh 증거의 존재 자체 (처음 실패, 구현 후 통과)
- **회귀 방지** = 모든 AC 는 테스트로 남아 다음 PR 에서 깨지면 즉시 감지

**Coverage 수치 임계값은 명시하지 않는다** — CLAUDE.md 에 미정의. 품질 게이트 = build + lint + test + e2e + code-review + security-review.

## 실행 (3 단계 검증)

### Step 1 · Red 검증 (테스트 작성 직후 호출)

E2E AC 별로 **실패하는** vitest / Playwright 테스트가 실제 존재하는지 확인.

```bash
# 1. 새 테스트 파일 존재 확인
git diff HEAD --name-only | grep -E '(\.test\.|\.spec\.|tests/e2e/)'
# 결과 없으면 FAIL ("테스트 파일이 추가되지 않았습니다")

# 2. 테스트 실행 → 실패 확인
# vitest (단위 · 통합)
npm test -- --run {path/to/new.test.ts} 2>&1 | tee /tmp/vcx-red.log
# Playwright (e2e)
npx playwright test tests/e2e/slice/s{N}-*.spec.ts --reporter=list

# 3. 실패 이유 분류:
#    - AssertionError / expect(...).toBe(...) 실패 / element not found → 올바른 Red
#    - ReferenceError / SyntaxError / ModuleNotFoundError → 잘못된 Red
```

**판정**:
- 테스트 존재 + AssertionError 계열 실패 → **Red 정상**, Green 단계 진행
- 테스트 없음 → FAIL, 테스트부터 작성 요구
- 테스트 존재하지만 Import / Syntax 에러 → FAIL, 테스트 자체 수정 요구

**Anti-pattern 차단 (CLAUDE.md §13)**:
- `vi.importActual('lucide-react')` — 무한 hang. 반드시 `vi.mock('lucide-react', () => ({ default: () => null }))` 형태 또는 소스 구조 미러링 mock 유틸 (`src/__tests__/utils/supabase-mock.ts` 참조).
- `render` 재호출 한계 초과 — `cleanup()` 누락 주의 (Testing Library).
- Zod v4 `.issues` (not `.errors`) 사용.
- jsdom form 제약 — `jsdom` 환경에서 `<form>` submit 기본 차단, `preventDefault` 수동.

### Step 2 · Green 검증 (구현 완료 후 호출)

최소 구현으로 Step 1 의 Red 테스트가 통과하는지 확인.

```bash
# 1. Step 1 과 동일한 테스트 재실행
npm test -- --run {path/to/same.test.ts}

# 2. 전체 테스트 슈트 smoke (회귀 방지)
npm test -- --run
npx playwright test --reporter=dot

# 3. build + lint green 확인 (CLAUDE.md §2.2)
npm run build
npm run lint
```

**판정**:
- 대상 테스트 + 기존 슈트 모두 PASS + build + lint green → **Green**, Phase 4 진행
- 대상 테스트 실패 → Phase 3-B 루프 (구현 계속, 최대 5회)
- 기존 테스트 깨짐 (회귀) → 즉시 중단, `git diff` 로 변경 범위 축소 후 재시도
- 5회 초과 실패 → Phase 1 복귀 (AC 또는 테스트 재설계, 설계 결함 가능성)

### Step 3 · Refactor (기본 포함, Green 직후 호출)

Green 을 통과한 코드에 대해, **테스트를 고정한 채** 중복 제거 · 구조화만 수행. Phase 3-A · 3-B 의 테스트 + AC 가 동작 보존 기준.

**담당**: `oh-my-claudecode:code-simplifier` (opus).

**스킵 조건** (vcx-orchestrator Phase 3-C 에 기술, 본 스킬은 항상 체크리스트 수행):
- 1 file 단독 수정 AND <50 LOC AND 중복 없음

#### 3.1 리팩터 체크리스트 (code-simplifier 프롬프트 주입)

- [ ] 중복 함수 / 블록 (3회+ 반복) → 공통 유틸 추출 (`src/lib/**`)
- [ ] 하나의 함수 >80 LOC → 책임 분리
- [ ] 조건 분기 >5단계 중첩 → early return / guard clause
- [ ] 네이밍 일관성 (TypeScript camelCase 관용)
- [ ] 죽은 코드 · 미사용 import · 임시 주석 (`TODO`, `FIXME`, `refactor later`) 제거
- [ ] `any` 타입 제거 (TS strict mode — CLAUDE.md §"Key Constraints")
- [ ] 매직 넘버 → 이름 있는 상수 (`src/constants/site.ts` DESIGN_TOKENS 활용)
- [ ] Supabase 쿠키 `{get, set, remove}` → `{getAll, setAll}` 교정 (CLAUDE.md §13 anti-pattern)

**건드리지 않는 것**:
- 테스트 파일 (`src/__tests__/**`, `tests/e2e/**`, `*.test.*`, `*.spec.*`)
- Route Handler 응답 스키마 (Zod schema)
- Supabase migration 파일 (`supabase/migrations/*.sql`)
- `src/types/supabase.ts` (Supabase 자동 생성)
- Export 함수 signature

#### 3.2 회귀 검증 블록

```bash
# 전체 슈트 재실행 — 1건이라도 FAIL = 롤백
npm test -- --run
npx playwright test --reporter=list
npm run build
npm run lint

# 테스트 동등성 확인 (리팩터가 테스트를 건드리지 않았는지)
npm test -- --run --reporter=verbose > /tmp/vcx-tests-after.txt
# 리팩터 전 스냅샷과 diff 0 라인이어야 한다
```

#### 3.3 롤백 규약

- 어느 한 테스트라도 FAIL → 즉시 `git reset --hard HEAD~{N}` 로 리팩터 커밋만 되돌린다
- 롤백 후에도 Phase 4 진행 (리팩터 실패가 릴리스를 막지 않는다 — Green 은 유지됨)

#### 3.4 산출물 템플릿

```markdown
## Refactor Summary · {slug}

- Files touched: [src/app/..., src/components/..., src/lib/...]
- Duplications removed: N (locations: ...)
- Utilities extracted: [names in src/lib/]
- LOC delta: -X / +Y
- Tests: vitest {PASS|FAIL} · playwright {PASS|FAIL}
- Build / Lint: {PASS|FAIL}
- Test collection diff: 0 (동등) / N (불일치 — 위반)
- Verdict: PASS | ROLLBACK | SKIP
- Rollback reason (if any): {실패 테스트 이름}
```

## 테스트 레벨 매핑 (E2E AC → 테스트)

AC 별로 적절한 테스트 레벨. **E2E 레벨 AC 는 반드시 `tests/e2e/slice/s{1..5}-*.spec.ts` 중 1개 이상 대응.**

| AC 유형 | 1차 테스트 레벨 | 파일 위치 |
|---|---|---|
| 초대 수락 → 로그인 → 온보딩 → 디렉토리 (S1) | E2E (Playwright) | `tests/e2e/slice/s1-invite-onboarding.spec.ts` |
| 큐레이션 피드 브라우즈 (S2) | E2E (Playwright) | `tests/e2e/slice/s2-feed-browse.spec.ts` |
| 디렉토리 탐색 + 프로필 (S3) | E2E (Playwright) | `tests/e2e/slice/s3-directory.spec.ts` |
| Peer 커피챗 + AI Brief (S4) | E2E (Playwright) | `tests/e2e/slice/s4-coffeechat-brief.spec.ts` |
| 세션 후 피드백 (S5) | E2E (Playwright) | `tests/e2e/slice/s5-session-feedback.spec.ts` |
| Route Handler API | 통합 (vitest) | `src/__tests__/app/api/**/route.test.ts` |
| React 컴포넌트 | 단위 (vitest + Testing Library) | `src/__tests__/components/**/*.test.tsx` |
| lib · util 로직 | 단위 (vitest) | `src/__tests__/lib/**/*.test.ts` |
| Zod 스키마 | 단위 (vitest) | `src/__tests__/lib/validation/*.test.ts` |
| Supabase RLS · migration | smoke SQL | `scripts/verify-rpc-applied.sh` |

## E2E AC 작성 포맷 (Given-When-Then)

모든 E2E AC 는 다음 포맷으로 Phase 1 산출물에 저장:

```markdown
## AC-S{N}-{NN} · {한 줄 요약}

**Given** (전제):
- `vcx_members` 테이블에 tier=core 사용자가 존재
- 사용자가 Magic Link 로 로그인 완료 (미들웨어 `x-vcx-authenticated: true`)

**When** (동작):
- 사용자가 `/coffeechat/[id]` 에서 커피챗 수락 버튼을 누른다

**Then** (검증):
- 응답 200
- `vcx_peer_coffeechat_sessions.status` = `accepted`
- Anthropic API 호출 → AI Brief 생성 → `vcx_ai_brief` 테이블 insert
- ANTHROPIC_API_KEY 미설정 시 fallback (eab4597) 동작 + PreBriefCard 에러 상태 표시
- Galaxy 360px 뷰포트에서 PreBriefCard UI 깨짐 없음

**테스트**:
- E2E: `tests/e2e/slice/s4-coffeechat-brief.spec.ts::test_accept_with_ai_brief`
- 통합: `src/__tests__/app/api/coffeechat/[id]/accept/route.test.ts`
- 단위: `src/__tests__/components/coffeechat/pre-brief-card.test.tsx`
```

이 포맷 없이는 Phase 2 진행 불가.

## 자주 발견되는 안티패턴

- **A (테스트 없음)**: "시간 없어서 나중에" → TDD 게이트 차단. 예외 시 L-High + 48h 쿨다운.
- **B (테스트 항상 PASS)**: Red 에서 실패 안 함 → assertion 이 틀렸거나 mock 이 느슨. 테스트 재설계.
- **C (구현이 테스트에 맞춤)**: hardcoded return 으로 통과 → AC 의 When / Then 부족. AC 재정의.
- **D (통과했지만 회귀)**: Step 2 에서 전체 smoke 필수.
- **E (silent skip creep)**: `test.skip()`, `describe.skip()` 남용. 신규 증가 시 경고 — CLAUDE.md §8 블로커 차단 의도.
- **F (`vi.importActual('lucide-react')`)**: 무한 hang — 절대 금지.
- **G (jsdom form 제약 무시)**: `<form>` submit 테스트 시 `preventDefault` 수동 확인.

## 판정 보고 템플릿

```markdown
# VCX TDD Gate Report · {slug} · Step {Red|Green|Refactor}

**AC**: AC-S{N}-{NN}
**테스트 파일**: {경로}

## Step {N} 결과

| 항목 | 상태 | 증거 |
|---|---|---|
| 테스트 파일 존재 | ✅ | `git diff --name-only` 출력 |
| 실행 결과 | {PASS/FAIL} | `/tmp/vcx-red.log` 또는 `/tmp/vcx-green.log` |
| 실패 이유 유형 | AssertionError / ReferenceError / etc | stack trace |
| build / lint | {PASS/FAIL} | `npm run build` / `npm run lint` 출력 |

**판정**: {Red 정상 / Green 달성 / Refactor PASS / 루프 필요 / ROLLBACK}

**다음 단계**:
- Red 정상 → Phase 3-B (Green 구현)
- Green 달성 → Phase 3-C (Refactor) 또는 Phase 4
- Refactor PASS → Phase 4 (도메인 게이트)
- 루프 필요 → Phase 3-B 재진입, {구체 수정 힌트}
- ROLLBACK → `git reset --hard HEAD~{N}`, Phase 4 진행 (Green 유지)
```

## 후속 작업 / 재호출

- Phase 3 Red / Green 루프 중 재호출 시 → 직전 단계 결과와 diff 로 진척도 보고.
- 리팩터 반복 시 → Step 3 에 누적 실행 횟수 기록 (탈출 조건: 테스트 계속 PASS & LOC 증감 수렴).
- Green 달성 후 AC 추가 요청 시 → 새 AC 를 Phase 1 에 추가하고 3-A 부터 재시작.
