#!/usr/bin/env bash
# role-harness-check.sh — Verify VCX role harness infrastructure
# Usage: bash scripts/role-harness-check.sh
# Exit: 0=pass, 1=missing artifact, 2=format violation

set -uo pipefail
# Run from repo root
cd "$(dirname "$0")/.." || exit 1

EXIT_CODE=0
MISSING_FILES=""
FORMAT_ISSUES=""

fail_missing() { MISSING_FILES="$MISSING_FILES $1"; EXIT_CODE=1; }
fail_format() { FORMAT_ISSUES="$FORMAT_ISSUES\n  - $1"; [ "$EXIT_CODE" -lt 2 ] && EXIT_CODE=2; }

echo "== Role Harness Check =="

# 1. required files
REQUIRED="docs/roles/README.md docs/roles/CEO.md docs/roles/CPO.md docs/roles/CTO.md docs/roles/CDO.md docs/roles/SRE.md docs/roles/DESIGNER.md docs/roles/HARNESS.md docs/roles/GAP-LEDGER.md"
for f in $REQUIRED; do
  if [ -f "$f" ]; then echo "  ✓ $f"; else echo "  ✗ $f (missing)"; fail_missing "$f"; fi
done

# 2. role md H2 sections
ROLES="CEO CPO CTO CDO SRE DESIGNER"
for r in $ROLES; do
  f="docs/roles/$r.md"
  [ -f "$f" ] || continue
  count=$(grep -c '^## ' "$f" || true)
  if [ "$count" -ge 9 ]; then
    echo "  ✓ $f has $count H2 sections"
  else
    echo "  ✗ $f has only $count H2 sections (need ≥9)"
    fail_format "$f: only $count H2 sections"
  fi
done

# 3. OMC agent smoke
AGENT_DIR=$(ls -d "$HOME"/.claude/plugins/cache/omc/oh-my-claudecode/*/agents 2>/dev/null | sort -V | tail -1)
if [ -z "$AGENT_DIR" ]; then
  echo "  ✗ OMC agents directory not found"
  fail_format "OMC agents directory missing"
else
  echo "  ✓ using agent dir: $AGENT_DIR"
  AGENTS="planner scientist product-manager architect test-engineer qa-tester verifier build-fixer code-reviewer security-reviewer executor designer style-reviewer ux-researcher vision document-specialist writer information-architect"
  for a in $AGENTS; do
    if [ -f "$AGENT_DIR/$a.md" ]; then
      :
    else
      echo "  ✗ agent missing: $a"
      fail_format "agent missing: $a"
    fi
  done
  [ -z "$FORMAT_ISSUES" ] && echo "  ✓ all 18 OMC agents present"
fi

# 4. PROCESS Annex A
if grep -q "Annex A" docs/PROCESS.md 2>/dev/null; then
  echo "  ✓ PROCESS.md contains Annex A"
else
  echo "  ✗ PROCESS.md missing Annex A section"
  fail_format "PROCESS.md missing Annex A"
fi

echo
echo "== Summary =="
if [ "$EXIT_CODE" -eq 0 ]; then
  echo "OK: role harness infrastructure intact"
else
  [ -n "$MISSING_FILES" ] && echo "MISSING FILES:$MISSING_FILES"
  [ -n "$FORMAT_ISSUES" ] && echo -e "FORMAT ISSUES:$FORMAT_ISSUES"
  echo "FAIL (exit $EXIT_CODE)"
fi

exit $EXIT_CODE
