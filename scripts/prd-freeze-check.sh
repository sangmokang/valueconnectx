#!/usr/bin/env bash
# prd-freeze-check.sh — Pre-commit guard for PRD/PROCESS/MANIFEST changes.
# Per PROCESS.md §1.3 & §7.
# Exit 0 = pass, 1 = block.
#
# Invocation:
#   - As pre-commit hook: runs against staged files (git diff --cached --name-only)
#   - Manual check:       bash scripts/prd-freeze-check.sh
#   - Manual all-mode:    bash scripts/prd-freeze-check.sh --all
#
# To install as a pre-commit hook (if you don't already have one):
#   echo '#!/usr/bin/env bash\nbash scripts/prd-freeze-check.sh || exit 1' > .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# If you use a hook manager (husky, lefthook, pre-commit), add:
#   bash scripts/prd-freeze-check.sh
# as a pre-commit step in your config instead.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

MODE="staged"
[[ "${1:-}" == "--all" ]] && MODE="all"

# ── Get changed files ─────────────────────────────────────────────────────────
if [[ "$MODE" == "staged" ]]; then
  CHANGED=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true)
else
  # Manual all-mode: compare working tree vs HEAD
  CHANGED=$(git diff --name-only HEAD --diff-filter=ACMR 2>/dev/null || true)
fi

if [[ -z "$CHANGED" ]]; then
  echo "prd-freeze: no changes detected"
  exit 0
fi

# ── Protected authoritative files ─────────────────────────────────────────────
# NOTE: PRD file is docs/prd-6.0.md (kebab-case) — renamed 2026-04-19 per DOC-CONVENTION.md
PROTECTED_REGEX='^(docs/prd-6\.0\.md|docs/PROCESS\.md|docs/sdd/FEATURE_MANIFEST\.yaml)$'

# ── Detect protected file changes ─────────────────────────────────────────────
PRD_CHANGES=$(echo "$CHANGED" | grep -E "$PROTECTED_REGEX" || true)

# ── Detect ADR additions/modifications ────────────────────────────────────────
# Expected pattern: docs/prd/ADR/ADR-NNNN-kebab-title.md
ADR_REGEX='^docs/prd/ADR/ADR-[0-9]{4}-[a-z0-9-]+\.md$'
ADR_CHANGES=$(echo "$CHANGED" | grep -E "$ADR_REGEX" || true)

# ── No protected files touched → pass ─────────────────────────────────────────
if [[ -z "$PRD_CHANGES" ]]; then
  echo "prd-freeze: OK (no protected file changes)"
  exit 0
fi

echo "prd-freeze: protected file changes detected:"
echo "$PRD_CHANGES" | sed 's/^/  - /'

# ── Protected file changed but no ADR → BLOCK ─────────────────────────────────
if [[ -z "$ADR_CHANGES" ]]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════════════════╗"
  echo "║  BLOCK: PROCESS.md §1.2 violation                                   ║"
  echo "╚══════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Protected file(s) were modified without an accompanying ADR."
  echo ""
  echo "  Rule: '논의 자유, 결정은 ADR로 닫는다' (PROCESS.md §1.2)"
  echo ""
  echo "  Required: Include a new or updated file matching:"
  echo "    docs/prd/ADR/ADR-NNNN-kebab-title.md"
  echo "  in the same commit as the protected-file change."
  echo ""
  echo "  ADR series guidance (PROCESS.md §7):"
  echo "    ADR-0000-*  → PROCESS/governance changes"
  echo "    ADR-0001-*  → PRD scope / feature decisions"
  echo "    ADR-0002-*  → FEATURE_MANIFEST changes"
  echo ""
  echo "  Emergency bypass tracks (PROCESS.md §1.1 — use sparingly):"
  echo "    - Legal Blocker  : PIPA / personal-info risk"
  echo "    - User Harm      : release could harm users"
  echo "    - Cost Explosion : monthly API cost >150% budget"
  echo ""
  echo "  To bypass this hook (discouraged): git commit --no-verify"
  echo ""
  exit 1
fi

# ── Protected file + ADR present → PASS ───────────────────────────────────────
echo ""
echo "prd-freeze: ADR present — OK"
echo "$ADR_CHANGES" | sed 's/^/  + /'
exit 0
