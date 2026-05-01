#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="${VCX_SQLITE_PATH:-$ROOT_DIR/.local/vcx-dev.sqlite}"
SCHEMA_PATH="$ROOT_DIR/sqlite/schema.sql"
SEED_PATH="$ROOT_DIR/sqlite/seed.sql"

usage() {
  cat <<'EOF'
사용법:
  scripts/sqlite-dev.sh init
  scripts/sqlite-dev.sh reset
  scripts/sqlite-dev.sh smoke
  scripts/sqlite-dev.sh query "select * from vcx_members;"
  scripts/sqlite-dev.sh path

환경변수:
  VCX_SQLITE_PATH  SQLite DB 경로를 오버라이드합니다. 기본값: .local/vcx-dev.sqlite
EOF
}

ensure_sqlite() {
  if ! command -v sqlite3 >/dev/null 2>&1; then
    echo "sqlite3 CLI가 필요합니다." >&2
    exit 1
  fi
}

init_db() {
  mkdir -p "$(dirname "$DB_PATH")"
  sqlite3 "$DB_PATH" < "$SCHEMA_PATH"
  sqlite3 "$DB_PATH" < "$SEED_PATH"
}

smoke_db() {
  local member_count
  local feed_count
  local recipient_email
  local event_count
  local b2b_jd_count
  local b2b_signal_count

  member_count="$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM vcx_members;")"
  feed_count="$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM vcx_feed_items;")"
  recipient_email="$(sqlite3 "$DB_PATH" "SELECT email FROM vcx_newsletter_recipient_tokens WHERE send_token = 'dev-newsletter-token';")"
  event_count="$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM vcx_newsletter_events WHERE type = 'sent';")"
  b2b_jd_count="$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM vcx_company_jds;")"
  b2b_signal_count="$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM vcx_b2b_market_job_signals;")"

  [[ "$member_count" -ge 3 ]] || { echo "vcx_members seed 검증 실패: $member_count" >&2; exit 1; }
  [[ "$feed_count" -ge 2 ]] || { echo "vcx_feed_items seed 검증 실패: $feed_count" >&2; exit 1; }
  [[ "$recipient_email" == "newsletter.member@example.com" ]] || { echo "newsletter token 조회 검증 실패: $recipient_email" >&2; exit 1; }
  [[ "$event_count" -ge 1 ]] || { echo "newsletter event seed 검증 실패: $event_count" >&2; exit 1; }
  [[ "$b2b_jd_count" -ge 1 ]] || { echo "vcx_company_jds seed 검증 실패: $b2b_jd_count" >&2; exit 1; }
  [[ "$b2b_signal_count" -ge 2 ]] || { echo "vcx_b2b_market_job_signals seed 검증 실패: $b2b_signal_count" >&2; exit 1; }

  echo "SQLite dev mirror OK"
  echo "DB: $DB_PATH"
  echo "members=$member_count feed_items=$feed_count newsletter_events=$event_count b2b_jds=$b2b_jd_count b2b_signals=$b2b_signal_count"
}

main() {
  ensure_sqlite

  case "${1:-}" in
    init)
      init_db
      smoke_db
      ;;
    reset)
      rm -f "$DB_PATH" "$DB_PATH-shm" "$DB_PATH-wal"
      init_db
      smoke_db
      ;;
    smoke)
      [[ -f "$DB_PATH" ]] || init_db
      smoke_db
      ;;
    query)
      shift
      [[ $# -gt 0 ]] || { echo "query SQL이 필요합니다." >&2; exit 1; }
      [[ -f "$DB_PATH" ]] || init_db
      sqlite3 -header -column "$DB_PATH" "$*"
      ;;
    path)
      echo "$DB_PATH"
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"
