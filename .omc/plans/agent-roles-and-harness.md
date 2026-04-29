# Agent Roles & Harness Definition — ValueConnect X

> Status: DRAFT v2 (consensus REVISE feedback 반영)
> Created: 2026-04-19 | Revised: 2026-04-19
> Owner: Kang Sangmo (1인 팀, 모든 C-role을 1인이 수행 + AI 에이전트 위임)
> Relationship to PROCESS.md: **본 문서는 PROCESS.md의 Annex A** (SoT는 PROCESS, Role 상세는 이곳)
> Anchor files: `docs/PROCESS.md`, `docs/sdd/FEATURE_MANIFEST.yaml`, `docs/prd6.0.md`

## 0. 배경

ValueConnect X는 현재 1인 체제이며, 다음 제약을 가진다:
- 제품 단일: 초대 전용 인재 네트워크 (Phase 1 vertical slice 진행 중)
- 프로세스 SoT: `docs/PROCESS.md` (L-Std/L-High 2등급, 48h 쿨다운, Feature Manifest, Vertical Slice)
- 스킬 인프라: `skills/SKILL-*.md` 6개, OMC agent 30종 (`~/.claude/plugins/cache/omc/oh-my-claudecode/4.2.15/agents/`)

**현 상황 점검 결과:**
1. 역할별 책임·권한·산출물 경계가 문서화되지 않음 → 의사결정 주체 모호
2. 역할별 "Harness"(실행 환경, 검증 도구, 품질 게이트) 정의 없음 → 작업 ad-hoc
3. OMC agent와 VCX C-role의 매핑 미정의
4. 역할 간 인터페이스(input/output, 핸드오프) 미정의
5. **책임 공백 3곳**: Growth/Marketing, Security/Compliance, AI Prompt Ownership

## 1. 요구사항 Summary

6개 C-role(CEO, CPO, CTO, CDO, DevOps/SRE, Chief Designer)에 대해 9개 차원을 정의하고 현 구성 상태를 점검한다.

| 차원 | 내용 |
|------|------|
| Mission | 단일 문장 목표 |
| Scope (owns) | 의사결정 권한 |
| Non-Scope (owned by) | 이 역할이 책임지지 **않는** 것 + 실제 owner |
| Inputs | 입력 신호·문서·지표 |
| Outputs | 산출물 규격 (경로, 포맷, 주기) |
| Harness | OMC agent(정확한 파일명 + model 파라미터) + skill + tool + 파일 루트 |
| Verification | 검증 도구 |
| Quality Gates | 자동 측정 가능한 최소 기준 |
| Current State | ✅ 완비 / ⚠️ 부분 / ❌ 결여 (파일·라인 인용) |
| Gap Actions | 결여 요소 action items (ID + 우선순위) |

## 2. Acceptance Criteria (testable, 2-track)

**Track A — 본 계획의 산출물 검증 (즉시 측정 가능):**
- [ ] AC-1: `docs/roles/` 디렉토리 생성, 6개 role 파일(`CEO.md`, `CPO.md`, `CTO.md`, `CDO.md`, `SRE.md`, `DESIGNER.md`) 존재
- [ ] AC-2: 각 role 파일이 9개 차원(§1)을 H2 섹션으로 모두 포함 — 검증: `grep -c '^## ' docs/roles/*.md` 각 ≥ 9
- [ ] AC-3: `docs/roles/HARNESS.md` 매트릭스(role ↔ OMC agent ↔ skill ↔ quality gate) 존재
- [ ] AC-4a: 각 role 파일의 "Current State" 섹션에서 **현존 자산**을 인용할 때 `경로:라인` 패턴으로 기재 (검증: `grep -E '\([a-zA-Z_/.-]+:[0-9]+\)' docs/roles/*.md | wc -l ≥ 12` — role당 2개 이상)
- [ ] AC-4b: **결여 자산**은 Gap ID(G01~G17)로 tracking, role 파일과 `docs/roles/GAP-LEDGER.md` 쌍방향 링크
- [ ] AC-5: `scripts/role-harness-check.sh` 실행 시:
  - 모든 role 산출물 경로 존재 → exit 0
  - 1개 이상 결여 → exit 1 (결여 목록 stdout)
  - 형식 위반(H2 섹션 < 9) → exit 2
- [ ] AC-6: `docs/PROCESS.md`에 "Annex A: Role-Harness" 섹션이 추가되어 `docs/roles/`를 참조
- [ ] AC-7: `docs/roles/HARNESS.md` 및 각 role 파일(`docs/roles/{CEO,CPO,CTO,CDO,SRE,DESIGNER}.md`)의 Harness 블록에 나열된 모든 OMC agent 이름이 OMC agents 디렉토리에 실존 (smoke check는 glob `$HOME/.claude/plugins/cache/omc/oh-my-claudecode/*/agents/` 또는 `OMC_AGENT_DIR` env 변수 사용, 버전 하드코딩 금지)

**Track B — Gap Actions 완료 기준 (장기, 각 Gap마다 acceptance 개별 정의):**
- Track B는 `docs/roles/GAP-LEDGER.md`에서 관리. 본 계획의 승인 조건은 Track A만.

## 3. Role Definitions

### 3.1 CEO
- **Mission:** 주주가치 극대화. VCX가 시장에서 최고의 포지셔닝을 갖도록 의사결정·방향설정.
- **Scope (owns):** PRD major 변경, 신규 버티컬 진출, 수익 모델, 투자, 브랜드 톤, **Growth 거시전략**(누구를 대상으로 무엇을)
- **Non-Scope (owned by):**
  - Sprint/리소스 → CPO
  - 랜딩페이지 문구·부스 스크립트·뉴스레터 실행 → CPO (tactical execution)
  - 기술 스택 → CTO
  - AI Brief 모델·비용 모니터링 → CTO (실행) + CEO는 비용 한도만 승인
- **Inputs:** 시장 조사(Y Combinator, LinkedIn Premium, Lunchclub, Polywork, Pallet), 재무(런레이트, Vercel/Supabase/Anthropic API 사용량), 북극성 지표(WAU, Coffee Chat Completed, NPS)
- **Outputs:**
  - `docs/strategy/ceo-memo-YYYYMM.md` (월간)
  - `docs/strategy/market-scan-YYYYMM.md` (분기)
  - ADR (PRD/Manifest 변경 시 `docs/prd/ADR/ADR-NNNN-*.md`, L-High)
- **Harness:**
  - OMC agent: `planner` (`model=opus`) + `scientist` (`model=opus`, 시장 데이터 분석)
  - Tool: WebSearch, WebFetch, context7
  - 파일 루트: `docs/strategy/`
- **Verification:** 북극성 KPI 대비 월간 진척도; ADR이 PROCESS.md §1.2 규칙 준수
- **Quality Gates:**
  - Memo는 ≥3 reference 인용
  - ADR은 PROCESS.md §1.4 L-High 쿨다운(48h) 적용
  - 비용 한도 변경은 ADR 필수 (L-High)
- **Current State:** ❌ `docs/strategy/` 없음 (Gap G01). ADR 규칙은 `docs/PROCESS.md:40-45`에 존재. ADR 디렉토리 `docs/prd/ADR/README.md:1` 존재하나 실제 ADR 파일 0개.
- **Gap Actions:** G01 (`docs/strategy/` + 첫 memo 템플릿, P1), G02 (ADR-0001~0005 소급 작성, P0, 기한 2026-04-24)

### 3.2 CPO (Chief Product Officer)
- **Mission:** CEO 의도를 제품으로 구현. Scope·자원·문서·법규·결제·채용·Growth 실행의 책임자.
- **Scope (owns):** Sprint 범위, PRD 세부 조항, 랜딩페이지/부스/뉴스레터 문구, 결제 모듈 스펙, 법률/규제 증빙, 외부 채용, **AI Brief 제품 스펙**(무엇을 보여줄지)
- **Non-Scope (owned by):**
  - 코드 구현 → CTO
  - 데이터 모델 → CDO
  - 시각 디자인 → Chief Designer
  - AI Brief 런타임(모델 선택, 프롬프트 튜닝, 비용) → CTO
  - 배포/운영 → SRE
- **Inputs:** PRD `docs/prd6.0.md`, `docs/prd6.1.md`; `docs/sdd/FEATURE_MANIFEST.yaml:1-200`; 법률(PIPA, 전자상거래법, 통신판매업); PG사 계약
- **Outputs:**
  - `docs/prd/ADR/ADR-NNNN-*.md` (L-High)
  - `docs/sdd/FEATURE_MANIFEST.yaml` 업데이트 (L-High)
  - `docs/legal/` (개인정보처리방침, 이용약관, 특정 규제 증빙)
  - `docs/hiring/ROLES-NEEDED.md`
  - `docs/plans/sprint-*.md`
- **Harness:**
  - OMC agent: `product-manager` (`model=sonnet`) + `document-specialist` + `writer` + `information-architect`
  - Skill: 모든 `skills/SKILL-*.md` 준수 (primary owner는 CTO/Designer/CDO, CPO는 enforcer)
  - 파일 루트: `docs/prd/`, `docs/plans/`, `docs/legal/`, `docs/hiring/`
- **Verification:**
  - `scripts/prd-freeze-check.sh` (PROCESS.md §1.3) — **현 상태 부재, G05로 P0 처리**
  - 법률 증빙: 외부 변호사 1회 리뷰 + ADR
- **Quality Gates:** 결정은 ADR로 닫힘 / Feature는 Manifest 등록 시만 구현 / 법률 문서는 `docs/legal/CHECKLIST.md` 전체 체크
- **Current State:** ⚠️ PRD/Manifest 존재(`docs/prd6.0.md:1`, `docs/sdd/FEATURE_MANIFEST.yaml:1`), PROCESS `docs/PROCESS.md:38-47` 존재. `docs/legal/`, `docs/hiring/`, `scripts/prd-freeze-check.sh` 결여 (ls 검증 완료).
- **Gap Actions:** G03 (`docs/legal/CHECKLIST.md` + 템플릿, P1), G04 (`docs/hiring/ROLES-NEEDED.md`, P2), G05 (`scripts/prd-freeze-check.sh` **P0**), G06 (결제 모듈 ADR, P1)

### 3.3 CTO
- **Mission:** 서비스가 이상 없이 동작. TDD Input/Output 정의, 리팩터링·E2E·품질 총괄.
- **Scope (owns):** 아키텍처 변경, 기술 스택, DDL, 외부 API 구현, 테스트 전략, **AI Brief 런타임**(모델 선택, 프롬프트 튜닝, 비용 최적화), **코드 수준 보안**
- **Non-Scope (owned by):**
  - 제품 스펙 → CPO
  - 데이터 정합성·ERD·RLS 정책 기획 → CDO
  - 배포 파이프라인·SLO → SRE
  - 디자인 토큰 변경 → Chief Designer (CTO는 enforce)
- **Inputs:** FEATURE_MANIFEST의 AC, `docs/sdd/contracts/`, `docs/sdd/schemas/`, 기존 코드(`src/**`)
- **Outputs:**
  - ADR (아키텍처, L-High)
  - `src/__tests__/**` (Vitest)
  - `e2e/**` (Playwright)
  - `supabase/migrations/NNN_vcx_*.sql`
  - `docs/sdd/DEBT_LEDGER.md` 업데이트
- **Harness:**
  - OMC agent: `architect` (`model=opus`) + `test-engineer` + `qa-tester` + `verifier` + `build-fixer` + `code-reviewer` + `security-reviewer`
  - Skill (**owner**):
    - `skills/SKILL-testing-vitest.md` (owner: CTO)
    - `skills/SKILL-supabase-ssr.md` (owner: CTO)
    - `skills/SKILL-api-route-convention.md` (owner: CTO)
    - `skills/SKILL-supabase-migration.md` (owner: CDO, CTO enforces)
    - `skills/SKILL-zod-validation.md` (owner: CTO)
    - `skills/SKILL-vcx-design-system.md` (owner: Chief Designer, CTO enforces)
  - TDD: **Iron Law — No production code without failing test first**
  - 파일 루트: `src/`, `e2e/`, `supabase/migrations/`
- **Verification:** `npm run build` / `npm run lint` / `npm test` / `npm run test:e2e` 전부 green + `code-reviewer` pass
- **Quality Gates:** 4 gates green 후 merge / DDL은 `supabase/migrations/` 파일만 (CLAUDE.md) / `rounded-*` grep 0 / border-radius 0 전역
- **Current State:** ✅ 완비. `package.json:1` commands 존재, `supabase/migrations/` 존재(15개 파일 + 중복 2쌍), `src/__tests__/` 존재, `e2e/` 존재, 6개 skill 전량 존재(`skills/SKILL-*.md`).
- **Gap Actions:** G07 (`scripts/ci-local.sh` 4게이트 단일 커맨드, P1), G08 (`e2e/COVERAGE.md`, P2)

### 3.4 CDO (Chief Data Officer)
- **Mission:** 인프라·데이터 파이프라인·정합성·최적화·설계. 데이터 품질 책임.
- **Scope (owns):** 데이터 모델, 인덱스 전략, 파이프라인 아키텍처, 데이터 보관 정책(PIPA), **RLS 정책 기획**, PII 인벤토리
- **Non-Scope (owned by):**
  - Migration 파일 실제 작성 → CTO (CDO 설계 → CTO 구현)
  - 애플리케이션 보안(OWASP) → CTO
  - 인프라 비용·SLO → SRE
- **Inputs:** `supabase/migrations/**`, `docs/sdd/schemas/**`, Supabase dashboard 메트릭, 제품 analytics
- **Outputs:**
  - `docs/sdd/schemas/*.yaml` (Zod/SQL 단일 정의)
  - `docs/data/ERD-YYYYMMDD.md`
  - `docs/data/PII-INVENTORY.md` (PIPA 연동)
  - `docs/data/RETENTION-POLICY.md`
- **Harness:**
  - OMC agent: `scientist` (`model=opus`) + `architect` (schema 설계) + `executor` (migration 구현)
  - Tool: `mcp__plugin_oh-my-claudecode_t__python_repl`, Supabase SQL Editor
  - Skill: `skills/SKILL-supabase-migration.md` (**CDO = primary owner**), `skills/SKILL-supabase-ssr.md`
  - 파일 루트: `supabase/migrations/`, `docs/data/`, `docs/sdd/schemas/`
- **Verification:** Migration dry-run on local Supabase / RLS 테스트(`src/__tests__/rls/**`, 현재 부재) / EXPLAIN ANALYZE
- **Quality Gates:**
  - Migration 번호 중복 금지 (자동 grep)
  - 모든 PII 컬럼은 RLS + audit log
  - 신규 테이블은 `created_at`, `updated_at` 필수
- **Current State:** ⚠️ `supabase/migrations/` 존재, `docs/sdd/schemas/` 존재(`docs/sdd/FEATURE_MANIFEST.yaml:1`). **Migration 013/014 중복 4개 파일 실측 확인** (`013_vcx_head_hunting_agreement.sql`, `013_vcx_notifications_insert_policy.sql`, `014_vcx_community_reactions.sql`, `014_vcx_profile_visibility.sql`). `docs/data/` 전부 결여.
- **Gap Actions:** G09 (`docs/data/ERD.md`, P1), G10 (`docs/data/PII-INVENTORY.md` **P0** — PIPA), G11 (Migration rename ADR + supabase_migrations 테이블 sync 절차 + rename script, **P0**)

### 3.5 DevOps / SRE
- **Mission:** 서비스 안정 운영. 지표 대시보드로 목표 달성.
- **Scope (owns):** 배포 게이트, 인시던트 대응, 모니터링 임계치, SLO/에러 예산, **런타임 보안 경보**
- **Non-Scope (owned by):**
  - 코드 수정 → CTO
  - Schema 변경 → CDO
  - 법률 이벤트(PIPA 고지) → CPO
- **Inputs:** Vercel 배포 로그, Supabase 로그, Upstash 로그, Sentry 에러, SLO 타겟
- **Outputs:**
  - `docs/ops/runbooks/**`
  - `docs/ops/SLO.md`
  - `docs/ops/DEPLOY-CHECKLIST.md`
  - `.github/workflows/*.yml`
  - `scripts/ops/*.sh`
- **Harness:**
  - OMC agent: `executor` + `verifier`
  - Tool: Vercel CLI, Supabase CLI, `mcp__sentry__*`
  - 파일 루트: `docs/ops/`, `scripts/ops/`, `.github/workflows/`
- **Verification:** 배포 후 smoke test / SLO daily 리뷰 / Sentry 임계치 alert
- **Quality Gates:** Production = main only / Preview smoke test pass 후 merge / Rollback plan 있는 migration만 merge
- **Current State:** ⚠️ `docs/ops/runbooks/` 존재(3개 runbook), Sentry 계측 2곳 존재 — `instrumentation-client.ts` (프로젝트 루트), `src/instrumentation.ts`. `docs/ops/SLO.md`, `docs/ops/DEPLOY-CHECKLIST.md`, `scripts/ops/` 전부 결여 (실측 `scripts/` 목록: apply-migrations.sql, create-account-direct.ts, create-invite.ts, health-check-cron.sh, orchestrator.sh, seed-*.ts만 존재).
- **Gap Actions:** G12 (`docs/ops/SLO.md` **P0**), G13 (`scripts/ops/smoke-test.sh`, P1), G14 (`docs/ops/DEPLOY-CHECKLIST.md`, P1)

### 3.6 Chief Designer
- **Mission:** 시장에서 통용되는 균형 잡힌 디자인. 모든 페이지 통일된 디자인 체계 준수.
- **Scope (owns):** 디자인 토큰, 컴포넌트 라이브러리, 브랜드 가이드, 모바일 퍼스트 규율, **스크린샷 매트릭스 관리**
- **Non-Scope (owned by):**
  - 컴포넌트 구현 → CTO
  - 디자인 린트 자동화 런타임 → SRE (CI 통합)
  - 브랜드 톤 거시결정 → CEO
- **Inputs:** `src/constants/site.ts` (DESIGN_TOKENS), `docs/Branding.md`, `docs/vcx-design-review.md`, `docs/figma-design-prompt.md`, 모바일 360px 기준
- **Outputs:**
  - `src/components/ui/**`
  - `docs/design/DESIGN-SYSTEM.md` (단일 진실)
  - `docs/design/COMPONENT-INVENTORY.md`
  - Figma 업데이트 기록
- **Harness:**
  - OMC agent: `designer` + `style-reviewer` + `ux-researcher` + `vision` (스크린샷 리뷰)
  - Skill: `skills/SKILL-vcx-design-system.md` (**Designer = primary owner**)
  - Tool: `mcp__playwright__browser_take_screenshot`, `mcp__magic__21st_magic_component_builder`
  - 파일 루트: `src/components/ui/`, `src/constants/`, `docs/design/`
- **Verification:** 스크린샷 매트릭스(`qa/screenshots/YYYYMMDD/`) / Design token grep / Galaxy 360px viewport
- **Quality Gates:**
  - `rg "rounded-" src/` 결과 0 (제외: `rounded-none`)
  - 하드코딩 색상 금지 — `DESIGN_TOKENS` 참조
  - 영어 UI 텍스트 금지
  - 모바일 360px overflow 없음
- **Current State:** ⚠️ `src/components/ui/`, 디자인 토큰(`src/constants/site.ts:1`), 브랜드 문서(`docs/Branding.md:1`), `docs/vcx-design-review.md:1`, `docs/figma-design-prompt.md:1` 존재. `docs/design/` 통합 문서 전체 결여.
- **Gap Actions:** G15 (`docs/design/DESIGN-SYSTEM.md` **P0**), G16 (`docs/design/COMPONENT-INVENTORY.md` + 자동 추출 script, P1), G17 (`scripts/design-lint.sh` — `rg "rounded-[a-z]" src/ | grep -v rounded-none`, P1)

## 4. Gap Priority Matrix (Track B 관리)

| Gap | 제목 | Owner | 우선순위 | 기한 | Phase 1 slice 방해? |
|-----|------|-------|---------|------|------------------|
| G01 | `docs/strategy/` | CEO | P1 | Sprint 2 | No |
| G02 | ADR-0001~0005 소급 | CEO/CPO | **P0** | **2026-04-24** | Yes (PROCESS §1.2 기한) |
| G03 | `docs/legal/CHECKLIST.md` | CPO | P1 | 2026-05-10 | No |
| G04 | `docs/hiring/ROLES-NEEDED.md` | CPO | P2 | Sprint 3 | No |
| G05 | `scripts/prd-freeze-check.sh` | CPO | **P0** | 2026-04-22 | Yes (PROCESS §1.3 전제) |
| G06 | 결제 모듈 ADR | CPO | P1 | Sprint 2 | No |
| G07 | `scripts/ci-local.sh` | CTO | P1 | Sprint 2 | No |
| G08 | `e2e/COVERAGE.md` | CTO | P2 | Sprint 3 | No |
| G09 | `docs/data/ERD.md` | CDO | P1 | Sprint 2 | No |
| G10 | PII inventory | CDO | **P0** | 2026-05-01 | Yes (PIPA 컴플라이언스) |
| G11 | Migration rename ADR + sync | CDO | **P0** | 2026-04-26 (하드 게이트: **다음 production deploy 전**) | Yes (deploy 리스크) |
| G12 | `docs/ops/SLO.md` | SRE | **P0** | 2026-04-26 | Yes (error budget 근거) |
| G13 | `scripts/ops/smoke-test.sh` | SRE | P1 | Sprint 2 | Partial |
| G14 | `docs/ops/DEPLOY-CHECKLIST.md` | SRE | P1 | Sprint 2 | No |
| G15 | `docs/design/DESIGN-SYSTEM.md` | Designer | **P0** | 2026-04-26 | Yes (Feed UI 작업 전) |
| G16 | Component inventory | Designer | P1 | Sprint 2 | No |
| G17 | `scripts/design-lint.sh` | Designer | P1 | Sprint 2 | No |

**P0 (6개) = 2026-04-19 ~ 2026-05-01 내 처리 필수.**

## 5. Implementation Steps (본 계획의 실행)

| # | 단계 | 파일 | 에이전트 | 소요 |
|---|------|------|---------|------|
| S1 | `docs/roles/` 디렉토리 + 6 role md + README | `docs/roles/{CEO,CPO,CTO,CDO,SRE,DESIGNER}.md`, `docs/roles/README.md` | writer | 40분 |
| S2 | `docs/roles/HARNESS.md` 매트릭스 (agent 이름 smoke check 포함) | `docs/roles/HARNESS.md` | writer | 30분 |
| S3 | `docs/roles/GAP-LEDGER.md` (§4 표 포함) | `docs/roles/GAP-LEDGER.md` | writer | 15분 |
| S4 | `scripts/role-harness-check.sh` (exit 0/1/2 구현) | `scripts/role-harness-check.sh` | executor | 45분 |
| S5 | `docs/PROCESS.md` Annex A 추가 | `docs/PROCESS.md` | writer | 15분 (L-High 48h 쿨다운 적용) |
| S6 | 검증: `bash scripts/role-harness-check.sh` exit 0 | — | verifier | 10분 |
| S7 | 본 계획 자체의 L-High 48h 쿨다운 타이머 시작 → 만료 후 Owner(Kang Sangmo, CPO 역할) 재서명 + merge | — | self-approve (1인팀, R8으로 echo 위험 관리) | 대기 48h + 재서명 5분 |

**합계: 활성 작업 ~2시간 30분 + 48h 쿨다운 대기.** Phase 1 slice 시간 침범 최소화.

**별도 트랙(Gap 처리):** P0 6개는 본 계획 머지 이후 별도 plan으로 진행.

## 6. Risks & Mitigations

| Risk ID | Risk | Impact | Likelihood | Mitigation |
|---------|------|--------|------------|-----------|
| R1 | 1인 팀이 6 role 컨텍스트 스위칭 시 일관성 상실 | High | High | 작업 시작 시 `docs/roles/<ROLE>.md`를 명시 로드 + 세션 note에 `role=X` pin |
| R2 | OMC agent 이름 버전 업그레이드 시 깨짐 | Med | Med | `scripts/role-harness-check.sh`가 agent 디렉토리 smoke check 포함 |
| R3 | G02 ADR 5개 × 48h 쿨다운이 2026-04-24 기한과 수학적 충돌 | High | High | ADR-0001~0005 **5건을 2026-04-19 당일 단일 배치로 초안**. 5건이 **동일 쿨다운 타이머 공유**(배치 타이머 규칙, PROCESS.md Annex A §A.2에 명문화). 쿨다운 종료 2026-04-21 20:00 → 재서명 + 일괄 merge 2026-04-22 → 기한(04-24) 이전 완료. 단, 각 ADR이 서로 독립적 결정 사안인 경우 배치 묶기 부적절 → 그 경우 긴급트랙(PROCESS §1.1 Legal Blocker/User Harm/Cost Explosion) 해당 여부 검토 후 면제 적용 |
| R4 | Gap 처리가 Phase 1 slice(VERTICAL_SLICE_PHASE1) 일감 잠식 | High | Med | P0 6개만 즉시, P1/P2는 Sprint 2+로 명시 분리 (§4 표) |
| R5 | 본 계획 자체가 L-High 48h 쿨다운 위반 | Med | Low | §5 S7로 쿨다운 타이머 명시, 타이머 완료 전 merge 금지 |
| R6 | `scripts/prd-freeze-check.sh` 부재로 PROCESS §1.3 미작동 | High | High (현재 진행 중) | G05를 P0로 격상, S1~S6 이후 즉시 작업 |
| R7 | Migration 013/014 중복이 원격 DB와 divergence 유발 | High | Med | G11에 supabase_migrations 테이블 sync 절차 명시 — production에 이미 적용됐는지 SELECT 확인 후 rename 전략 결정 |
| R8 | Self-review echo chamber (본인이 6 role 전부 승인) | Med | High | 본 계획의 role 정의는 L-High 취급, Scope 변경 시 48h 쿨다운 강제 |

## 7. Verification Steps

1. `ls docs/roles/` → 6개 role md + HARNESS.md + GAP-LEDGER.md + README.md 존재
2. `for f in docs/roles/{CEO,CPO,CTO,CDO,SRE,DESIGNER}.md; do [ $(grep -c '^## ' "$f") -ge 9 ] || echo "FAIL: $f"; done` → 출력 없음
3. `bash scripts/role-harness-check.sh` → exit 0
4. `grep -q "Annex A" docs/PROCESS.md` → match
5. Agent 이름 smoke check: `AGENT_DIR=$(ls -d $HOME/.claude/plugins/cache/omc/oh-my-claudecode/*/agents 2>/dev/null | sort -V | tail -1); for a in planner scientist product-manager architect test-engineer qa-tester verifier build-fixer code-reviewer security-reviewer executor designer style-reviewer ux-researcher vision document-specialist writer information-architect; do [ -f "$AGENT_DIR/$a.md" ] || echo "MISSING: $a"; done` → 출력 없음 (glob으로 버전 하드코딩 회피)
6. `npm run build && npm run lint && npm test` → CTO harness 동작 검증
7. `oh-my-claudecode:code-reviewer` 리뷰 → 승인

## 8. Out of Scope (명시)

- OMC agent 코드 수정 — 기존 agent 조합 매핑만
- `docs/legal/` 실제 법률 문서 내용 — 템플릿·체크리스트만, 실 내용은 변호사 필요
- 결제 모듈 구현 — ADR 스펙만, 구현은 별도 plan
- Phase 2 이후 채용 실행 — JD 문서까지만
- Gap Actions P0~P2 실제 처리 — 본 계획은 인프라 정의만, Gap 처리는 별도 plan 분기
- 기존 PROCESS.md의 L-Std/L-High 2등급 체계 변경 — 본 계획은 기존 체계 위에 구축

## 9. Open Questions (승인 전 해소 필요)

- **Q1 (해소):** role 문서의 L-등급? → **L-High**로 취급 (Scope 변경 시 48h 쿨다운 적용, R8 대응)
- **Q2:** CEO/CPO 의사결정을 에이전트 위임 시 승인 루프를 자동화? → 본 계획 범위 밖, Sprint 3에서 결정
- **Q3 (해소):** 17개 Gap 중 Phase 1 slice 비방해 몇 개? → §4 표에서 "No" 11개, "Yes/Partial" 6개 분류 완료

---

## Changelog

- 2026-04-19 v1: 초안 작성 (Planner)
- 2026-04-19 v3: iteration 2 개선사항 적용
  - AC-7에 "role 파일 Harness 블록 포함" + agent 디렉토리 glob 명시
  - G11에 "다음 production deploy 전" 하드 게이트 추가
  - R3 타이머 정책 명문화: 5 ADR 배치 초안 = 단일 쿨다운 공유, Annex A §A.2로 규칙화
  - S7 approver 명시(self-approve + R8 echo 위험 관리)
  - 검증 단계 §7-5 agent smoke을 glob으로 변경
- 2026-04-19 v2: consensus REVISE 피드백 반영
  - Agent 이름 정정: `scientist-high`→`scientist`+`model=opus`, `product-analyst`→`product-manager`, `information-architect` 추가
  - 책임 공백 3곳 봉합: Growth(CEO거시/CPO실행), Security(CTO코드/CDO데이터/SRE런타임), AI Brief(CPO스펙/CTO런타임) — Non-Scope 섹션 신설
  - L-등급 PROCESS.md와 정합: 본 계획 = L-High, role 문서 = L-High, Scope 변경 시 48h 쿨다운
  - Migration 013/014 중복 **실측 확인** (4파일), G11 확장(rename + sync 절차)
  - Sentry 경로 정정: 루트 `instrumentation-client.ts` + `src/instrumentation.ts` 2개 실존
  - Skills owner 메타 추가 (CTO/Designer/CDO primary owner 명시)
  - `scripts/prd-freeze-check.sh` 부재 확인, G05 **P0** 격상
  - AC-4 2-track 분리 (Track A 즉시 측정 + Track B Gap 장기)
  - AC-5 exit code 스펙 (0/1/2) 명시
  - AC-7 신규: agent 이름 smoke check
  - Gap Priority Matrix(§4) 신규: P0 6개 날짜 명시
  - HARNESS.md를 PROCESS.md Annex A로 재위치
  - S4 시간 예산 수정: ADR 소급은 별도 트랙으로 분리, 본 계획 활성 작업 ~2.5h + 48h 쿨다운
  - R3 신규: ADR 타이밍 수학적 충돌 해소안
