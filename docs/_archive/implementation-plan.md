# VXMI Implementation Plan
## Anthropic Harness Methodology 기반 구현 가이드

**버전:** v1.0 | **작성일:** 2026-03-13

---

## 1. Harness 구조 개요

이 프로젝트는 **Anthropic 공식 Harness 방법론**을 적용합니다.

```
PRD.md + CLAUDE.md
       ↓
[Initializer Agent] ── 1회 실행
  └─ feature_list.json 생성 (55개 기능, 모두 passes: false)
  └─ init.sh, claude-progress.txt 생성
  └─ git 초기 커밋
       ↓
[Coding Agent] ── 기능 1개씩 반복
  └─ init.sh 실행 → 현황 파악
  └─ feature_list.json에서 첫 번째 미완료 기능 선택
  └─ 구현 → git commit
       ↓
[QA Subagent] ── 독립 컨텍스트
  └─ 브라우저 자동화 or 단위 테스트로 검증
  └─ passes: true 업데이트 (성공 시)
  └─ 실패 시 Coding Agent에게 피드백
       ↓
[Loop] 55개 기능 모두 passes: true 될 때까지
```

---

## 2. Agent 팀 역할 분담

### Orchestrator Agent (리드)
**역할:** 전체 진행 조율, 컨텍스트 관리, 막힌 부분 해결  
**프롬프트 패턴:**
```
당신은 VXMI 프로젝트의 오케스트레이터입니다.
1. init.sh를 실행하세요
2. feature_list.json에서 미완료 기능을 확인하세요
3. 다음 기능을 Coding Agent에 할당하세요
4. 완료 후 QA Agent에게 검증을 요청하세요
5. passes: true 확인 후 다음 기능으로 진행하세요
```

### Coding Agent
**역할:** 기능 구현 (한 번에 1개 feature만)  
**프롬프트 패턴:**
```
당신은 VXMI 프로젝트의 Coding Agent입니다.
현재 구현할 기능: [feature_id]
CLAUDE.md의 코딩 컨벤션을 준수하세요.
구현 완료 후:
1. git add . && git commit -m "feat(scope): description"
2. claude-progress.txt 업데이트
3. feature_list.json의 해당 feature passes: true로 변경 (QA 통과 후)
```

### QA Subagent
**역할:** 브라우저 자동화 + 단위 테스트로 기능 검증  
**독립 컨텍스트 사용 (메인 세션과 분리)**  
**프롬프트 패턴:**
```
당신은 VXMI 프로젝트의 QA Agent입니다.
검증할 기능: [feature_id]
검증 단계 (feature_list.json의 steps 기준):
1. 개발 서버가 실행 중인지 확인
2. 각 step을 사람 사용자처럼 검증
3. 성공: feature_list.json의 passes: true로 업데이트
4. 실패: 구체적인 오류 내용을 Coding Agent에게 전달
절대로 코드를 보고만 완료로 판단하지 말 것. 반드시 E2E로 확인할 것.
```

---

## 3. 단계별 구현 세부 지침

### Phase P0: Infrastructure Setup (우선순위: 최고)

**목표:** 코딩 시작 전 모든 인프라 준비  
**예상 소요:** 4~6시간  

#### P0-01: Next.js 프로젝트 생성
```bash
npx create-next-app@latest vxmi \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd vxmi

# shadcn/ui 초기화
npx shadcn-ui@latest init

# 필요 패키지 설치
npm install @supabase/supabase-js recharts d3 swr
npm install @types/d3 --save-dev
```

**QA 체크:** `npm run dev` → http://localhost:3000 접속 → Next.js 기본 화면 확인

#### P0-03 ~ P0-05: Supabase 테이블 생성
```sql
-- market_index 테이블 (Supabase SQL Editor에서 실행)
CREATE TABLE IF NOT EXISTS market_index (
  snapshot_date   DATE        NOT NULL,
  segment         TEXT        NOT NULL,
  demand          INTEGER     DEFAULT 0,
  supply_pool     INTEGER     DEFAULT 0,
  active_supply   INTEGER     DEFAULT 0,
  otw_rate        NUMERIC(5,2) DEFAULT 0,
  sd_ratio        NUMERIC(8,1) DEFAULT 0,
  market_status   TEXT        CHECK (market_status IN ('극심한_공급부족','공급부족','균형','공급과잉')),
  demand_trend    TEXT        CHECK (demand_trend IN ('상승','횡보','하락')),
  supply_trend    TEXT        CHECK (supply_trend IN ('상승','횡보','하락')),
  PRIMARY KEY (snapshot_date, segment)
);

-- company_attractiveness 테이블
CREATE TABLE IF NOT EXISTS company_attractiveness (
  snapshot_date    DATE   NOT NULL,
  company          TEXT   NOT NULL,
  news_summary     TEXT,
  investment_stage TEXT,
  total_positions  INTEGER DEFAULT 0,
  segment_list     TEXT[],
  PRIMARY KEY (snapshot_date, company)
);
```

**QA 체크:** Supabase Dashboard → Table Editor에서 테이블 존재 확인

#### P0-07: 세그먼트/섹터 상수 파일
```typescript
// src/lib/constants/segments.ts
export const SEGMENT_LIST = [
  'dev_server', 'dev_frontend', 'dev_devops', 'dev_mlai', 'dev_java',
  'dev_cto', 'design', 'pm_po', 'marketing', 'sales',
  'cfo_finance', 'hr', 'strategy', 'data'
] as const;

export const SECTOR_MAP = {
  'Tech Core':    ['dev_server', 'dev_frontend', 'dev_devops', 'dev_mlai', 'dev_java'],
  'Tech Leader':  ['dev_cto'],
  'Product':      ['design', 'pm_po'],
  'Go-to-Market': ['marketing', 'sales'],
  'Finance/Ops':  ['cfo_finance', 'hr', 'strategy'],
} as const;

export const MARKET_STATUS_CONFIG = {
  '극심한_공급부족': { color: '#ef4444', emoji: '🔴', fee: '20-25%', label: '극심한 공급부족' },
  '공급부족':        { color: '#f97316', emoji: '🟠', fee: '15-20%', label: '공급부족' },
  '균형':            { color: '#eab308', emoji: '🟡', fee: '15%',    label: '균형' },
  '공급과잉':        { color: '#22c55e', emoji: '🟢', fee: '12-15%', label: '공급과잉' },
} as const;
```

---

### Phase P2: F1 Dashboard (가장 중요한 P0 기능)

**목표:** 수요-공급 매트릭스 대시보드 완성  
**PRD 참조:** F1, Chart 1-1, 1-2, 1-3  
**예상 소요:** 8~12시간  

#### 개발 순서 (반드시 이 순서 준수)
1. API Route 먼저 (P2-01) → curl로 데이터 확인
2. KPI 카드 (P2-02) → 가장 단순한 컴포넌트부터
3. Diverging Bar (P2-03) → 핵심 차트 1
4. Bubble Matrix (P2-04) → 핵심 차트 2
5. 페이지 조립 (P2-05)
6. 데이터 테이블 (P2-06)

#### 목업 데이터 (Supabase 데이터 없을 때 사용)
```typescript
// src/lib/mock/market-data.ts
export const MOCK_MARKET_INDEX = [
  { segment: 'dev_mlai',    demand: 312,  active_supply: 8600,  supply_pool: 210000, sd_ratio: 27.6, market_status: '공급과잉'         },
  { segment: 'dev_devops',  demand: 198,  active_supply: 5100,  supply_pool: 134000, sd_ratio: 25.8, market_status: '공급과잉'         },
  { segment: 'dev_cto',     demand: 45,   active_supply: 89,    supply_pool: 2300,   sd_ratio: 2.0,  market_status: '극심한_공급부족'  },
  { segment: 'dev_server',  demand: 1204, active_supply: 43200, supply_pool: 600000, sd_ratio: 35.9, market_status: '공급과잉'         },
  { segment: 'dev_frontend',demand: 856,  active_supply: 28900, supply_pool: 402000, sd_ratio: 33.8, market_status: '공급과잉'         },
  { segment: 'dev_java',    demand: 643,  active_supply: 18200, supply_pool: 253000, sd_ratio: 28.3, market_status: '공급과잉'         },
  { segment: 'design',      demand: 421,  active_supply: 9800,  supply_pool: 156000, sd_ratio: 23.3, market_status: '공급과잉'         },
  { segment: 'pm_po',       demand: 287,  active_supply: 5600,  supply_pool: 89000,  sd_ratio: 19.5, market_status: '공급과잉'         },
  { segment: 'marketing',   demand: 534,  active_supply: 7200,  supply_pool: 112000, sd_ratio: 13.5, market_status: '균형'             },
  { segment: 'sales',       demand: 712,  active_supply: 4100,  supply_pool: 67000,  sd_ratio: 5.8,  market_status: '공급부족'         },
  { segment: 'cfo_finance', demand: 89,   active_supply: 210,   supply_pool: 8900,   sd_ratio: 2.4,  market_status: '극심한_공급부족'  },
  { segment: 'hr',          demand: 234,  active_supply: 2800,  supply_pool: 45000,  sd_ratio: 12.0, market_status: '균형'             },
  { segment: 'strategy',    demand: 156,  active_supply: 890,   supply_pool: 23000,  sd_ratio: 5.7,  market_status: '공급부족'         },
  { segment: 'data',        demand: 398,  active_supply: 6700,  supply_pool: 98000,  sd_ratio: 16.8, market_status: '공급과잉'         },
];
```

#### QA 체크리스트 (P2 완료 기준)
- [ ] /dashboard 접속 시 2초 이내 로드
- [ ] KPI 카드 6개 모두 표시, WoW delta 색상 정확
- [ ] Diverging Bar: 13개 세그먼트 정렬, 색상 4단계 정확
- [ ] Bubble Matrix: hover 툴팁 동작, 클릭 drill-down 동작
- [ ] WeekPicker: 주차 변경 시 데이터 갱신
- [ ] 세그먼트 테이블: CSV 다운로드 동작

---

### Phase P3~P9: 후속 기능 구현

각 Phase는 독립적으로 구현 가능하나, 아래 의존성 준수:

```
P2 완료 후 → P3, P4, P5 병렬 가능
P4 완료 후 → P5 (기업 링크 연동)
P3, P4, P5, P6 완료 → P7 (내보내기) 가능
전체 완료 → P10 (성능/QA)
```

---

## 4. QA 세부 프로토콜

### 기능 단위 QA (매 feature 완료 시)

```bash
# QA Subagent 시작 시 실행 순서
1. 개발 서버 확인
   curl http://localhost:3000 -s -o /dev/null -w "%{http_code}"
   # 200이어야 함

2. API 엔드포인트 확인 (API Route 기능의 경우)
   curl http://localhost:3000/api/[endpoint] | python3 -m json.tool

3. 브라우저 E2E 테스트 (Puppeteer MCP 또는 직접 확인)
   - 해당 페이지 접속
   - feature의 steps 항목 하나씩 사람처럼 테스트
   - 모든 steps 통과 시 passes: true

4. feature_list.json 업데이트
   # 해당 feature의 "passes": false → "passes": true
```

### 단계별 통합 QA (Phase 완료 시)

**P2 Dashboard QA 체크리스트:**
```
브라우저에서 http://localhost:3000/dashboard 접속

□ 페이지 로드 오류 없음 (콘솔 에러 확인)
□ 로딩 스켈레톤 → 실제 데이터 전환 확인
□ KPI 카드: 6개 모두 수치 표시
□ Diverging Bar: 13/14개 세그먼트 표시
□ Diverging Bar: 정렬 토글 3가지 동작
□ Bubble Matrix: 13/14개 버블 표시
□ Bubble Matrix: hover 시 툴팁 표시
□ Bubble Matrix: 클릭 시 /trend 또는 상세로 이동
□ WeekPicker: 이전 주 → 데이터 변경 확인
□ 세그먼트 테이블: 14행 정확한 데이터
□ CSV 다운로드: 파일 생성 확인
□ 모바일 375px: 카드 레이아웃 깨지지 않음
```

---

## 5. 세션 시작/종료 규칙

### 세션 시작 필수 루틴 (복붙 가능)
```bash
# 1. 현황 파악
bash init.sh

# 2. 다음 작업 확인
python3 -c "
import json
with open('feature_list.json') as f:
    d = json.load(f)
for p in d['phases']:
    for f in p['features']:
        if not f['passes']:
            print(f\"구현할 기능: [{f['id']}] {f['description']}\")
            print('단계:')
            for i, s in enumerate(f['steps'], 1):
                print(f'  {i}. {s}')
            break
    else:
        continue
    break
"

# 3. 개발 서버 시작
npm run dev
```

### 세션 종료 필수 루틴
```bash
# 1. 변경사항 커밋
git add .
git commit -m "feat(scope): description"

# 2. claude-progress.txt 업데이트
# - 완료한 기능 ID와 내용 추가
# - 블로커/이슈 기록
# - 다음 세션 시작점 명시

# 3. feature_list.json 완료 항목 확인
python3 -c "
import json
with open('feature_list.json') as f:
    d = json.load(f)
total = sum(len(p['features']) for p in d['phases'])
passed = sum(1 for p in d['phases'] for f in p['features'] if f['passes'])
print(f'최종 진행률: {passed}/{total} ({round(passed/total*100)}%)')
"
```

---

## 6. 컨텍스트 관리 규칙

### 컨텍스트 최적화
- **50% 도달 시**: `/compact` 실행 (Claude Code 사용 시)
- **새 기능 시작 시**: `/clear` 실행 (이전 기능 컨텍스트 제거)
- **QA 서브에이전트**: 항상 독립 컨텍스트 (메인과 분리)

### 블로킹 이슈 처리
```
기능 구현 중 30분 이상 막힌 경우:
1. 이슈를 claude-progress.txt의 KNOWN ISSUES에 기록
2. 해당 feature를 건너뛰고 다음 feature로 진행
3. 블로커 해결 후 돌아와서 처리
절대로 한 feature에 1시간 이상 소비하지 말 것
```

---

## 7. 완료 기준 (Definition of Done)

각 feature가 "완료"로 인정되려면:

1. **코드 구현 완료** — 기능 코드 작성
2. **E2E 테스트 통과** — QA Agent가 브라우저에서 직접 확인
3. **TypeScript 오류 없음** — `npx tsc --noEmit` 통과
4. **ESLint 통과** — `npm run lint` 경고/오류 없음
5. **git 커밋** — 커밋 메시지 컨벤션 준수
6. **feature_list.json 업데이트** — `passes: true`

---

## 8. 빠른 참조

### 핵심 파일 위치
| 파일 | 용도 |
|------|------|
| `feature_list.json` | 전체 기능 목록 (진행 현황) |
| `claude-progress.txt` | 세션 간 컨텍스트 |
| `init.sh` | 세션 시작 스크립트 |
| `IMPLEMENTATION_PLAN.md` | 이 파일 |

### 주요 명령어
```bash
bash init.sh              # 세션 시작
npm run dev               # 개발 서버
npm run build             # 빌드 테스트
npx tsc --noEmit          # 타입 체크
npm run lint              # ESLint
git log --oneline -10     # 최근 커밋
```

### 세그먼트 이름 빠른 참조
```
dev_server, dev_frontend, dev_devops, dev_mlai, dev_java,
dev_cto, design, pm_po, marketing, sales,
cfo_finance, hr, strategy, data
```

### S/D Ratio 빠른 판단
```
< 3:1  → 🔴 극심한_공급부족  수수료 20-25%
3~7:1  → 🟠 공급부족         수수료 15-20%
7~15:1 → 🟡 균형             수수료 15%
> 15:1 → 🟢 공급과잉         수수료 12-15%
```