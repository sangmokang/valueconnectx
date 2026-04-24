# ValueConnect X — CLAUDE.md

> 작성일: 2026-04-21 · Phase 1 납기: **2026-05-15** (D-24) · 솔로팀 (Sangmo Kang: CEO = CPO = CTO)
> 권위: `@docs/plans/VERTICAL_SLICE_PHASE1.md` > `@docs/prd-6.0.md` > `@docs/PROCESS.md` > `@docs/sdd/FEATURE_MANIFEST.yaml` > `@docs/prd/ADR/` > `@docs/roles/HARNESS.md` > 본 문서 > `@docs/sdd/DEBT_LEDGER.md`
> 활성 ADR: `docs/prd/ADR/ADR-0001` ~ `ADR-0007` (7건)

---

## §1. 제품 한 줄 정의

검증된 핵심 인재와 기업 리더를 연결하는 **초대 전용(invite-only) Private Talent Network**. 3 레이어 = ① 채용시장 큐레이션 피드(Hook) ② 커뮤니티 라운지(Sticky) ③ 커피챗 기반 채용 연결(Revenue). 수익원 = **성사 수수료 연봉 25%** (멤버 UI 노출 금지 — ADR-0001).

---

## §2. Phase 1 DoD

- **2.1 기능**: F-AUTH · F-DIRECTORY · F-PEER-COFFEECHAT · F-SESSION-FEEDBACK AC 충족 (`@docs/sdd/FEATURE_MANIFEST.yaml`) · F-FEED MVP (`022_vcx_feed_items.sql` + `/api/feed` + `/feed`) · F-CEO-COFFEECHAT 카피 재적용 (copy only, out-of-slice, E2E 제외 — ADR-0002)
- **2.2 기술 게이트**: `npm run build`/`lint`/`test` green · Playwright 5건 (`tests/e2e/slice/s{1,2,3,4,5}-*.spec.ts`) · a11y axe critical = 0 · Lighthouse mobile ≥ 70 (360px) · Anthropic API 월 예산 준수 (§7.3)
- **2.3 법률·컴플라이언스**: PIPA 개인정보 처리방침 최신 (015 migration) · UI "수수료"/"25%"/"fee" grep 0 (`scripts/check-fee-hidden.sh`, ADR-0001) · UI 한국어 100%
- **2.4 운영**: `/api/health` (Vercel Cron 5분) + Supabase/Vercel/Anthropic/Resend runbook · `@docs/sdd/DEBT_LEDGER.md` D-0001~0004 CLOSED
- **2.5 제품 자기검증**: S1~S5 AC 전량 (`@docs/plans/VERTICAL_SLICE_PHASE1.md`) · 초대→수락→로그인→온보딩→디렉토리 E2E 3건 수동 · 360px 스크린샷 5페이지

**상세 지표 정의 = `@docs/PROCESS.md` §5 단일 원천. 재선언 금지.**

---

## §3. Scope — IN / OUT

### 3.1 IN (Phase 1 Slice — `@docs/sdd/FEATURE_MANIFEST.yaml` 원천)
| Feature | Slice | Status | Maturity |
|---|---|---|---|
| F-AUTH | S1 | live | needs_polish |
| F-FEED | S2 | stub | mvp_required |
| F-DIRECTORY | S3 | live | validate_only |
| F-PEER-COFFEECHAT (+ AI Brief) | S4 | live | quality_check |
| F-SESSION-FEEDBACK | S5 | live | instrumentation_needed |

### 3.2 Live-but-out-of-slice
- F-CEO-COFFEECHAT — 기본 플로우 live 유지, ADR-0002 "컬쳐핏" 카피 재적용만 (copy only, E2E 제외)

### 3.3 OUT (Phase 1 수정·개선 금지, bug fix/보안 패치 예외)
- F-COMMUNITY · F-POSITIONS · F-ADMIN-EXTENDED (신규 기능 없음)
- F-AI-RESUME (Phase 2 후보) · F-MULTI-VERTICAL (Phase 3+) · F-DOMAIN-EXPERT-ROUTING (ADR-0005 — VCX 제품 아님)

---

## §4. 작업 규율 (Hard Rules)

### 4.1 Vertical Slice First
모든 변경은 `@docs/plans/VERTICAL_SLICE_PHASE1.md` S1~S5 중 하나에 기여해야 머지 가능. 매일 작업 시작 시 `@docs/PROCESS.md` §3.3 **Slice Daily Check 3 질문** 통과. Slice 밖 작업은 왜인지 PR description 에 명시.

### 4.2 PRD 변경 = ADR + 48h 쿨다운 재서명
1인 팀 변형 (2-hand 불가). L-High (PRD/PROCESS/MANIFEST/ADR/본 문서) 변경은 **PR 생성 → 최소 48h merge 보류 → 재서명 후 merge**. 쿨다운 중 자기번복 시 abort. `scripts/prd-freeze-check.sh` pre-commit hook 이 `docs/prd-6.0.md` 수정 시 ADR 동반 없으면 block. 긴급 트랙 3 종 (Legal Blocker / User Harm / Cost Explosion — API 월 예산 150% 초과) 만 쿨다운 면제. → `@docs/PROCESS.md` §1.

### 4.3 Authorization Matrix
| Level | 승인자 | 대상 |
|---|---|---|
| L-Lite | 본인 | 테스트, 스타일, 리팩터, 오탈자, deps patch |
| L-Std | 본인 + CI | 신규 파일, migration, API, UI 신규 페이지, deps minor |
| L-High | 본인 + 48h 쿨다운 | PRD/PROCESS/MANIFEST/ADR/본 문서, 법률·PII·결제, deps major, 외부 API 계약 |

상세 = `@docs/PROCESS.md` §4. "침묵의 승인" 금지 — L-Std/L-High 자동 approve 불가.

### 4.4 Evidence Before Assertion
"완료" · "테스트 통과" · "빌드 green" 주장 시 **fresh 증거 필수** — 같은 세션의 최신 `npm run build` 출력, Playwright artifact, `git log --oneline` 커밋 SHA, CI 링크. 증거 없는 주장은 거짓 보고 간주. Red flag: "should" · "probably" · "seems to" 없이 fresh 실행 결과 없음. **architect / architect-medium 검증 없이 L-Std 이상 merge 금지**.

### 4.5 Prior Work Verification (다른 세션 중복 방지)
작업 시작 전 3 소스 **병렬** 조회:
```bash
git log --all --oneline --grep="<topic>"     # 로컬 커밋
gh pr list --state all --search "<topic>"    # 모든 PR (열림·닫힘·머지)
gh pr list --state open                       # 열린 PR 전량
```
날짜 필터 사용 금지 (다른 세션 커밋을 놓침). **VCX 1인 레포 가드**: `"gh 미가용 또는 0-hit — git log + @docs/sdd/DEBT_LEDGER.md 전용 판정, 한계 명시 의무"`. 워크트리 존재만으로 "미머지" 판정 금지 — 같은 커밋이 main 에 이미 있을 수 있음.

### 4.6 Pre-Work Sync (diverged 방지)
작업 시작 전 `git fetch origin main` → `git status -sb` (ahead/behind 확인) → diverged 시 `git rebase origin/main` (merge 금지). force push 금지, 개인 feature 브랜치만 `--force-with-lease` 허용 (공유 브랜치도 금지).

---

## §5. Weekly Metrics

M1 · M2 · M3 정의·측정은 **`@docs/PROCESS.md` §5 단일 원천**. 매주 금 18:00 KST Weekly Finish Ritual (§5.4) 준수 — 미제출 주간 = "Progress zero" 기록. 본 문서에서 숫자 재선언 금지.

---

## §6. Sprint Timeline (Phase 1, 2026-04-17 ~ 2026-05-15)

| Sprint | 기간 | 테마 | 핵심 산출물 |
|---|---|---|---|
| **S1** | 04-18 ~ 04-24 | Close Decisions & Fix Debt | ADR-0001~0005 **소급** 서명 (ADR-0006/0007 은 Phase 1 중 append) · D-0001·D-0002 closed · 온보딩 UX 3 종 · plan 아카이브 · `check-fee-hidden.sh` · `/api/health` |
| **S2** | 04-25 ~ 05-01 | Cold Start Feed MVP | `022_vcx_feed_items.sql` · `/api/feed` · `/feed` · PostHog 6 이벤트 · Stibee 1 회 발송 |
| **S3** | 05-02 ~ 05-08 | Coffee Chat Loop + AI Brief Quality | Peer 커피챗 E2E · AI Brief 품질 샘플 10 건 · fallback 검증 · `/admin/ops` 피드백 대시보드 · CEO 커피챗 카피 재적용 |
| **S4** | 05-09 ~ 05-15 | Onboarding V2 + Landing + Phase 1 DoD | `/` v6.0 카피 · 온보딩 V2 · E2E 5 건 CI green · a11y axe 0 critical · Lighthouse mobile ≥ 70 · DoD Go/No-Go |

**Velocity Override**: 타임라인은 **FLOOR** (하한). 조기 완료 시 Phase 2 선행 착수 가능하되 §2 품질 게이트 희생은 금지. 상세 작업 분해 = `@docs/plans/VERTICAL_SLICE_PHASE1.md` §5.

---

## §7. 에이전트 실행 규칙

### 7.1 Delegation-First
Orchestrator 는 **코드를 직접 쓰지 않는다**. `src/**` · `supabase/migrations/**` · `tests/**` · `scripts/**` 변경은 `executor` / `executor-high` / `build-fixer` 에 위임. **직접 수정 허용 경로**: `.claude/**`, `.omc/**`, `CLAUDE.md`, `AGENTS.md`, `docs/**/*.md`. 외부 SDK/API 사용 전 **Context7 MCP (`resolve-library-id` → `query-docs`) 필수** — `@base-ui/react`, `@supabase/ssr`, `recharts`, `zod@4`, `next@14` 등 추측 금지. 상세 = `~/.claude/CLAUDE.md` PART 1.

### 7.2 검증 티어
| 티어 | 조건 | Agent |
|---|---|---|
| LIGHT | <5 파일, <100 라인, full tests pass | architect-low (haiku) |
| STANDARD | 기본 | architect-medium (sonnet) |
| THOROUGH | >20 파일, 보안 / 스키마 / RLS / 결제 | architect (opus) |

상세 = `~/.claude/CLAUDE.md` §"Tiered Architect Verification".

### 7.3 비용 규율
Haiku (단순 lookup) / Sonnet (표준) / Opus (복잡 reasoning · 보안). VCX 추가: **사용자 노출 Anthropic API 호출은 F-PEER-COFFEECHAT AI Brief 한 피처만**. **Anthropic 월 예산 상한 = USD 100 잠정 (ADR-0008 로 Sprint 1 말 서명 예정 — PROCESS Annex A.2 배치 타이머 편입 검토)**. 초과 시 §4.2 긴급 트랙 "Cost Explosion" (월 예산 150% 초과) 발동, ADR 작성 후 48h 쿨다운 면제로 조치.

---

## §8. Remaining Work + Backlog Investigation

작업 시작 전 **5 소스 병렬** 조회 필수 — 어느 하나 생략 시 누락 리스크:

1. Task tool (TaskList)
2. `gh issue list --state all`
3. `gh pr list --state all`
4. `@docs/plans/_backlog/ideas.md` + `@docs/sdd/DEBT_LEDGER.md`
5. `git log -n 20 --oneline --grep -iE 'TODO|follow-up|SHOULD-FIX|FIXME'`

**VCX 1인 레포 가드**: `"gh 미가용 또는 0-hit — git log + @docs/sdd/DEBT_LEDGER.md 전용 판정, 한계 명시 의무"`. 조용한 생략 금지. 날짜 필터 사용 금지.

---

## §9. Authority Chain (참조 문서 권위순)

1. `@docs/plans/VERTICAL_SLICE_PHASE1.md` — Phase 1 스코프 SoT
2. `@docs/prd-6.0.md` — PRD
3. `@docs/PROCESS.md` — 게이트 · 권한 · 측정
4. `@docs/sdd/FEATURE_MANIFEST.yaml` — feature 스코프 원천
5. `@docs/prd/ADR/*.md` — 결정 기록 (ADR-0001 ~ ADR-0007)
6. `@docs/roles/HARNESS.md` — 1 인 6-role 매트릭스
7. 본 CLAUDE.md
8. `@docs/sdd/DEBT_LEDGER.md` — 부채 장부

상충 시 낮은 번호가 이긴다.

---

## §10. Phase 1 완료 선언 체크리스트

전부 녹색이 되기 전까지 Phase 2 착수 금지:

- [ ] §2.1~2.5 전량 충족 (F-CEO 카피는 copy only — out-of-slice, E2E 제외)
- [ ] §5 Weekly Metrics 목표치 달성 (`@docs/PROCESS.md` §5 정의 기준)
- [ ] Sprint 4 Go/No-Go 회의 기록 + Phase 2 Kick-off 결정 ADR
- [ ] 본 CLAUDE.md 변경 포함 L-High 항목 **48h 쿨다운 재서명 완료**

하나라도 미달 = **Phase 1 미완**. Phase 2 논의 동결.

---

## §11. Agent Harness

- **런타임 진입점**: `~/.claude/CLAUDE.md` (oh-my-claudecode — 30+ agents, skills, autopilot/ralph/ultrawork/plan 등). VCX 세션 시작 시 자동 로드.
- **1 인 6-role 매트릭스**: `@docs/roles/HARNESS.md` (CEO/CPO/CTO/CDO/SRE/DESIGNER × agent · skill · tool · quality gate).
- **도메인 단일 진입점**: `.claude/skills/vcx-orchestrator/SKILL.md` — Phase 0~6 파이프라인, 6-role 프록시 + 도메인 게이트 (vcx-scope-gate · vcx-tdd-gate · vcx-dod-gate · vcx-history-digest) 조율.
- **L4 런타임 3중 방어** (ADR-0008):
  1. **SessionStart hook** — `.claude/hooks/worktree-session-start.sh` (워크트리 상태 고지, 메인 워크트리에 opt-in 정책 경고)
  2. **PreToolUse — opt-in** (HARD STOP 미채택, ADR-0008 §D-2 근거; 2인체제 전환 시 재검토)
  3. **pre-commit hook** — `.githooks/pre-commit` → `scripts/prd-freeze-check.sh` + `scripts/secret-scan.sh` (PRD freeze + Secret/PII fail-closed)
- **L5 Sprint Evidence Ledger**: `docs/sprints/{slug}/NN-type.ext` 단일 SoT — Phase 0 영수증 · 01-plan · 01-e2e-ac · 02-arch · 03a-red.log · 03b-green.log · 03c-refactor.md · 04-gate-*.md · 05-verify.md. 운영 가이드 = `@docs/sprints/README.md`. 정책 근거 = ADR-0008 (§D-1).
- **Phase 5 외부 advisor 프로토콜**: self-review echo 차단 — `/oh-my-claudecode:code-review` + `/oh-my-claudecode:security-review` 병렬 호출 + Verdict 포맷 강제. 상세 = `@docs/PROCESS.md §5.5`.
- 본 문서는 위 SoT 들을 **재선언하지 않는다**. 변경이 필요하면 해당 파일을 고치고 여기는 링크만 유지.

---

## §12. 환경 & 기술 규칙 (Summary)

| 항목 | 값 |
|---|---|
| Tech stack | Next.js 14 App Router · TS strict · Tailwind v4 · `@base-ui/react` (서브패스) · `@supabase/ssr` · Vitest · Playwright · SWR · Zod v4 · Anthropic (AI Brief 전용) |
| Commands | `npm run dev` / `build` / `lint` / `test` / `test:e2e` |
| Env vars | `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` · `RESEND_API_KEY` · `ANTHROPIC_API_KEY` (미설정 시 AI Brief fallback — F-PEER-COFFEECHAT AC 참조) |
| Member types | `vcx_members` (tier: core/endorsed) · `vcx_corporate_users` (CEO/Founder/C-level/HR Leader) |
| Routing 분류 | Public / Semi-public / Protected (x-vcx-authenticated 헤더) / Admin (`/login` 리다이렉트) / Auth |
| DDL 보호 | App roles (`anon`/`authenticated`/`service_role`) DDL 금지, Event Trigger `vcx_prevent_ddl` 차단, migration only (`NNN_vcx_*.sql` 순번 증가), Dashboard Table Editor 절대 금지 |
| 하드코딩 금지 | secret/API key 는 Vercel Dashboard 관리 |

**상세 (프로젝트 구조 tree · API convention 헬퍼 리스트 · 스타일 토큰 · 테스트 환경 상세)** = `@docs/engineering/VCX_STACK.md`. 본 문서에서 재선언 금지.

---

## §13. Anti-Patterns (절대 하지 말 것)

- ❌ `tailwind.config.ts` 생성 (Tailwind v4 는 CSS-first)
- ❌ `createClientComponentClient` / `createServerComponentClient` (삭제된 API)
- ❌ Supabase 쿠키 `{get, set, remove}` 형태 → `{getAll, setAll}`
- ❌ `cookies()` without `await` (Next.js 14 async)
- ❌ `vi.importActual('lucide-react')` (무한 hang)
- ❌ `rounded-*` Tailwind 클래스 (전역 `border-radius: 0` 정책 — `src/app/globals.css` 전역 정책)
- ❌ `ZodSchema` import → `ZodType` (Zod v4)
- ❌ Supabase Dashboard Table Editor 직접 수정
- ❌ 마이그레이션 번호 중복 (현재 013 · 014 중복 잔존 — D-0001, Sprint 1 정리)
- ❌ `@base-ui/react` 루트 import → 서브패스 `@base-ui/react/button`
- ❌ 영어 UI 텍스트 (한국어 필수)
