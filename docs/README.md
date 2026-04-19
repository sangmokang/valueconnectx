# ValueConnect X — 문서 색인

> **목적**: 문서가 늘어도 혼선 없이 찾고 유지보수 가능한 단일 분류 체계를 고정한다.
> **Owner**: Sangmo Kang (CTO = CPO). 체계 변경은 ADR 필수.
> **최종 개정**: 2026-04-17 (v1.0)
> **상위 문서**: `docs/PROCESS.md` (프로세스 SoT)

---

## 0. 원칙

1. **버전명은 폴더에 쓰지 않는다.** `v6-*` 같은 버전 라벨 폴더 금지. 대신 납기(deadline) + 코드명 또는 주제로 분류.
2. **한 파일은 한 역할.** PRD/Process/Plan을 한 파일에 섞지 않는다.
3. **계획과 아이디어는 물리적으로 분리.** `docs/plans/` = 활성 실행, `docs/plans/_backlog/ideas.md` = 검토 대기, `docs/plans/_archive/` = 종료.
4. **제품 plan과 개발 도구 plan은 분리** (PROCESS §2.3). 도구 plan은 `~/.claude/skills/` 로.
5. **문서 번호는 0-padded 4자리** (ADR만 해당).

---

## 1. 현행 디렉토리 맵

```
docs/
├── README.md                              # (본 문서)
├── PROCESS.md                             # ★ 프로세스 SoT — v1.0
├── process-review-2026-04-17.md           # ★ 프로세스 감사 보고서 (모체)
├── history.md                             # 기능 커밋 자동 로그 (Stop hook)
│
├── prd6.0.md                              # ★ 현행 마스터 PRD — v6.0 (2026-04-03)
├── prd5.1.md                              # (archive candidate — ADR-0004)
├── prd4.1.3.md                            # (archive candidate — ADR-0004)
│
├── prd/
│   └── ADR/
│       ├── README.md                      # ADR 템플릿
│       ├── ADR-0001-fee-structure-hidden.md        # (Sprint 1)
│       ├── ADR-0002-ceo-coffeechat-culturefit.md   # (Sprint 1)
│       ├── ADR-0003-ai-brief-as-official-feature.md # (Sprint 1)
│       ├── ADR-0004-prd60-as-single-source.md      # (Sprint 1)
│       └── ADR-0005-domain-expert-routing-out-of-scope.md # (Sprint 1)
│
├── plans/
│   ├── VERTICAL_SLICE_PHASE1.md           # ★ Phase 1 스코프 SoT (4주)
│   ├── _open_questions_triaged.md         # (Sprint 1 — VCX 질문만 triage)
│   ├── _backlog/
│   │   └── ideas.md                       # 신규 아이디어 수집 (평상시 참조 금지)
│   └── _archive/
│       ├── INDEX.md                       # 아카이브 이유 + 재활용 규칙
│       ├── vcx-full-recode.md             # (PRD v6.0 흡수)
│       ├── p1-auth-completion-sprint.md
│       ├── p2-p4-development-roadmap.md
│       ├── sprint-implementation-plan.md
│       ├── bmplan-multi-vertical-vision.md
│       ├── ai-resume-intelligence.md
│       ├── cto-cpo-review-and-roadmap.md
│       ├── vcx-design-review.md
│       └── infra/
│           └── ai-ops-agent.md            # 헬스체크 1건만 Sprint 1 반영
│
├── sdd/
│   ├── FEATURE_MANIFEST.yaml              # ★ Phase 1 feature 매니페스트
│   ├── DEBT_LEDGER.md                     # 기술부채 단일 장부
│   ├── contracts/
│   │   └── openapi.yaml                   # (Sprint 2+) 48 Route Handler 스펙
│   └── schemas/
│       └── ERD.svg                        # (Sprint 2+) Supabase 스키마 다이어그램
│
├── design/
│   ├── tokens/
│   │   └── design-tokens.json             # (Sprint 1+) `src/constants/site.ts` 추출
│   ├── Branding.md
│   ├── figma-design-prompt.md
│   └── 260401vcx-complete.jsx             # 프로토타입 참조
│
├── ops/
│   └── runbooks/                          # 운영 가이드
│
├── research/
│   └── code_research.md
│
└── legacy/
    ├── BMplan.md
    ├── Operationplan.md
    ├── booth-demo-cheatsheet.md
    ├── booth-script-ai-ops.md
    ├── invite-only-auth.md
    ├── open-questions.md                  # (Sprint 1 내 _open_questions_triaged.md로 이관)
    ├── supabase-type-workflow.md
    ├── valueconnect_new.md
    ├── valueconnect_original.md
    ├── demo-site-setup.md
    └── superpowers/
    # NOTE: vcx-design-review.md 는 docs/legacy/ 가 아닌 docs/plans/_archive/ 로 단일 이관
    #       (Sprint 1 PR 에서 중복 제거)
```

(**참고**: Sprint 1 내 실제 물리 이동 작업이 필요한 항목은 `plans/_archive/INDEX.md` 에 체크리스트화.)

---

## 2. 파일 명명 규칙

### 2.1 `docs/plans/<codename>/`
- 신규 plan은 deadline 기반 codename: `docs/plans/phase2-may29/` 같은 식.
- 파일 프리픽스: `NN-<role>-<topic>.md` (NN = 00, 01, ...).

### 2.2 `docs/prd/ADR/`
- 번호: `ADR-NNNN-kebab-title.md`. 4자리 zero-pad.
- 한 번 매긴 번호 재사용 금지 (supersedes 체인으로 닫음).
- Template: `docs/prd/ADR/README.md`.

### 2.3 `docs/plans/_backlog/`
- 단일 파일 `ideas.md` 에 모든 아이디어 append.
- 개별 파일 생성 금지 (plan sprawl 방지).

### 2.4 `docs/plans/_archive/`
- 원본 파일명 유지.
- 이동 시 상단에 "Archived: YYYY-MM-DD, reason: ..." 블록 삽입.

---

## 3. 의사결정 변경 관리

| 항목 | 규칙 |
|---|---|
| PRD 수정 | ADR 필수 + 48h 쿨다운 재서명 (PROCESS §1.4) |
| PROCESS 수정 | `ADR-0000-process-meta-*` 시리즈 |
| 신규 plan | 기존 active 1개 archive 이동 + 같은 PR |
| Feature Manifest 변경 | Phase 종료 시까지 금지 (긴급 트랙 3개 예외) |
| 아이디어 → 실행 승격 | `_backlog/ideas.md` → ADR → `plans/<codename>/` |

---

## 4. 현재 활성 plan (Phase 1 · 2026-04-17 기준)

| 폴더/파일 | 코드명 | 납기 | 상태 |
|---|---|---|---|
| `docs/plans/VERTICAL_SLICE_PHASE1.md` | Phase 1 | **2026-05-15** | 🟢 실행 중 |
| `docs/PROCESS.md` | Process SoT | (상시) | 🟡 48h 쿨다운 |
| `docs/process-review-2026-04-17.md` | Audit | (완료) | ✅ 감사 |

**활성 ≤ 3 제한** (PROCESS §6.1). 위 3개가 상한.

---

## 5. 보류 / Kill 된 개념 (혼선 방지)

`docs/plans/_archive/` 또는 `docs/legacy/` 에 있는 것은 **현재 비실행**. 제품 스펙 질문 시 절대 먼저 참조하지 말 것.

| 개념 | 위치 | 상태 |
|---|---|---|
| Multi-vertical (미슐랭 3스타) | `_archive/bmplan-multi-vertical-vision.md` | ⏸️ Phase 3+ 백로그 |
| AI Resume Intelligence | `_archive/ai-resume-intelligence.md` | ⏸️ Phase 2 재평가 |
| 전체 리코드 (260401.jsx 기반) | `_archive/vcx-full-recode.md` | ❌ Killed (v6.0 흡수) |
| v4.1.3 PRD | `prd4.1.3.md` | ⏸️ 아카이브 (ADR-0004) |
| v5.1 PRD | `prd5.1.md` | ⏸️ 아카이브 (ADR-0004) |
| Domain Expert Routing + RLVR | `~/.claude/skills/` 로 이관 예정 | ❌ VCX 제품 아님 (ADR-0005) |
| AI Ops Agent 7요소 | `_archive/infra/ai-ops-agent.md` | ⏸️ 헬스체크만 Sprint 1 |
| Stibee 자동화 파이프라인 | (미시작) | ⏸️ Sprint 5+ |

---

## 6. 빠른 네비게이션

**시작할 때 열어볼 3개 파일**:
1. `docs/PROCESS.md` — 어떻게 일할지
2. `docs/plans/VERTICAL_SLICE_PHASE1.md` — 무엇을 만들지
3. `docs/prd6.0.md` — 왜 만들지

**작업 중 자주 참조**:
- `CLAUDE.md` (루트) — 코딩 스타일 + anti-patterns
- `AGENTS.md` (루트) — 에이전트 가이드
- `docs/sdd/FEATURE_MANIFEST.yaml` — Phase 1 scope
- `docs/sdd/DEBT_LEDGER.md` — 기술부채 현황

**주간 리듬**:
- 금요 18:00 `scripts/weekly-metrics.sh` 실행 → `docs/history.md` append

---

*본 색인은 `docs/PROCESS.md` 가 정한 규율의 결과다. 규칙 위반 사례 발견 시 즉시 정리.*
