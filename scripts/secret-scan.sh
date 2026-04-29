#!/usr/bin/env bash
# secret-scan.sh — Pre-commit secret / PII detector (Harness §7.4)
# Exit 0 = clean, 1 = secret detected.
#
# Modes:
#   staged (default) — scan `git diff --cached` (staged changes only)
#   --all            — scan entire working tree vs HEAD
#   --files <paths>  — scan given paths only (CI use)
#
# Bypass (discouraged — audit trail required): git commit --no-verify

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

MODE="staged"
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

# ── Parse arguments ───────────────────────────────────────────────────────────
if [[ "${1:-}" == "--all" ]]; then
  MODE="all"
elif [[ "${1:-}" == "--files" ]]; then
  MODE="files"
  shift
  FILE_PATHS=("$@")
fi

# ── Collect diff content to scan ──────────────────────────────────────────────
case "$MODE" in
  staged)
    # Staged changes only — skip lines from excluded paths
    git diff --cached --unified=0 --diff-filter=ACMR 2>/dev/null | perl -ne '
      if (/^\+\+\+ b\/(.+)/) { $file = $1; }
      elsif (/^\+/ && !/^\+\+\+/) {
        next if $file =~ m{(^docs/|^tests/|scripts/qa-rls/|\.env\.example|node_modules/|scripts/secret-scan\.sh|\.test\.ts|\.spec\.ts)};
        print $_;
      }
    ' > "$TEMP_FILE" || true
    ;;
  all)
    # Entire tree vs HEAD — skip lines from excluded paths
    git diff --unified=0 HEAD --diff-filter=ACMR 2>/dev/null | perl -ne '
      if (/^\+\+\+ b\/(.+)/) { $file = $1; }
      elsif (/^\+/ && !/^\+\+\+/) {
        next if $file =~ m{(^docs/|^tests/|scripts/qa-rls/|\.env\.example|node_modules/|scripts/secret-scan\.sh|\.test\.ts|\.spec\.ts)};
        print $_;
      }
    ' > "$TEMP_FILE" || true
    ;;
  files)
    # Explicit file list (for CI/manual scanning)
    for file in "${FILE_PATHS[@]}"; do
      [[ -f "$file" ]] && cat "$file" >> "$TEMP_FILE"
    done
    ;;
esac

# ── Exclude paths that shouldn't be scanned ───────────────────────────────────
# Remove lines from files we know contain examples or non-production content
EXCLUDED_PATHS=("docs/" "tests/" "scripts/qa-rls/" ".env.example" "node_modules/" "scripts/secret-scan.sh" "\.test\.ts" "\.spec\.ts")

# ── Define detection patterns (ordered by priority) ────────────────────────────
declare -a DETECTIONS
declare -a PATTERN_NAMES

# 1. AWS Access Key ID (AKIA prefix + 16 alphanumeric chars)
DETECTIONS+=('AKIA[0-9A-Z]{16}')
PATTERN_NAMES+=('AWS Access Key ID')

# 2. AWS Secret Access Key (aws.*= followed by 40-char base64-like string in quotes)
DETECTIONS+=('aws.{0,30}["\x27][0-9a-zA-Z/+]{38,}["\x27]')
PATTERN_NAMES+=('AWS Secret Access Key')

# 3. Google API Key (AIza prefix + 35 URL-safe chars)
DETECTIONS+=('AIza[0-9A-Za-z_-]{35}')
PATTERN_NAMES+=('Google API Key')

# 4. JWT token (3 base64-like segments separated by dots)
DETECTIONS+=('eyJ[A-Za-z0-9_=-]{20,}\.[A-Za-z0-9_=-]{20,}\.[A-Za-z0-9_=-]{20,}')
PATTERN_NAMES+=('JWT Token')

# 5. Private key block (PEM format)
DETECTIONS+=('-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----')
PATTERN_NAMES+=('Private Key Block')

# 6. Korean SSN (주민등록번호) — NNNNNN-1..4NNNNNN
DETECTIONS+=('[0-9]{6}-[1-4][0-9]{6}')
PATTERN_NAMES+=('Korean SSN')

# 7. Korean phone number — skip all-zero patterns like 010-0000-0000
# Pattern: 01[016789]-NNNN-NNNN but NOT 010-0000-0000, 010-1111-1111, etc.
# Implementation: use negative lookahead in perl
DETECTIONS+=('01[016789]-[0-9]{3,4}-[0-9]{4}')
PATTERN_NAMES+=('Korean Phone Number')

# 8. Credit card (NNNN-NNNN-NNNN-NNNN) — skip Stripe test card 4242-4242-4242-4242
DETECTIONS+=('[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}')
PATTERN_NAMES+=('Credit Card Number')

# ── Scan for secrets ──────────────────────────────────────────────────────────
FOUND_SECRETS=0
FOUND_LINES=""

if [[ ! -s "$TEMP_FILE" ]]; then
  echo "secret-scan: no changes to scan"
  exit 0
fi

# Use Perl for more robust regex matching (macOS grep doesn't support -P)
for i in "${!DETECTIONS[@]}"; do
  pattern="${DETECTIONS[$i]}"
  pattern_name="${PATTERN_NAMES[$i]}"

  # Special handling for Korean patterns to exclude all-zero sequences
  if [[ "$pattern_name" == "Korean Phone Number" ]]; then
    # Match phone but NOT all-zero, all-one, all-two patterns
    matches=$(perl -ne "
      if (/01[016789]-[0-9]{3,4}-[0-9]{4}/) {
        # Extract the numeric part (remove hyphens)
        \$_ =~ /01[016789]-([0-9]{3,4})-([0-9]{4})/;
        \$mid = \$1; \$end = \$2;
        # Skip if all same digit
        unless (\$mid =~ /^(\d)\1+\$/ && \$end =~ /^(\d)\1+\$/) {
          print \$_;
        }
      }
    " "$TEMP_FILE"
    )
  elif [[ "$pattern_name" == "Credit Card Number" ]]; then
    # Match card but NOT Stripe test card 4242-4242-4242-4242
    matches=$(perl -ne "
      if (/([0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4})/) {
        \$card = \$1;
        unless (\$card eq '4242-4242-4242-4242') {
          print \$_;
        }
      }
    " "$TEMP_FILE"
    )
  else
    # Standard pattern matching
    matches=$(perl -ne "print if /$pattern/" "$TEMP_FILE" 2>/dev/null || true)
  fi

  if [[ -n "$matches" ]]; then
    # Filter out false positives from excluded paths
    for path in "${EXCLUDED_PATHS[@]}"; do
      # Skip this match category if it's in an excluded path
      if echo "$matches" | grep -q "$path"; then
        # For docs, test files, examples — suppress
        matches=$(echo "$matches" | grep -v "$path" || true)
      fi
    done
  fi

  if [[ -n "$matches" ]]; then
    FOUND_SECRETS=1
    FOUND_LINES+=$(printf "%s\n" "$matches" | sed "s/^/    [$pattern_name] /")$'\n'
  fi
done

# ── Report results ────────────────────────────────────────────────────────────
if [[ $FOUND_SECRETS -eq 1 ]]; then
  cat >&2 <<EOF
FAIL: secret scan detected potential exposures:

$FOUND_LINES

조치:
  1. 해당 파일에서 secret 제거
     git restore --staged <file>
     (파일 편집 후) git add <file>
  2. 실제 노출 의심 시 git-filter-repo 로 history rewrite 고려
  3. 테스트 fixture 라면 EXAMPLE_ / PLACEHOLDER_ 접두 사용
     (테스트 카드: 4242-4242-4242-4242 자동 제외)

우회 (감사 트레일 요구됨): git commit --no-verify

EOF
  exit 1
fi

echo "secret-scan: OK (no secrets detected)"
exit 0
