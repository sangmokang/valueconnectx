#!/bin/bash
# VCX 헬스체크 크론 스크립트 — 맥북에서 10분 주기 실행
# crontab: */10 * * * * /Users/kangsangmo/Desktop/valueconnectx/scripts/health-check-cron.sh

PROJECT_DIR="/Users/kangsangmo/Desktop/valueconnectx"
LOG_FILE="/tmp/vcx-health-check.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# .env.local에서 환경변수 읽기
if [ -f "$PROJECT_DIR/.env.local" ]; then
  CRON_SECRET=$(grep '^CRON_SECRET=' "$PROJECT_DIR/.env.local" | cut -d '=' -f2-)
  DISCORD_WEBHOOK=$(grep '^DISCORD_OPS_WEBHOOK_URL=' "$PROJECT_DIR/.env.local" | cut -d '=' -f2-)
  PROD_URL=$(grep '^NEXT_PUBLIC_SITE_URL=' "$PROJECT_DIR/.env.local" | cut -d '=' -f2-)
fi

CRON_SECRET="${CRON_SECRET:-vcx-ops-test-secret-2026}"

# Discord 알림 함수 (API 서버 없이도 직접 발송)
send_discord() {
  local title="$1"
  local color="$2"
  local description="$3"

  if [ -z "$DISCORD_WEBHOOK" ]; then
    return
  fi

  curl -s -X POST "$DISCORD_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{
      \"embeds\": [{
        \"title\": \"$title\",
        \"color\": $color,
        \"description\": \"$description\",
        \"footer\": {\"text\": \"맥북 크론 | $TIMESTAMP\"}
      }]
    }" > /dev/null 2>&1
}

# --- 프로덕션 체크 (Vercel 배포) ---
check_endpoint() {
  local label="$1"
  local url="$2"

  local result=$(curl -s -m 15 -H "Authorization: Bearer $CRON_SECRET" "$url/api/ops/health" 2>/dev/null)

  if [ -z "$result" ]; then
    echo "[$TIMESTAMP] $label: unreachable" >> "$LOG_FILE"
    send_discord "🔴 [VCX $label] 서버 접속 불가" 15548997 "헬스체크 엔드포인트에 접속할 수 없습니다.\n\nURL: $url/api/ops/health"
    return
  fi

  local status=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','error'))" 2>/dev/null || echo "parse_error")
  local prev_status_file="/tmp/vcx-health-last-${label}.txt"
  local prev_status=$(cat "$prev_status_file" 2>/dev/null || echo "unknown")

  echo "[$TIMESTAMP] $label: $status" >> "$LOG_FILE"
  echo "$status" > "$prev_status_file"

  # 상태 변화 시에만 Discord 알림
  if [ "$status" != "$prev_status" ]; then
    case "$status" in
      unhealthy)
        local supabase=$(echo "$result" | python3 -c "import sys,json; c=json.load(sys.stdin)['checks']; print(f\"Supabase: {c['supabase']['status']} ({c['supabase']['latency_ms']}ms)\")" 2>/dev/null || echo "파싱 실패")
        local redis=$(echo "$result" | python3 -c "import sys,json; c=json.load(sys.stdin)['checks']; print(f\"Redis: {c['redis']['status']} ({c['redis']['latency_ms']}ms)\")" 2>/dev/null || echo "파싱 실패")
        send_discord "🔴 [VCX $label] 장애 감지" 15548997 "서비스 상태: **unhealthy**\n\n$supabase\n$redis\n\n런북: docs/ops/runbooks/01-incident-response.md"
        ;;
      degraded)
        send_discord "🟡 [VCX $label] 성능 저하" 16776960 "서비스 상태: **degraded**\n\n일부 서비스의 응답이 지연되고 있습니다."
        ;;
      healthy)
        if [ "$prev_status" = "unhealthy" ] || [ "$prev_status" = "degraded" ]; then
          send_discord "🟢 [VCX $label] 서비스 복구" 5763719 "서비스가 정상 복구되었습니다.\n\n이전 상태: $prev_status → healthy"
        fi
        ;;
    esac
  fi
}

# 프로덕션 체크
if [ -n "$PROD_URL" ] && [ "$PROD_URL" != "http://localhost:3000" ]; then
  check_endpoint "PROD" "$PROD_URL"
fi

# 로컬 체크 (dev 서버 실행 중일 때만)
if lsof -i :3000 > /dev/null 2>&1; then
  check_endpoint "LOCAL" "http://localhost:3000"
elif lsof -i :3001 > /dev/null 2>&1; then
  check_endpoint "LOCAL" "http://localhost:3001"
fi

# 로그 최근 1000줄만 유지
if [ -f "$LOG_FILE" ]; then
  tail -1000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE" 2>/dev/null
fi
