# VCX Claude Harness Adaptation — valuehire_v2 → valueconnectx

> Status: DRAFT v2 (Planner revision, 2026-04-21)
> Owner: Kang Sangmo (1-person)
> Source: `/Users/kangsangmo/Desktop/valuehire_v2/.claude/`
> Target: `/Users/kangsangmo/Desktop/valueconnectx/.claude/`
> Authority: `docs/PROCESS.md` (SoT — note: §4.1 = "권한 3단계" Authorization Matrix, NOT worktree policy. PROCESS.md has NO worktree section.), `docs/roles/HARNESS.md` (Annex A), `CLAUDE.md` (project constraints)

---

## Summary

valuehire_v2 의 `.claude/` 하네스(agents, skills, hooks, commands, HARNESS.md, settings.json)를 valueconnectx 프로젝트에 **선별·재명명·도메인 치환**하여 이식한다. valueconnectx 의 기존 자산(`docs/roles/`, `skills/SKILL-*.md`, `docs/PROCESS.md`, `.claude/settings.local.json`, `.claude/scripts/log-history.py`, `.claude/worktrees/`)은 **절대 변경하지 않고 병합(merge)**한다. `src/`, `supabase/migrations/`, `package.json` 등 코드베이스는 **건드리지 않는다**. 결과물은 valuehire 도메인 키워드(CONF1, Resume Studio, F-16, F-18, PIPA §26, May-5 등)를 전부 제거하고 VCX 도메인(초대 수락, 커피챗, 커뮤니티, 포지션, AI Brief, CEO Brief)에 맞춘 **valueconnectx-native 하네스**로 재구성된다.

---

## Phase 0 — Documentation-First (MANDATORY, 이식 전 선행)

이식 시작 전, Claude Code 공식 문서로 settings 병합 의미(semantics)를 확정하고 그 결론을 R5/AC-H18/AC-H19 에 반영한다. 문서로 확정 불가능한 경우 실증 테스트 후 폴백(fallback) 정책을 적용한다.

### Phase 0.1 — 공식 문서 조회 (Context7 MCP 우선)

```
# Context7 MCP 경로 (우선)
mcp__context7__resolve-library-id("claude-code")
mcp__context7__query-docs(<lib-id>, "settings.json hooks merge precedence local")

# 실패/불명확 시 WebFetch 폴백
WebFetch("https://docs.claude.com/en/docs/claude-code/settings", "settings.json vs settings.local.json hook merge semantics")
```

답해야 할 3가지 질문:

1. **Hook 배열 병합**: 동일 이벤트(예: `Stop`) 에 `settings.json` 과 `settings.local.json` 양쪽에 hooks 배열이 있으면 — **concatenate (둘 다 실행)** vs **override (local이 이김)** vs **replace (settings.json이 이김)**?
2. **env 키 병합**: 동일 키가 양쪽에 있으면 어느 쪽이 우선?
3. **파일 우선순위**: 전반적으로 `settings.local.json` > `settings.json` 인가, 또는 병합인가?

### Phase 0.2 — 결론 기록

결론을 R5 및 본 문서에 인라인으로 기입:

- 결론 A: "Hooks concatenate (둘 다 실행)" 확인 → S.1 전제 확정 (Stop 훅을 settings.json 에 추가하지 않는 이유가 유효).
- 결론 B: "Hooks override / local wins" 확인 → S.1 재작성 (settings.json 의 Stop 등록 안전. 여전히 보수적으로 미등록 유지하되 근거 갱신).
- 결론 C: "문서 불명확" 확인 → **실증 테스트**:
  - 임시 디렉토리에 `settings.json` (Stop: echo A) + `settings.local.json` (Stop: echo B) 작성
  - SessionStop 이벤트 발생시켜 로그 관찰
  - concatenate 여부 결정

### Phase 0.3 — 폴백 정책 (결론 불명확 시)

Phase 0.2 에서 확정 불가 시, **보수적 기본값**: Stop 훅은 `settings.json` 에 등록하지 않는다. AC-H19 에 "기존 `log-history.py` 단일 실행 (세션 1회당 append 1건)" 을 명시적으로 요구. 만약 AC-H19 가 실패 (중복 append) → `history-stop.sh` 는 파일로만 존재 (opt-in) 유지.

**AC-H18/AC-H19 반영**: Phase 0 결과에 따라 AC-H19 의 문구를 "단일 append / 정확히 1회 실행" 으로 강화.

---

## Acceptance Criteria

### A. 구조 ACs (이식 완료 판정 — 파일 존재/내용 검증)

- [ ] **AC-H1**: `.claude/HARNESS.md` 생성, `docs/roles/HARNESS.md` 를 참조(링크)하고 **중복 내용 없음** (≤120 줄, valuehire 도메인 키워드 0-hit).
- [ ] **AC-H2**: `.claude/agents/` 디렉토리에 6개 프록시 에이전트 존재:
      `vcx-ceo.md`, `vcx-cpo.md`, `vcx-cto.md`, `vcx-cdo.md`, `vcx-sre.md`, `vcx-designer.md` (valuehire 8-role → vcx 6-role 매핑).
- [ ] **AC-H3**: `.claude/skills/` 디렉토리에 선별된 VCX-네이티브 스킬만 존재:
      `vcx-orchestrator/`, `vcx-scope-gate/`, `vcx-tdd-gate/`, `vcx-dod-gate/`, `vcx-history-digest/` (총 5개).
      valuehire 전용 스킬(citation-guard, pii-audit, linkedin-block, legal-dod, grep-gate, kill-switch, weekly-metrics, slice-check, career-ingest, supabase, supabase-postgres-best-practices) 은 **전부 미이식**.
- [ ] **AC-H4**: `.claude/hooks/` 디렉토리에 3개 훅만 존재:
      `worktree-session-start.sh` (읽기 전용, 경고만), `history-stop.sh` (경로 치환됨), `log-user-prompt.sh` (경로 치환됨).
      `worktree-guard.sh` 와 `supabase-env-guard.sh` 는 **미이식** (안전 사유).
- [ ] **AC-H5**: `.claude/commands/` 디렉토리는 **생성하지 않는다** (`history-digest` 는 `.claude/skills/vcx-history-digest/` skill 로 통합됨 — §C.4 참고). 검증: `[ ! -d .claude/commands ]` exit 0.
- [ ] **AC-H6**: `.claude/settings.json` 생성되지만 `Stop` 훅은 **기존 `settings.local.json` 의 `log-history.py` 와 병행**되도록 분리 — 신규 hooks 는 SessionStart, UserPromptSubmit 만 등록. Stop 훅에는 `history-stop.sh` 를 **추가하지 않음** (Phase 0 결과에 따라 확정된 병합 의미 기반 충돌 방지).
- [ ] **AC-H7**: `.claude/settings.local.json` 은 **완전히 보존** (기존 permissions + Stop 훅 log-history.py 유지).
- [ ] **AC-H8**: `.claude/scripts/log-history.py` 파일 **변경되지 않음** (`git diff .claude/scripts/` 공백).
- [ ] **AC-H9**: `.claude/worktrees/` 디렉토리 **완전히 보존** (기존 `agent-a31a3780`, `agent-ad4d9701` 삭제 금지).

### B. 내용 ACs (도메인 치환 완료 판정)

- [ ] **AC-H10**: 이식된 모든 파일에 대해 `grep -rEi '(CONF1|F-16|F-18|Resume Studio|Best Version|May-5|May 5|2026-05-05|PIPA|valuehire|linkedin)' .claude/` 결과 **0-hit**.
- [ ] **AC-H11**: 이식된 모든 파일에 금지 경로가 없어야 한다 (명시적 배타 리스트 사용, 정규식 과매칭 회피):
      `grep -rE '\bDocs/(history|plans|prd|sprints|roles|requirements|sdd)\b' .claude/ 2>/dev/null && echo FAIL || echo OK`
      기대: `OK`.
- [ ] **AC-H12**: 이식된 모든 에이전트/스킬은 vcx 도메인 키워드를 포함:
      `초대`, `커피챗`, `커뮤니티`, `포지션`, `AI Brief`, `CEO Brief`, `vcx_members`, `vcx_corporate_users` 중 **최소 3종** 언급.
- [ ] **AC-H13**: 이식된 에이전트/스킬의 frontmatter `description` 은 vcx 도메인 트리거 키워드(위 목록)만 사용. valuehire 키워드 0-hit.

### C. 안전 ACs (valueconnectx 비영향 판정 — must hold)

- [ ] **AC-H14**: `npm run build` 통과 (이식 전/후 동일 결과).
- [ ] **AC-H15**: `npm run lint` 통과 (이식 전/후 동일 결과).
- [ ] **AC-H16**: `npm test` 통과 (이식 전/후 동일 결과).
- [ ] **AC-H17**: `git status -- src/ supabase/ package.json package-lock.json tsconfig.json eslint.config.mjs next.config.mjs playwright.config.ts vitest.config.ts` 결과 **공백** (코드베이스 미변경).
- [ ] **AC-H18**: SessionStart 훅 실행 (새 Claude 세션 시작) 시 stderr 에 에러 없음, stdout 경고는 허용. Phase 0 확정 병합 의미 근거 하에 UserPromptSubmit 도 정상 실행. smoke test 는 **격리 tmp 디렉토리**에서 수행 (production `.omc/state/` 미오염, V.4 참고).
- [ ] **AC-H19**: 기존 Stop 훅 (`log-history.py`) 이 **세션당 정확히 1회** 실행됨 (`history.md` 에 중복 append 없음). Phase 0 결과에 따라:
      - concatenate (둘 다 실행) 확인 시: `settings.json` 에 Stop 훅 **미등록** 필수 (중복 방지).
      - override/local-wins 확인 시: 보수적으로 여전히 미등록 유지하되, AC-H19 는 "단일 실행" 확인으로 통과.
- [ ] **AC-H20**: 기존 `.omc/` 상태 디렉토리 (`.omc/plans/`, `.omc/state/`, `.omc/sessions/`) 미변경. smoke test 결과물이 production state 에 섞이지 않음.
- [ ] **AC-H24**: `vcx_prevent_ddl` Event Trigger 가 실제로 `supabase/migrations/` 에 정의되어 있는지 검증 (vcx-cdo 에이전트에서 인용하기 전 사전 확인):
      `grep -rl "vcx_prevent_ddl" /Users/kangsangmo/Desktop/valueconnectx/supabase/migrations/ | head -1` — 최소 1개 파일 매치.
      현재 확인: `supabase/migrations/012_vcx_ddl_protection.sql` 존재.

### D. 문서 ACs

- [ ] **AC-H21**: `.claude/HARNESS.md` 는 "이 하네스는 docs/PROCESS.md 의 부속이며, SoT 는 PROCESS.md 다" 를 명시. 단, **worktree 는 PROCESS.md §4.1 의 주제가 아니므로 (§4.1 = 권한 3단계) 인용하지 않는다.** 워크트리 정책은 PROCESS.md 외부의 권장 사항임을 명시.
- [ ] **AC-H22**: `docs/roles/HARNESS.md` 에 `.claude/` 하네스 참조 1줄 추가 (선택적 — CPO 권한이므로 L-Std 통과 가정).
- [ ] **AC-H23**: `.claude/README.md` 생성하여 이식된 구조/사용법 요약 (≤80 줄).
- [ ] **AC-H25**: `.omc/plans/agent-roles-and-harness.md` 파일 상단에 "이 문서는 역사적 설계 기록 (historical design doc). 실제 런타임 정의는 `.claude/HARNESS.md` 및 `docs/roles/HARNESS.md` 를 SoT 로 한다." 1줄 note 추가 (문서 drift 표시). `.claude/HARNESS.md` 의 §8 에서도 이 파일을 "historical design doc" 로 cross-reference.

---

## Classification

valuehire 자산을 3가지로 분류: **KEEP** (그대로 복사), **ADAPT** (내용 재작성/도메인 치환), **DROP** (미이식).

### C.1 Agents (8개 → 6개)

| valuehire | 분류 | vcx 대응 | 근거 |
|---|---|---|---|
| `vh-ceo.md` | ADAPT | `vcx-ceo.md` | `docs/roles/CEO.md` 기반 재작성. "scope freeze", "L-High 48h 쿨다운", ADR 결재 트리거. Kill-Switch 제거. |
| `vh-cpo.md` | ADAPT | `vcx-cpo.md` | `docs/roles/CPO.md` 기반. PRD/Feature Manifest/Vertical Slice 트리거. AC-01~22 → 현재 AC 체계로. |
| `vh-cto.md` | ADAPT | `vcx-cto.md` | `docs/roles/CTO.md` 기반. Next.js + Supabase 아키텍처. `src/`, `e2e/`, `supabase/migrations/` 루트. Haiku/F-16 제거. |
| `vh-cdo.md` | ADAPT | `vcx-cdo.md` | `docs/roles/CDO.md` 기반. `supabase/migrations/NNN_vcx_*.sql` + RLS + DDL 보호(Event Trigger `vcx_prevent_ddl`). PII 20샘플 감사 제거, LLM 비용 캡은 AI Brief 도메인으로 재작성. |
| `vh-chief-designer.md` | ADAPT | `vcx-designer.md` | `docs/roles/DESIGNER.md` 기반. Galaxy 360px 모바일 퍼스트, accent gold `#c9a84c`, `rounded-*` 금지 안티패턴. 이력서 템플릿/A4 제거. |
| `vh-devops.md` | ADAPT | `vcx-sre.md` | `docs/roles/SRE.md` 기반. Vercel + Sentry + Upstash. `docs/ops/`, `scripts/ops/`, `.github/workflows/` 루트. |
| `vh-infra.md` | DROP (흡수) | — | vcx 에서는 SRE 가 인프라까지 책임 (6-role 체제). 이식 대신 `vcx-sre.md` 에 RLS/Resend/pg_cron 섹션 통합. |
| `vh-qa.md` | DROP (흡수) | — | vcx 는 CTO 가 QA Harness 보유(`docs/roles/CTO.md` 의 test-engineer/qa-tester/verifier). 별도 qa 에이전트 불필요. 테스트 스킬은 `skills/SKILL-testing-vitest.md` 가 이미 담당. |

### C.2 Skills (15개 → 5개)

| valuehire | 분류 | vcx 대응 | 근거 |
|---|---|---|---|
| `vh-orchestrator/` | ADAPT | `vcx-orchestrator/` | Phase 0~6 파이프라인 골격만 유지. CONF1/F-16/F-18/May-5 트리거 제거. vcx 트리거: `초대 플로우`, `커피챗`, `AI Brief`, `CEO Brief`, `포지션`, `커뮤니티`, `vcx_members`. 도메인 게이트(Phase 4)는 `vcx-scope-gate` + `vcx-tdd-gate` + `vcx-dod-gate` 3개로 축소. |
| `vh-scope-gate/` | ADAPT | `vcx-scope-gate/` | `docs/sdd/FEATURE_MANIFEST.yaml` + `docs/PROCESS.md` L-Std/L-High 체크로 재작성. May-5 scope freeze → PROCESS.md 48h 쿨다운 + ADR 참조. |
| `vh-tdd-gate/` | ADAPT | `vcx-tdd-gate/` | Red-Green-Refactor 3단계 유지. 도구 치환: pytest → vitest, Playwright 유지. AC 출처는 `docs/plans/` 플랜 AC. silent skip (V-02) 규칙은 vitest `test.skip` 로 변환. |
| `vh-dod-gate/` | ADAPT | `vcx-dod-gate/` | 최종 완료 체크리스트 골격만. F1~F14/May-5 항목 전부 제거. vcx DoD: `npm run build`, `npm run lint`, `npm test`, `npm run test:e2e`, code-review, 커밋+푸시 (CLAUDE.md "품질 게이트" 순서 그대로). |
| `vh-grep-gate/` | DROP | — | AC-19 Deferred 용어 감사는 valuehire 전용(뉴스레터/헤드헌팅 용어). vcx 에는 해당 규칙 없음. |
| `vh-pii-audit/` | DROP | — | 20샘플 이력서 PII 감사 → vcx 에는 이력서 업로드 기능 없음. vcx PII 규칙은 invite-only 프로필에만 적용되며 별도 도메인. |
| `vh-citation-guard/` | DROP | — | 이력서 불릿 citation → vcx 에 합성 이력서 기능 없음. |
| `vh-linkedin-block/` | DROP | — | LinkedIn 원본 차단 → vcx 도메인 무관. |
| `vh-legal-dod/` | DROP | — | PIPA §26 수탁계약 + 처리방침 v1 + LEGAL-01/02/03 → vcx 초대 전용 네트워크 법률 체계와 다름. 필요 시 vcx 별도 계획 필요. |
| `vh-slice-check/` | DROP | — | valuehire Vertical Slice Phase 1 5개 페이지 (`/auth`, `/studio`, `/consent/revoke` 등) 하드코딩. vcx 는 `docs/plans/VERTICAL_SLICE_PHASE1.md` 부재. 필요 시 vcx 버전 별도 작성. |
| `vh-weekly-metrics/` | DROP | — | M1/M2/M3 (Slice Pages Live/Contracts Signed/E2E Smoke) 타임박스(금요일 18:00 KST) + May-5 타겟 전용. vcx 운영 지표 다름. |
| `vh-kill-switch/` | DROP | — | 2026-05-08 단일 날짜 Kill-Switch 평가 (ADR-0002 CEO-11). vcx 무관. |
| `career-ingest/` | DROP | — | DART + ontology_companies 회사 채용 페이지 스크랩 파이프라인. vcx 초대 전용 네트워크와 완전히 다른 제품. |
| `supabase/` | DROP | — | 일반 Supabase 스킬. vcx 에는 이미 `skills/SKILL-supabase-ssr.md` + `skills/SKILL-supabase-migration.md` 존재 → 중복. |
| `supabase-postgres-best-practices/` | DROP | — | 일반 Postgres 튜닝 가이드. 현시점 불필요 (필요 시 향후 별도). |
| `history-digest` (command) | ADAPT → skill | `vcx-history-digest/` | skill 로 변환. `Docs/history.raw.jsonl` → `.omc/state/user-prompts.raw.jsonl`, `Docs/history.md` → `history.md` (vcx 루트) 로 경로 치환. |

### C.3 Hooks (5개 → 3개)

| valuehire | 분류 | vcx 대응 | 근거 |
|---|---|---|---|
| `worktree-session-start.sh` | ADAPT | `worktree-session-start.sh` | 경고 메시지만 (exit 0). "CLAUDE.md §11" 문구 제거, "vcx-orchestrator Phase 0-A" 언급 제거. 메시지 본문은 **PROCESS.md 인용 없이 중립 산문**: "메인 워크트리에서 `src/**` 편집은 권장되지 않음 (권장 사항, opt-in)". /oh-my-claudecode:project-session-manager 참조는 유지. |
| `log-user-prompt.sh` | ADAPT | `log-user-prompt.sh` | `log_dir="$cwd/Docs"` → `log_dir="$cwd/.omc/state"`, `log_file="$log_dir/history.raw.jsonl"` → `.omc/state/user-prompts.raw.jsonl`. `mkdir -p` 경로도 치환. |
| `history-stop.sh` | ADAPT | `history-stop.sh` | `HISTORY="$REPO_ROOT/Docs/history.md"` → `$REPO_ROOT/history.md`. `Docs/(prd/...)` grep pattern → `docs/(prd/...)` (소문자) 또는 `.omc/plans/...`. 그러나 **이 훅은 settings.json Stop 훅에 등록하지 않음** (기존 log-history.py 와 충돌 방지). 파일만 준비하고 opt-in. |
| `worktree-guard.sh` | DROP | — | **메인 워크트리에서 `src/**` 편집 차단** 하드 게이트. valueconnectx 현재 작업 방식(git status 에 `M src/...` 다수) 과 즉시 충돌. 이식 시 사용자 모든 작업이 block 당함. opt-in 조차 위험하므로 미이식. |
| `supabase-env-guard.sh` | DROP | — | `SUPABASE_STAGING_DB_PASSWORD`, `SUPABASE_PROD_DB_PASSWORD` 검사 — vcx 는 staging/prod 분리 환경변수 없음 (단일 `SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_*`). 이식 시 오탐 가능. 미이식. |

### C.4 Commands (2개 → 1개)

| valuehire | 분류 | vcx 대응 | 근거 |
|---|---|---|---|
| `history-digest.md` | ADAPT → skill | `.claude/skills/vcx-history-digest/SKILL.md` | command 가 아닌 skill 로 재배치 (트리거 키워드 기반 자동 호출). 경로 `Docs/history.raw.jsonl` → `.omc/state/user-prompts.raw.jsonl`, `Docs/history.md` → `history.md`. |
| `career.md` | DROP | — | `apps/career/` 파이프라인 전용. vcx 에 `apps/` 디렉토리 없음. |

### C.5 Root Files

| valuehire | 분류 | vcx 대응 | 근거 |
|---|---|---|---|
| `HARNESS.md` | ADAPT | `.claude/HARNESS.md` (신규, 슬림) | 골격만 이식 (≤120 줄). §1 목표 → vcx 6-role proxy 진입점. §2 트리거 → vcx 도메인 키워드. §3 구성 (L1 OMC / L2 vcx-proxy / L3 vcx-skills). §5 워크트리 정책 → **권장 only, opt-in** 표기. §6 TDD 정책 → vitest 도구로 재작성. §7 Supabase 정책 → vcx 의 "DDL 보호 Event Trigger" 체계로 재작성. `docs/roles/HARNESS.md` 를 SoT 로 참조. |
| `settings.json` | ADAPT (merge 대상) | `.claude/settings.json` (신규) | env 3개 (`OMC_PSM_*`) 유지. hooks: **SessionStart, UserPromptSubmit 만 등록**. PreToolUse (worktree-guard) 미등록. Stop 훅은 **settings.local.json 에 이미 등록된 log-history.py 와 충돌하므로 settings.json 에는 추가하지 않음**. |
| `settings.local.json` | DROP | — | valuehire 전용 permissions (launchctl, .venv/bin/python 등) → vcx 에 불필요. vcx 의 기존 `.claude/settings.local.json` 은 그대로 보존. |
| `scheduled_tasks.lock` | DROP | — | valuehire career 파이프라인 락 파일. 미이식. |

---

## Naming Convention

### 재명명 규칙

- **Agents**: `vh-<role>.md` → `vcx-<role>.md` (예: `vh-ceo.md` → `vcx-ceo.md`).
- **Skills**: `vh-<name>/` → `vcx-<name>/` (예: `vh-orchestrator/` → `vcx-orchestrator/`).
- **Hooks**: 파일명 유지 (내용만 치환). 모두 `.claude/hooks/*.sh`.
- **Commands**: history-digest 는 skill 로 전환 → command 파일은 만들지 않음.

### Frontmatter 규칙

- `name`: kebab-case, `vcx-` prefix 필수.
- `description`: valuehire 키워드(CONF1, F-16, F-18, Resume Studio, May-5, PIPA, LinkedIn) **완전 제거**. vcx 도메인 키워드만 사용.
- `tools`: `Read, Grep, Glob, Edit, Write, Bash` 기본. vcx-cto 는 `Task` 추가.
- `model`: `opus` (6 agents 전체 — docs/roles 매트릭스와 동일한 계층).

### 금칙어 (grep -rEi 0-hit)

`CONF1|F-16|F-18|Resume Studio|Best Version|May-5|May 5|2026-05-05|PIPA|valuehire|linkedin|뉴스레터|헤드헌팅|리워드|카이i|apps/career|apps/api|apps/web|Docs/plans/mvp-may5|Docs/sprints|Docs/roles/00-role-charter|FEATURE_MANIFEST\.yaml.*linkedin|ADR-0002|ADR-0016|ADR-0017`

---

## Domain Mapping

valuehire 개념 → valueconnectx 개념 변환표.

| valuehire | valueconnectx |
|---|---|
| CONF1 Resume Studio Lite | (삭제 — 해당 기능 없음) |
| F-16 v0 (주간 뉴스레터) | (삭제) |
| F-18 v0 (헤드헌팅 풀/PlacementRewardBadge) | (삭제) |
| Best Version PDF | (삭제) |
| May-5 MVP (2026-05-05 납기) | (삭제 — vcx 는 continuous delivery) |
| Kill-Switch (2026-05-08) | (삭제) |
| PIPA §26 수탁계약 | (유지 개념 but 별도 vcx-legal 스킬 향후 검토) |
| Haiku 4.5 synthesize | AI Brief / CEO Brief (Anthropic API 사용 단 불릿 합성 아님) |
| 20샘플 PII 감사 | vcx 는 프로필 기반 — 별도 감사 규칙 필요 (이번 스코프 외) |
| LinkedIn 원본 차단 | (삭제) |
| 이력서 citation 100% | (삭제) |
| AC-19 grep 차등 게이트 | (삭제) |
| 8-role (ceo/cpo/cdo/cto/chief-designer/infra/qa/devops) | 6-role (CEO/CPO/CTO/CDO/SRE/DESIGNER) — infra+devops→SRE, qa→CTO 흡수 |
| `Docs/` (대문자 SoT) | `docs/` (소문자 SoT) |
| `Docs/roles/00-role-charter.md` | `docs/roles/{CEO,CPO,CTO,CDO,SRE,DESIGNER}.md` (6개 분리) |
| `Docs/plans/` | `.omc/plans/` + `docs/plans/` (현재는 `.omc/plans/` 우선) |
| `Docs/prd/ADR/` | `docs/prd/ADR/` (if exists) 또는 `docs/_archive/` |
| `Docs/history.md` | `history.md` (vcx 루트) |
| `Docs/history.raw.jsonl` | `.omc/state/user-prompts.raw.jsonl` |
| `Docs/sprints/{slug}/` | `.omc/plans/{slug}.md` (파일 단위) |
| `Docs/requirements/log.md` | (없음 — vcx 는 티켓 시스템 미도입) |
| `apps/web/` + `apps/api/` (monorepo) | `src/app/` (single Next.js) |
| Supabase staging/prod/dev 3환경 | Supabase dev + prod 2환경 (staging 없음) |
| pytest + Vitest + Playwright | **Vitest + Playwright** (no Python) |
| Resend DNS SPF/DKIM/DMARC | 유지 (docs/roles/SRE.md 책임) |
| market_essence_v1.json (1,704 JD) | (삭제) |
| `FEATURE_MANIFEST.yaml` status `in_scope`/`deferred`/`killed` | `docs/sdd/FEATURE_MANIFEST.yaml` (vcx 버전 존재 시 동일 status) 또는 `.omc/plans/*.md` 존재 여부로 대체 |

### vcx-orchestrator 트리거 키워드 (신규)

valuehire `vh-orchestrator` 의 트리거를 전부 교체:

**KEEP (일반):** `AC-`, `DoD`, `Sprint`

**ADD (vcx 도메인):**
- `초대 수락`, `invite-only`, `invite accept`
- `커피챗`, `CEO 커피챗`, `peer coffeechat`
- `커뮤니티`, `community post`
- `포지션`, `position card`
- `AI Brief`, `CEO Brief`
- `vcx_members`, `vcx_corporate_users`, `vcx_prevent_ddl`
- `Galaxy 360`, `모바일 퍼스트`
- `Magic Link`, `비밀번호 재설정`
- `RLS`, `DDL 보호`, `Event Trigger`

**REMOVE (valuehire 전용):**
- CONF1, F-16, F-18, Resume Studio, PIPA, May-5, Kill-Switch, v0 드롭, Best Version PDF, 부스, citation, consent, PII

---

## Safety Gates (valueconnectx 비영향 보장)

### S.1 settings.json 병합 규칙 (Stop 훅 충돌 방지)

- **현 상태**: `.claude/settings.local.json` 의 Stop 훅 = `python3 .claude/scripts/log-history.py`.
- **신규 `.claude/settings.json`**: Stop 훅 **등록 금지**. SessionStart + UserPromptSubmit 만 등록.
- 근거: Claude Code 는 `settings.json` 과 `settings.local.json` 의 hooks 를 **merge** 하므로 둘 다 Stop 훅을 가지면 2회 실행됨. 데이터 중복 위험.
- 구현: `.claude/settings.json` hooks 키에서 `Stop` 항목 **제거**. `history-stop.sh` 는 파일로만 존재하고 opt-in 으로 사용자가 필요 시 수동 등록.

### S.2 훅 경로 치환 규칙

- `log-user-prompt.sh`: `Docs/` → `.omc/state/`.
- `history-stop.sh`: `Docs/history.md` → `history.md`, `Docs/(prd/|[^/]+\.md$)` → `docs/(prd/|plans/|[^/]+\.md$)` + `.omc/plans/`.
- `worktree-session-start.sh`: 메시지 내 "CLAUDE.md §11" 제거. 워크트리 문구는 **중립 산문**으로 대체: "메인 워크트리 `src/**` 편집은 권장 사항으로 opt-in 입니다." **PROCESS.md §4.1 인용 금지** (§4.1 은 Authorization Matrix 이며 worktree 주제 아님). "vh-orchestrator" → "vcx-orchestrator", "/media/psf/..." 계열 절대 경로 하드코딩 제거.

### S.3 워크트리 정책 opt-in

- valuehire 의 worktree-guard.sh **미이식** (hard gate 시 vcx 현재 작업 즉시 차단).
- `.claude/HARNESS.md` 에 워크트리 정책을 **"권장 (recommended, opt-in)"** 로 기록. **PROCESS.md 인용 없음** — PROCESS.md 는 워크트리 정책을 다루지 않음.
- `worktree-session-start.sh` 는 경고만 출력 (exit 0), block 없음.
- 향후 vcx 팀이 워크트리 정책을 도입하려면 별도 ADR → settings.json PreToolUse 추가 (이번 스코프 외).

### S.4 Supabase env guard 완전 제외

- `supabase-env-guard.sh` **미이식**. 이유:
  - vcx 는 staging/prod DB password 환경변수 분리 구조 없음.
  - vcx `.env` 에는 `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_*` 만 존재.
  - 훅 실행 시 오탐(false negative) 또는 혼란만 유발.
- 향후 vcx 가 staging 환경 분리 시 별도 계획(`vcx-supabase-env-guard`) 작성.

### S.5 settings.local.json 완전 보존

- 기존 `.claude/settings.local.json` 내용:
  - permissions: playwright MCP, OMC state, `claude mcp:*`, `npm run:*`, `npm test:*`
  - Stop 훅: `python3 .claude/scripts/log-history.py`
- 이 파일은 **read-only** 로 취급. 이식 과정에서 편집 금지.

### S.6 scripts/log-history.py 완전 보존

- 해당 스크립트는 vcx-native 이력 로깅 시스템. valuehire 와 독립.
- `git diff .claude/scripts/` 이 공백이어야 통과.

### S.7 worktrees/ 디렉토리 완전 보존

- `.claude/worktrees/agent-a31a3780`, `.claude/worktrees/agent-ad4d9701` 은 기존 작업 상태.
- 이식 과정에서 접근/변경 금지.

### S.8 src/, supabase/migrations/, package.json 완전 격리

- 이식 과정에서 **절대 편집 금지**.
- 훅 파일이 위 경로를 참조하는 경우, **검사/경고 only**. 파일 생성/수정 없음.

---

## Implementation Steps

각 스텝은 `파일 경로 / 액션 / 내용 요약` 으로 기술. 순차 실행.

### Phase 0 — Documentation-First (이식 전 선행)

상단 "Phase 0 — Documentation-First" 섹션 참고. Context7 MCP 또는 WebFetch 로 Claude Code settings 병합 의미를 확정하고 R5 + AC-H18/AC-H19 에 반영한다. 이 단계를 건너뛰면 S.1 Stop 훅 전제가 흔들린다.

- **Step 0.1**: Context7 MCP (`resolve-library-id` → `query-docs`) 로 "claude-code settings.json hooks merge" 질의. 실패 시 WebFetch.
- **Step 0.2**: 결론을 R5 에 인라인 업데이트.
- **Step 0.3**: 문서 불명확 시 tmp 디렉토리 실증 테스트 + 폴백 정책(Stop 훅 미등록) 확정.

### Phase 1 — 디렉토리 준비 (안전 검증)

- **Step 1.1**: `ls -la /Users/kangsangmo/Desktop/valueconnectx/.claude/` 실행하여 기존 구조 확인. 출력에 `settings.local.json`, `scripts/`, `worktrees/` 가 보여야 함.
- **Step 1.2**: 디렉토리 생성 (`mkdir -p`):
  - `.claude/agents/`
  - `.claude/skills/vcx-orchestrator/`
  - `.claude/skills/vcx-scope-gate/`
  - `.claude/skills/vcx-tdd-gate/`
  - `.claude/skills/vcx-dod-gate/`
  - `.claude/skills/vcx-history-digest/`
  - `.claude/hooks/`
  - **`.claude/commands/` 디렉토리는 생성하지 않는다** (history-digest 는 skill 로 통합 — AC-H5 참고).
- **Step 1.3**: 기존 자산 SHA256 해시 기록 (pre-install baseline):
  ```bash
  mkdir -p /Users/kangsangmo/Desktop/valueconnectx/.omc/state
  shasum -a 256 \
    /Users/kangsangmo/Desktop/valueconnectx/.claude/settings.local.json \
    /Users/kangsangmo/Desktop/valueconnectx/.claude/scripts/log-history.py \
    > /Users/kangsangmo/Desktop/valueconnectx/.omc/state/vcx-preinstall-hashes.txt
  ```
  이식 완료 후 verify:
  ```bash
  cd /Users/kangsangmo/Desktop/valueconnectx && shasum -a 256 -c .omc/state/vcx-preinstall-hashes.txt
  ```
  기대: `OK` (두 파일 미변경).

### Phase 2 — Hooks 이식 (3개)

- **Step 2.1**: `.claude/hooks/worktree-session-start.sh` 작성.
  - valuehire 원본 복사 후:
    - "CLAUDE.md §11 정책" 문구 **삭제** (→ 중립 산문으로 대체: "메인 워크트리에서 `src/**` 편집은 권장 사항으로 opt-in 입니다.")
    - **"docs/PROCESS.md §4.1" 인용하지 않음** (§4.1 은 Authorization Matrix, worktree 주제 아님)
    - "vh-orchestrator Phase 0-A" → "vcx-orchestrator (권장 — opt-in)"
    - `../valuehire_v2-{slug}` 언급 → `../valueconnectx-{slug}`
    - exit 0 유지 (경고만).
  - `chmod +x`.
- **Step 2.2**: `.claude/hooks/log-user-prompt.sh` 작성.
  - `log_dir="$cwd/Docs"` → `log_dir="$cwd/.omc/state"`
  - `log_file="$log_dir/history.raw.jsonl"` → `$log_dir/user-prompts.raw.jsonl`
  - 나머지 그대로.
  - `chmod +x`.
- **Step 2.3**: `.claude/hooks/history-stop.sh` 작성 (파일만 존재, settings.json 에는 미등록).
  - `HISTORY="$REPO_ROOT/Docs/history.md"` → `HISTORY="$REPO_ROOT/history.md"`
  - grep pattern `^Docs/(prd/|[^/]+\.md$)` → `^(docs/(prd/|plans/|[^/]+\.md$)|\.omc/plans/.+\.md$)`
  - history.md 가 존재하지 않으면 exit 0 (이미 그런 처리 있음).
  - `chmod +x`.
- **Step 2.4**: `worktree-guard.sh`, `supabase-env-guard.sh` **이식하지 않음** (검증: 해당 파일 존재하지 않아야 함).

### Phase 3 — Agents 이식 (6개)

각 agent 는 `docs/roles/<ROLE>.md` 를 읽고 그 Mission/Scope/Harness 섹션을 재구성하여 `.claude/agents/vcx-<role>.md` 에 작성.

- **Step 3.1**: `.claude/agents/vcx-ceo.md`
  - Frontmatter: `name: vcx-ceo`, `description: ValueConnect X의 CEO 역할 프록시. 스코프 freeze, ADR 결재 (docs/PROCESS.md §1.2), 비전/전략, 초대 전용 네트워크 방향성. L-High 결재 권한은 docs/PROCESS.md §4.1 (Authorization Matrix). 48h 쿨다운 참조는 docs/PROCESS.md §1.4 (Two-Hand Commitment). 트리거: "scope freeze", "L-High", "ADR 결재", "비전", "방향성", "48시간 쿨다운".`
  - tools: `Read, Grep, Glob, Bash`, model: `opus`
  - 본문: `docs/roles/CEO.md` Mission/Scope/Outputs 를 요약. valuehire 의 Kill-Switch/S03 D19 완전 제거. 인용 시 §4.1 (권한) 과 §1.4 (쿨다운) 을 혼동하지 않도록 명시적으로 구분.
- **Step 3.2**: `.claude/agents/vcx-cpo.md`
  - description: `ValueConnect X의 CPO 프록시. PRD/Feature Manifest/Vertical Slice 소유, 제품 DoD, 사용자 가치 × 실행가능성 × 납기 정합. 트리거: "PRD", "AC 정의", "Feature Manifest", "vertical slice", "product DoD", "제품 결정".`
  - tools: `Read, Grep, Glob, Edit, Write, Bash`, model: `opus`
  - 본문: `docs/roles/CPO.md` 반영.
- **Step 3.3**: `.claude/agents/vcx-cto.md`
  - description: `ValueConnect X의 CTO 프록시. Next.js 14 App Router + Supabase + TypeScript strict 아키텍처, src/ + e2e/ + supabase/migrations/ 책임. 트리거: "아키텍처", "API route", "@supabase/ssr", "RLS 설계", "성능", "보안 리뷰", "파일 ownership", "Tailwind v4".`
  - tools: `Read, Grep, Glob, Edit, Write, Bash, Task`, model: `opus`
  - 본문: `docs/roles/CTO.md` 반영. 품질 게이트: `npm run build && npm run lint && npm test && npm run test:e2e`.
- **Step 3.4**: `.claude/agents/vcx-cdo.md`
  - **사전 검증** (AC-H24): `grep -rl "vcx_prevent_ddl" /Users/kangsangmo/Desktop/valueconnectx/supabase/migrations/ | head -1` — 현재 `supabase/migrations/012_vcx_ddl_protection.sql` 매치 확인 완료. 이 검증이 실패하면 description 에서 `vcx_prevent_ddl` 구체 이름 제거하고 "DDL 보호 장치 (Event Trigger)" 일반 문구로 순화.
  - description: `ValueConnect X의 CDO 프록시. Supabase 스키마 (vcx_* 테이블), supabase/migrations/NNN_vcx_*.sql, RLS 정책, DDL 보호 장치 (Event Trigger vcx_prevent_ddl — supabase/migrations/012_vcx_ddl_protection.sql), 데이터 품질. 트리거: "migration", "RLS", "DDL", "vcx_prevent_ddl", "스키마", "vcx_members", "vcx_corporate_users", "데이터 모델".`
  - tools: `Read, Grep, Glob, Edit, Write, Bash`, model: `opus`
  - 본문: `docs/roles/CDO.md` 반영. valuehire 의 pg_cron 30일 auto-purge / LLM 비용 캡은 제거.
- **Step 3.5**: `.claude/agents/vcx-sre.md`
  - description: `ValueConnect X의 SRE/DevOps 프록시. Vercel 배포, Sentry P0=0 관측, Supabase 백업, Resend DNS (SPF/DKIM/DMARC), GitHub Actions CI/CD, 롤백 판단. 트리거: "Vercel", "Sentry", "CI/CD", "GitHub Actions", "rollback", "deploy", "런북", "관측", "알림", "Resend DNS".`
  - tools: `Read, Grep, Glob, Edit, Write, Bash`, model: `opus`
  - 본문: `docs/roles/SRE.md` 반영. valuehire `vh-infra` + `vh-devops` 내용 통합.
- **Step 3.6**: `.claude/agents/vcx-designer.md`
  - description: `ValueConnect X의 Chief Designer 프록시. 디자인 시스템, accent gold #c9a84c, Galaxy 360px 모바일 퍼스트, base-ui + Tailwind v4 + rounded-* 금지 안티패턴, WCAG AA, 반응형. 트리거: "디자인 시스템", "모바일 360", "accent gold", "base-ui", "Tailwind v4", "border-radius", "디자인 토큰", "WCAG".`
  - tools: `Read, Grep, Glob, Edit, Write, Bash`, model: `opus`
  - 본문: `docs/roles/DESIGNER.md` 반영.

### Phase 4 — Skills 이식 (5개)

각 skill 은 디렉토리 `.claude/skills/<name>/SKILL.md` 로 작성.

- **Step 4.1**: `.claude/skills/vcx-orchestrator/SKILL.md`
  - Frontmatter `name: vcx-orchestrator`. description 은 "Domain Mapping §vcx-orchestrator 트리거 키워드" 목록을 나열.
  - 본문: Phase 0~6 파이프라인 골격 이식 + 도메인 게이트를 `vcx-scope-gate`, `vcx-tdd-gate`, `vcx-dod-gate` 3개만 연결. valuehire 의 Phase 별 도메인 키워드(CONF1, F-16, F-18) 모두 교체.
  - Phase 0-A 선검사: worktree-guard 대신 "메인 워크트리 `src/**` 편집은 권장 사항 (opt-in) 안내 (경고 only)" 로 재작성. **PROCESS.md §4.1 인용하지 않음** (§4.1 은 Authorization Matrix, worktree 주제 아님).
- **Step 4.2**: `.claude/skills/vcx-scope-gate/SKILL.md`
  - description: `VCX 신규 기능/PR 스코프 검증. docs/sdd/FEATURE_MANIFEST.yaml + docs/PROCESS.md L-Std/L-High 등급 + 48h 쿨다운 준수. 트리거: "신규 기능", "scope 변경", "L-High", "L-Std", "48h 쿨다운", "PR 생성".`
  - 본문: valuehire Phase 절차 유지, `Docs/sdd/FEATURE_MANIFEST.yaml` → `docs/sdd/FEATURE_MANIFEST.yaml`, `Docs/plans/mvp-may5/00-ceo-scope-freeze.md` → `docs/PROCESS.md §2.2 (Creep/Churn 차단)` + `docs/PROCESS.md §4.1 (Authorization Matrix — L-High 결재 권한)` + `docs/prd/ADR/`, backlog 경로 → `.omc/plans/_backlog/ideas.md` (선택적). **주의**: §4.1 은 "권한 3단계" 이며 워크트리와 무관. scope gate 에서는 결재 권한 근거로만 인용.
- **Step 4.3**: `.claude/skills/vcx-tdd-gate/SKILL.md`
  - description: `VCX TDD (Red-Green-Refactor) 강제. vitest + Playwright 기준. AC 출처 = .omc/plans/*.md. 트리거: "TDD", "test first", "red green refactor", "vitest", "e2e AC", "테스트가 먼저", "회귀 방지".`
  - 본문: pytest 언급 제거, `@pytest.mark.skip` → `test.skip`. **Coverage 수치 임계값은 명시하지 않는다** (CLAUDE.md 에 coverage 임계값 미정의 — 품질 게이트는 `build/lint/test/e2e/review` 통과만 요구). coverage 게이트 도입은 별도 ADR 로 결정 예정 (Out of Scope §16 참고).
- **Step 4.4**: `.claude/skills/vcx-dod-gate/SKILL.md`
  - description: `VCX 최종 완료 선언 게이트. CLAUDE.md 품질 게이트 5단계 순차 통과 (build → lint → test → code-review → 커밋+푸시). 트리거: "완료 선언", "DoD", "최종 체크", "ship 준비", "go/no-go".`
  - 본문: valuehire F1~F14 제거, vcx 체크리스트:
    - [ ] `npm run build` 통과
    - [ ] `npm run lint` 통과
    - [ ] `npm test` 통과
    - [ ] `npm run test:e2e` 통과 (해당 기능에 e2e 있을 경우)
    - [ ] `/oh-my-claudecode:code-review` 실행
    - [ ] `/oh-my-claudecode:security-review` 실행 (보안 민감 변경일 때)
    - [ ] 커밋 + 푸시
- **Step 4.5**: `.claude/skills/vcx-history-digest/SKILL.md`
  - description: `raw 프롬프트 로그 (.omc/state/user-prompts.raw.jsonl) 를 history.md 의 요약 섹션으로 소화. 트리거: "history digest", "프롬프트 요약", "히스토리 정리".`
  - 본문: valuehire command `history-digest.md` 재구성. 경로 치환:
    - `Docs/history.raw.jsonl` → `.omc/state/user-prompts.raw.jsonl`
    - `Docs/history.md` → `history.md`
    - `Docs/history.raw.processed.jsonl` → `.omc/state/user-prompts.processed.jsonl`
  - 규칙 섹션 유지 (부록 A/B/C 건드리지 않음 등).

### Phase 5 — Settings 및 HARNESS 이식 (최종)

- **Step 5.1**: `.claude/settings.json` 작성 (신규 파일).
  ```json
  {
    "env": {
      "OMC_PSM_TMUX_DEFAULT": "1",
      "OMC_PSM_BRANCH_PREFIX": "feat,fix,chore,refactor,docs",
      "OMC_PSM_WORKTREE_SIBLING": "1"
    },
    "hooks": {
      "SessionStart": [
        {
          "hooks": [
            { "type": "command", "command": "bash \"${CLAUDE_PROJECT_DIR}/.claude/hooks/worktree-session-start.sh\"" }
          ]
        }
      ],
      "UserPromptSubmit": [
        {
          "hooks": [
            { "type": "command", "command": "bash \"${CLAUDE_PROJECT_DIR}/.claude/hooks/log-user-prompt.sh\"" }
          ]
        }
      ]
    }
  }
  ```
  - **Stop 훅 미등록** (S.1 충돌 방지).
  - **PreToolUse 훅 미등록** (worktree-guard 미이식).
  - **supabase-env-guard SessionStart 항목 미포함**.
- **Step 5.2**: `.claude/HARNESS.md` 작성 (≤120 줄).
  - §1 목적 — vcx 6-role proxy 진입점
  - §2 트리거 — vcx 도메인 키워드
  - §3 L1 OMC (기존) / L2 `.claude/agents/vcx-*` (6개) / L3 `.claude/skills/vcx-*` (5개)
  - §4 Phase 0~6 요약표 (vcx 버전)
  - §5 워크트리 정책 (권장 — opt-in)
  - §6 TDD 정책 (vitest 기반)
  - §7 Supabase 정책 (DDL 보호 Event Trigger 방식)
  - §8 SoT 링크: `docs/roles/HARNESS.md`, `docs/PROCESS.md`, `CLAUDE.md`
- **Step 5.3**: `.claude/README.md` 작성 (≤80 줄) — 구조/사용법 요약.
  - 기존 구조(`settings.local.json`, `scripts/log-history.py`, `worktrees/`) 보존 명시.
  - 신규 구조(`HARNESS.md`, `agents/`, `skills/`, `hooks/`, `settings.json`) 소개.
  - opt-in 항목 (worktree-guard, history-stop) 설명.

### Phase 6 — 검증

- **Step 6.1**: 금칙어 grep:
  `grep -rEi '(CONF1|F-16|F-18|Resume Studio|Best Version|May-5|May 5|2026-05-05|PIPA|valuehire|linkedin|뉴스레터|헤드헌팅|PlacementRewardBadge|apps/career|apps/api|apps/web|Docs/plans/mvp-may5|Docs/sprints|Docs/roles/00-role-charter|ADR-0002|ADR-0016|ADR-0017|Haiku 4\.5|Anthropic 경유)' /Users/kangsangmo/Desktop/valueconnectx/.claude/` → **0-hit 필수**.
- **Step 6.2**: 경로 grep: `grep -rE '(^|[^.])/?Docs/' /Users/kangsangmo/Desktop/valueconnectx/.claude/` → **0-hit 필수** (대문자 Docs/ 경로 없음).
- **Step 6.3**: 보존 검증: `git status .claude/settings.local.json .claude/scripts/ .claude/worktrees/ src/ supabase/ package.json package-lock.json tsconfig.json next.config.mjs` → 공백.
- **Step 6.4**: 빌드/린트/테스트: `npm run build && npm run lint && npm test`.
- **Step 6.5**: 훅 smoke test (**격리 tmp 디렉토리 필수 — production `.omc/state/` 미오염**):
  ```bash
  # worktree-session-start: 부작용 없음 확인
  bash /Users/kangsangmo/Desktop/valueconnectx/.claude/hooks/worktree-session-start.sh
  # 기대: exit 0

  # log-user-prompt: 격리된 CLAUDE_PROJECT_DIR 로 실행하여 production state 미오염
  SMOKE_DIR=$(mktemp -d -t vcx-hook-smoke-XXXX)
  CLAUDE_PROJECT_DIR="$SMOKE_DIR" bash /Users/kangsangmo/Desktop/valueconnectx/.claude/hooks/log-user-prompt.sh <<< '{"prompt":"smoke","session_id":"test","cwd":"'"$SMOKE_DIR"'"}'
  test -f "$SMOKE_DIR/.omc/state/user-prompts.raw.jsonl" && echo "OK: append 확인" || echo "FAIL"
  cat "$SMOKE_DIR/.omc/state/user-prompts.raw.jsonl" | tail -1
  rm -rf "$SMOKE_DIR"

  # production state 미변경 확인
  git status -- /Users/kangsangmo/Desktop/valueconnectx/.omc/state/user-prompts.raw.jsonl
  # 기대: 변경 없음 (기존 파일이 있든 없든)
  ```
  - 주의: `log-user-prompt.sh` 구현이 `$cwd` 기반으로 경로를 결정하면 위 JSON 의 `cwd` 가 SMOKE_DIR 을 가리키므로 격리됨. 구현이 `CLAUDE_PROJECT_DIR` 만 사용하면 `cwd` 필드는 무시되나 CLAUDE_PROJECT_DIR 가 덮어씀. 두 경우 모두 tmp 디렉토리로 격리.
- **Step 6.6**: 에이전트/스킬/커맨드 파일 수 확인:
  ```bash
  ls /Users/kangsangmo/Desktop/valueconnectx/.claude/agents/ | wc -l                    # 기대: 6
  ls -d /Users/kangsangmo/Desktop/valueconnectx/.claude/skills/*/ 2>/dev/null | wc -l   # 기대: 5
  ls /Users/kangsangmo/Desktop/valueconnectx/.claude/hooks/*.sh 2>/dev/null | wc -l     # 기대: 3
  [ ! -d /Users/kangsangmo/Desktop/valueconnectx/.claude/commands ] && echo OK || echo FAIL   # 기대: OK (디렉토리 미생성)
  ```

---

## Risks & Mitigations

| 위험 | 영향 | 완화책 |
|---|---|---|
| R1. Stop 훅 중복 (valuehire history-stop.sh + vcx log-history.py 양쪽 등록) | `history.md` 에 중복 append, 데이터 손상 | settings.json 에 Stop 훅 등록하지 않음 (S.1). history-stop.sh 는 파일만 존재, opt-in. |
| R2. worktree-guard.sh 하드 게이트로 `src/` 편집 전면 차단 | 사용자 모든 작업 즉시 block | worktree-guard.sh 이식 자체를 포기. session-start 경고만. |
| R3. supabase-env-guard.sh 오탐 | SessionStart 실패, 세션 진입 불가 | 이식 자체를 포기 (vcx env 구조 다름). |
| R4. 에이전트 description 에 valuehire 키워드 잔존 → OMC 라우팅 오작동 | vcx 작업이 엉뚱한 에이전트로 라우팅 | Phase 6.1 금칙어 grep 0-hit 강제. |
| R5. `.claude/settings.json` + `.claude/settings.local.json` env/hook 병합 의미 | Stop 훅 중복 실행 또는 override 로 예기치 않은 동작 | **Phase 0 Documentation-First 로 사전 확정**: Context7 MCP (`resolve-library-id("claude-code")` → `query-docs` for "settings.json hooks merge") 또는 WebFetch https://docs.claude.com/en/docs/claude-code/settings. 질의 결과에 따라: (a) concatenate 면 Stop 훅 미등록 필수 유지 — AC-H19 "단일 append" 통과. (b) override/local-wins 면 미등록 여전히 보수적으로 안전. (c) 문서 불명확 시 tmp 디렉토리 실증 테스트 후 폴백 ("Stop 훅을 settings.json 에 추가하지 않는다" 기본값 유지, AC-H19 실패 시 history-stop.sh 완전 비활성). env 키는 settings.json 에만 (OMC_PSM_*). settings.local.json 은 read-only. |
| R6. `docs/roles/HARNESS.md` 편집 권한 (L-High) | CPO 결재 없이 편집 시 PROCESS 위반 | 이 플랜에서는 docs/roles/HARNESS.md 를 **편집하지 않음** (AC-H22 는 optional). .claude/HARNESS.md 는 신규 파일이라 L-Std. |
| R7. 훅 경로 치환 누락 | `Docs/history.md` 생성 시도 → 파일 없음 → silent fail | Phase 6.2 `Docs/` 대문자 grep 0-hit. |
| R8. vcx-orchestrator description 지나치게 광범 → 모든 프롬프트 가로채기 | 생산성 저하 | description 에 명시적 vcx 도메인 키워드만 나열. 일반 질문(`코드 설명`, `버그 수정`) 트리거 제외. |
| R9. skills 가 docs/roles/*.md 라인 번호 참조 시 파일 변경으로 lint fail | docs/roles/*.md 는 이미 존재하지만 라인 번호 drift 가능 | skills 본문에서는 라인 번호 참조 금지. 섹션 앵커(§)만 사용. |
| R10. `.omc/state/user-prompts.raw.jsonl` 디렉토리 미존재 | log-user-prompt.sh 실행 시 write 실패 | 스크립트 내 `mkdir -p "$log_dir"` 유지 (원본에도 있음). 추가 검증 필요. |
| R11. valuehire 의 `scheduled_tasks.lock` 또는 `.DS_Store` 실수로 이식 | vcx 디렉토리 오염 | Phase 2~5 에서 명시된 파일만 작성. 와일드카드 복사 금지. |
| R12. 기존 `.omc/plans/agent-roles-and-harness.md` 와의 중복 혼선 | 두 개의 하네스 정의 공존 | `.claude/HARNESS.md` §8 에서 `docs/roles/HARNESS.md` 를 SoT 로 명시, `.omc/plans/agent-roles-and-harness.md` 는 **설계 문서** 로 구분. |

---

## Verification Steps

### V.1 안전 검증 (AC-H14 ~ AC-H20)

```bash
cd /Users/kangsangmo/Desktop/valueconnectx

# 1. 코드베이스 비영향
git status -- src/ supabase/ package.json package-lock.json tsconfig.json eslint.config.mjs next.config.mjs playwright.config.ts vitest.config.ts
# 기대: 공백

# 2. 기존 .claude 자산 보존
git status -- .claude/settings.local.json .claude/scripts/log-history.py .claude/worktrees/
# 기대: 공백

# 3. 빌드
npm run build
# 기대: exit 0

# 4. 린트
npm run lint
# 기대: exit 0

# 5. 테스트
npm test
# 기대: exit 0 (이식 전과 동일)
```

### V.2 금칙어 grep (AC-H10, AC-H11, AC-H13)

```bash
# valuehire 도메인 키워드 0-hit
grep -rEi '(CONF1|F-16|F-18|Resume Studio|Best Version|May-5|May 5|2026-05-05|PIPA|valuehire|뉴스레터|헤드헌팅|PlacementRewardBadge|apps/career|apps/api|apps/web|Docs/plans/mvp-may5|Docs/sprints|Docs/roles/00-role-charter|ADR-0002|ADR-0016|ADR-0017|Haiku 4\.5)' /Users/kangsangmo/Desktop/valueconnectx/.claude/
# 기대: no match

# 대문자 Docs/ 경로 0-hit
grep -rE '(^|[^.A-Za-z])Docs/' /Users/kangsangmo/Desktop/valueconnectx/.claude/
# 기대: no match
```

### V.3 vcx 도메인 포함 (AC-H12)

```bash
# 각 에이전트가 vcx 키워드 최소 3종 포함
for f in .claude/agents/vcx-*.md; do
  count=$(grep -cEo '(초대|커피챗|커뮤니티|포지션|AI Brief|CEO Brief|vcx_members|vcx_corporate_users|Galaxy 360|Tailwind v4|accent gold|Magic Link)' "$f")
  echo "$f: $count"
done
# 기대: 각 ≥ 3
```

### V.4 훅 smoke test (AC-H18, AC-H20 — 격리 tmp 디렉토리 필수)

**중요**: production `.omc/state/user-prompts.raw.jsonl` 에 절대 append 하지 않는다. 반드시 tmp 디렉토리로 격리.

```bash
# 1. worktree-session-start: 부작용 없음
bash /Users/kangsangmo/Desktop/valueconnectx/.claude/hooks/worktree-session-start.sh
# 기대: exit 0

# 2. log-user-prompt: 격리된 tmp 디렉토리에서 실행
SMOKE_DIR=$(mktemp -d -t vcx-hook-smoke-XXXX)
CLAUDE_PROJECT_DIR="$SMOKE_DIR" bash /Users/kangsangmo/Desktop/valueconnectx/.claude/hooks/log-user-prompt.sh <<< '{"prompt":"smoke","session_id":"test","cwd":"'"$SMOKE_DIR"'"}'
# 기대: exit 0
test -f "$SMOKE_DIR/.omc/state/user-prompts.raw.jsonl" && echo "OK: append 발생" || echo "FAIL: append 실패"
tail -1 "$SMOKE_DIR/.omc/state/user-prompts.raw.jsonl" | jq -r '.prompt'
# 기대: "smoke"
rm -rf "$SMOKE_DIR"

# 3. production state 미오염 확인
git status -- /Users/kangsangmo/Desktop/valueconnectx/.omc/state/
# 기대: smoke test 에 의한 변경 없음
```

### V.5 Stop 훅 무충돌 (AC-H19)

```bash
# .claude/settings.json 에 Stop 항목 없음
jq '.hooks.Stop // "null"' .claude/settings.json
# 기대: "null"

# .claude/settings.local.json 에만 Stop 훅 존재
jq '.hooks.Stop[0].hooks[0].command' .claude/settings.local.json
# 기대: "python3 .claude/scripts/log-history.py 2>/dev/null || true"
```

### V.6 파일 수 (AC-H2, AC-H3, AC-H4, AC-H5)

```bash
cd /Users/kangsangmo/Desktop/valueconnectx
ls .claude/agents/ | wc -l                        # 기대: 6
ls -d .claude/skills/*/ 2>/dev/null | wc -l       # 기대: 5
ls .claude/hooks/*.sh 2>/dev/null | wc -l         # 기대: 3
test -f .claude/hooks/worktree-guard.sh && echo FAIL || echo OK        # 기대: OK (미이식)
test -f .claude/hooks/supabase-env-guard.sh && echo FAIL || echo OK    # 기대: OK (미이식)
[ ! -d .claude/commands ] && echo OK || echo FAIL                      # 기대: OK (commands 디렉토리 미생성)
```

---

## Rollback Plan

이식 도중 또는 후 문제 발생 시 복원 절차.

### R.1 원자적 롤백 (권장)

이식 전에 브랜치 분리:
```bash
git checkout -b feat/claude-harness-adaptation
# ... 이식 작업 ...
# 문제 발생 시:
git checkout main
git branch -D feat/claude-harness-adaptation
```

### R.2 파일 단위 롤백

각 Step 을 git commit 단위로 분리 (예: `feat(claude): vcx-ceo agent 이식`, `feat(claude): hooks 이식` 등).
문제 발생 시:
```bash
git log --oneline .claude/
git revert <commit-sha>
```

### R.3 긴급 비활성화 (설정만 되돌림)

`.claude/settings.json` 을 삭제 또는 hooks 키를 비움:
```json
{ "env": { "OMC_PSM_TMUX_DEFAULT": "1", "OMC_PSM_BRANCH_PREFIX": "feat,fix,chore,refactor,docs", "OMC_PSM_WORKTREE_SIBLING": "1" }, "hooks": {} }
```
에이전트/스킬 파일은 존재하되 훅이 비활성이므로 무해.

### R.4 완전 제거

```bash
rm -f .claude/settings.json .claude/HARNESS.md .claude/README.md
rm -rf .claude/agents .claude/skills/vcx-* .claude/hooks .claude/commands
# settings.local.json, scripts/, worktrees/ 는 절대 건드리지 않음
```

---

## Out of Scope

이번 작업에서 **명시적으로 제외**:

1. **valuehire 문서 구조 (Docs/ 대문자) 도입** — vcx 는 `docs/` 소문자 체계 유지.
2. **`REQ-YYYY-MM-DD-NN` 티켓 시스템** — vcx 는 `.omc/plans/<slug>.md` 파일 단위로 관리.
3. **`ADR-NNNN-*.md` 강제** — vcx 는 `docs/prd/ADR/` 이 이미 존재할 경우 유지, 새 체계 강제 없음.
4. **`Docs/sprints/{slug}/` Evidence Ledger 도입** — vcx 현재 체계(`.omc/plans/`, `history.md`) 유지.
5. **valuehire 8-role → vcx 7+ role 확장** — 6-role (CEO/CPO/CTO/CDO/SRE/DESIGNER) 유지. infra 는 SRE 흡수, qa 는 CTO 흡수.
6. **Supabase staging 환경 분리** — 현재 vcx 의 dev+prod 2환경 유지. staging 도입은 별도 ADR.
7. **worktree-guard.sh 하드 게이트 활성화** — opt-in 으로만 제공. 활성화 결정은 별도 ADR.
8. **supabase-env-guard.sh 이식** — vcx env 구조 변경 전까지 이식 보류.
9. **PIPA §26, LEGAL-01/02/03 등 법률 DoD 도입** — vcx 법률 체계 별도 계획 필요.
10. **`vh-pii-audit` 의 20샘플 감사 로직 vcx 버전 작성** — vcx 프로필 도메인 PII 정책 먼저 확립 후.
11. **`career-ingest`, `supabase`, `supabase-postgres-best-practices` 스킬** — 현 시점 vcx 에 불필요.
12. **`docs/roles/HARNESS.md` 내용 변경** — AC-H22 는 optional. CPO 결재 + 48h 쿨다운 필요하므로 이번 플랜에선 건드리지 않음.
13. **`CLAUDE.md` 본문 변경** — vcx 프로젝트 SoT. 이식은 `.claude/` 에만 국한.
14. **`src/`, `supabase/migrations/`, `package.json`, `tsconfig.json` 등 코드베이스 파일 변경** — 절대 금지.
15. **기존 `.omc/plans/agent-roles-and-harness.md` 통합/삭제** — 별도 작업. 본 플랜에서는 AC-H25 로 historical-design-doc note 1줄만 추가.
16. **Test coverage 임계값 도입** — CLAUDE.md 품질 게이트가 `build/lint/test/e2e/review` 통과만 요구. vcx-tdd-gate 에 숫자 임계값 설정하지 않음. coverage 정책은 별도 ADR.

---

## Metis Gaps Review (pre-Critic checklist, v2)

- [x] `docs/PROCESS.md` 실제 섹션 의미 확인: §1.2 = ADR 강제, §1.4 = Two-Hand 48h 쿨다운, §2.2 = Creep/Churn, §4.1 = Authorization Matrix (권한 3단계). **§4.1 은 worktree 와 무관** → AC-H21, Step 2.1, Step 4.1, Step 4.2, Safety Gate S.2/S.3, vcx-ceo description 에 명시적 disambiguation.
- [x] PROCESS.md 에 worktree 섹션 부재 확인 → 워크트리 정책은 .claude/HARNESS.md 신규 섹션에서만 "권장 (opt-in)" 으로 기술. 외부 SoT 인용 없음.
- [x] Phase 0 Documentation-First 선행 → R5 settings 병합 semantics 확정 절차 포함. Context7 MCP → WebFetch → 실증 테스트 3단계 폴백.
- [x] `vcx_prevent_ddl` Event Trigger 실존 검증 → AC-H24. `supabase/migrations/012_vcx_ddl_protection.sql` 파일 확인 완료.
- [x] `.omc/plans/agent-roles-and-harness.md` drift 표시 → AC-H25. historical design doc 1줄 note + cross-reference.
- [x] Coverage 임계값 claim 제거 → Step 4.3 수정 + Out of Scope §16 추가.
- [x] V.4 smoke test production state 오염 방지 → 격리 tmp 디렉토리(`mktemp -d`) 사용 + AC-H20 강화.
- [x] `.claude/commands/` 디렉토리 생성하지 않음 → Step 1.2 수정 + AC-H5 재작성 + V.6 assertion `[ ! -d .claude/commands ]`.
- [x] AC-H11 정규식 과매칭/과소매칭 회피 → 명시적 경로 리스트 `\bDocs/(history|plans|prd|sprints|roles|requirements|sdd)\b`.
- [x] Stray backtick / 쉘 문법 오류 → Step 6.6 수정, `ls -d .claude/skills/*/ 2>/dev/null | wc -l` (불균형 백틱 제거).
- [x] SHA256 pre-install baseline 실행 가능 명령 제공 → Step 1.3 `shasum -a 256 ... > vcx-preinstall-hashes.txt` + 후 `shasum -a 256 -c` 검증.
- [x] `AGENTS.md` 안티패턴 (border-radius 0, Tailwind v4, `createClientComponentClient` 금지 등) → vcx-designer, vcx-cto 에 명시.
- [x] 배포 규칙 (Vercel, 환경변수 하드코딩 금지) → vcx-sre.
- [x] 테스트 규칙 (`vi.importActual('lucide-react')` 금지 등) → vcx-tdd-gate 에 주의 사항.
- [x] 마이그레이션 규칙 (`supabase/migrations/NNN_vcx_*.sql`, DDL 보호) → vcx-cdo.
- [x] 한국어 UI 필수 → vcx-designer, vcx-cpo.
- [x] `.omc/` 경로 표준 → log-user-prompt.sh, history-digest skill.
- [x] 기존 `.claude/settings.local.json` + `scripts/log-history.py` + `worktrees/` 보존 → S.5, S.6, S.7.
- [x] Stop 훅 충돌 방지 → S.1 (Phase 0 결과로 근거 강화).
- [x] OMC agent 버전 glob (하드코딩 금지) → `docs/roles/HARNESS.md §2` 기준 유지 (이식 범위 외).

---

PLAN_READY: .omc/plans/vcx-claude-harness-adaptation.md
