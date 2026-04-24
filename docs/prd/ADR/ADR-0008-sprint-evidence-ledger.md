# ADR-0008: Sprint Evidence Ledger + Harness L4/L5 Policy

- **Status**: Proposed (1st sign 2026-04-24)
- **Date (1st sign)**: 2026-04-24
- **Date (2nd sign, +48h)**: 2026-04-26 (eligible merge)
- **Signers**: Sangmo Kang (Self)
- **L-Tier**: L-High
- **Supersedes**: —
- **Related**: ADR-0004 (PRD v6.0 단일 SoT), ADR-0007 (CDO rev4 격리), `docs/roles/HARNESS.md`, Harness Engineering 이식 가이드 (2026-04-24 사용자 제공)

---

## Context

2026-04-24 Harness Engineering 이식 가이드 (ValueHire v2 harness 포팅 청사진) 를 VCX 에 반영하기 위한 gap 분석 결과:

1. **L0 (문서 권위 계층)** 과 **L1 (Role Charter)** 은 이미 70% 완비 (CLAUDE.md · PROCESS.md · FEATURE_MANIFEST.yaml · ADR-0001~0007 · docs/roles/*)
2. **L2 (3-tier 에이전트)** 는 완비 (`.claude/agents/vcx-*.md` 6개 + `.claude/skills/vcx-*` 5개)
3. **L3 (Phase 0~6 파이프라인)** 은 `vcx-orchestrator/SKILL.md` 로 구현됨, 단 Phase 0 영수증 포맷 표준 부재 · Phase 5 외부 advisor 프로토콜 부재
4. **L4 (런타임 3중 방어)** 은 SessionStart + UserPromptSubmit + pre-commit (prd-freeze-check) **2중 방어**만 구현. PreToolUse worktree-guard 와 secret-scan 미구현
5. **L5 (Sprint Evidence Ledger)** 는 **전혀 구현되지 않음** — 산출물이 `.omc/plans/`, 커밋 메시지, PR description 에 산재

문제는 CLAUDE.md §4.4 **Evidence Before Assertion** 이 실행력을 가지려면:
- "fresh 증거" 가 **단일 경로** 에 있어야 감사 가능
- 같은 증거가 **PR 과 함께 main 에 머지**되어야 dev B (또는 미래의 본인) 가 `git pull` 로 재현 가능
- 무엇이 "Phase 0 영수증" 이고 "Phase 3-C Verdict" 인지 **포맷 표준** 이 있어야 툴체인 자동화 가능

Harness 가이드 §8 (ADR-0017 동등) 은 이를 `Docs/sprints/{slug}/NN-type.ext` 단일 SoT 로 해결한다. VCX 도 같은 패턴을 채택하되 **VCX 1인 레포 특수성** 에 맞춰 적응이 필요하다.

---

## Decision

VCX 하네스에 **L4 강화** + **L5 신설** 을 도입한다. 단, VCX 1인 레포 컨텍스트에 맞춰 **HARD STOP 대신 opt-in** 노선을 명시적으로 채택한다.

### D-1 · L5 Sprint Evidence Ledger 도입

1. **경로 컨벤션 확정**: `docs/sprints/{slug}/{NN}{letter?}-{type}.{ext}`
2. **SoT 승격**: `.omc/plans/` 는 "작업 중 임시" 로 강등. merge 직전 해당 slug 로 이관 의무.
3. **아카이브 개념 없음**: 새 작업 = 새 slug = 새 디렉토리.
4. **PR 과 함께 main 머지**: 증거 휘발성 금지 — `git pull` 로 재현 가능해야 함.
5. **Secret 차단**: ledger 진입 전 `scripts/secret-scan.sh` (Day-1 추가) 가 자동 차단.
6. **Phase 0 영수증 필수**: 각 slug 의 `00-scope-slice.md` 에 vcx-orchestrator Phase 0 영수증 블록 적재.
7. **상세 경로 규칙 + 이관 로드맵**: `docs/sprints/README.md` 가 운영 가이드 (Day-1 작성됨).

본 ADR merge 후 신규 작업부터 즉시 발효. 기존 `.omc/plans/*.md` 이관은 Sprint 2~3 에 걸쳐 점증 (마이그레이션 M1 secret hygiene → M2 rename → M3 pointer 삽입).

### D-2 · L4 worktree-guard — **명시적 opt-in 유지** (HARD STOP 미채택)

Harness 가이드 §7.3 은 PreToolUse hook 으로 exit 2 HARD STOP 을 권장하나, VCX 는 **1인 레포 + 낮은 회귀 리스크** 로 인해 다음 근거로 opt-in 유지:

- **다인 협업 격리 리스크 낮음**: dev B 가 존재하지 않으므로 worktree 혼재 시 충돌 영향 제한적
- **의도적 메인 편집 허용 시나리오 존재**: docs/** · .claude/** · CLAUDE.md 는 CLAUDE.md §7.1 에 따라 메인 워크트리 직접 편집 허용 — HARD STOP 이 이 흐름을 차단하면 false positive
- **SessionStart 경고 + vcx-orchestrator Phase 0 영수증** 으로 "정책 인식" 수준은 확보
- **1인 레포 인프라 복잡도 비용**: PreToolUse hook 우회 (shell 직접 파일 touch 등) 에 드는 디버깅 시간 > 얻는 안전 마진

**단, 다음 조건 충족 시 본 결정 supersede 검토**:
1. 2인 이상 개발자 상시 투입
2. 메인 워크트리 실수 편집 월 2건 이상 관측
3. CI 회귀 중 "메인 워크트리 임시 변경 → 커밋 누락" 원인이 주요 원인으로 등록

위 조건 중 하나라도 충족 시 ADR-0008 supersede 용 ADR-00NN 발행 하여 HARD STOP 노선으로 전환.

### D-3 · L4 secret-scan.sh pre-commit 배선 (Day-1 L-Std)

Harness 가이드 §7.4 의 secret-scan 동등. AWS/GCP 키 · JWT · private key block · .env 실값 · 한국 PII 5종 검출. `.githooks/pre-commit` 에 `prd-freeze-check.sh` 직후 배선. fail-closed.

본 ADR 의 L-High 쿨다운 **대상 아님** (Day-1 L-Std 로 분리 실행, 커밋 메시지에 별도 표기).

### D-4 · L3 Phase 5 External Advisor Protocol (PROCESS §5.5)

Phase 5 self-review echo 차단 — PROCESS §A.4 (1인 팀 Self-Review Echo 방지) 의 L3 런타임 구현. 구체적으로:

1. 자동 호출: `/oh-my-claudecode:code-review` (sonnet) + `/oh-my-claudecode:security-review` (opus) **병렬**
2. Fresh 컨텍스트 요구: 같은 세션 내 구현자가 곧바로 "검토 완료" 선언 금지 — 별도 에이전트 호출 결과 필수
3. Verdict 포맷 강제: `## Gate Verdict` + `MUST_FIX_COUNT` + `BLOCKERS` (가이드 §6.5 차용)
4. L-High 변경은 Codex/Gemini CLI 등 **모델-외부** advisor 추가 고려 (옵션, 비용 민감)
5. 루프 캡: Phase 5 재진입 최대 3회, 초과 시 Phase 1/2 복귀

상세는 `docs/PROCESS.md §5.5` 에 규칙으로 기재 (본 ADR 의 동일 쿨다운 윈도우).

---

## Consequences

### Positive

- **감사 가능성**: "완료" 주장과 fresh 증거가 같은 git tree 에 존재 — CLAUDE.md §4.4 의 실행력 확보.
- **후속 개발자 연속성**: 2인체제 전환 시 `git pull` 만으로 prior session evidence 복구 가능 (Harness 가이드 §8.3 이점 수용).
- **게이트 자동화 기반**: `vcx-scope-gate`, `vcx-tdd-gate`, `vcx-dod-gate` 가 `docs/sprints/{slug}/NN-*.md` 단일 경로에서 증거 수집 — 특수 케이스 분기 제거.
- **Phase 5 self-review echo 명시 봉합**: PROCESS §A.4 가 원칙 선언만 하던 것을 §5.5 에서 실행 프로토콜로 확정.
- **L4 3중 방어 완성**: Day-1 secret-scan 배선 + 기존 prd-freeze-check + SessionStart 경고 → CLAUDE.md §11 Agent Harness 섹션이 "3중 방어" 를 명시 가능.

### Negative / Risk

- **문서 폴더 비대**: `docs/sprints/{slug}/` 디렉토리가 Sprint 당 5~10 파일 추가 — repo size 증가 (월 ~2MB 추정, 무시 가능).
- **Phase 0 영수증 누락 시 하네스 위반**: vcx-orchestrator 가 영수증을 누락하면 ledger 빈 파일 생성 → 자체 검사 필요. 초기 2주간 수동 확인 부담.
- **`.omc/plans/` 기존 파일 이관 cost**: 약 10개 plan 이관에 Sprint 2 의 ~2시간 소모. 단, M3 지표 (Plan Active Count ≤ 3) 개선 효과로 상쇄.
- **HARD STOP 미채택의 장기 리스크**: 2인체제 전환 시 `D-2` 재검토 필요 — 그 시점에는 이미 "opt-in 관행" 이 고착되어 전환 저항 가능.
- **Secret-scan false positive**: 기존 테스트 fixture 에서 placeholder 가 아닌 실 포맷 데이터 (예: 한국 휴대폰 하이픈 포맷) 가 걸릴 수 있음 — Day-1 smoke test 로 식별 후 예외 룰 추가. 또한 `staged` 모드에서 per-file 제외 로직 강화 필요 (Sprint 2 follow-up).

### Mitigation

- Phase 0 영수증 누락 감지: `scripts/role-harness-check.sh` 에 `docs/sprints/{slug}/00-scope-slice.md` 존재 + 영수증 블록 regex 매칭 검증 추가 (Sprint 2).
- Secret-scan false positive: `.secretscanignore` 파일 패턴 지원 (Day-1 스크립트 명세에 포함).
- HARD STOP 재검토 트리거: `docs/sprints/README.md` §6 에 "재검토 조건" 명시하여 잊힘 방지.

---

## Alternatives Considered

1. **Full HARD STOP 채택** (Harness 가이드 원안) — 기각: 1인 레포 컨텍스트에 오버킬 + docs/** 메인 편집 흐름과 충돌. 2인체제 시 재검토 (D-2 트리거 참조).
2. **현행 `.omc/plans/` 유지 + PR description 증거** — 기각: 증거 휘발성 (PR close 시 description 사라지진 않으나 검색성 낮고 포맷 불일치로 자동 수집 불가).
3. **`Docs/sprints/` 대신 Notion / Linear 같은 외부 SaaS** — 기각: git SoT 원칙 (§A.4 1인 Self-Review Echo 방지 + CLAUDE.md §4.4 Evidence Before Assertion) 과 상충, 오프라인·재현성 저하.
4. **Phase 5 외부 advisor 도입 안 함** — 기각: PROCESS §A.4 가 이미 원칙 선언했으나 런타임 구현 부재로 실효성 없음. §5.5 로 명문화 필요.

---

## Enforcement

| 대상 | 강제 수단 | 시점 |
|---|---|---|
| `docs/sprints/{slug}/` 경로 | `vcx-orchestrator` Phase 0 영수증 필수 | 세션 내 런타임 |
| Secret 차단 | `.githooks/pre-commit` → `scripts/secret-scan.sh` | git commit |
| PRD freeze | 기존 `scripts/prd-freeze-check.sh` | git commit |
| Phase 5 advisor | `vcx-orchestrator` Phase 5 체크리스트 | 세션 내 런타임 |
| 영수증 누락 감지 | `scripts/role-harness-check.sh` 확장 | CI (Sprint 2) |
| `.omc/plans/` 이관 진행 | `docs/sprints/README.md` §5 이관 계획 | Sprint 2~3 수동 |

---

## Follow-ups

1. **Day-1 (L-Std, 별도 커밋)**:
   - `scripts/secret-scan.sh` 신규 작성 + `.githooks/pre-commit` wire
   - `.claude/hooks/worktree-session-start.sh` 에 CLAUDE.md §11 근거 한 줄 추가
   - `.claude/skills/vcx-orchestrator/SKILL.md` 에 Phase 0 영수증 포맷 블록 추가
   - `docs/sprints/README.md` 정책 예약 초안 (본 ADR merge 후 발효)

2. **Week-1 (본 ADR 쿨다운 윈도우, 2026-04-26 merge 후)**:
   - 본 ADR merge
   - `CLAUDE.md §11` 에 L4 3중 방어 명시 + L5 Sprint Evidence Ledger 참조 추가 (같은 쿨다운)
   - `docs/PROCESS.md §5.5 External Advisor Protocol` 추가 (같은 쿨다운)
   - 첫 slug 디렉토리 생성: `docs/sprints/harness-ledger-policy/` — 본 작업 자체의 evidence 이관

3. **Sprint 2**:
   - `scripts/role-harness-check.sh` 확장: 영수증 블록 regex 검증
   - `.omc/plans/` 파일 10건 중 "완료 / 아카이브" 제외한 활성 plan 을 `docs/sprints/{slug}/` 로 이관
   - `docs/prd/ADR/README.md` 현재 ADR 목록 표 갱신 (ADR-0008 등재)
   - `scripts/secret-scan.sh` staged 모드 per-file 제외 로직 보강 (현재 diff 라인 단위 exclude 가 docs/** 경로를 정확히 제외하지 못함 — executor-low 에 위임)

4. **Sprint 3**:
   - `.omc/plans/README.md` 에 "SoT 는 docs/sprints/" 포인터 삽입 (완전 이관 후)
   - HARD STOP 재검토 조건 (D-2) 달성 여부 점검

5. **조건부 (2인체제 전환 시)**:
   - ADR-00NN 발행하여 D-2 supersede — HARD STOP 노선 전환 + `worktree-guard.sh` PreToolUse hook 배선

---

## References

- Harness Engineering 이식 가이드 (2026-04-24 사용자 제공, 원본은 ValueHire v2 `ADR-0017-harness-evidence-storage.md` + `Docs/roles/00-role-charter.md`)
- `docs/PROCESS.md §A.4` — 1인 팀 Self-Review Echo 방지
- `docs/roles/HARNESS.md` — 6-role × OMC agent 매트릭스
- `docs/sprints/README.md` — Sprint Evidence Ledger 운영 가이드 (Day-1 작성)
- `.claude/skills/vcx-orchestrator/SKILL.md` — Phase 0~6 파이프라인

---

## Sign-off

- [x] 1차 서명 (Self): Sangmo Kang · 2026-04-24
- [ ] 2차 서명 (Cooldown +48h): Sangmo Kang · 2026-04-26 **예정** (본 시점 자기번복 시 abort + `Status: Abandoned`)

**쿨다운 중 self-check 질문 (§A.4 Echo 방지)**:
1. 48시간 뒤에도 여전히 L5 Sprint Evidence Ledger 가 필요한가?
2. D-2 의 opt-in 선택이 1인 레포 현실 대비 옳은가? (HARD STOP 이 아니어도 evidence 수집이 실제 동작하는가?)
3. §5.5 External Advisor Protocol 이 §A.4 원칙 선언과 중복은 아닌가? (Answer: §A.4 = 원칙, §5.5 = 런타임 실행 — 중복 아님)
