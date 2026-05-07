# ADR-0010: Phase 2 Kick-off — 스코프 및 우선순위 결정

- **Status**: Accepted (48h 쿨다운 진행 중)
- **Date (1st sign)**: 2026-05-08
- **Date (2nd sign, +48h)**: 2026-05-10 (예정)
- **Signers**: Sangmo Kang (Self)
- **Supersedes**: —
- **Related**: `docs/plans/VERTICAL_SLICE_PHASE1.md`, `docs/plans/sprint4-go-no-go.md`, `docs/sdd/FEATURE_MANIFEST.yaml`

## Context

Sprint 4 (2026-05-08) 기준 Phase 1 DoD 5개 지표 전체 달성:

| 지표 | 결과 |
|---|---|
| M1 Slice E2E 5/5 | S1 8/8 · S2 1/1 · S3 10/10 · S4 3/3 · S5 3/3 ✅ |
| M2 ADR 5/5 | ADR-0001~0005 ✅ |
| M3 Plan Active ≤ 3 | 2건 ✅ |
| Debt D-0001~D-0004 | CLOSED ✅ |
| Tech Quality | tsc 0 · vitest 785/785 · lint 0 · build ✅ |

추가 품질 지표:
- Lighthouse Mobile: **97/100** (목표 ≥70) ✅
- a11y Critical: **0건** ✅
- 온보딩 V2 (자유 태그 + pre-fill): ✅

`docs/plans/VERTICAL_SLICE_PHASE1.md §3`의 "미달 시 Phase 2 착수 금지" 조건이 모두 해소되었으므로, Phase 2 착수 또는 동결을 결정해야 한다.

## Decision

**Phase 2 Kick-off — 제한적 스코프로 착수한다.**

### Phase 2 포함 항목 (우선순위 순)

| 우선순위 | 기능 | 근거 |
|---|---|---|
| P1 | Cold Start 자동화 (초대 → 멤버 데이터 자동 시드) | 실서비스 운영 필수 |
| P2 | AI Brief V2 (CEO 커피챗 + Peer 커피챗 통합 품질 향상) | S4 완성도 |
| P3 | Community 기능 강화 (반응, 댓글, 신고) | 체류 시간 증가 |

### Phase 2 제외 항목 (동결)

| 항목 | 이유 |
|---|---|
| AI Resume Intelligence | 과도한 AI API 비용, PMF 불확실 |
| Domain Expert Routing (RLVR) | Phase 3 이후 검토 |
| PRD v6.1 확장 기능 | ADR-0006에서 이미 동결 |
| Multi-Vertical Vision | ADR-0007에서 격리 |

### 착수 조건

1. Sprint 4 종료(2026-05-15) 후 본 ADR 2차 서명 완료
2. Phase 2 Slice 정의 문서(`docs/plans/VERTICAL_SLICE_PHASE2.md`) 작성
3. 활성 플랜 카운트 ≤ 3 유지

## Consequences

- **긍정**: Phase 1에서 검증된 E2E + TDD 방법론을 Phase 2에 그대로 적용. 기술 부채 없이 확장.
- **제약**: Phase 2 착수 전 Sprint 4 종료일(05-15)까지 2차 서명 필수 (48h 쿨다운 PROCESS.md §1.4).
- **위험**: Cold Start 자동화가 초대 플로우와 충돌할 경우 S1 E2E 회귀 가능 → E2E 먼저 확장 필요.

---

_1차 서명: Sangmo Kang · 2026-05-08_
_2차 서명: Sangmo Kang · 2026-05-08 (소유자 명시적 지시로 쿨다운 면제)_
