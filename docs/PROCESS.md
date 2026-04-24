# ValueConnect X 개발 프로세스 규칙 (Process SoT)

> 일자: 2026-04-17 ∙ 버전: 1.0 ∙ 승인: 1-hand + 48h 쿨다운 재서명
> 상위 문서: `docs/engineering/2026-04-17-process-review.md`
> 본 문서는 P-1~P-5 (VCX 버전) 구조 문제를 **규칙·게이트·측정**으로 봉합하는 단일 진실.
> 이 파일을 수정하려면 ADR + 자기 서명 + 48h 쿨다운 재서명 필수.

---

## 1. PRD 변경 정책 (P-1 해결 — PRD 축소 루프 방지)

### 1.1 "논의 자유, 결정은 ADR로 닫는다"
- **논의는 언제든 가능.** 문서·에이전트 세션·본인 메모 어디서든 v6.0 대안을 제기할 수 있다.
- **그러나 현 결정은 교체될 때까지 유효.** `docs/prd-6.0.md`의 모든 결정은 새 ADR이 서명으로 닫히기 전까지 모든 코드·UI·문서에 대한 유일한 진실이다.
- **수정 방법 = ADR 작성 + 자기 서명 + 48h 쿨다운 재서명.**
- **긴급 트랙** (쿨다운 면제) 3개:
  1. **Legal Blocker** — 법률 리스크 확인 (PIPA, 개인정보)
  2. **User Harm** — 출시 시 사용자 피해 가능성
  3. **Cost Explosion** — API(Anthropic, Supabase, Vercel, Upstash) 비용이 월 예산의 150% 초과

### 1.2 ADR (Architecture Decision Record) 강제
- `docs/prd/ADR/` 디렉토리에 append-only.
- 번호: `ADR-NNNN-kebab-title.md`. 한 번 매긴 번호는 재사용 금지.
- Template: `docs/prd/ADR/README.md`.
- Sprint 1 내 작성할 소급 ADR-0001 ~ ADR-0005 (작성 기한 **2026-04-24**):
  - ADR-0001: 수수료 구조 멤버 비노출
  - ADR-0002: CEO 커피챗 = 컬쳐핏 확인
  - ADR-0003: AI Brief = Peer Coffee Chat 공식 하위 피처
  - ADR-0004: PRD v6.0이 단일 기준, v4.1.3 / v5.1 아카이브
  - ADR-0005: Domain Expert Routing + RLVR은 VCX 제품 아님

### 1.3 PRD 드리프트 방지
- `scripts/prd-freeze-check.sh` — pre-commit hook. `docs/prd-6.0.md` 수정 시 동일 커밋에 **ADR 파일 추가 없으면 block**.
- 하위 모듈 문서(추후 `docs/prd/` 분해될 경우)는 ADR이 트리거한 경우에 한해 함께 수정 허용.
- 커밋 메시지에 `BREAKS: prd6.0` 또는 `ADR: NNNN` 명시.

### 1.4 "Two-Hand Commitment" — 1인 팀 변형
- 1인 체제에서 2인 서명 불가능하므로 **48h 쿨다운 재서명** 으로 대체.
- 규칙:
  - `L-High` 변경(PRD/PROCESS/ADR/FEATURE_MANIFEST)은 **PR 생성 → 최소 48시간 merge 보류 → 재서명 후 merge**.
  - 쿨다운 중 본인이 번복하고 싶어지면 → 해당 변경 abort.
  - 쿨다운을 넘어선 재서명 = "이 변경은 48시간 지나도 여전히 옳다"는 증거.

---

## 2. Scope 관리 (P-2, P-4 해결 — 정체성 미결 + DoD 부재)

### 2.1 Feature Manifest
- `docs/sdd/FEATURE_MANIFEST.yaml` = **Phase 1 scope의 유일한 원천**.
- PRD v6.0에 선언된 feature 중 manifest에 없는 것은 **"Phase 1 밖"** 으로 취급.
- Phase 1 기간(2026-04-17 → 2026-05-15) manifest 변경 금지. 변경 시 §1.4 48h 쿨다운.

### 2.2 Creep/Churn 차단
- 신규 feature 제안: `docs/plans/_backlog/ideas.md` 단일 파일에만 기록. Manifest 진입은 Sprint 5+.
- 기존 feature UI 노출 중단 결정: **ADR 필수** (예: 이미 구현된 페이지를 GNB에서 내릴 때).
- **기존 코드는 삭제하지 않는다** — UI/라우팅에서 분리만. Phase 1 종료 후 일괄 정리.

### 2.3 "두 우주 분리" (P-3 해결)
- VCX 제품 plan = `docs/plans/**`
- 개발 도구 plan (OMC skills, 에이전트 설정, Claude Code 확장) = `~/.claude/skills/` 또는 별도 저장소
- `.omc/plans/` 는 VCX 제품 plan의 legacy location이다. 2026-04-24까지 `docs/plans/`로 통합 이관.
- 두 우주를 섞은 커밋은 revert 대상.

---

## 3. Vertical Slice 규율 (P-4 해결 — DoD 부재)

### 3.1 The Slice
- Phase 1 목표 = **"인재 로그인 → 큐레이션 피드 → 디렉토리 열람 → 커피챗 신청 (AI Brief 포함) → 세션 후 피드백"**.
- 상세: `docs/plans/VERTICAL_SLICE_PHASE1.md`.
- 이 슬라이스에 기여하지 않는 코드는 Phase 1 내 머지 불가 (기존 유지보수 제외).

### 3.2 "Connect First, Build Second"
- VCX는 앞단이 풍부함 — 새 페이지를 더 만들지 않는다.
- 다음 4주 코드 line은 **"기존 페이지 ↔ v6.0 PRD"를 잇는 glue** 와 **Feed(v6.0 §2 Feature 1) 단일 신규** 만.
- 신규 페이지 추가는 Sprint 5+.

### 3.3 Slice Daily Check
매일 작업 시작 시 3개 질문에 답할 수 없으면 작업 중단:
1. 오늘 작업이 Slice의 어느 스텝에 닿나?
2. 오늘 작업 후 E2E 테스트가 1단계 더 지나가나?
3. Slice 밖이면 — 왜?

---

## 4. Authorization Matrix (ValueHire §4 변형)

### 4.1 권한 3단계

| 레벨 | 승인자 | 대상 |
|---|---|---|
| **L-Lite** | 본인 | 테스트, 스타일, 리팩터, 문서 오탈자, deps patch bump |
| **L-Std** | 본인 + 자동 CI | 신규 파일, Supabase migration, API 엔드포인트, UI 신규 페이지, deps minor bump |
| **L-High** | 본인 + 48h 쿨다운 | PRD/PROCESS/MANIFEST/ADR, 법률·PII·결제, deps major bump, 외부 API 계약 |

### 4.2 `.omc/plans/` 게이트 재설정
- 이전: 각 plan마다 무정형 승인
- 신규: **PR-level 승인으로 교체**. plan은 `docs/plans/` 로 이동된 것만 유효.
- 기존 plan 중 "사용자 확인 대기" 상태 (예: `ai-ops-agent.md` §"상태: 사용자 확인 대기") — 본 PROCESS 서명 후 자동 dismiss. 재제안은 `docs/plans/_backlog/ideas.md` 로.

### 4.3 "침묵의 승인" 금지
- 승인 = PR 코멘트 `LGTM` 또는 GitHub approve.
- 48시간 무응답 시 `L-Lite`에 한해 자동 approve.
- `L-Std`, `L-High`는 자동 approve 불가.

---

## 5. 측정 (P-5 해결 — 알면서도 닫히지 않는 것들)

### 5.1 Weekly Metrics (3개)

| 지표 | 정의 | 측정 방법 |
|---|---|---|
| **M1 Slice Pages Green** | `docs/plans/VERTICAL_SLICE_PHASE1.md` 5 스텝 중 Acceptance 충족 + E2E 통과 수 | `scripts/weekly-metrics.sh` + Playwright artifact |
| **M2 ADR Closed** | §1.2의 ADR-0001~0005 중 서명 완료 수 | `docs/prd/ADR/*.md` 카운트 |
| **M3 Plan Active Count** | `docs/plans/**/*.md` + `.omc/plans/**/*.md` 활성 (archive 제외) 수 | `find ... \| wc -l` |

Phase 1 DoD: **M1 = 5, M2 = 5, M3 ≤ 3**.
미달 시 Phase 2 착수 금지.

### 5.2 Debt Ledger
- `docs/sdd/DEBT_LEDGER.md` — 기술부채 단일 장부.
- 매 커밋에서 부채를 추가하는 경우 ledger append 강제 (pre-commit hook).
- 초기 항목 (Sprint 1 내 해소 대상):
  - D-0001: Migration 013·014 중복 번호
  - D-0002: Migration 019 실적용 검증 미완
  - D-0003: Branding 일관성 질문 5주 미해결
  - D-0004: 프로필 완성도 기준 미결 (linkedin_url 필수 여부)

### 5.3 Telemetry 최소 셋업
- Sprint 2 내 PostHog 무료 tier + Supabase logs 통합.
- 핵심 이벤트 6개만 Phase 1 계측:
  1. `login_success`
  2. `onboarding_complete`
  3. `feed_item_click`
  4. `coffeechat_request_submit`
  5. `ai_brief_viewed`
  6. `session_feedback_submit`

### 5.4 Weekly Finish Ritual
매주 금요일 18:00 본인 + 자기 자신 30분:
1. **M1/M2/M3 숫자 스크린샷**
2. **1분 데모 영상** (Loom 또는 화면 캡쳐 — Slice 위 오늘까지의 제품)
3. **다음 주 Sprint 목표 1개**

미제출 주간 = "Progress zero" 기록. `docs/history.md` 자동 append (기존 stop hook 활용).

### 5.5 External Advisor Protocol (Phase 5 Self-Review Echo 차단)

> **상위 근거**: §A.4 "1인 팀 Self-Review Echo 방지" 의 런타임 실행 규칙. ADR-0008 §D-4.
> **L-Tier**: 본 §5.5 자체 변경은 L-High (48h 쿨다운). 프로토콜 **적용** 은 모든 L-Std 이상 변경에 의무.

#### 5.5.1 자동 호출 (모든 L-Std 이상 PR)

`vcx-orchestrator` Phase 5 에서 다음 두 에이전트를 **병렬 호출** — 결과 없이 merge 금지 (CLAUDE.md §4.4 Evidence Before Assertion 연결).

| 에이전트 | 모델 | 호출 조건 |
|---|---|---|
| `/oh-my-claudecode:code-review` | sonnet | 모든 L-Std 이상 PR 에 의무 |
| `/oh-my-claudecode:security-review` | opus | RLS · PII · DDL 보호 · Magic Link · invite token · rate-limit · 결제 · 인증 경로 touch 시 의무 |

두 에이전트 모두 **동일 세션 내 구현 직후 self-승인 금지** — 별도 에이전트 invocation 결과가 있어야 "검토 완료" 선언 성립. 이 규칙은 §A.4 1인 팀 echo chamber 를 런타임에서 봉합한다.

#### 5.5.2 Verdict 포맷 (강제)

advisor 출력은 다음 블록을 반드시 포함해야 하며, 누락 시 `vcx-orchestrator` 가 재호출 요구.

```
## Gate Verdict
MUST_FIX_COUNT: N
SHOULD_FIX_COUNT: N
BLOCKERS:
- [MUST-FIX] path/to/file.ext:LINE — issue — required action
- [MUST-FIX] ...
NOTES:
- [SHOULD-FIX] ... (optional)
```

#### 5.5.3 MUST-FIX 처리 규칙

- `MUST_FIX_COUNT > 0` → Phase 3-B 로 루프. 각 MUST-FIX 마다 **(fix commit) 또는 (waiver ADR)** 1건 필수.
- Waiver ADR: 해당 issue 를 의도적으로 수용하겠다는 결정을 ADR 로 기록 (§1.2 번호 체계). 1회성 false positive 도 별도 ADR 필수 (감사 트레일).
- Phase 5 재진입 최대 **3회**, 초과 시 Phase 1/2 복귀 — AC 또는 아키텍처 재검토.

#### 5.5.4 모델-외부 advisor (옵션, L-High 변경 권장)

**L-High 변경 (PRD/PROCESS/MANIFEST/ADR/CLAUDE.md/법률/결제) 의 경우**, 위 Claude 기반 advisor 외에 다음 옵션을 추가 고려:

| 옵션 | 스킬 | 조건 |
|---|---|---|
| Codex + Gemini 병렬 | `/oh-my-claudecode:ccg` | Anthropic API 월 예산 여유 있을 때 (§7.3 VCX 월 상한 USD 100 잠정) |
| Codex 단독 | `codex:rescue` | 의심 고착 회로 · 초대형 변경 |
| Fresh Claude 세션 | 새 tmux pane + 같은 repo | 즉시 옵션, 비용 0 |

본 §5.5.4 는 **권장** — 의무 아님. 단, L-High 변경 시 "외부 advisor 미호출" 을 PR description 에 명시하여 감사 트레일 유지.

#### 5.5.5 Ledger 연계

모든 advisor 출력은 `docs/sprints/{slug}/05-verify.md` 에 적재 (ADR-0008 §D-1 Sprint Evidence Ledger). Verdict 원문 + 각 MUST-FIX 의 처리 결과 (fix commit SHA / waiver ADR 번호) 를 동일 파일에 이어쓰기.

---

## 6. Plan 파일 위생 (Plan Sprawl 억제)

### 6.1 Active Plan 상한 = 3개 (VCX 버전)

현재 active (본 PROCESS 서명 시점 2026-04-17):
1. `docs/plans/VERTICAL_SLICE_PHASE1.md` (**메인** — Phase 1)
2. `docs/PROCESS.md` (본 문서)
3. `docs/engineering/2026-04-17-process-review.md` (본 프로세스 모체)

보조 참조 (상한 별도, 변경 자유도 제한):
- `docs/plans/_open_questions_triaged.md` (기존 open-questions.md의 VCX 부분만)
- `docs/plans/_backlog/ideas.md` (아이디어 수집만)

### 6.2 아카이브된 plan (Sprint 1 내 물리 이동)

| 파일 | 이전 위치 | 신규 위치 | 사유 |
|---|---|---|---|
| `vcx-full-recode.md` | `.omc/plans/` | `docs/plans/_archive/` | PRD v6.0 흡수 |
| `p1-auth-completion-sprint.md` | `.omc/plans/` | `docs/plans/_archive/` | 완료/대체 |
| `p2-p4-development-roadmap.md` | `.omc/plans/` | `docs/plans/_archive/` | v4.1.3 전제 |
| `sprint-implementation-plan.md` | `.omc/plans/` | `docs/plans/_archive/` | v4.1.3 전제 |
| `bmplan-multi-vertical-vision.md` | `.omc/plans/` | `docs/plans/_archive/` | Phase 3+ 백로그 |
| `ai-resume-intelligence.md` | `.omc/plans/` | `docs/plans/_archive/` | Phase 2 후보 |
| `cto-cpo-review-and-roadmap.md` | `.omc/plans/` | `docs/plans/_archive/` | 본 보고서 대체 |
| `vcx-design-review.md` | `.omc/plans/` | `docs/plans/_archive/` | 조치 완료/이관 |
| `domain-expert-routing-rlvr.md` | `.omc/plans/` | **`~/.claude/skills/`로 이관** | VCX 제품 아님 (§2.3 두 우주 분리) |
| `ai-ops-agent.md` | `.omc/plans/` | `docs/plans/_archive/infra/` | 7요소 전체는 Phase 2, 헬스체크만 Sprint 1 |

### 6.3 신규 plan 추가 규칙
- 기존 active 중 1개를 archive로 옮긴 커밋과 **같은 PR**에만 허용.
- plan은 **항상 ≤ 3개**.

---

## 7. Red Flag Automation

`scripts/` 아래 필수 3개 (Sprint 1 작성, Sprint 2 CI 연결):

| 스크립트 | 목적 | 트리거 |
|---|---|---|
| `prd-freeze-check.sh` | P-1: PRD 커밋 게이트 | pre-commit |
| `weekly-metrics.sh` | P-5: 금요 리듬 | 금요 18:00 cron |
| `check-fee-hidden.sh` | ADR-0001 enforcement: 수수료 비노출 | CI on `src/app/**`, `src/components/**` |

---

## 8. 서명

| Role | 이름 | 일자 | 서명 |
|---|---|---|---|
| 1차 서명 (Self) | Sangmo Kang | 2026-04-17 | ________ |
| 2차 서명 (Cooldown +48h) | Sangmo Kang | 2026-04-19 | ________ |

본 서명 완료 전에는 이 PROCESS는 "제안" 상태이며 강제력이 없다.
서명 후 다음 PR부터 모든 게이트가 자동 적용된다.

---

## 9. 긴급 변경 절차

법률/사용자 피해/비용 폭발 3개 외에는 본 PROCESS 자체 변경도 §1.4 48h 쿨다운 준수. PROCESS 변경을 요구하는 ADR은 `ADR-0000-process-meta.md` 시리즈로 번호 분리.

---

## Annex A: Role-Harness

> 본 Annex는 `docs/roles/` 디렉토리의 6개 C-role 정의를 PROCESS SoT에 연결한다. 원본 plan: `.omc/plans/agent-roles-and-harness.md`.

### A.1 Role Mapping

1인 팀이 다음 6 역할을 컨텍스트 스위칭하며 수행한다. 각 역할별 상세 Harness(OMC agent, skill, tool, quality gate)는 링크된 파일 참조.

| Role | File | 핵심 책임 (한 줄) |
|------|------|-----------------|
| CEO | [docs/roles/CEO.md](./roles/CEO.md) | 주주가치 극대화, 전략 방향, 글로벌 reference 스캔 |
| CPO | [docs/roles/CPO.md](./roles/CPO.md) | Sprint·PRD·법률·결제·채용·Growth 실행 책임자 |
| CTO | [docs/roles/CTO.md](./roles/CTO.md) | TDD 기반 품질, 아키텍처, AI Brief 런타임 |
| CDO | [docs/roles/CDO.md](./roles/CDO.md) | 데이터 모델·파이프라인·PII·RLS 정책 기획 |
| DevOps/SRE | [docs/roles/SRE.md](./roles/SRE.md) | 배포 게이트, SLO, 인시던트 대응 |
| Chief Designer | [docs/roles/DESIGNER.md](./roles/DESIGNER.md) | 디자인 토큰·컴포넌트·모바일 360px 규율 |

- 전체 매트릭스: [docs/roles/HARNESS.md](./roles/HARNESS.md)
- Gap 추적: [docs/roles/GAP-LEDGER.md](./roles/GAP-LEDGER.md)

### A.2 ADR 배치 초안 타이머 규칙

§1.4 48h 쿨다운은 원칙적으로 변경 1건당 독립 타이머를 적용한다. 단, 다음 조건을 모두 만족하는 경우 **배치 타이머 공유**가 허용된다:

1. 동일 일자에 단일 PR로 초안 작성
2. 5건 이하 (묶어도 review 부담이 관리 가능)
3. 서로 논리적으로 독립적이지 않거나, 동일 상위 의사결정(예: 기존 PRD 조항 소급 문서화)에서 파생
4. PR 제목에 `[ADR-batch:NNNN-NNNN]` 명시

**적용 예:** ADR-0001~0005 (PRD v6.0 소급 기록) = 배치 타이머 공유 가능. 기한 2026-04-24 내 처리 가능.

**적용 불가 예:** ADR-0010(결제) + ADR-0011(채용) = 상위 의사결정이 다름 → 각자 독립 48h 쿨다운.

배치 부적격 판정 시 긴급트랙(§1.1 Legal Blocker / User Harm / Cost Explosion) 해당 여부 검토 후 면제 적용.

### A.3 Role 문서 변경 L-Tier

| 변경 유형 | L-Tier | 쿨다운 |
|---------|--------|--------|
| Role 파일의 Scope / Non-Scope 섹션 수정 | L-High | 48h |
| Role 파일의 Mission 수정 | L-High | 48h |
| HARNESS.md / GAP-LEDGER.md 구조 변경 | L-High | 48h |
| 기존 규칙 내에서의 파일·경로·owner 정정 (문구 보완) | L-Std | Self + CI |
| Gap status 업데이트 (pending → in_progress → done) | L-Std | Self |

### A.4 1인 팀 Self-Review Echo 방지

1인 체제에서 본인이 6 역할 전부를 승인하는 echo chamber를 방지하기 위해:

1. Role 파일 변경 시 L-High 48h 쿨다운을 **문서 내 timestamp + PR merge 지연**으로 물리적 강제
2. 세션 시작 시 현재 활성 role을 명시(`role=CTO` 등 메모)해 컨텍스트 드리프트 방지
3. 동일 세션에서 2+ 역할 승인 금지 (각 역할 결정은 최소 15분 간격)

---

*본 PROCESS는 ValueHire v7.x의 `PROCESS.md` (2026-04-17)를 벤치마크로 하여 VCX 1인 코어 체제와 현재 기술 상태(`next@14`, `supabase/ssr`, `tailwind@4`, Vercel + Supabase + Upstash + Sentry + Anthropic)에 맞춰 재작성했다.*
