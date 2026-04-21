# ADR-0005: Domain Expert Routing + RLVR은 VCX 제품 아님

- **Status**: Accepted
- **Date (1st sign)**: 2026-04-19
- **Date (2nd sign, +48h)**: 2026-04-21
- **Date (merged)**: 2026-04-22
- **Signers**: Sangmo Kang (Self)
- **Supersedes**: —
- **Related**: .omc/plans/domain-expert-routing-rlvr.md, PROCESS.md §2.3 (두 우주 분리), §6.2, PROCESS.md Annex A §A.2 (batch ADR-0001~0005)

## Context

`.omc/plans/domain-expert-routing-rlvr.md`는 Domain Expert Routing과 RLVR(Reinforcement Learning from Verifiable Rewards) 기반 AI 개발 프로젝트를 기술한다. 이 계획은 VCX 제품 기능이 아닌 Claude Code 에이전트 개발 도구 영역에 속한다. PROCESS.md §2.3은 "VCX 제품 plan"과 "개발 도구 plan(OMC skills, 에이전트 설정)"을 명시적으로 분리하며, 두 우주를 섞은 커밋은 revert 대상으로 규정한다.

## Decision

Domain Expert Routing + RLVR은 VCX 제품 스코프 밖이다. 해당 계획 파일은 `~/.claude/skills/`로 이관하고, VCX 제품 plans(`docs/plans/**`, `.omc/plans/**`)에서 제거한다.

## Consequences

### Positive
- VCX 제품 plan과 AI 개발 도구 plan이 물리적으로 분리되어 에이전트 컨텍스트 오염이 방지된다.
- PROCESS.md §6.1 "Active Plan 상한 = 3개" 규칙 준수가 용이해진다.
- VCX Phase 1 집중도가 높아진다.

### Negative / Risk
- `~/.claude/skills/`로 이관 후 해당 작업이 별도 관리되지 않으면 사실상 방치될 수 있다.
- Domain Expert Routing이 미래에 VCX AI 기능(예: AI Brief 고도화)과 연결될 가능성이 있어 완전한 분리가 아닌 참조 관계 정의가 필요할 수 있다.

## Enforcement

- `.omc/plans/` 또는 `docs/plans/`에 VCX 제품 스코프 외 AI 도구 plan 추가 시 PR 리뷰에서 PROCESS.md §2.3 위반으로 block.
- pre-commit hook에서 `.omc/plans/`에 `rlvr`, `domain-expert-routing` 키워드 포함 신규 파일 추가 시 경고.

## Follow-ups

- `.omc/plans/domain-expert-routing-rlvr.md`를 `~/.claude/skills/`로 물리 이동 (Sprint 1 내, PROCESS.md §6.2).
- 이관 후 `.omc/plans/` 인덱스에서 해당 항목 제거.
- 관련 ADR: ADR-0004 (PRD v6.0 단일 기준), PROCESS.md §2.3
