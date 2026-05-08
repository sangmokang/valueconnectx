#!/usr/bin/env bash
# VCX SRE smoke-test
# ----------------------------------------------------------------------------
# Production / Preview 배포 직후 또는 정기적으로 실행하는 smoke-test.
# 6 개의 체크를 순차로 실행하고 각 단계는 PASS/FAIL/SKIP 으로 표시한다.
# 한 항목이 실패해도 다음 체크는 계속 실행되고, 마지막에 종합 결과로
# exit code 0 (전부 통과 또는 SKIP) 또는 1 (FAIL 1 개 이상) 을 반환한다.
#
# 사용법:
#   BASE_URL=https://valueconnect.kr bash scripts/ops/smoke-test.sh
#   BASE_URL=http://localhost:3100   bash scripts/ops/smoke-test.sh
#   bash scripts/ops/smoke-test.sh --dry-run     # 외부 호출 없이 계획만 출력
#
# 환경 변수 (모두 선택):
#   BASE_URL          기본 https://valueconnect.kr
#   MAIL_DOMAIN       기본 valueconnect.kr (SPF/DKIM/DMARC dig 대상)
#   DKIM_SELECTOR     기본 resend (Resend 가 발급한 DKIM 셀렉터)
#   SENTRY_DSN        설정 시 호스트 reachability 만 확인
#   VERCEL_PROJECT    vercel ls --json 에서 사용할 프로젝트 이름 (선택)
#   TIMEOUT           curl --max-time 초 (기본 15)
#
# 의존성: bash, curl, dig, jq (jq 와 vercel 은 미설치 시 일부 SKIP).
# 외부 비용/알림이 발생할 수 있으므로 prod 직접 호출 전 --dry-run 권장.
# ----------------------------------------------------------------------------

set -euo pipefail

DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help)
      sed -n '2,30p' "$0"
      exit 0
      ;;
    *)
      echo "[ERROR] 알 수 없는 옵션: $arg" >&2
      exit 2
      ;;
  esac
done

BASE_URL="${BASE_URL:-https://valueconnect.kr}"
MAIL_DOMAIN="${MAIL_DOMAIN:-valueconnect.kr}"
DKIM_SELECTOR="${DKIM_SELECTOR:-resend}"
TIMEOUT="${TIMEOUT:-15}"

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
FAIL_NOTES=()

print_header() {
  echo "============================================================"
  echo " VCX smoke-test"
  echo " BASE_URL     : $BASE_URL"
  echo " MAIL_DOMAIN  : $MAIL_DOMAIN"
  echo " DKIM_SELECTOR: $DKIM_SELECTOR"
  echo " DRY_RUN      : $DRY_RUN"
  echo " TIMESTAMP    : $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo "============================================================"
}

step() {
  # step "<n>" "<title>"
  echo
  echo "--- [$1/6] $2 ---"
}

mark_pass() {
  echo "[PASS] $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

mark_fail() {
  # mark_fail "<msg>" "<action hint>"
  echo "[FAIL] $1"
  echo "       조치: $2"
  FAIL_COUNT=$((FAIL_COUNT + 1))
  FAIL_NOTES+=("$1 / 조치: $2")
}

mark_skip() {
  echo "[SKIP] $1"
  SKIP_COUNT=$((SKIP_COUNT + 1))
}

dry_echo() {
  echo "[DRY] would run: $*"
}

# ---------------------------------------------------------------------------
# 1) Root URL 200
# ---------------------------------------------------------------------------
check_root() {
  step 1 "$BASE_URL/ 200 응답"
  if [[ $DRY_RUN -eq 1 ]]; then
    dry_echo "curl -sS -o /dev/null -w '%{http_code}' --max-time $TIMEOUT $BASE_URL/"
    mark_skip "dry-run"
    return
  fi
  local code
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" "$BASE_URL/" || echo "000")
  if [[ "$code" == "200" ]]; then
    mark_pass "root 200"
  else
    mark_fail "root status=$code (BASE_URL=$BASE_URL)" \
      "Vercel 대시보드에서 최신 배포 상태/도메인 바인딩 확인. 필요 시 rollback."
  fi
}

# ---------------------------------------------------------------------------
# 2) /api/health JSON ok:true
# ---------------------------------------------------------------------------
check_health() {
  step 2 "$BASE_URL/api/health -> { ok: true }"
  if [[ $DRY_RUN -eq 1 ]]; then
    dry_echo "curl -sS --max-time $TIMEOUT $BASE_URL/api/health"
    mark_skip "dry-run"
    return
  fi
  local body code
  body=$(curl -sS --max-time "$TIMEOUT" -w '\n__HTTP__%{http_code}' "$BASE_URL/api/health" 2>/dev/null || true)
  code=$(printf '%s' "$body" | sed -n 's/.*__HTTP__\([0-9]*\)$/\1/p' | tail -n1)
  body=$(printf '%s' "$body" | sed 's/__HTTP__[0-9]*$//')
  if [[ "$code" != "200" ]]; then
    mark_fail "/api/health status=$code" \
      "Vercel runtime 로그 확인 + Sentry P0 큐 점검."
    return
  fi
  if command -v jq >/dev/null 2>&1; then
    local ok
    ok=$(printf '%s' "$body" | jq -r 'try .ok // empty' 2>/dev/null || echo "")
    if [[ "$ok" == "true" ]]; then
      mark_pass "/api/health ok=true"
    else
      mark_fail "/api/health body 비정상: $(printf '%s' "$body" | head -c 200)" \
        "API 핸들러 회귀 — src/app/api/health/route.ts 점검."
    fi
  else
    if printf '%s' "$body" | grep -q '"ok"[[:space:]]*:[[:space:]]*true'; then
      mark_pass "/api/health ok=true (no jq)"
    else
      mark_fail "/api/health body 비정상 (jq 없음): $(printf '%s' "$body" | head -c 200)" \
        "jq 설치 후 재검증 또는 API 핸들러 점검."
    fi
  fi
}

# ---------------------------------------------------------------------------
# 3) /api/health/db (있으면 200, 없으면 SKIP)
# ---------------------------------------------------------------------------
check_health_db() {
  step 3 "$BASE_URL/api/health/db (선택)"
  if [[ $DRY_RUN -eq 1 ]]; then
    dry_echo "curl -sS -o /dev/null -w '%{http_code}' --max-time $TIMEOUT $BASE_URL/api/health/db"
    mark_skip "dry-run"
    return
  fi
  local code
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" "$BASE_URL/api/health/db" || echo "000")
  case "$code" in
    200)
      mark_pass "/api/health/db 200"
      ;;
    404)
      mark_skip "/api/health/db 미구현 (404)"
      ;;
    *)
      mark_fail "/api/health/db status=$code" \
        "Supabase 가용성 + Service Role 키 회전 확인."
      ;;
  esac
}

# ---------------------------------------------------------------------------
# 4) DNS — SPF / DKIM / DMARC
# ---------------------------------------------------------------------------
check_dns() {
  step 4 "Resend DNS (SPF / DKIM / DMARC) — domain=$MAIL_DOMAIN"
  if ! command -v dig >/dev/null 2>&1; then
    mark_fail "dig 미설치" "macOS: brew install bind. CI: dnsutils 설치."
    return
  fi
  if [[ $DRY_RUN -eq 1 ]]; then
    dry_echo "dig +short TXT $MAIL_DOMAIN"
    dry_echo "dig +short TXT ${DKIM_SELECTOR}._domainkey.$MAIL_DOMAIN"
    dry_echo "dig +short TXT _dmarc.$MAIL_DOMAIN"
    mark_skip "dry-run"
    return
  fi

  local spf dkim dmarc
  spf=$(dig +short TXT "$MAIL_DOMAIN" 2>/dev/null | grep -i 'v=spf1' || true)
  dkim=$(dig +short TXT "${DKIM_SELECTOR}._domainkey.$MAIL_DOMAIN" 2>/dev/null || true)
  dmarc=$(dig +short TXT "_dmarc.$MAIL_DOMAIN" 2>/dev/null | grep -i 'v=DMARC1' || true)

  local local_fail=0
  if [[ -n "$spf" ]]; then
    echo "  SPF  : OK"
  else
    echo "  SPF  : MISSING"
    local_fail=1
  fi
  if [[ -n "$dkim" ]]; then
    echo "  DKIM : OK ($DKIM_SELECTOR)"
  else
    echo "  DKIM : MISSING ($DKIM_SELECTOR._domainkey.$MAIL_DOMAIN)"
    local_fail=1
  fi
  if [[ -n "$dmarc" ]]; then
    echo "  DMARC: OK"
  else
    echo "  DMARC: MISSING"
    local_fail=1
  fi

  if [[ $local_fail -eq 0 ]]; then
    mark_pass "SPF/DKIM/DMARC 모두 존재"
  else
    mark_fail "이메일 인증 레코드 누락" \
      "Resend 대시보드에서 권장 TXT 복사 후 도메인 DNS 에 반영."
  fi
}

# ---------------------------------------------------------------------------
# 5) Sentry reachability (옵션)
# ---------------------------------------------------------------------------
check_sentry() {
  step 5 "Sentry DSN reachability"
  if [[ -z "${SENTRY_DSN:-}" ]]; then
    mark_skip "SENTRY_DSN 미설정"
    return
  fi
  # DSN 형식: https://<key>@<host>/<project>
  local host
  host=$(printf '%s' "$SENTRY_DSN" | sed -n 's#^https\?://[^@]*@\([^/]*\)/.*#\1#p')
  if [[ -z "$host" ]]; then
    mark_fail "SENTRY_DSN 파싱 실패" "DSN 포맷 https://<key>@<host>/<project> 인지 확인."
    return
  fi
  if [[ $DRY_RUN -eq 1 ]]; then
    dry_echo "curl -sS -o /dev/null -w '%{http_code}' --max-time $TIMEOUT https://$host/"
    mark_skip "dry-run"
    return
  fi
  local code
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" "https://$host/" || echo "000")
  # Sentry ingest host 는 보통 200/404/405 등으로 alive 임을 알려준다.
  if [[ "$code" =~ ^(200|301|302|400|403|404|405)$ ]]; then
    mark_pass "Sentry host reachable ($host, code=$code)"
  else
    mark_fail "Sentry host 응답 이상 (host=$host, code=$code)" \
      "Sentry status page + 네트워크 (egress) 확인."
  fi
}

# ---------------------------------------------------------------------------
# 6) Vercel 최신 배포 SHA == git HEAD
# ---------------------------------------------------------------------------
check_vercel_sha() {
  step 6 "Vercel 최신 배포 SHA vs git HEAD"
  if ! command -v git >/dev/null 2>&1; then
    mark_skip "git 미설치"
    return
  fi
  local head_sha
  head_sha=$(git rev-parse HEAD 2>/dev/null || true)
  if [[ -z "$head_sha" ]]; then
    mark_skip "git HEAD 확인 실패"
    return
  fi
  echo "  git HEAD: $head_sha"

  if ! command -v vercel >/dev/null 2>&1; then
    mark_skip "vercel CLI 미설치 — 'npm i -g vercel' 후 재실행"
    return
  fi
  if ! command -v jq >/dev/null 2>&1; then
    mark_skip "jq 미설치 — 'brew install jq' 후 재실행"
    return
  fi
  if [[ $DRY_RUN -eq 1 ]]; then
    dry_echo "vercel ls ${VERCEL_PROJECT:-} --json | jq -r '.[0].meta.githubCommitSha'"
    mark_skip "dry-run"
    return
  fi

  local vercel_sha
  vercel_sha=$(vercel ls ${VERCEL_PROJECT:-} --json 2>/dev/null \
    | jq -r 'if type=="array" then .[0].meta.githubCommitSha else .deployments[0].meta.githubCommitSha end' \
    2>/dev/null || true)

  if [[ -z "$vercel_sha" || "$vercel_sha" == "null" ]]; then
    mark_skip "vercel CLI 응답에서 SHA 추출 실패 (로그인/프로젝트 link 확인)"
    return
  fi
  echo "  vercel  : $vercel_sha"
  if [[ "$vercel_sha" == "$head_sha" ]]; then
    mark_pass "git HEAD == Vercel 최신 배포 SHA"
  else
    mark_fail "git HEAD($head_sha) != Vercel($vercel_sha)" \
      "main 푸시 후 Vercel 빌드 완료 대기. 의도치 않은 차이면 즉시 롤백 검토."
  fi
}

# ---------------------------------------------------------------------------
print_header
check_root
check_health
check_health_db
check_dns
check_sentry
check_vercel_sha

echo
echo "============================================================"
echo " 결과 요약: PASS=$PASS_COUNT  FAIL=$FAIL_COUNT  SKIP=$SKIP_COUNT"
if [[ $FAIL_COUNT -gt 0 ]]; then
  echo " 실패 항목:"
  for note in "${FAIL_NOTES[@]}"; do
    echo "  - $note"
  done
fi
echo "============================================================"

if [[ $FAIL_COUNT -gt 0 ]]; then
  exit 1
fi
exit 0
