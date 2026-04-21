# Documentation Convention — ValueConnect X

> Authored: 2026-04-19 by CEO. L-High file. 48h cooldown applies to changes.
> Related: PROCESS.md §6, roles/CPO.md, roles/CEO.md

## 1. Filename Rules

| Pattern | Example | Usage |
|---------|---------|-------|
| `kebab-case.md` | `design-review.md` | Default |
| `YYYY-MM-DD-subject.md` | `2026-04-17-process-review.md` | Retrospectives, snapshots |
| `subject-vN.md` or `subject-N.N.md` | `prd-6.0.md` | Versioned docs (hyphen separator) |
| `ADR-NNNN-kebab-title.md` | `ADR-0001-fee-structure-member-invisible.md` | Architecture Decision Records |

### Forbidden
- CamelCase: `BMplan.md`, `Branding.md`, `Operationplan.md`
- snake_case: `valueconnect_new.md`
- No separator numbers: `prd6.0.md`, `260401vcx-complete.jsx`
- Non-semantic prefixes: `p1-`, `p2-p4-` (use sprint folder instead)

### SoT Exceptions (UPPERCASE allowed)
`PROCESS.md`, `CLAUDE.md`, `AGENTS.md`, `README.md` (industry convention).

## 2. Folder Taxonomy

| Folder | Contents |
|--------|----------|
| `docs/` root | `README.md` (index), `DOC-CONVENTION.md`, `PROCESS.md`, `prd-6.0.md` (authoritative PRD) |
| `docs/prd/ADR/` | Architecture Decision Records |
| `docs/prd/_archive/` | Historical PRD versions (non-authoritative) |
| `docs/plans/` | Sprint / vertical slice plans |
| `docs/sdd/` | Specs-driven development (FEATURE_MANIFEST, contracts, schemas, DEBT_LEDGER) |
| `docs/roles/` | C-role harness definitions (6 roles + HARNESS + GAP-LEDGER) |
| `docs/strategy/` | CEO memos (monthly), market scans (quarterly) |
| `docs/ops/` | Runbooks, SLO, deploy checklists |
| `docs/design/` | Branding, design review, figma prompts, design system |
| `docs/marketing/` | Booth scripts, BM plan, growth materials |
| `docs/engineering/` | Dev workflows, retrospectives, open questions |
| `docs/superpowers/` | AI-dev plan capture |
| `docs/_archive/` | Legacy / superseded docs (read-only reference) |

## 3. Repo Root Policy

Repo root keeps ONLY: `README.md`, `CLAUDE.md`, `AGENTS.md`, `history.md`, `vercel.json`, `package*.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.mjs`, `playwright.config.ts`, `postcss.config.mjs`, `components.json`, `init.sh`, `instrumentation-client.ts`, `.env.example`, `.gitignore`.

All other markdown/json docs → `docs/_archive/` or appropriate subfolder.

## 4. Migration Rules

- Moves MUST use `git mv` where file is tracked (preserves history)
- Untracked moves use plain `mv`
- Cross-references in `CLAUDE.md`, `AGENTS.md`, `PROCESS.md` must be updated in the same PR
- NEVER rename without updating references
- NEVER delete — always archive

## 5. Enforcement

Pre-commit (Sprint 2, TBD): reject new docs violating naming.
Manual review: PR description must list any doc moves.

## References

- PROCESS.md §6 (plan 3-active cap)
- docs/roles/CPO.md (document ownership)
- docs/roles/CEO.md (L-High authority)
