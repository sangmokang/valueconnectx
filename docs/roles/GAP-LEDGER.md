# Gap Ledger — Role Harness Infrastructure

> Track of 17 gaps identified during role definition. See plan §4 for origin. P0 must be resolved within deadlines below.

## Priority Summary

- **P0 (6 gaps):** 2026-04-19 ~ 2026-05-01 내 처리 필수
- **P1 (9 gaps):** Sprint 2 내 처리 (Phase 1 slice 방해 없음)
- **P2 (2 gaps):** Sprint 3+

## Full Matrix

| Gap | 제목 | Owner | Priority | Deadline | Phase 1 slice 방해? | Status | Related plan |
|-----|------|-------|----------|----------|-------------------|--------|--------------|
| G01 | docs/strategy/ + 첫 memo 템플릿 | CEO | P1 | Sprint 2 | No | **done** (2026-04-19 ceo-memo-202604.md) | — |
| G02 | ADR-0001~0005 소급 | CEO/CPO | **P0** | **2026-04-24** | Yes | **cooldown** (drafted 2026-04-19, eligible merge 2026-04-22) | PROCESS §1.2, Annex A §A.2 |
| G03 | docs/legal/CHECKLIST.md + 템플릿 | CPO | P1 | 2026-05-10 | No | pending | — |
| G04 | docs/hiring/ROLES-NEEDED.md | CPO | P2 | Sprint 3 | No | pending | — |
| G05 | scripts/prd-freeze-check.sh | CPO | **P0** | 2026-04-22 | Yes | pending | PROCESS §1.3, §7 |
| G06 | 결제 모듈 ADR | CPO | P1 | Sprint 2 | No | pending | — |
| G07 | scripts/ci-local.sh (4 gates) | CTO | P1 | Sprint 2 | No | pending | — |
| G08 | e2e/COVERAGE.md | CTO | P2 | Sprint 3 | No | pending | — |
| G09 | docs/data/ERD.md | CDO | P1 | Sprint 2 | No | pending | — |
| G10 | docs/data/PII-INVENTORY.md | CDO | **P0** | 2026-05-01 | Yes | pending | PIPA |
| G11 | Migration 013/014 rename ADR + sync script | CDO | **P0** | 2026-04-26 (hard gate: next production deploy 전) | Yes | **in_progress** (migration-number-check.sh added 2026-04-19; ADR-0007 + prod DB sync 잔여) | D-0001 |
| G12 | docs/ops/SLO.md | SRE | **P0** | 2026-04-26 | Yes | pending | — |
| G13 | scripts/ops/smoke-test.sh | SRE | P1 | Sprint 2 | Partial | pending | — |
| G14 | docs/ops/DEPLOY-CHECKLIST.md | SRE | P1 | Sprint 2 | No | pending | — |
| G15 | docs/design/DESIGN-SYSTEM.md | Designer | **P0** | 2026-04-26 | Yes | pending | Feed UI 전 |
| G16 | docs/design/COMPONENT-INVENTORY.md + 추출 script | Designer | P1 | Sprint 2 | No | pending | — |
| G17 | scripts/design-lint.sh | Designer | P1 | Sprint 2 | No | pending | — |

## Status Values

- `pending` — not started
- `in_progress` — ADR draft / script WIP
- `cooldown` — L-High 48h 쿨다운 대기
- `done` — merged

## Update Rule

Status 변경 시 이 파일 + 해당 role md의 Gap Actions 섹션 쌍방향 동기화.

## References

- Plan: `/Users/kangsangmo/Desktop/valueconnectx/.omc/plans/agent-roles-and-harness.md` §4
- HARNESS.md: `./HARNESS.md`
- Role files: `./{CEO,CPO,CTO,CDO,SRE,DESIGNER}.md`
