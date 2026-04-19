#!/usr/bin/env bash
# VCX Orchestrator - 프로젝트 구조 제어 및 리포팅
# Usage: ./scripts/orchestrator.sh [command] [options]

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WIKI_DIR="$PROJECT_ROOT/wiki"
REPORT_DIR="$WIKI_DIR/orchestrator/reports"
SRC_DIR="$PROJECT_ROOT/src"
DATE=$(date '+%Y-%m-%d %H:%M')

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}━━━ $1 ━━━${NC}\n"
}

print_ok() {
    echo -e "  ${GREEN}✅ $1${NC}"
}

print_warn() {
    echo -e "  ${YELLOW}⚠️  $1${NC}"
}

print_fail() {
    echo -e "  ${RED}❌ $1${NC}"
}

# ─── Stats Command ───

cmd_stats() {
    print_header "VCX 프로젝트 통계"

    local ts_files=$(find "$SRC_DIR" -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v __tests__ | wc -l | tr -d ' ')
    local test_files=$(find "$SRC_DIR" -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" | wc -l | tr -d ' ')
    local pages=$(find "$SRC_DIR/app" -name "page.tsx" | wc -l | tr -d ' ')
    local api_routes=$(find "$SRC_DIR/app/api" -name "route.ts" | wc -l | tr -d ' ')
    local components=$(find "$SRC_DIR/components" -name "*.tsx" | wc -l | tr -d ' ')
    local lib_modules=$(find "$SRC_DIR/lib" -name "*.ts" | wc -l | tr -d ' ')
    local migrations=$(find "$PROJECT_ROOT/supabase/migrations" -name "*.sql" 2>/dev/null | wc -l | tr -d ' ')

    echo "  TypeScript 파일:  $ts_files"
    echo "  테스트 파일:      $test_files"
    echo "  페이지 수:        $pages"
    echo "  API 라우트:       $api_routes"
    echo "  컴포넌트:         $components"
    echo "  lib 모듈:         $lib_modules"
    echo "  DB 마이그레이션:  $migrations"

    print_header "도메인별 현황"

    local domains=("auth" "coffeechat" "community" "directory" "positions" "feed" "admin")
    printf "  %-15s %-8s %-8s %-12s %-8s\n" "도메인" "페이지" "API" "컴포넌트" "테스트"
    printf "  %-15s %-8s %-8s %-12s %-8s\n" "───────" "────" "───" "────────" "────"

    for domain in "${domains[@]}"; do
        local d_pages=$(find "$SRC_DIR/app" -path "*/$domain/*" -name "page.tsx" 2>/dev/null | wc -l | tr -d ' ')
        local d_api=0
        # Map domain to API folder names
        case "$domain" in
            coffeechat) d_api=$(find "$SRC_DIR/app/api" \( -path "*/ceo-coffeechat/*" -o -path "*/peer-coffeechat/*" \) -name "route.ts" 2>/dev/null | wc -l | tr -d ' ') ;;
            auth) d_api=$(find "$SRC_DIR/app/api" \( -path "*/invites/*" -o -path "*/recommendations/*" \) -name "route.ts" 2>/dev/null | wc -l | tr -d ' ') ;;
            *) d_api=$(find "$SRC_DIR/app/api/$domain" -name "route.ts" 2>/dev/null | wc -l | tr -d ' ') ;;
        esac
        local d_comp=$(find "$SRC_DIR/components/$domain" -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
        local d_test=$(find "$SRC_DIR/__tests__" -path "*/$domain/*" 2>/dev/null | wc -l | tr -d ' ')
        printf "  %-15s %-8s %-8s %-12s %-8s\n" "$domain" "$d_pages" "$d_api" "$d_comp" "$d_test"
    done
}

# ─── Check Command ───

cmd_check() {
    print_header "VCX 구조 규칙 검증"
    local violations=0

    # R-001: 페이지 위치 체크
    local stray_pages=$(find "$SRC_DIR/app" -name "page.tsx" -not -path "*/(protected)/*" -not -path "*/(auth)/*" -not -path "*/app/page.tsx" -not -path "*/benefit/*" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$stray_pages" -eq 0 ]; then
        print_ok "R-001: 페이지 위치 규칙 준수"
    else
        print_fail "R-001: 잘못된 위치의 페이지 $stray_pages개"
        violations=$((violations + 1))
    fi

    # N-001: kebab-case 파일명
    local bad_names=$(find "$SRC_DIR" \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/__tests__/*" | xargs -I{} basename {} | grep '[A-Z]' | grep -v '.d.ts' | wc -l | tr -d ' ')
    if [ "$bad_names" -eq 0 ]; then
        print_ok "N-001: kebab-case 파일명 준수"
    else
        print_warn "N-001: PascalCase/camelCase 파일명 ${bad_names}개"
        violations=$((violations + 1))
    fi

    # X-001: rounded 클래스 체크
    local rounded=$(grep -r "rounded-" "$SRC_DIR" --include="*.tsx" --include="*.ts" -l 2>/dev/null | wc -l | tr -d ' ')
    if [ "$rounded" -eq 0 ]; then
        print_ok "X-001: rounded 클래스 미사용"
    else
        print_warn "X-001: rounded 클래스 사용 파일 ${rounded}개"
        violations=$((violations + 1))
    fi

    # X-003: 레거시 Supabase API 체크
    local legacy_sb=$(grep -r "createClientComponentClient\|createServerComponentClient" "$SRC_DIR" --include="*.ts" --include="*.tsx" -l 2>/dev/null | wc -l | tr -d ' ')
    if [ "$legacy_sb" -eq 0 ]; then
        print_ok "X-003: Supabase 레거시 API 미사용"
    else
        print_fail "X-003: 레거시 Supabase API 사용 파일 ${legacy_sb}개"
        violations=$((violations + 1))
    fi

    # X-004: tailwind.config.ts 체크
    if [ ! -f "$PROJECT_ROOT/tailwind.config.ts" ] && [ ! -f "$PROJECT_ROOT/tailwind.config.js" ]; then
        print_ok "X-004: tailwind.config 파일 없음 (CSS-first)"
    else
        print_fail "X-004: tailwind.config 파일이 존재함!"
        violations=$((violations + 1))
    fi

    # N-003: 직접 에러 응답 체크
    local direct_errors=$(grep -r "NextResponse.json" "$SRC_DIR/app/api" --include="*.ts" -l 2>/dev/null | xargs grep -l "status.*[45]" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$direct_errors" -eq 0 ]; then
        print_ok "N-003: 에러 헬퍼 사용 준수"
    else
        print_warn "N-003: 직접 에러 응답 파일 ${direct_errors}개 (에러 헬퍼 사용 권장)"
        violations=$((violations + 1))
    fi

    echo ""
    if [ "$violations" -eq 0 ]; then
        echo -e "  ${GREEN}모든 규칙 통과! ✅${NC}"
    else
        echo -e "  ${YELLOW}${violations}개 규칙 위반 발견${NC}"
    fi

    return $violations
}

# ─── Report Command ───

cmd_report() {
    local save_flag=false
    [[ "${1:-}" == "--save" ]] && save_flag=true

    print_header "VCX 프로젝트 리포트 생성"
    echo "  생성일: $DATE"
    echo ""

    cmd_stats
    echo ""
    cmd_check || true

    print_header "품질 게이트"

    # Build check
    echo -n "  Build: "
    if npm run build --prefix "$PROJECT_ROOT" > /dev/null 2>&1; then
        print_ok "성공"
    else
        print_fail "실패"
    fi

    # Lint check
    echo -n "  Lint: "
    local lint_output
    lint_output=$(npm run lint --prefix "$PROJECT_ROOT" 2>&1) || true
    local lint_errors=$(echo "$lint_output" | grep -c "error" || true)
    if [ "$lint_errors" -eq 0 ]; then
        print_ok "에러 0"
    else
        print_warn "에러 ${lint_errors}개"
    fi

    # Test check
    echo -n "  Test: "
    if npm test --prefix "$PROJECT_ROOT" -- --run 2>/dev/null; then
        print_ok "전체 통과"
    else
        print_warn "일부 실패"
    fi

    if $save_flag; then
        mkdir -p "$REPORT_DIR"
        local report_file="$REPORT_DIR/report-$(date '+%Y%m%d-%H%M').md"
        {
            echo "# VCX 프로젝트 리포트"
            echo ""
            echo "> 생성일: $DATE"
            echo "> 생성자: orchestrator.sh report --save"
            echo ""
            cmd_stats 2>&1 | sed 's/\x1b\[[0-9;]*m//g'
            echo ""
            cmd_check 2>&1 | sed 's/\x1b\[[0-9;]*m//g' || true
        } > "$report_file"
        echo ""
        echo -e "  ${GREEN}리포트 저장됨: $report_file${NC}"
    fi
}

# ─── Help ───

cmd_help() {
    echo "VCX Orchestrator - 프로젝트 구조 제어 및 리포팅"
    echo ""
    echo "Usage: ./scripts/orchestrator.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  stats          프로젝트 통계 출력"
    echo "  check          구조 규칙 검증"
    echo "  report         전체 리포트 생성"
    echo "  report --save  리포트를 wiki/orchestrator/reports/에 저장"
    echo "  help           이 도움말"
}

# ─── Main ───

case "${1:-help}" in
    stats)  cmd_stats ;;
    check)  cmd_check ;;
    report) cmd_report "${2:-}" ;;
    help)   cmd_help ;;
    *)      echo "Unknown command: $1"; cmd_help; exit 1 ;;
esac
