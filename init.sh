#!/bin/bash
# =============================================================================
# VXMI - 프로젝트 초기화 스크립트
# Anthropic Harness Methodology - Initializer Agent용
# =============================================================================
# 용도: 새 개발 세션 시작 시, 또는 새 기여자 온보딩 시 실행
# 실행: bash init.sh
# =============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "============================================================"
echo "  VXMI - ValueConnect Market Intelligence"
echo "  Harness Init Script v1.0"
echo "============================================================"
echo -e "${NC}"

# -----------------------------------------------------------------------------
# 1. 프로젝트 현황 파악
# -----------------------------------------------------------------------------
echo -e "${CYAN}[1/7] 프로젝트 현황 파악${NC}"

echo "▶ 현재 디렉토리: $(pwd)"

if [ -f "claude-progress.txt" ]; then
  echo -e "${GREEN}✓ claude-progress.txt 존재${NC}"
  echo ""
  echo "--- 최근 세션 요약 ---"
  grep -A 5 "SESSION HISTORY" claude-progress.txt | head -15
  echo "----------------------"
else
  echo -e "${YELLOW}⚠ claude-progress.txt 없음 (첫 실행)${NC}"
fi

if [ -f "feature_list.json" ]; then
  echo ""
  echo -e "${GREEN}✓ feature_list.json 존재${NC}"
  echo "--- 진행률 ---"
  if command -v python3 &> /dev/null; then
    python3 -c "
import json
with open('feature_list.json') as f:
    d = json.load(f)
total = sum(len(p['features']) for p in d['phases'])
passed = sum(1 for p in d['phases'] for f in p['features'] if f['passes'])
failed_ids = [f['id'] for p in d['phases'] for f in p['features'] if not f['passes']]
print(f'완료: {passed}/{total} ({round(passed/total*100)}%)')
if failed_ids:
    print(f'다음 작업: {failed_ids[0]}')
    print(f'미완료 목록 (앞 5개): {failed_ids[:5]}')
"
  fi
  echo "--------------"
fi

echo ""

# -----------------------------------------------------------------------------
# 2. Git 상태 확인
# -----------------------------------------------------------------------------
echo -e "${CYAN}[2/7] Git 상태 확인${NC}"

if [ -d ".git" ]; then
  echo "▶ 최근 커밋 (20개):"
  git log --oneline -20 2>/dev/null || echo "  (커밋 없음)"
  echo ""
  echo "▶ 변경사항:"
  git status --short 2>/dev/null || echo "  (git 상태 조회 실패)"
else
  echo -e "${YELLOW}⚠ git 저장소 없음. 초기화...${NC}"
  git init
  git add .
  git commit -m "init: VXMI project initialization" 2>/dev/null || true
  echo -e "${GREEN}✓ git 초기화 완료${NC}"
fi

echo ""

# -----------------------------------------------------------------------------
# 3. Node.js 환경 확인 및 의존성 설치
# -----------------------------------------------------------------------------
echo -e "${CYAN}[3/7] Node.js 환경 및 의존성 확인${NC}"

if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js 미설치. https://nodejs.org 에서 설치 필요${NC}"
  exit 1
fi

echo "▶ Node.js: $(node --version)"
echo "▶ npm: $(npm --version)"

if [ -f "package.json" ]; then
  echo "▶ package.json 존재"
  if [ ! -d "node_modules" ]; then
    echo "▶ node_modules 없음. 설치 중..."
    npm install
    echo -e "${GREEN}✓ 의존성 설치 완료${NC}"
  else
    echo -e "${GREEN}✓ node_modules 존재${NC}"
  fi
else
  echo -e "${YELLOW}⚠ package.json 없음. Next.js 프로젝트 생성 필요 (P0-01)${NC}"
fi

echo ""

# -----------------------------------------------------------------------------
# 4. 환경변수 확인
# -----------------------------------------------------------------------------
echo -e "${CYAN}[4/7] 환경변수 확인${NC}"

if [ -f ".env.local" ]; then
  echo -e "${GREEN}✓ .env.local 존재${NC}"

  REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "DISCORD_WEBHOOK_URL"
  )

  for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" .env.local; then
      val=$(grep "^${var}=" .env.local | cut -d'=' -f2-)
      if [ -z "$val" ] || [ "$val" = "your_value_here" ]; then
        echo -e "${YELLOW}  ⚠ ${var}: 값 없음${NC}"
      else
        echo -e "${GREEN}  ✓ ${var}: 설정됨${NC}"
      fi
    else
      echo -e "${RED}  ✗ ${var}: 누락${NC}"
    fi
  done
else
  echo -e "${RED}✗ .env.local 없음. 생성 필요:${NC}"
  echo ""
  cat << 'EOF'
  # .env.local 생성:
  cat > .env.local << 'ENVEOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook
ENVEOF
EOF
fi

echo ""

# -----------------------------------------------------------------------------
# 5. 개발 서버 기본 동작 테스트
# -----------------------------------------------------------------------------
echo -e "${CYAN}[5/7] 개발 서버 기본 동작 확인${NC}"

if [ -f "package.json" ] && [ -d "node_modules" ]; then
  echo "▶ TypeScript 타입 체크..."
  if npm run type-check &> /dev/null 2>&1; then
    echo -e "${GREEN}✓ TypeScript 타입 체크 통과${NC}"
  elif npx tsc --noEmit &> /dev/null 2>&1; then
    echo -e "${GREEN}✓ TypeScript 타입 체크 통과${NC}"
  else
    echo -e "${YELLOW}⚠ TypeScript 오류 있음 (또는 아직 소스 파일 없음)${NC}"
  fi

  echo "▶ ESLint 체크..."
  if npm run lint &> /dev/null 2>&1; then
    echo -e "${GREEN}✓ ESLint 통과${NC}"
  else
    echo -e "${YELLOW}⚠ ESLint 경고/오류 있음${NC}"
  fi
else
  echo -e "${YELLOW}⚠ 프로젝트 미생성 상태 - 서버 확인 스킵${NC}"
fi

echo ""

# -----------------------------------------------------------------------------
# 6. Supabase 연결 테스트 (선택적)
# -----------------------------------------------------------------------------
echo -e "${CYAN}[6/7] Supabase 연결 테스트${NC}"

if [ -f ".env.local" ]; then
  SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d'=' -f2-)
  if [ ! -z "$SUPABASE_URL" ] && [ "$SUPABASE_URL" != "your_value_here" ]; then
    echo "▶ Supabase URL: $SUPABASE_URL"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${SUPABASE_URL}/rest/v1/" 2>/dev/null || echo "000")
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "400" ]; then
      echo -e "${GREEN}✓ Supabase 연결 가능 (HTTP ${HTTP_STATUS})${NC}"
    else
      echo -e "${YELLOW}⚠ Supabase 연결 불가 (HTTP ${HTTP_STATUS})${NC}"
    fi
  else
    echo -e "${YELLOW}⚠ Supabase URL 미설정 - 연결 테스트 스킵${NC}"
  fi
else
  echo -e "${YELLOW}⚠ .env.local 없음 - 연결 테스트 스킵${NC}"
fi

echo ""

# -----------------------------------------------------------------------------
# 7. 다음 작업 안내
# -----------------------------------------------------------------------------
echo -e "${CYAN}[7/7] 다음 작업 안내${NC}"

if [ -f "feature_list.json" ] && command -v python3 &> /dev/null; then
  echo "▶ 다음 구현 대상:"
  python3 -c "
import json
with open('feature_list.json') as f:
    d = json.load(f)
for phase in d['phases']:
    for feature in phase['features']:
        if not feature['passes']:
            print(f\"  [{feature['id']}] {feature['description']}\")
            print(f\"  Phase: {phase['name']}\")
            print(f\"  첫 번째 단계: {feature['steps'][0]}\")
            print()
            break
    else:
        continue
    break
"
fi

echo ""
echo "▶ 개발 서버 시작 명령어:"
echo "  npm run dev"
echo ""
echo "▶ 기능 완료 후 feature_list.json 업데이트:"
echo "  해당 feature의 \"passes\": false → \"passes\": true"
echo ""
echo "▶ 세션 종료 전 반드시:"
echo "  1. git add . && git commit -m \"feat(scope): description\""
echo "  2. claude-progress.txt에 작업 내역 업데이트"
echo ""

echo -e "${GREEN}"
echo "============================================================"
echo "  VXMI 초기화 완료"
echo "  feature_list.json에서 다음 미완료 기능을 확인하세요"
echo "============================================================"
echo -e "${NC}"