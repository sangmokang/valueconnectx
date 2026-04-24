# Sprint Evidence Ledger

> **Status**: 구조 예약 (Policy 확정은 `@docs/prd/ADR/ADR-0008-sprint-evidence-ledger.md` 48h 쿨다운 후 merge 시점부터 발효)
> **근거**: Harness Engineering 이식 가이드 §8 (ADR-0017 동등 정책)
> **권위**: `@docs/plans/VERTICAL_SLICE_PHASE1.md` > `@docs/PROCESS.md` > 본 문서

---

## 1. 목적

VCX Phase 0~5 산출물의 **감사 가능한 SoT 경로**. `.omc/plans/` 에 산재하던 plan/AC/evidence 를 `docs/sprints/{slug}/` 로 통합하여:

1. 다인 협업 전에도 `git pull` 로 prior session evidence 재현 가능.
2. CLAUDE.md §4.4 **Evidence Before Assertion** 의 fresh 증거를 PR 과 함께 main 에 머지.
3. `vcx-dod-gate` · `vcx-scope-gate` · `vcx-tdd-gate` 가 단일 경로에서 증거 확인.

---

## 2. 경로 컨벤션

```
docs/sprints/{slug}/{NN}{letter?}-{type}.{ext}
```

| 컴포넌트 | 의미 | 예 |
|---|---|---|
| `{slug}` | kebab-case 작업 식별자 (브랜치 접두 `feat/`·`fix/`·`chore/` 제외) | `harness-ledger-policy`, `peer-coffeechat-feedback` |
| `{NN}` | 2자리 Phase 번호 (00~05) | 01, 03, 04 |
| `{letter?}` | 같은 Phase 내 다중 산출물 | 3a, 3b, 3c |
| `{type}` | 의미 토큰 | `plan`, `e2e-ac`, `arch`, `test-plan`, `red`, `green`, `refactor`, `gate-{skill}`, `verify` |
| `{ext}` | 확장자 | `md` (기본), `log` (테스트 출력), `json` (구조화된 데이터) |

## 3. 전형적 slug 디렉토리 예시

```
docs/sprints/harness-ledger-policy/
├── 00-scope-slice.md          # Phase 0 gate 결과 (scope-gate + slice-check 요약)
├── 01-plan.md                 # Phase 1 계획 + 스코프 + 리스크
├── 01-e2e-ac.md               # Phase 1 AC 리스트 (Given-When-Then + 테스트 레벨)
├── 02-arch.md                 # Phase 2 아키텍처 + 슬롯 할당
├── 02-test-plan.md            # Phase 2 AC ↔ 테스트 매핑
├── 03a-red.log                # Phase 3-A 실패 테스트 출력
├── 03b-green.log              # Phase 3-B 통과 테스트 출력
├── 03c-refactor.md            # Phase 3-C 리팩터 결과 (Verdict: PASS | ROLLBACK | SKIP)
├── 04-gate-scope.md           # Phase 4 vcx-scope-gate 결과
├── 04-gate-tdd.md             # Phase 4 vcx-tdd-gate 결과
└── 05-verify.md               # Phase 5 code-review + security-review Verdict
```

## 4. 규칙 (ADR-0008 확정 후 발효)

1. **SoT**: `docs/sprints/{slug}/` 가 단일 산출물 경로. `.omc/plans/` 는 "작업 중 임시" 로만 허용, merge 직전 해당 slug 로 이관.
2. **아카이브 개념 없음**: 새 작업 = 새 slug = 새 디렉토리.
3. **직전 버전 백업 필요 시**: `_prev/` 서브디렉토리 (예: `docs/sprints/{slug}/_prev/01-plan.v1.md`).
4. **PR 과 함께 main 머지**: 다인 협업 가시성 확보 (VCX 가 1인 레포라도 실 운영 시 dev B 재현 가능 구조).
5. **Secret 금지**: ledger 진입 전 `scripts/secret-scan.sh` (Day-1 추가) 가 자동 차단. placeholder 자리에 실 키 복붙 금지.
6. **Phase 0 영수증 필수**: `00-scope-slice.md` 에 vcx-orchestrator Phase 0 영수증 블록 반드시 포함.

## 5. 기존 자료 이관 계획 (ADR-0008 merge 후)

| 현 위치 | 이관 대상 | 시점 |
|---|---|---|
| `.omc/plans/agent-roles-and-harness.md` | `docs/sprints/agent-roles-and-harness/` | Sprint 2 |
| `.omc/plans/open-questions.md` | `docs/sprints/open-questions-triage/` 또는 DEBT_LEDGER 로 흡수 | Sprint 2 |
| `.omc/plans/vcx-design-review.md` | `docs/sprints/design-review/` | D-0003 close 시 |

마이그레이션 순서: M1 (secret hygiene 확인) → M2 (파일 rename + slug 정렬) → M3 (`.omc/plans/` README 에 "SoT 는 docs/sprints/" 포인터 삽입).

---

## 6. 현재 상태

- [ ] ADR-0008 draft (`docs/prd/ADR/ADR-0008-sprint-evidence-ledger.md`) — 2026-04-24 개시, **2026-04-26 재서명 merge 예정**
- [ ] `CLAUDE.md §11` 참조 추가 (L-High, 같은 쿨다운 윈도우)
- [ ] `docs/PROCESS.md §5.5` External Advisor Protocol 추가 (L-High, 같은 쿨다운 윈도우)
- [ ] 첫 slug 디렉토리: `docs/sprints/harness-ledger-policy/` — Phase 1~6 산출물 적재 (ADR-0008 merge 후)

본 파일은 **정책 확정 전 구조 예약** 이다. 실제 slug 디렉토리 생성은 ADR-0008 merge 후부터 의무화한다.
