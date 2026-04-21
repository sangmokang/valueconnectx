# ADR-0006: Archive PRD v6.1 as Phase 2-Reserved

- Status: Accepted (CEO directive, same-day execution per shareholder override)
- Date: 2026-04-19
- Decider: Sangmo Kang (CEO + CPO role)
- L-Tier: L-High
- Cooldown waiver: Legal/scope-drift emergency per PROCESS.md §1.1 — PRD duplication triggers Red Flag #2

## Context

`docs/prd6.1.md` (84KB) was created 2026-04-19 while `docs/prd6.0.md` remains the authoritative PRD per ADR-0004. Two concurrent PRD documents violate PROCESS.md Red Flag condition #2 ("PRD v6.1 초안이 Sprint 2 전에 등장"). If left in place, scope creep and drift are imminent.

A CDO review doc `docs/prd6.1-cdo-review.md` also exists — consolidates feedback against v6.1 content.

## Decision

1. Move `docs/prd6.1.md` → `docs/prd/_archive/prd6.1.md`.
2. Move `docs/prd6.1-cdo-review.md` → `docs/prd/_archive/` (tied to archived 6.1).
3. Mark `docs/prd/_archive/` contents as **non-authoritative**. Phase 1 decisions refer only to `docs/prd6.0.md`.
4. Any content from v6.1 deemed valuable for Phase 2 must be re-proposed via new ADR after Phase 1 DoD is met.

## Consequences

### Positive
- Red Flag #2 cleared.
- PRD SoT restored to single file (v6.0).
- Phase 1 focus preserved — 26일 남은 기한 내 완주 가능성 제고.

### Negative / Risks
- v6.1의 유용한 아이디어가 일시 동결됨 — Phase 2 시작 시 재검토 필요.
- CDO review 문서도 함께 아카이브되므로 Phase 2 진입 시 review 재수행 여부 판단 필요.

## Compliance

- PROCESS.md Red Flag #2: ✓ 해소
- PROCESS.md §1.1 긴급트랙: Scope drift 자체 = User Harm 가능성 (confused PRD가 구현 팀 오판 유발)으로 해석 적용
- ADR-0004: ✓ 확장 적용 (v6.0 단일 SoT 원칙에 v6.1 포함)

## References

- Archive: `docs/prd/_archive/prd6.1.md`
- Authoritative: `docs/prd6.0.md`
- Related: `ADR-0004-prd-v6-single-source.md`
