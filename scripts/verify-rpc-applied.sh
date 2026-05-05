#!/usr/bin/env bash
# verify-rpc-applied.sh
# D-0002: Migration 019 vcx_get_user_info RPC 실적용 검증
# 사용법: SUPABASE_DB_URL=postgres://... bash scripts/verify-rpc-applied.sh
#         또는 .env.local에서 자동 로드: bash scripts/verify-rpc-applied.sh

set -e

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== D-0002: Migration 019 vcx_get_user_info RPC 실적용 검증 ==="
echo ""

# 1. DB URL 로드
DB_URL="${SUPABASE_DB_URL}"

# DB_URL이 없으면 .env.local에서 시도
if [ -z "$DB_URL" ]; then
  if [ -f ".env.local" ]; then
    # SUPABASE_SERVICE_ROLE_KEY와 NEXT_PUBLIC_SUPABASE_URL을 이용해 DB URL 구성
    SERVICE_ROLE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d= -f2 | tr -d '\r')
    SUPABASE_URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d= -f2 | tr -d '\r')
    
    if [ -n "$SERVICE_ROLE_KEY" ] && [ -n "$SUPABASE_URL" ]; then
      # Supabase URL 형식: https://PROJECT_ID.supabase.co
      PROJECT_ID=$(echo "$SUPABASE_URL" | sed 's|https://||' | sed 's|\.supabase\.co||')
      DB_URL="postgres://postgres:${SERVICE_ROLE_KEY}@db.${PROJECT_ID}.supabase.co:5432/postgres"
    fi
  fi
fi

# 2. DB URL 검증
if [ -z "$DB_URL" ]; then
  echo -e "${YELLOW}[SKIP]${NC} SUPABASE_DB_URL 환경변수 또는 .env.local 미가용 — Supabase Dashboard에서 수동 검증 필요"
  echo ""
  echo "=== 수동 검증 가이드 (Supabase Dashboard > SQL Editor) ==="
  echo ""
  echo "1. 함수 존재 확인:"
  echo "   SELECT proname FROM pg_proc WHERE proname = 'vcx_get_user_info';"
  echo ""
  echo "2. 함수 소스 코드 확인:"
  echo "   SELECT prosrc FROM pg_proc WHERE proname = 'vcx_get_user_info';"
  echo ""
  echo "3. 검증 항목:"
  echo "   - 함수명: vcx_get_user_info"
  echo "   - SECURITY DEFINER 설정 여부"
  echo "   - SET search_path = public, pg_temp 설정 여부"
  echo "   - member 객체에 다음 4개 필드 포함:"
  echo "     * name"
  echo "     * current_company"
  echo "     * title"
  echo "     * linkedin_url"
  echo "   - corporate 객체에 'role' 필드 포함"
  echo ""
  exit 0
fi

# psql이 설치되어 있는지 확인
if ! command -v psql &> /dev/null; then
  echo -e "${YELLOW}[SKIP]${NC} psql 미설치 — Supabase Dashboard > SQL Editor에서 수동 검증 필요"
  echo ""
  echo "=== 수동 검증 가이드 (Supabase Dashboard > SQL Editor) ==="
  echo ""
  echo "1. 함수 존재 확인:"
  echo "   SELECT proname FROM pg_proc WHERE proname = 'vcx_get_user_info';"
  echo ""
  echo "2. 함수 소스 코드 확인:"
  echo "   SELECT prosrc FROM pg_proc WHERE proname = 'vcx_get_user_info';"
  echo ""
  echo "3. 검증 항목:"
  echo "   - 함수명: vcx_get_user_info"
  echo "   - SECURITY DEFINER 설정 여부"
  echo "   - SET search_path = public, pg_temp 설정 여부"
  echo "   - member 객체에 다음 4개 필드 포함:"
  echo "     * name"
  echo "     * current_company"
  echo "     * title"
  echo "     * linkedin_url"
  echo "   - corporate 객체에 'role' 필드 포함"
  echo ""
  exit 0
fi

# 3. 함수 존재 여부 확인
echo "1. 함수 존재 여부 확인..."
FUNCTION_EXISTS=$(psql "$DB_URL" -tAc "SELECT proname FROM pg_proc WHERE proname = 'vcx_get_user_info';" 2>/dev/null || echo "")

if [ -z "$FUNCTION_EXISTS" ]; then
  echo -e "${RED}✗ vcx_get_user_info 함수 미발견${NC} — 수동 확인 필요"
  exit 1
else
  echo -e "${GREEN}✓ vcx_get_user_info 함수 발견${NC}"
fi

# 4. 함수 소스 코드 조회
echo ""
echo "2. 함수 정의 및 시그니처 확인..."
FUNCTION_SRC=$(psql "$DB_URL" -tAc "SELECT prosrc FROM pg_proc WHERE proname = 'vcx_get_user_info';" 2>/dev/null)

# 4a. SECURITY DEFINER 확인
if echo "$FUNCTION_SRC" | grep -q "SECURITY DEFINER"; then
  echo -e "${GREEN}✓ SECURITY DEFINER 설정 확인${NC}"
else
  echo -e "${RED}✗ SECURITY DEFINER 미설정${NC} — 수동 확인 필요"
fi

# 4b. search_path 설정 확인
if echo "$FUNCTION_SRC" | grep -q "search_path"; then
  echo -e "${GREEN}✓ search_path 설정 확인${NC}"
else
  echo -e "${RED}✗ search_path 미설정${NC} — 수동 확인 필요"
fi

# 5. 필드 검증 (v2: name, current_company, title, linkedin_url)
echo ""
echo "3. 함수 필드 검증 (v2 스펙)..."

REQUIRED_FIELDS=("name" "current_company" "title" "linkedin_url")
ALL_FIELDS_FOUND=true

for field in "${REQUIRED_FIELDS[@]}"; do
  if echo "$FUNCTION_SRC" | grep -q "'$field'"; then
    echo -e "${GREEN}✓ '$field' 필드 발견${NC}"
  else
    echo -e "${RED}✗ '$field' 필드 미발견${NC} — 수동 확인 필요"
    ALL_FIELDS_FOUND=false
  fi
done

# 6. corporate role 필드 확인
echo ""
echo "4. Corporate 객체 검증..."
if echo "$FUNCTION_SRC" | grep -q "'role'"; then
  echo -e "${GREEN}✓ 'corporate.role' 필드 발견${NC}"
else
  echo -e "${RED}✗ 'corporate.role' 필드 미발견${NC} — 수동 확인 필요"
fi

# 7. 최종 요약
echo ""
echo "=== 검증 완료 ==="
if [ "$ALL_FIELDS_FOUND" = true ]; then
  echo -e "${GREEN}✓ Migration 019 vcx_get_user_info 적용 검증 성공${NC}"
  echo ""
  echo "다음 단계: Sentry 에러 대시보드 확인"
  echo "- https://sentry.io/organizations/valueconnect-x/ → Issues 탭"
  echo "- 'vcx_get_user_info' 관련 에러 0건 확인"
  exit 0
else
  echo -e "${RED}✗ 일부 필드가 누락되었습니다. 수동 확인이 필요합니다.${NC}"
  exit 1
fi

# =============================================================================
# 수동 검증 (Supabase Dashboard):
#
# 1. Supabase Dashboard에 접속
# 2. SQL Editor로 이동
# 3. 다음 쿼리 실행:
#
#    SELECT proname, prosrc FROM pg_proc WHERE proname = 'vcx_get_user_info';
#
# 4. 결과에서 다음을 확인:
#    - 함수명: vcx_get_user_info
#    - 함수 본문에 'SECURITY DEFINER' 포함
#    - 함수 본문에 'search_path' 포함
#    - 함수 본문에 다음 4개 필드 포함:
#      * 'name'
#      * 'current_company'
#      * 'title'
#      * 'linkedin_url'
#    - 함수 본문에 'corporate' 객체와 'role' 필드 포함
#
# 5. 모든 항목이 확인되면 Migration 019가 정상 적용됨
# =============================================================================
