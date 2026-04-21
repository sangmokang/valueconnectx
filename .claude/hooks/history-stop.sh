#!/usr/bin/env bash
# Claude Code Stop hook: log uncommitted doc edits to history.md.
set -e
REPO_ROOT=$(git -C "${CLAUDE_PROJECT_DIR:-$PWD}" rev-parse --show-toplevel 2>/dev/null) || exit 0
HISTORY="$REPO_ROOT/history.md"
[ -f "$HISTORY" ] || exit 0

CHANGED=$(cd "$REPO_ROOT" && git status --porcelain \
  | awk '{print $2}' \
  | grep -E '^(docs/(prd/|plans/|[^/]+\.md$)|\.omc/plans/.+\.md$)' \
  | grep -v '^history\.md$' || true)
[ -z "$CHANGED" ] && exit 0

SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"
MARKER="<!-- session:$SESSION_ID -->"
grep -q "$MARKER" "$HISTORY" && exit 0

DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M)

if ! grep -q "^## 부록 C — 자동 기록" "$HISTORY"; then
  cat >> "$HISTORY" <<'EOF'

## 부록 C — 자동 기록 (machine-generated)

이 섹션은 git post-commit 훅과 Claude Code Stop 훅이 자동 append 합니다. 수동 편집은 상단 내러티브 섹션에서 진행하세요.
EOF
fi

{
  echo ""
  echo "- **$DATE $TIME** _(session end · 미커밋 변경)_ $MARKER"
  echo "$CHANGED" | sed 's|^|  - |'
} >> "$HISTORY"

exit 0
