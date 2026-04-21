#!/usr/bin/env bash
# Detect duplicate migration numbers in supabase/migrations/
# Exit 0 if clean, 1 if duplicates found.
# Runs as pre-commit hook or manually.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

MIG_DIR="supabase/migrations"
[ -d "$MIG_DIR" ] || { echo "$MIG_DIR not found"; exit 0; }

# Extract leading 3-digit number (with optional letter suffix like 025b)
DUPES=$(ls "$MIG_DIR" | grep -oE '^[0-9]{3}[a-z]?' | sort | uniq -d)

if [ -z "$DUPES" ]; then
  echo "OK: no duplicate migration numbers"
  exit 0
else
  echo "FAIL: duplicate migration numbers detected:"
  for num in $DUPES; do
    echo "  $num:"
    ls "$MIG_DIR" | grep "^$num" | sed 's/^/    /'
  done
  echo ""
  echo "Known historical duplicates (013, 014): documented in ADR-0007 (pending)."
  echo "NEW duplicates must be resolved before commit."
  exit 1
fi
