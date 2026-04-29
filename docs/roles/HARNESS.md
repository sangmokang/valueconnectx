# ValueConnect X — Role Harness Matrix

> Annex A of docs/PROCESS.md. Maps each C-role to its execution environment: OMC agents, skills, tools, file roots, verification commands, and quality gates.

## 1. Master Matrix

| Role | Primary Agents (+ model) | Skills owned | Skills enforced | Tools | File roots | Quality gate command |
|------|-------------------------|--------------|-----------------|-------|-----------|---------------------|
| CEO | planner (opus), scientist (opus) | — | ADR convention | WebSearch, WebFetch, context7 | `docs/strategy/`, `docs/prd/ADR/` | ADR L-High 48h cooldown |
| CPO | product-manager (sonnet), document-specialist, writer, information-architect | — | all skills/SKILL-*.md | — | `docs/prd/`, `docs/plans/`, `docs/legal/`, `docs/hiring/` | scripts/prd-freeze-check.sh |
| CTO | architect (opus), test-engineer, qa-tester, verifier, build-fixer, code-reviewer, security-reviewer | testing-vitest, supabase-ssr, api-route-convention, zod-validation | supabase-migration, vcx-design-system | LSP tools, Playwright | `src/`, `e2e/`, `supabase/migrations/` | npm run build && npm run lint && npm test && npm run test:e2e |
| CDO | scientist (opus), architect, executor | supabase-migration | supabase-ssr | python_repl, Supabase SQL | `supabase/migrations/`, `docs/data/`, `docs/sdd/schemas/` | migration dry-run + RLS tests |
| DevOps/SRE | executor, verifier | — | — | Vercel CLI, Supabase CLI, mcp__sentry__* | `docs/ops/`, `scripts/ops/`, `.github/workflows/` | smoke test + SLO dashboard |
| Chief Designer | designer, style-reviewer, ux-researcher, vision | vcx-design-system | — | Playwright screenshot, 21st magic builder | `src/components/ui/`, `src/constants/`, `docs/design/` | scripts/design-lint.sh + Galaxy 360px test |

## 2. Agent Smoke Check (AC-7)

Verify all agents exist in OMC agents directory (version-agnostic glob):

```bash
AGENT_DIR=$(ls -d $HOME/.claude/plugins/cache/omc/oh-my-claudecode/*/agents 2>/dev/null | sort -V | tail -1)
AGENTS="planner scientist product-manager architect test-engineer qa-tester verifier build-fixer code-reviewer security-reviewer executor designer style-reviewer ux-researcher vision document-specialist writer information-architect"
MISSING=""
for a in $AGENTS; do
  [ -f "$AGENT_DIR/$a.md" ] || MISSING="$MISSING $a"
done
[ -z "$MISSING" ] && echo "OK: all agents present" || { echo "MISSING:$MISSING"; exit 1; }
```

## 3. Cross-role Interfaces

- CPO (product spec) → CTO (implementation) → CDO (data layer)
- CDO (schema design) → CTO (migration file) → SRE (deploy gate)
- Designer (tokens/components) → CTO (enforce in code) → SRE (CI lint)
- CEO (strategy) → CPO (PRD/ADR) → all roles (execution)

## 4. Decision Authority by L-Tier (per PROCESS.md §4.1)

| Change type | L-Tier | Who owns | Cooldown |
|------------|--------|----------|----------|
| PRD/PROCESS/MANIFEST/ADR | L-High | CPO (CEO for vision) | 48h |
| Migration, API, new UI page | L-Std | CTO (CDO for data design) | Self+CI |
| Role file Scope change | L-High | self (1-person) | 48h |
| Role file content polish | L-Std | self | Self+CI |

## 5. References

- Plan: `/Users/kangsangmo/Desktop/valueconnectx/.omc/plans/agent-roles-and-harness.md`
- Skills: `/Users/kangsangmo/Desktop/valueconnectx/skills/SKILL-*.md`
- OMC agents: `$HOME/.claude/plugins/cache/omc/oh-my-claudecode/*/agents/`
- PROCESS: `../PROCESS.md` Annex A
