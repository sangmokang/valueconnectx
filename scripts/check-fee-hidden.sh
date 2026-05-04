#!/usr/bin/env bash
# check-fee-hidden.sh — ADR-0001 Enforcement: 멤버 UI 수수료 노출 금지
#
# 근거:
#   - ADR-0001 §Enforcement (docs/prd/ADR/ADR-0001-fee-structure-member-invisible.md)
#   - CLAUDE.md §1 (수익원 — 멤버 UI 노출 금지)
#   - FEATURE_MANIFEST L113·L183 (F-PEER-COFFEECHAT AC 1번·infra_minimum)
#
# 스캔 대상:
#   src/app/**, src/components/**  (멤버 UI)
#
# 제외 (corporate / operator / admin 전용 UI):
#   src/app/(protected)/admin/**
#   src/app/api/admin/**
#   src/components/admin/**
#
# 금지 패턴:
#   한글 — 수수료 / 성사 수수료 / 연봉 25% / 25% 수수료
#   영어 — fee / commission (word boundary)
#
# Exit:
#   0 = clean, 1 = violation
#
# Modes:
#   (no arg)   all — scan whole tracked working tree (CI/manual verification)
#   --staged   scan git diff --cached (pre-commit hook)

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

MODE="all"
[[ "${1:-}" == "--staged" ]] && MODE="staged"

# Target file filter (paths + extensions)
FILE_REGEX='^src/(app|components)/.*\.(ts|tsx|js|jsx)$'
EXEMPT_REGEX='^src/app/\(protected\)/admin/|^src/app/api/admin/|^src/components/admin/'

# Forbidden patterns (ERE)
#   - Korean literal strings
#   - 25% 관련 연봉/수수료 맥락
#   - fee / commission (word boundary)
PATTERN_KO='수수료|성사[[:space:]]*수수료|연봉[[:space:]]*25%|25%[[:space:]]*(수수료|연봉)'
PATTERN_EN='\b(fee|commission)\b'
PATTERN="${PATTERN_KO}|${PATTERN_EN}"

# ── Gather candidate files ────────────────────────────────────────────────────
if [[ "$MODE" == "staged" ]]; then
  FILES=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null \
    | grep -E "$FILE_REGEX" \
    | grep -vE "$EXEMPT_REGEX" \
    || true)
else
  FILES=$(git ls-files 'src/app/*' 'src/components/*' 2>/dev/null \
    | grep -E "$FILE_REGEX" \
    | grep -vE "$EXEMPT_REGEX" \
    || true)
fi

if [[ -z "$FILES" ]]; then
  echo "fee-hidden: no member-UI files to scan"
  exit 0
fi

# ── Scan ──────────────────────────────────────────────────────────────────────
HITS=""
while IFS= read -r f; do
  [[ -z "$f" || ! -f "$f" ]] && continue
  MATCH=$(grep -nE "$PATTERN" "$f" 2>/dev/null || true)
  if [[ -n "$MATCH" ]]; then
    HITS+=$(echo "$MATCH" | sed "s|^|$f:|")$'\n'
  fi
done <<< "$FILES"

if [[ -z "$HITS" ]]; then
  echo "fee-hidden: OK (멤버 UI 에 수수료/커미션 패턴 없음)"
  exit 0
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  BLOCK: ADR-0001 violation — 멤버 UI 에 수수료 정보 노출             ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Rule: ADR-0001 §Decision — 수수료는 vcx_corporate_users 전용 UI 에만 표시"
echo ""
echo "Hits:"
echo "$HITS" | sed 's/^/  /'
echo ""
echo "Action options:"
echo "  1. 카피를 '성사 연결' · '매칭 성공' · '검증 완료' 등 비공개 표현으로 교체"
echo "  2. 해당 코드를 corporate/admin 전용 경로로 이동:"
echo "       src/app/(protected)/admin/**  |  src/app/api/admin/**  |  src/components/admin/**"
echo "  3. 긴급 bypass (discouraged): git commit --no-verify"
echo "       PROCESS §1.1 긴급 트랙 3종 한정 (Legal / User Harm / Cost Explosion)"
echo ""
exit 1
