# Plan — VCX `CLAUDE.md` Refactor (VH v2 Structural Discipline → VCX Reality)

> 작성일: 2026-04-21 (Sprint 1, D-24 to Phase 1 DoD 2026-05-15)
> 작성자: Prometheus (planner) for Sangmo Kang
> 출력 대상: `/Users/kangsangmo/Desktop/valueconnectx/CLAUDE.md`
> Critic 검토 대상. 사용자 confirmation 스킵.

---

## 0. Context

### 0.1 Original Request

현재 VCX `CLAUDE.md`(201 lines)는 **기술 카탈로그** — 스택·구조·라우팅·DDL·스타일·Anti-patterns의 덤프.
규율(DoD, Evidence, Prior Work Verification, Authorization, Pre-Work Sync) 은 전부 `docs/PROCESS.md`·`docs/plans/VERTICAL_SLICE_PHASE1.md`·`docs/sdd/FEATURE_MANIFEST.yaml` 등 **주변 SoT**로 이관돼 있으나, `CLAUDE.md` 가 그걸 **호출하지 않는다**. 결과: 에이전트가 세션 시작 시 규율을 못 본다.

ValueHire v2 의 `CLAUDE.md` 는 같은 문제를 이미 풀었다 — 140줄 lean 리팩터로 §1~§11 을 배치, 하위 SoT 를 `@docs/...` 링크로 위임, 규율(Evidence/Prior Work/Pre-Work Sync/Authorization/Backlog Investigation)을 에이전트가 첫 문장에서 마주치게 만든다.

이 구조를 **VCX 현실**(1인팀, 48h 쿨다운, 7 features, Phase 1 DoD M1=5 M2=5 M3≤3, PRD v6.0, ADR-0001~0007, Debt D-0001~0004) 로 **이식**한다.

### 0.2 Interview Summary (인터뷰 불필요 — 요청서에 요구사항 17개 전부 명시)

사용자 요청 §1~§17 을 모두 반영한다. 특히:
- §2 기존 PROCESS 재선언 금지, `@docs/...` 링크로 위임
- §5 "Two-Hand Commitment" → **48h 쿨다운 재서명** 로 변환 (1인팀)
- §9 Backlog 조사 에 "gh 0-hit 시 git log 가 권위" 가드 명시
- §15 분량 목표 150~200줄 lean
- §17 상단 프론트매터에 납기·권위순·활성 ADR 고정

### 0.3 Research / Verification

다음 파일을 실제 읽어 ground truth 확정:

| 문서 | 발견사항 |
|---|---|
| `docs/PROCESS.md` (269 lines) | §1.4 48h 쿨다운, §4.1 L-Lite/Std/High, §5.1 M1/M2/M3, §6.1 Plan 상한 3, §2.3 두 우주 분리, Annex A role-harness |
| `docs/plans/VERTICAL_SLICE_PHASE1.md` (180 lines) | S1~S5 AC, Sprint 1~4 분해, §3 Phase 1 DoD 표, §6 Red Flag 7종 |
| `docs/sdd/FEATURE_MANIFEST.yaml` | 7 features (F-AUTH · F-FEED · F-DIRECTORY · F-PEER-COFFEECHAT · F-SESSION-FEEDBACK · F-CEO-COFFEECHAT · out-of-scope 6종), infra_minimum (healthcheck + telemetry 6 이벤트 + debt + scripts) |
| `docs/sdd/DEBT_LEDGER.md` | D-0001 013·014 중복 / D-0002 019 검증 / D-0003 Branding / D-0004 프로필 완성도 — 전부 기한 2026-04-24 |
| `docs/roles/HARNESS.md` | 6 role × agent/skill/tool/quality gate 매트릭스, Agent Smoke Check AC-7 |
| `docs/prd/ADR/` | ADR-0001~0007 존재 확인 (7개 전부) |
| `docs/prd-6.0.md` | 3 레이어 비즈니스 (Hook/Sticky/Revenue), 성사 수수료 연봉 25%, Cold Start 4주 타임라인 |
| 기존 `CLAUDE.md` | 기술 스택·구조·DDL·Anti-patterns (11 항목) — 전부 보존해야 에이전트 컨텍스트 유지 |

---

## 1. Work Objectives

### 1.1 Core Objective

VH v2 의 **"§1~§11 배치 + 권위 상단 프론트매터 + SoT @링크 위임"** 구조로 VCX `CLAUDE.md` 를 재작성한다. 기존 기술 카탈로그(스택/구조/DDL/Anti-patterns)는 lean 압축 후 §10~§11 로 보존, **규율 영역(§1~§9)** 은 신규.

### 1.2 Deliverables

1. `.omc/plans/vcx-claude-md-refactor.md` (본 문서) — 전략 + 매핑 + 최종 draft 임베드
2. `/Users/kangsangmo/Desktop/valueconnectx/CLAUDE.md` 재작성은 **후속 executor 단계** (Critic 승인 후)

### 1.3 Definition of Done (본 plan 레벨)

- [ ] VH v2 §1~§11 전 섹션이 VCX 대응 섹션으로 매핑됨 (drop/keep/transform 명시)
- [ ] 새 draft 가 150~200 줄 lean target 달성
- [ ] 모든 하위 SoT 를 `@docs/...` 링크로 위임, 재선언 0
- [ ] 프론트매터 상단: 납기 2026-05-15 + 권위순 + 활성 ADR 0001~0007
- [ ] Evidence / Prior Work Verification / Pre-Work Sync / Backlog Investigation 규율 모두 VCX flavor 로 포함
- [ ] 기존 `CLAUDE.md` 의 Anti-patterns 11 항목 전량 보존
- [ ] 기존 `CLAUDE.md` 의 Tech stack · Project structure · Commands · Env vars 전량 보존 (압축 가능)
- [ ] 한국어 + 마크다운 표 + 간결 명령형 톤

---

## 2. VH v2 → VCX Section Mapping

| VH v2 § | VCX § (new) | Action | 근거 |
|---|---|---|---|
| §1 제품 한 줄 정의 | §1 제품 한 줄 정의 | **Transform** — VCX 버전 ("초대 전용 Private Talent Network"), 3 레이어 (Hook/Sticky/Revenue) 및 수익 구조 (성사 수수료 25%) 한 줄 포함 | prd-6.0.md §1.2~1.3 |
| §2 DoD 필수 조건 | §2 Phase 1 DoD | **Transform** — 2.1 기능(F-AUTH~F-SESSION-FEEDBACK AC + F-FEED MVP + F-CEO-COFFEECHAT 카피) / 2.2 기술 게이트(build/lint/test, Playwright 5건, a11y axe 0 critical, Lighthouse mobile perf ≥ 70, Anthropic API 월 예산) / 2.3 법률·컴플라이언스(PIPA, 수수료 UI 0건 ADR-0001, 한국어) / 2.4 운영(runbook + healthcheck + Debt 4건 closed) / 2.5 제품 자기검증(Slice S1~S5 AC + 초대 이메일 3건 E2E + 모바일 360px 시각) | 요청 §3, VERTICAL_SLICE_PHASE1.md §2~§3 |
| §3 IN/OUT | §3 Scope IN / OUT | **Transform** — FEATURE_MANIFEST.yaml 기반 IN(F-AUTH/F-FEED/F-DIRECTORY/F-PEER-COFFEECHAT/F-SESSION-FEEDBACK), live-out-of-slice(F-CEO-COFFEECHAT 카피만), OUT(F-COMMUNITY/F-POSITIONS/F-ADMIN-EXTENDED/F-AI-RESUME/F-MULTI-VERTICAL/F-DOMAIN-EXPERT-ROUTING) | FEATURE_MANIFEST.yaml |
| §4.1 Vertical Slice | §4.1 Vertical Slice First | **Keep** — VH v2 원칙 유지, docs/plans/VERTICAL_SLICE_PHASE1.md 5 스텝 기여 의무, PROCESS §3.3 "Slice Daily Check 3 질문" 링크 | PROCESS.md §3 |
| §4.2 PRD 변경 = ADR + 2-Hand | §4.2 PRD 변경 = ADR + 48h 쿨다운 재서명 | **Transform** — 1인팀 대응. L-High 변경 PR 48h merge 보류 → 재서명. prd-freeze-check.sh pre-commit 링크 | PROCESS.md §1.4, §1.3 |
| §4.3 Authorization Matrix | §4.3 Authorization Matrix | **Keep** — PROCESS §4.1 표 그대로 인용 (L-Lite/L-Std/L-High + 48h 쿨다운). 재선언 금지 — 한 줄 요약 + @docs/PROCESS.md §4 링크 | PROCESS.md §4 |
| §4.4 Evidence Before Assertion | §4.4 Evidence Before Assertion | **Keep** — VH v2 원칙 동일. architect/architect-medium 검증 없이 merge 금지. "완료/통과" 주장 시 fresh 증거 필수 (npm run build 출력, Playwright artifact 등) | 요청 §5 |
| §4.5 Prior Work Verification | §4.5 Prior Work Verification | **Keep + Guard** — gh pr list --state all + git log --all --grep + gh pr list --state open 3종 병렬. 날짜 필터 금지. VCX 가드 추가: "1인 레포 — gh 결과 0-hit 이면 git log 가 권위, 워크트리 존재만으로 미머지 판정 금지" | 요청 §5, §9 |
| §4.6 Pre-Work Sync | §4.6 Pre-Work Sync | **Keep** — git fetch origin main + rebase 의무. diverged 시 rebase 필수 (merge 금지). force push 금지, 개인 feature 브랜치에 한해 `--force-with-lease` 만 허용 | 요청 §5 |
| §5 측정 (매주 금 18:00 KST) | §5 Weekly Metrics | **Delegate** — M1/M2/M3 정의 재선언 금지. 한 줄 요약 + @docs/PROCESS.md §5 링크. Weekly Finish Ritual §5.4 도 링크 | PROCESS.md §5 |
| §6 스프린트 타임라인 | §6 Sprint Timeline | **Transform** — S1 Close Decisions(04-18~24) / S2 Cold Start Feed(04-25~05-01) / S3 Coffee Chat Loop + AI Brief Quality(05-02~05-08) / S4 Onboarding V2 + Landing + Phase 1 DoD(05-09~05-15). Velocity Override: "타임라인은 FLOOR, 조기 완료 시 Phase 2 선행 착수 가능하나 §2 품질 게이트 희생 금지" | VERTICAL_SLICE_PHASE1.md §5 |
| §7.1 Delegation-First | §7.1 Delegation-First | **Keep** — 코드 변경은 executor 에이전트 위임. 직접 수정 허용 경로 명시: `.claude/**`, `.omc/**`, `CLAUDE.md`, `AGENTS.md`, `docs/**/*.md`. SDK/라이브러리 사용 전 Context7 MCP (resolve-library-id → query-docs) 필수 | ~/.claude/CLAUDE.md Part 1 |
| §7.2 검증 티어 | §7.2 검증 티어 | **Keep** — LIGHT(<5 files, <100 lines) → architect-low (haiku) / STANDARD(기본) → architect-medium (sonnet) / THOROUGH(>20 files 또는 보안/스키마/RLS) → architect (opus) | ~/.claude/CLAUDE.md §"Tiered Architect Verification" |
| §7.3 비용 규율 | §7.3 비용 규율 | **Transform** — Haiku/Sonnet/Opus 라우팅. VCX 추가: 사용자 노출 Anthropic API 는 **F-PEER-COFFEECHAT AI Brief 만**. 월 예산 상한 설정 (긴급 트랙 Cost Explosion = 월 예산 150% — PROCESS §1.1) | PROCESS.md §1.1, ~/.claude/CLAUDE.md §"Smart Model Routing" |
| §8 남은 작업·블로커 + 조사 지침 | §8 Remaining Work + Backlog Investigation | **Keep + Guard** — 소스 5종 병렬: (1) TaskList (2) `gh issue list` (3) `gh pr list --state all` (4) `docs/plans/_backlog/ideas.md` + `docs/sdd/DEBT_LEDGER.md` (5) 최근 20 커밋 `git log --grep -iE 'TODO\|follow-up\|SHOULD-FIX\|FIXME'`. VCX 가드: "gh 미가용/빈 결과 시 '명시적으로 gh 0-hit — git log + Debt Ledger 전용 판정' 을 답변에 기록. 어느 하나 생략 시 누락 리스크" | 요청 §9 |
| §9 참조 문서 권위순 | §9 Authority Chain | **Transform** — 1. `@docs/plans/VERTICAL_SLICE_PHASE1.md` / 2. `@docs/prd-6.0.md` / 3. `@docs/PROCESS.md` / 4. `@docs/sdd/FEATURE_MANIFEST.yaml` / 5. `@docs/prd/ADR/*.md` / 6. `@docs/roles/HARNESS.md` / 7. 본 CLAUDE.md / 8. `@docs/sdd/DEBT_LEDGER.md` | 요청 §10 |
| §10 완료 선언 체크리스트 | §10 Phase 1 Completion Checklist | **Transform** — §2.1~2.5 전량 + M1=5 M2=5 M3≤3 + Debt D-0001~0004 closed + Sprint 4 E2E 5건 녹색 + 48h 쿨다운 재서명. 하나라도 미달 시 "Phase 1 미완" Phase 2 착수 금지 | 요청 §11 |
| §11 하네스 Agent Runtime | §11 Agent Harness | **Delegate** — `~/.claude/CLAUDE.md` (OMC) = 에이전트 런타임 진입점 + `@docs/roles/HARNESS.md` = 6-role 매트릭스. 둘 다 **링크만**, 재선언 금지 | 요청 §12 |
| (VH v2 에 있던 booth-playbook / PIPA §26 Anthropic 수탁계약) | — | **Drop** — VCX 제품 범위 아님. 다만 PIPA 자체는 §2.3 법률·컴플라이언스에서 언급 (VCX 는 초대 전용 프라이버시 모델 015 migration 기반) | 요청 §1 "Drop" |
| (기존 VCX CLAUDE.md Tech Stack/Structure/Commands/Env) | §12 환경 & 기술 규칙 (summary only) + **신규 SoT `docs/engineering/VCX_STACK.md`** | **Externalize** — CLAUDE.md §12 는 단일 compact 표 (≤ 25 줄) — tech stack 한 줄 / commands 5개 / env vars 5개 / member types 1 줄 / routing 1 줄 / DDL 1 줄. 상세 (project structure tree, API convention, styling tokens, testing 환경) 는 모두 `@docs/engineering/VCX_STACK.md` 신규 파일로 이관. 기존 CLAUDE.md lines 15–165 전량 보존 대상 | 요청 §14 + Critic fix #1 |
| (기존 VCX CLAUDE.md Anti-Patterns 11 항목) | §13 Anti-Patterns (절대 하지 말 것) | **Keep (verbatim)** — 11 항목 전부 보존: tailwind.config.ts / createClient*ComponentClient / 쿠키 {get,set,remove} / cookies() await / vi.importActual lucide-react / rounded-* / ZodSchema / Supabase Dashboard / migration 013·014 중복 / @base-ui/react 루트 import / 영어 UI | 요청 §13 |

---

## 3. Must Have / Must NOT Have

### 3.1 Must Have

1. 상단 프론트매터 — 작성일 / Phase 1 납기 / 솔로팀 / 권위순 / 활성 ADR
2. §1~§13 섹션 (VH v2 스타일 간결 명령형)
3. 모든 SoT 를 `@docs/...` 링크로 위임 (재선언 금지 — 단, 표/표 행을 발췌 인용해 에이전트 맥락 힌트 제공은 허용)
4. Evidence Before Assertion 규율 명시
5. Prior Work Verification 3종 병렬 (gh 0-hit 가드 포함)
6. Pre-Work Sync (fetch + rebase + force-with-lease)
7. Backlog Investigation 5 소스 병렬 (gh 0-hit 가드 포함)
8. Authorization Matrix 1 줄 요약 + @PROCESS.md §4 링크
9. Phase 1 DoD M1=5 M2=5 M3≤3 + Debt D-0001~0004 closed
10. Sprint Timeline 4 주 + Velocity Override
11. Delegation-First + 직접 수정 허용 경로 명시
12. 검증 3 티어 (LIGHT/STANDARD/THOROUGH)
13. 비용 규율 + AI Brief 월 예산 상한
14. Anti-Patterns 11 항목 (verbatim)
15. Tech stack / Project structure / Commands / Env vars / DDL 보호 / Routing / Member types 보존
16. 한국어 + 마크다운 표
17. 150~200 줄 lean target

### 3.2 Must NOT Have

1. ❌ `docs/PROCESS.md` 의 M1/M2/M3 정의 재선언
2. ❌ `docs/plans/VERTICAL_SLICE_PHASE1.md` 의 S1~S5 AC 전체 복붙
3. ❌ `docs/sdd/FEATURE_MANIFEST.yaml` 의 features 전체 복붙
4. ❌ `~/.claude/CLAUDE.md` 의 OMC 에이전트 30+ 리스트 재선언
5. ❌ `docs/roles/HARNESS.md` 의 6-role 매트릭스 재선언
6. ❌ VH v2 의 "PIPA §26 Anthropic 수탁계약" · "booth-playbook" (VCX 제품 아님)
7. ❌ 2-hand commitment (1인팀 — 48h 쿨다운 으로 대체)
8. ❌ 200 줄 초과 (분량 초과 시 §9 ~ §13 을 더 aggressive 하게 @링크 위임)
9. ❌ 영어 본문 (한국어 필수)
10. ❌ 에이전트 런타임 재정의 (OMC CLAUDE.md 가 SoT)

---

## 4. Task Flow & Dependencies

```
[본 plan 승인 (Critic)]
    ↓
[Task A] /Users/kangsangmo/Desktop/valueconnectx/CLAUDE.md 백업 (git 이미 관리 중이므로 skip 가능)
    ↓
[Task B] 신규 CLAUDE.md 작성 (본 plan §5 draft 복사)
    ↓
[Task C] 체크리스트 검증 — 분량 / Anti-patterns 11 / 프론트매터 / @링크 무결성
    ↓
[Task D] 48h 쿨다운 문서화 — CLAUDE.md 는 L-High(PROCESS meta 영향 있을 수 있음) 로 보고 PR 생성 → 48h merge 보류 → 재서명
    ↓
[Task E] (cooldown 종료 후) merge + AGENTS.md (있다면) 와의 중복 제거
```

Dependency: A → B → C → D → E (순차).
병렬 가능: 없음 (본 plan 은 단일 파일 재작성).

---

## 5. Detailed TODOs

### TODO-1 — `docs/engineering/VCX_STACK.md` 신규 파일 작성 (CLAUDE.md §12 bulk 이관)

- **Acceptance**: 기존 `CLAUDE.md` lines 15–165 (tech stack / project structure tree / commands / env vars / routing / member types / DDL 보호 / API convention / styling / testing 전량) 을 `docs/engineering/VCX_STACK.md` 로 **그대로 복사**. CLAUDE.md §12 와 중복되는 요약은 허용, 상세(디렉토리 트리, API 헬퍼 전체 리스트, DESIGN_TOKENS 상세, 테스트 환경 상세) 는 **VCX_STACK.md 전용**.
- **Owner**: 본인 (L-Std — 신규 문서, ADR 불필요, PRD 무관)
- **Files**: `docs/engineering/VCX_STACK.md` (create)
- **Evidence**: `wc -l docs/engineering/VCX_STACK.md` ≥ 130, `grep -c '# ' docs/engineering/VCX_STACK.md` ≥ 8 (섹션 수), `grep 'vcx_prevent_ddl' docs/engineering/VCX_STACK.md` hit ≥ 1

### TODO-2 — 신규 CLAUDE.md draft 작성

- **Acceptance**: 본 plan §6 의 draft 를 그대로 `/Users/kangsangmo/Desktop/valueconnectx/CLAUDE.md` 로 쓴다. Critic 검토 통과한 버전이어야 함. TODO-1 (VCX_STACK.md) 완료 후에만 실행 — §12 의 `@docs/engineering/VCX_STACK.md` 링크가 깨지면 안 됨.
- **Owner**: 본인 (L-High — PRD/PROCESS 인접, 48h 쿨다운 대상)
- **Files**: `CLAUDE.md` (write)
- **Evidence**: `wc -l CLAUDE.md` 결과 150~200 줄 범위, `grep -c '@docs/' CLAUDE.md` ≥ 8 (SoT 링크 수 — VCX_STACK 추가로 ≥ 8), `grep -c '❌' CLAUDE.md` = 11 (Anti-patterns 11 항목)

### TODO-3 — 백업 확인

- **Acceptance**: git log 에 기존 CLAUDE.md 가 보존되어 있음 (`git log --follow CLAUDE.md` 마지막 커밋 확인).
- **Owner**: 본인
- **Evidence**: `git show HEAD:CLAUDE.md | wc -l` → 201 (기존)

### TODO-4 — 신규 CLAUDE.md 자체검증 체크리스트

- [ ] 프론트매터 3 줄 (작성일 / 권위 / 활성 ADR) 존재
- [ ] §1 제품 한 줄 정의 포함 "3 레이어" + "성사 수수료 25%" 언급
- [ ] §2 DoD 5 서브섹션 (2.1~2.5) 존재
- [ ] §3 IN/OUT 표에 F-AUTH~F-SESSION-FEEDBACK 5 IN + F-CEO-COFFEECHAT live-but-out + 6 OUT
- [ ] §4.2 PRD 변경 = "ADR + 48h 쿨다운 재서명" (not 2-hand)
- [ ] §4.5 Prior Work Verification 에 "gh 0-hit 가드" 명시
- [ ] §4.6 Pre-Work Sync 에 "force-with-lease" 명시
- [ ] §5 M1/M2/M3 재선언 없음 + @docs/PROCESS.md §5 링크
- [ ] §6 Sprint 1~4 표 + Velocity Override 1 줄
- [ ] §7.3 에 "AI Brief 월 예산 상한"
- [ ] §8 Backlog Investigation 5 소스 병렬 + gh 0-hit 가드
- [ ] §9 권위순 8 줄 리스트
- [ ] §10 완료 선언 체크리스트 (M1=5, M2=5, M3≤3, Debt 4 closed, Sprint 4 E2E 5 녹색, 48h 쿨다운 재서명)
- [ ] §11 Agent Harness — `~/.claude/CLAUDE.md` + `@docs/roles/HARNESS.md` 링크만
- [ ] §12 환경 & 기술 규칙 (Tech stack / Project structure / Commands / Env vars / DDL 보호 / Routing / Member types / API / Styling / Testing)
- [ ] §13 Anti-Patterns 11 항목 (verbatim)
- [ ] 전체 분량 150~200 줄

---

## 6. New `CLAUDE.md` — Full Draft (Critic 검토 대상)

```markdown
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
- 본 문서는 위 두 SoT 를 **재선언하지 않는다**. 변경이 필요하면 해당 파일을 고치고 여기는 링크만 유지.

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
```

---

## 7. Commit Strategy

1. **Commit 1** (본 plan) — `chore(plan): add CLAUDE.md refactor plan (.omc/plans/vcx-claude-md-refactor.md)`
2. **Commit 2** (VCX_STACK.md 신규 SoT, CLAUDE.md 재작성보다 선행) — `docs(engineering): extract VCX stack/structure/API/style/testing to VCX_STACK.md (L-Std)`
   - CLAUDE.md §12 링크가 가리킬 대상 파일을 먼저 등록, 링크 무결성 보장
3. **Commit 3** (draft 적용, Critic 승인 후) — `docs(claude): refactor CLAUDE.md to VH v2 discipline structure (L-High, 48h cooldown)`
   - PR description 에 "L-High — 48h 쿨다운 대상, 2026-04-23 이후 재서명 merge" 명시
   - Commit 2 가 main 에 있어야 `@docs/engineering/VCX_STACK.md` 링크 dangling 방지
4. **Commit 4** (재서명 merge) — 쿨다운 종료 후 별도 커밋 없이 merge (PR approve → merge)

---

## 8. Success Criteria

- [ ] 본 plan 이 `.omc/plans/vcx-claude-md-refactor.md` 에 저장됨
- [ ] Critic 에이전트가 §6 draft 를 승인
- [ ] 새 CLAUDE.md 가 150~200 줄 lean target 내
- [ ] §9 Authority Chain 8 항목 전부 @링크
- [ ] §13 Anti-Patterns 11 항목 기존 CLAUDE.md 와 바이너리 등가
- [ ] 에이전트 세션 시작 시 Evidence / Prior Work / Pre-Work Sync 규율을 첫 화면에서 마주침
- [ ] 기존 SoT (`@docs/PROCESS.md`, `@docs/plans/VERTICAL_SLICE_PHASE1.md`, `@docs/sdd/FEATURE_MANIFEST.yaml`) 재선언 0 (링크만)
- [ ] 신규 SoT `docs/engineering/VCX_STACK.md` 가 `@docs/engineering/VCX_STACK.md` 링크 대상으로 Commit 2 에서 main 에 존재

### 8.1 자체 검증 (iteration 2 Critic 요구)

§6 draft 에 대해 아래 6 체크 전부 통과 시에만 `PLAN_READY` 재송출:

| # | 체크 | 기대값 | 실측값 (iteration 2 실행 결과) |
|---|---|---|---|
| 1 | `wc -l` (draft only, ```markdown ~ ``` 내부) | 150~200 | **197** — PASS |
| 2 | `grep -cE "M1 = 5\|M2 = 5\|M3 ≤ 3\|M3 <= 3"` on draft | 0 | **0** — PASS |
| 3 | `grep -c "gh 미가용 또는 0-hit"` on draft | ≥ 2 (§4.5 + §8) | **2** — PASS |
| 4 | `grep -E "eab4597\|c08c32c"` on draft | 0 | **0** — PASS |
| 5 | `grep -c "❌"` on draft | = 11 | **11** — PASS |
| 6 | `grep -c "@docs/"` on draft | 이전 iteration 대비 증가 (VCX_STACK 추가분 포함) | **32** — 이전 iteration 대비 증가, PASS |

실측 재확인은 draft 를 `CLAUDE.md` 로 쓴 직후 TODO-2 acceptance 단계에서 재실행.

---

## 9. Handoff

Critic 승인 후 `/oh-my-claudecode:start-work vcx-claude-md-refactor` 로 executor (본 draft 는 `CLAUDE.md` 직접 수정 허용 경로이므로 executor 없이 `Write` 도 가능) 에 인계.

48h 쿨다운 타이머: PR 생성 시점 + 48h (예: 04-21 15:00 → 04-23 15:00 이후 재서명 merge).

PLAN_READY: .omc/plans/vcx-claude-md-refactor.md
