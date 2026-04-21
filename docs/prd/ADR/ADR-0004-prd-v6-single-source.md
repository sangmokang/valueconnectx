# ADR-0004: PRD v6.0이 단일 기준, v4.1.3 / v5.1 아카이브

- **Status**: Accepted
- **Date (1st sign)**: 2026-04-19
- **Date (2nd sign, +48h)**: 2026-04-21
- **Date (merged)**: 2026-04-22
- **Signers**: Sangmo Kang (Self)
- **Supersedes**: —
- **Related**: docs/prd6.0.md §0 (서문), PROCESS.md §1.1~§1.3, PROCESS.md Annex A §A.2 (batch ADR-0001~0005)

## Context

VCX는 지난 30일간 PRD v4.1.3, v5.1, v6.0이 병존했고, 어느 버전이 구현의 기준인지 불명확한 상태가 반복되었다. 다중 PRD 버전은 코드·UI·문서 간 드리프트의 주요 원인이었다. PROCESS.md §1.1은 "현 결정은 교체될 때까지 유효"를 선언했고, docs/prd6.0.md §0은 v6.0을 단일 기준점으로 명시했다.

## Decision

`docs/prd6.0.md`가 VCX 제품의 유일한 PRD 기준점이다. v4.1.3과 v5.1은 즉시 아카이브 처리되며, 구현·UI·문서 작성 시 이 두 버전을 참조하는 것은 허용되지 않는다. 아카이브 목적지는 `docs/archive/` 또는 `docs/_archive/`이다.

## Consequences

### Positive
- 코드·UI·ADR이 단일 PRD를 기준으로 정렬되어 드리프트가 차단된다.
- "어느 버전이 맞나?" 혼선이 제거된다.
- PROCESS.md §1.3 `prd-freeze-check.sh`가 단일 파일을 게이트로 삼을 수 있게 된다.

### Negative / Risk
- v4.1.3·v5.1에만 존재하는 일부 결정 사항이 v6.0에 반영되지 않았을 가능성 — 이관 전 diff 검토 필요.
- 아카이브 후에도 팀원(또는 AI 에이전트)이 구 버전을 참조할 경우 오류 발생 가능 — 파일명 또는 헤더에 `ARCHIVED` 명시 필요.

## Enforcement

- `scripts/prd-freeze-check.sh`: `docs/prd6.0.md` 수정 시 동일 커밋에 ADR 파일 없으면 pre-commit block (PROCESS.md §1.3).
- 아카이브된 파일 상단에 `> ⚠️ ARCHIVED: 이 문서는 아카이브되었습니다. 기준 문서는 docs/prd6.0.md를 참조하세요.` 배너 추가.

## Follow-ups

- `docs/prd/` 또는 저장소 내 v4.1.3·v5.1 파일 위치 확인 후 `docs/_archive/`로 이동 (Sprint 1 내).
- 아카이브 파일 상단에 ARCHIVED 배너 추가.
- 관련 ADR: ADR-0001~0003, ADR-0005
