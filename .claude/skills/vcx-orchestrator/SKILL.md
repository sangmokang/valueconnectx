---
name: vcx-orchestrator
description: ValueConnect X 개발 작업의 단일 진입점. Phase 0~6 파이프라인으로 6-role 프록시(vcx-{ceo,cpo,cto,cdo,sre,designer}) 와 도메인 게이트(vcx-scope-gate, vcx-tdd-gate, vcx-dod-gate) 를 조율. 트리거 — "초대 수락", "초대 플로우", "커피챗", "CEO 커피챗", "peer coffeechat", "커뮤니티", "포지션", "AI Brief", "CEO Brief", "vcx_members", "vcx_corporate_users", "Galaxy 360", "Magic Link", "RLS", "DDL 보호", "Event Trigger", "Feature Manifest", "vertical slice", "Sprint", "AC", "DoD" 중 하나라도 언급되면 반드시 이 스킬을 먼저 호출. 후속 작업 (재검증, 부분 수정, 이어서) 도 모두 이 스킬로 라우팅.
---

# VCX-Orchestrator · ValueConnect X Phase 1 총괄

ValueConnect X (vcx_members · vcx_corporate_users · Peer Coffee Chat · AI Brief · Galaxy 360 모바일) 1-인 6-role 매트릭스를 Phase 0~6 으로 조율. 상위 SoT = `docs/plans/VERTICAL_SLICE_PHASE1.md` > `docs/prd-6.0.md` > `docs/PROCESS.md` > `docs/sdd/FEATURE_MANIFEST.yaml` (CLAUDE.md §9 Authority Chain).

## 실행 모드: 하이브리드

| Phase | 모드 | 이유 |
|---|---|---|
| Phase 0 (컨텍스트 + 워크트리 상태) | 직접 실행 (경고만, opt-in) | 단일 읽기 · 분기 결정 |
| Phase 1 (계획 + E2E AC) | 서브 에이전트 | vcx-cpo 가 planner + Given/When/Then AC |
| Phase 2 (아키텍처 + 테스트 전략) | 서브 에이전트 | vcx-cto 가 architect + test 매트릭스 |
| Phase 3-A (Red: 실패 테스트) | 서브 에이전트 | vitest 또는 Playwright 로 먼저 실패 |
| Phase 3-B (Green: 최소 구현) | 에이전트 팀 | executor / executor-high 슬롯 병렬 |
| Phase 3-C (Refactor) | 서브 에이전트 | code-simplifier (테스트 고정, 회귀 시 `git reset`) |
| Phase 4 (도메인 게이트) | 서브 에이전트 병렬 | vcx-scope-gate + vcx-tdd-gate + vcx-dod-gate |
| Phase 5 (검증) | 서브 에이전트 | code-reviewer + security-reviewer 병렬 |
| Phase 6 (커밋 + 푸시) | 서브 에이전트 | git-master 단일 호출 |

## 6-role 프록시 매핑

| Role | 프록시 에이전트 | 기반 OMC | Phase |
|---|---|---|---|
| 최종 결재 · 전략 | `vcx-ceo` | architect + critic | 0, 6 |
| 제품 · AC · Sprint | `vcx-cpo` | planner + verifier | 1, 5 |
| 데이터 · RLS · PII | `vcx-cdo` | scientist / scientist-high | 3-B, 4 |
| 기술 · TDD · AI Brief 런타임 | `vcx-cto` | architect + code-reviewer | 2, 3-B, 5 |
| 운영 · SRE · Vercel / Supabase | `vcx-sre` | executor + debugger | 3-B, 6 |
| 디자인 · Tailwind v4 · 360px | `vcx-designer` | designer / designer-high | 3-B |

상세 매트릭스 = `@docs/roles/HARNESS.md`. Gap 추적 = `@docs/roles/GAP-LEDGER.md`.

## 워크플로우

### Phase 0 · 컨텍스트 + 워크트리 상태 (opt-in)

경고만 — 워크트리 강제 핸드오프 없음. VCX 는 1인 레포 이므로 Phase 0 HARD STOP 을 채택하지 않는다. CLAUDE.md §4.6 **Pre-Work Sync** 만 준수:

```bash
git fetch origin main
git status -sb                    # ahead/behind 확인
git rev-parse --abbrev-ref HEAD   # 현재 브랜치
```

diverged 시 `git rebase origin/main` (merge 금지). force push 금지. 개인 feature 브랜치만 `--force-with-lease` 허용.

**CLAUDE.md §4.5 Prior Work Verification (다른 세션 중복 방지, 병렬 3 소스):**

```bash
git log --all --oneline --grep="<topic>"     # 로컬 커밋
gh pr list --state all --search "<topic>"    # 모든 PR (열림·닫힘·머지)
gh pr list --state open                       # 열린 PR 전량
```

VCX 1인 레포 가드: `"gh 미가용 또는 0-hit — git log + @docs/sdd/DEBT_LEDGER.md 전용 판정, 한계 명시 의무"`. 날짜 필터 금지. 워크트리 존재만으로 "미머지" 판정 금지.

**§8 Remaining Work 5 소스 병렬 조회**: Task tool (TaskList) · `gh issue list --state all` · `gh pr list --state all` · `@docs/plans/_backlog/ideas.md` + `@docs/sdd/DEBT_LEDGER.md` · `git log -n 20 --oneline --grep -iE 'TODO|follow-up|SHOULD-FIX|FIXME'`.

#### Phase 0 영수증 (필수)

Phase 0 실행 후 반드시 다음 블록을 출력하고 slug 디렉토리에 `00-scope-slice.md` 로 적재 (Sprint Evidence Ledger — `@docs/sprints/README.md`, ADR-0008 merge 후 의무). 누락 시 하네스 위반.

```
[Phase 0 영수증]
- 위치:         {CURR_TOP}
- 브랜치:       {BRANCH}
- 분류:         {CODE | DOCS | RO}
- slug:         {kebab-case | n/a for RO}
- 메인 워크트리: {OK (작업 워크트리) | OPT-IN (메인, CLAUDE.md §11 warn only) | EXEMPT(DOCS) | EXEMPT(RO)}
- Pre-Work Sync: {OK (in-sync with origin/main) | REBASED | DIVERGED-아직 미해결}
- Prior Work:   {0-hit | {commit SHAs / PR numbers}}
- Remaining Work: {0 open TODOs | {요약}}
- scope-gate:   {PASS | L-Std-필요 | L-High-48h-쿨다운 필요 | SKIPPED(RO)}
- slice-check:  {PASS (S1~S5 매핑) | OUT (백로그 리다이렉트) | SKIPPED(RO)}
- 다음 Phase:   {1 | 3-A | 단독 스킬명 (예: vcx-dod-gate)}
```

VCX 특이점 (포팅 가이드 대비):
- "메인 워크트리" 에 `OPT-IN` 상태 허용 (HARD STOP 미채택 — ADR-0008 근거).
- Prior Work 에서 `gh` 미가용이면 반드시 `"gh 미가용 — git log + DEBT_LEDGER 전용 판정, 한계 명시"` 라인 덧붙일 것 (CLAUDE.md §4.5).

### Phase 1 · 계획 + E2E AC 도출 (vcx-cpo)

1. **요구사항 명확화** — 2개 이상 해석 가능하면 `/oh-my-claudecode:plan` 선행. PRD 변경 포함 시 `/oh-my-claudecode:ralplan --consensus` 로 ADR 초안 (L-High, 48h 쿨다운 트리거 — `docs/PROCESS.md` §1.4).
2. **Slice Daily Check 3 질문** (`docs/PROCESS.md` §3.3) 통과:
   - 오늘 작업이 S1~S5 (초대·온보딩 · 큐레이션 피드 · 디렉토리 · Peer 커피챗+AI Brief · 세션 피드백) 중 어느 스텝에 닿나?
   - 오늘 작업 후 E2E 테스트가 1단계 더 지나가나?
   - Slice 밖이면 — 왜?
3. **E2E AC 도출 (TDD 필수)** — Given-When-Then 포맷으로 작성. 각 AC 에 테스트 레벨 (E2E Playwright / 통합 Route Handler / 단위 vitest) 명시. E2E 레벨 AC 는 반드시 `tests/e2e/slice/s{1,2,3,4,5}-*.spec.ts` 1개 이상 대응.
4. **산출물**:
   - `.omc/plans/{slug}-01-plan.md` 또는 `docs/plans/{slug}-01-plan.md` — 계획 + 스코프 + 리스크
   - 위 파일 내에 AC 리스트 (Given-When-Then + 테스트 레벨 매핑) 포함

AC 포맷 = `vcx-tdd-gate/SKILL.md` 참조.

### Phase 2 · 아키텍처 + 테스트 전략 (vcx-cto)

1. **아키텍처** — `vcx-cto` + `oh-my-claudecode:architect`:
   - 파일 ownership 슬롯 할당 (파일 경합 방지): A=`src/app/(protected)/**`, B=`src/components/**`, C=`src/app/api/**`, D=`src/lib/**`, E=`supabase/migrations/**`, F=`docs/**` · `.omc/plans/**`, G=`src/types/**` · Zod 스키마, **H=`src/__tests__/**` + `tests/e2e/**`**
   - Verification Tier 결정 (CLAUDE.md §7.2): <5 파일 <100 LOC full tests pass = LIGHT (architect-low haiku), 기본 = STANDARD (architect-medium sonnet), 보안/RLS/migration/결제 = THOROUGH (architect opus)
2. **테스트 전략** — `vcx-cto` + test-engineer 로 AC → 테스트 파일 매핑:

   | AC 레벨 | 파일 위치 | 프레임워크 |
   |---|---|---|
   | E2E | `tests/e2e/slice/s{1..5}-*.spec.ts` | Playwright |
   | 통합 (Route Handler) | `src/__tests__/app/api/**/route.test.ts` | vitest |
   | 단위 (컴포넌트) | `src/__tests__/components/**/*.test.tsx` | vitest + Testing Library (jsdom) |
   | 단위 (lib) | `src/__tests__/lib/**/*.test.ts` | vitest |
   | migration · RLS · DDL | `scripts/verify-rpc-applied.sh` + smoke SQL | Supabase (postgres role) |

3. **Context7 MCP 선행** (CLAUDE.md §7.1) — `@base-ui/react`, `@supabase/ssr`, `recharts`, `zod@4`, `next@14` 사용 전 `resolve-library-id` → `query-docs`. 추측 금지.

### Phase 3 · TDD Cycle (Red → Green → Refactor)

#### Phase 3-A · Red

1. Phase 2 테스트 매트릭스대로 슬롯 H 에 테스트 파일 작성 — **구현 코드는 건드리지 않는다**
2. `npm test -- --run {path}` 또는 `npx playwright test tests/e2e/slice/s{N}-*.spec.ts` → **반드시 실패**
3. `vcx-tdd-gate` Step 1 호출 → 실패 이유가 "구현 부재" (올바른 Red) vs "테스트 자체 결함" (잘못된 Red) 분류
4. 올바른 Red 확인 시 Phase 3-B 진행

**Anti-pattern 금지**: `vi.importActual('lucide-react')` — 무한 hang (CLAUDE.md §13).

#### Phase 3-B · Green

- `vcx-cto` 주도, 슬롯별 `executor` / `executor-high` 병렬. 2 슬롯 이상 변경 시 팀 구성, 각 에이전트는 **Phase 3-A Red 테스트만 통과하는 최소 구현**.
- 구현 후 `vcx-tdd-gate` Step 2 → Red 전량 PASS + 기존 슈트 회귀 0.
- 5회 실패 시 Phase 1 복귀 (AC 또는 테스트 재설계).

**직접 수정 허용 경로** (Orchestrator 예외, CLAUDE.md §7.1): `.claude/**`, `.omc/**`, `CLAUDE.md`, `AGENTS.md`, `docs/**/*.md`. 그 외 `src/**` · `supabase/migrations/**` · `tests/**` · `scripts/**` 는 반드시 `executor` / `executor-high` / `build-fixer` 위임.

#### Phase 3-C · Refactor (기본 포함)

- `oh-my-claudecode:code-simplifier` (opus) 위임. vcx-tdd-gate Step 3 체크리스트 8항목 + 전체 슈트 재실행 + 회귀 시 `git reset` 롤백.
- 스킵 조건: 1 file AND <50 LOC AND 중복 없음.
- 테스트 파일 수정 금지. 외부 시그니처 (Route Handler 응답, DB 컬럼, export signature) 유지.

### Phase 4 · 도메인 게이트 (병렬)

변경 영역에 따라 선택적으로 병렬 호출 (`run_in_background: true`):

| 변경 영역 | 필수 스킬 |
|---|---|
| 신규 기능 · PR scope | `vcx-scope-gate` (L-Lite/L-Std/L-High 판정, 48h 쿨다운 ADR 요구 여부) |
| Red-Green-Refactor 완료 주장 | `vcx-tdd-gate` |
| 최종 완료 선언 | `vcx-dod-gate` |
| 모든 PR | `vcx-scope-gate` + `vcx-tdd-gate` 는 항상 |

실패 시 Phase 3-B 로 루프 (`/oh-my-claudecode:ralph --critic=vcx-tdd-gate`, 최대 3회). 3회 초과 시 사용자 에스컬레이션.

### Phase 5 · 검증 (병렬)

1. `/oh-my-claudecode:code-review` — 전체 diff 리뷰 (sonnet)
2. `/oh-my-claudecode:security-review` — RLS · PII · DDL 보호 · Magic Link · invite token · rate-limit 경로 변경 시 필수 (opus)
3. CLAUDE.md §4.4 **Evidence Before Assertion** — fresh `npm run build` 출력, Playwright artifact, `git log --oneline` 커밋 SHA, CI 링크 첨부. "should" · "probably" · "seems" 없이 fresh 실행 결과 없는 주장은 거짓 보고 간주.
4. `architect-medium` (sonnet) 검증 없이 L-Std 이상 merge 금지.

### Phase 6 · 커밋 + 푸시 (vcx-sre + git-master)

1. pre-commit: `scripts/prd-freeze-check.sh` (PRD 변경 ADR 동반 확인), `scripts/check-fee-hidden.sh` (ADR-0001 수수료 비노출).
2. Authorization Matrix 에 따라 진행 (`docs/PROCESS.md` §4.1):
   - L-Lite (테스트 · 스타일 · 리팩터 · deps patch) — self + CI
   - L-Std (신규 파일 · migration · API · UI 신규 페이지) — self + CI (자동 approve 불가, `vcx-cto` 검토)
   - L-High (PRD / PROCESS / MANIFEST / ADR / CLAUDE.md / 법률 · PII · 결제 / deps major / 외부 API 계약) — 48h 쿨다운 재서명 (긴급 트랙 3: Legal Blocker · User Harm · Cost Explosion 만 면제)
3. `oh-my-claudecode:git-master` 로 atomic commit + `git push`. `--force-with-lease` 만 허용.

## 데이터 흐름

```
[User 요청]
   ↓
[Phase 0: Pre-Work Sync + Prior Work Verification (3 소스 병렬) + Remaining Work (5 소스 병렬)]
   ↓
[Phase 1 vcx-cpo: planner → .omc/plans/{slug}-01-plan.md + Given-When-Then AC]
   ↓
[Phase 2 vcx-cto: architect → 슬롯 할당 + 테스트 매트릭스 (+ Context7 MCP 선행)]
   ↓
[Phase 3-A RED: vitest / Playwright 실패 테스트 → vcx-tdd-gate Step 1]
   ↓
[Phase 3-B GREEN: executor/executor-high 슬롯 병렬 → vcx-tdd-gate Step 2]
   ↓ ↻ 5회 미만 재시도, 5회 초과 시 Phase 1 복귀
[Phase 3-C REFACTOR: code-simplifier → vcx-tdd-gate Step 3 (회귀 시 git reset)]
   ↓
[Phase 4: vcx-scope-gate + vcx-tdd-gate + vcx-dod-gate 병렬]
   ↓
[Phase 5: code-review + security-review + architect-medium 검증 (fresh 증거 필수)]
   ↓
[Phase 6: git-master → commit + push (Authorization Matrix + 48h 쿨다운)]
```

## 에러 핸들링

| 상황 | 전략 |
|---|---|
| Phase 0 diverged | `git rebase origin/main` (merge 금지, force push 금지) |
| Phase 0 gh 미가용 | git log + DEBT_LEDGER.md 전용 판정, 한계 명시 |
| Phase 1 AC 모호 | `/oh-my-claudecode:plan` 재진입하여 Given-When-Then 구체화 |
| Phase 2 Context7 미조회 | 사용 전 `resolve-library-id` → `query-docs` 강제 |
| Phase 3-A 잘못된 Red (Import / Syntax) | 테스트 파일 문법 · import 만 수정 (로직 건드리지 않음) |
| Phase 3-B 5회 초과 실패 | Phase 1 AC 재정의 또는 Phase 2 아키텍처 재검토 |
| Phase 3-B `rounded-*` 클래스 사용 시도 | 전역 `border-radius: 0` 정책 위반 (CLAUDE.md §13) — 즉시 차단 |
| Phase 3-C 리팩터 후 테스트 깨짐 | `git reset --hard` 롤백, Phase 4 진행 (Green 은 유지됨) |
| Phase 4 vcx-scope-gate OUT 판정 | `.omc/plans/_backlog/ideas.md` 또는 `docs/sdd/DEBT_LEDGER.md` 리다이렉트 |
| Phase 5 security-review MUST-FIX | Phase 3-B 로 루프 (최대 3회) |
| Phase 6 pre-commit 실패 | 새 commit 생성 재시도 (amend 금지, CLAUDE.md Git Safety) |
| Phase 6 L-High 48h 쿨다운 중 자기번복 | 해당 변경 abort (`docs/PROCESS.md` §1.4) |
| Supabase DDL 직접 수정 시도 | Event Trigger `vcx_prevent_ddl` 자동 차단. migration 파일 (`NNN_vcx_*.sql` 순번) 로 재작성 |

## 매직 키워드 매핑

| 사용자 발화 | 라우팅 |
|---|---|
| "PR 준비" · "커밋하고 푸시" | Phase 6 |
| "DoD 체크" · "완료 선언" · "ship 준비" | `vcx-dod-gate` |
| "스코프 확인" · "L-High 여부" · "ADR 필요?" | `vcx-scope-gate` |
| "TDD" · "실패 테스트 먼저" · "Red phase" | `vcx-tdd-gate` |
| "히스토리 요약" · "프롬프트 정리" | `vcx-history-digest` |
| "이번 주 지표" · "Weekly Finish Ritual" | `scripts/weekly-metrics.sh` + `vcx-dod-gate` M1/M2/M3 |
| "autopilot" | Phase 1 선행 후 `/oh-my-claudecode:autopilot` (PRD 변경 포함 시 `/ralplan` 강제) |
| "ralph" · "끝까지" | Phase 3 에서 `/oh-my-claudecode:ralph --critic=vcx-tdd-gate` |

## 후속 작업 / 재호출 지침

- `.omc/plans/{slug}-*.md` 존재 → 같은 slug 면 **부분 재실행** (기존 plan 추가 · 개정). 새 slug 면 **새 plan 파일**.
- "이전 결과 개선" → 직전 plan 먼저 Read, diff 기반 업데이트. Authority Chain (CLAUDE.md §9) 위반 여부 먼저 확인.
- Sprint 말 자동 호출 → `scripts/weekly-metrics.sh` (금 18:00 KST Weekly Finish Ritual — `docs/PROCESS.md` §5.4).
- Phase 1 DoD 직전 → `vcx-dod-gate` 최종 호출 (`docs/plans/VERTICAL_SLICE_PHASE1.md` §3 + CLAUDE.md §10).
