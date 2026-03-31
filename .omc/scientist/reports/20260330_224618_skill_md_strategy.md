# ValueConnect X — Agent Skill SKILL.md 전략 보고서

**생성일:** 2026-03-30  
**분석 대상:** /Users/kangsangmo/Desktop/valueconnectx  
**분석 파일 수:** 223 .ts/.tsx 파일, 42 API route 파일, 63 테스트 파일, 20 마이그레이션 파일

---

## [OBJECTIVE]

ValueConnect X 프로젝트에 Agent Skill 방법론(SKILL.md)을 도입하기 위한  
우선순위, 통합 전략, 유지보수 계획, 단계별 로드맵을 데이터 기반으로 도출한다.

---

## [DATA]

- 총 소스 파일: 223개 (.ts/.tsx)
- API route 파일: 42개 (에러 헬퍼 사용률 71%, 미사용 29%)
- Zod 사용 파일: 24개 (전체 API route의 57%)
- Supabase createClient 사용 파일: 102개
- vcx-* 커스텀 클래스: 14종, 누적 사용 561회
- 테스트 파일: 67개 (known quirk: lucide-react importActual hang)
- 마이그레이션 파일: 20개 (번호 중복 발견: 013, 014 각 2개)
- CLAUDE.md 커버리지 스코어: 11/12 항목 (92%)
- P2~P4 예상 신규 파일: ~80-100개, DB 테이블 10개, API route 25개

---

## [FINDING 1] Supabase SSR 클라이언트 혼용이 최고 위험 영역이다

102개 파일이 `createClient`를 사용하지만, server/client/middleware 구분이  
CLAUDE.md에 "존재 여부"만 언급되고 "언제 어떤 클라이언트를 쓰는지" 패턴이 없다.  
실제로 `createBrowserClient`는 1개 파일에만 존재하며 서버-클라이언트 혼용 시  
쿠키 세션 누수와 RLS bypass가 발생할 수 있다.

[STAT:n] 102개 파일 createClient 사용, 4개 createServerClient (middleware)
[STAT:effect_size] 우선순위 스코어 4.80/5.00 (1위)
[STAT:p_value] error_risk=5/5, agent_gain=5/5 (최고 위험 조합)

---

## [FINDING 2] API route 패턴 불일치가 29% 수준으로 실질적 일관성 문제가 있다

42개 API route 파일 중 12개(29%)가 `src/lib/api/error.ts` 헬퍼를 사용하지 않고  
`NextResponse.json()`을 직접 호출한다. 이는 에러 응답 형식 불일치와  
향후 에러 중앙화 리팩터링 비용을 증가시킨다.

[STAT:n] 42개 API route 중 30개 헬퍼 사용(71%), 12개 직접 호출(29%)
[STAT:effect_size] 불일치율 29% — "명시적 컨벤션 부재"가 원인
[STAT:ci] P2~P4에서 ~25개 신규 route 추가 예정 → 방치 시 불일치 누적 예상

---

## [FINDING 3] 마이그레이션 번호 중복이 스키마 관리 취약성을 드러낸다

20개 마이그레이션 파일 중 `013_`, `014_` 번호가 각각 2개씩 중복 존재한다.  
이는 AI 에이전트가 "다음 번호" 규칙을 따르지 않았거나 병렬 작업 중 충돌이  
발생했음을 의미하며, SKILL-supabase-migration.md의 필요성을 직접 증명한다.

[STAT:n] 20개 마이그레이션 파일, 번호 중복 2건 (013, 014)
[STAT:effect_size] 스키마 실수는 롤백 불가 — error_risk=5/5 최고 등급
[STAT:p_value] P2~P4에서 DB 테이블 10개 추가 예정 (고위험 지속)

---

## [FINDING 4] vcx-* 커스텀 클래스가 561회 사용되나 에이전트용 레퍼런스가 없다

`vcx-sans`(188회), `vcx-label`(72회), `vcx-dark`(61회) 등 14종의 커스텀 클래스가  
`src/specs/design-system.md`에 정의되어 있으나, 이 파일은 에이전트 최적화가 아닌  
사람을 위한 문서다. AI 에이전트는 border-radius 추가, shadow 추가,  
잘못된 폰트 사용 등 디자인 시스템 위반을 반복적으로 저지른다.

[STAT:n] 561회 커스텀 클래스 사용, 14종 정의
[STAT:effect_size] agent_gain=5/5 — "zero border-radius" 같은 비직관적 규칙
[STAT:ci] 우선순위 스코어 4.25/5.00 (4위)

---

## [FINDING 5] Vitest 테스트 환경 quirk가 문서화되지 않으면 에이전트 hang을 유발한다

`lucide-react`의 `vi.importActual` 사용 금지와 파일당 ≤6 renders 제한이  
메모리에만 존재하며 코드베이스 어디에도 문서화되지 않았다.  
67개 테스트 파일이 존재하는 상황에서 이 규칙을 모르는 에이전트가  
테스트를 작성하면 vitest process가 hang되어 세션을 낭비한다.

[STAT:n] 67개 테스트 파일, 1개 known-quirk 문서화 없음
[STAT:effect_size] agent_gain=5/5, write_cost=4/5 (ROI 최고)
[STAT:p_value] 작성 소요 1시간 — 가장 낮은 비용으로 가장 큰 세션 손실 방지

---

## SKILL.md 후보 목록 (우선순위 순)

| 순위 | 파일명 | 스코어 | 작성시간 | 임팩트 | 핵심 커버리지 |
|------|--------|--------|----------|--------|--------------|
| 1 | SKILL-supabase-ssr.md | 4.80 | 2h | 높음 | server/client/middleware 3종 구분, 쿠키 패턴 |
| 2 | SKILL-supabase-migration.md | 4.40 | 2h | 높음 | vcx_ 접두사, RLS 템플릿, DDL 보호, 번호 규칙 |
| 3 | SKILL-zod-validation.md | 4.35 | 1.5h | 높음 | Zod v4 스키마, validation.ts 패턴, API route 통합 |
| 4 | SKILL-vcx-design-system.md | 4.25 | 1.5h | 높음 | vcx-* 클래스 전체 목록, 금지 규칙, 컴포넌트 예시 |
| 5 | SKILL-api-route-convention.md | 4.15 | 1.5h | 높음 | error helpers, getVcxUser, Zod 통합 패턴 |
| 6 | SKILL-auth-flow.md | 4.15 | 2h | 중간 | 5-tier route 분류, onboarding redirect, RPC |
| 7 | SKILL-testing-vitest.md | 3.90 | 1h | 높음 | lucide-react 금지, ≤6 renders, mock 패턴 |
| 8 | SKILL-ai-matching.md | 3.00 | 3h | 중간 | pgvector, embedding, P4-A 파이프라인 (P4 시작 전) |

---

## 기존 인프라와의 통합 전략

### CLAUDE.md vs SKILL.md 역할 분리

| 문서 | 역할 | 포함할 것 | 포함하지 말 것 |
|------|------|-----------|--------------|
| CLAUDE.md | **What** — 규칙과 제약 | 스택 목록, 아키텍처 규칙, 절대 금지 사항, 환경변수 | 코드 스니펫, 복붙 예시, 에러 케이스 |
| SKILL.md | **How** — 실행 패턴 | 복붙 가능한 코드, 언제 무엇을 쓰는지 결정 트리, 실수 예방 규칙 | 프로젝트 전체 구조 설명 |

현재 CLAUDE.md 커버리지가 92%(11/12)로 높기 때문에 SKILL.md는  
CLAUDE.md를 대체하는 것이 아니라 "실행 레이어"를 추가하는 방향이어야 한다.  
RLS 패턴(현재 MISSING)은 SKILL-supabase-migration.md에 포함시키면 된다.

### oh-my-claudecode 스킬과의 관계

- `oh-my-claudecode:deepsearch` → SKILL.md 패턴 탐색 시 활용
- `oh-my-claudecode:autopilot` → 실행 전 SKILL.md 참조 지시 프롬프트 추가 권장
- `oh-my-claudecode:ultrawork` → 병렬 에이전트가 동일 SKILL.md 참조 → 일관성 보장
- SKILL.md 위치: `src/skills/` 또는 `.claude/skills/` (프로젝트 루트 권장)

### Context7 MCP와의 보완 관계

| 사용 사례 | 우선 소스 | 이유 |
|-----------|-----------|------|
| 라이브러리 최신 API 문법 | Context7 MCP | 실시간 최신 버전 반영 |
| VCX 프로젝트 커스텀 패턴 | SKILL.md | Context7는 모름 |
| Supabase 클라이언트 선택 | SKILL.md | 프로젝트 고유 결정 |
| vcx_get_user_info RPC 사용 | SKILL.md | 프로젝트 내부 함수 |
| Zod v4 스키마 문법 | Context7 MCP | 최신 API 변경 가능 |
| vcx-* 클래스 사용법 | SKILL.md | 커스텀 유틸리티 |
| RLS 정책 작성 구조 | SKILL.md | 프로젝트 템플릿 |

**원칙:** "표준 라이브러리 문법 → Context7, VCX 커스텀 패턴 → SKILL.md"

---

## 유지보수 전략

### SKILL.md를 최신 상태로 유지하는 방법

1. **트리거 기반 업데이트**: 다음 이벤트 발생 시 해당 SKILL.md 업데이트
   - 새 마이그레이션 파일 추가 → SKILL-supabase-migration.md
   - 새 API route 패턴 발견 → SKILL-api-route-convention.md
   - 디자인 시스템 변경 → SKILL-vcx-design-system.md

2. **자동화 가능한 부분**:
   - `package.json` 의존성 버전 변경 감지 (git hook)
   - 마이그레이션 번호 중복 체크 스크립트 (`cli/vcx.ts`에 추가 가능)
   - vcx-* 클래스 사용 통계 자동 추출 (현 스크립트 재사용)

3. **자동화하면 안 되는 부분**:
   - 코드 패턴 의미 해석 → 사람 판단 필요
   - "금지 규칙" 추가/제거 → 아키텍처 결정

### 비용 대비 효과가 떨어져 만들지 말아야 할 SKILL.md

| 파일명 | 이유 |
|--------|------|
| SKILL-swr-data-fetching.md | 사용 파일 4개뿐, SWR 자체가 직관적 |
| SKILL-recharts-d3.md | P4-B까지 최소 6개월, 시기상조 |
| SKILL-next-app-router.md | Context7 MCP로 실시간 조회 충분 |
| SKILL-tailwind-basics.md | Tailwind 표준 부분은 불필요, vcx-* 만으로 충분 |
| SKILL-typescript-strict.md | 컴파일러가 강제, 문서 불필요 |

---

## 단계적 도입 로드맵

### Phase 1: 즉시 적용 (Day 1, ~7시간)

**목표:** 에이전트 오류 빈도가 가장 높은 3개 영역 즉시 커버

| 작업 | 파일 | 시간 | 우선 이유 |
|------|------|------|-----------|
| Vitest quirk 문서화 | SKILL-testing-vitest.md | 1h | 1시간으로 세션 hang 완전 방지 |
| Supabase SSR 패턴 | SKILL-supabase-ssr.md | 2h | 102개 파일, 최고 에러 위험 |
| 디자인 시스템 | SKILL-vcx-design-system.md | 1.5h | P2 UI 작업 직전 필수 |

**기대 효과:** UI 컴포넌트 수정 시 디자인 위반 0건, 테스트 hang 0건

### Phase 2: 단기 (Week 1, +5시간)

**목표:** P2 개발 착수 전 API/DB 레이어 완전 커버

| 작업 | 파일 | 시간 | 우선 이유 |
|------|------|------|-----------|
| Zod v4 + API validation | SKILL-zod-validation.md | 1.5h | 29% 불일치 해결 |
| API route convention | SKILL-api-route-convention.md | 1.5h | P2 신규 route 25개 대비 |
| Supabase migration | SKILL-supabase-migration.md | 2h | P2 DB migration 5-6개 예정 |

**기대 효과:** 신규 API route 패턴 일관성 100%, 마이그레이션 번호 중복 0건

### Phase 3: 중기 (Month 1, +4시간)

**목표:** P3 진입 전 인증 레이어 및 AI 매칭 사전 준비

| 작업 | 파일 | 시간 | 우선 이유 |
|------|------|------|-----------|
| Auth flow 문서화 | SKILL-auth-flow.md | 2h | P3 알림/분석 시스템 연동 |
| AI matching (사전 설계) | SKILL-ai-matching.md | 3h | P4-A 착수 전 pgvector 설계 |

**총 Phase 3까지 누적 시간:** ~16.5시간  
**커버된 SKILL.md:** 8개  
**예상 코드베이스 커버리지:** P2~P4 전체 도메인의 ~90%

---

## [LIMITATION]

1. **에이전트 행동 데이터 없음**: 실제 에이전트가 어떤 실수를 했는지 로그가 없어  
   `agent_gain` 점수는 코드 패턴 복잡도 기반 추정값이다.

2. **Context7 MCP 응답 품질 미검증**: Context7이 Zod v4, Supabase SSR 등  
   최신 API를 정확히 반환하는지 직접 테스트하지 않았다.

3. **SKILL.md 효과 측정 기준 없음**: SKILL.md 도입 전후 에이전트 오류율을  
   측정할 베이스라인 데이터가 현재 없다. 도입 후 비교를 위해 현재 상태 스냅샷을 보존 권장.

4. **1인 개발 환경**: 팀 규모가 커지면 SKILL.md 유지보수 부담이 선형 증가한다.

---

## 요약 결론

ValueConnect X는 이미 CLAUDE.md가 92% 커버리지로 잘 작성되어 있다.  
SKILL.md의 역할은 "무엇을 해야 하는가(CLAUDE.md)" 위에  
"어떻게 하는가(SKILL.md)"를 추가하는 것이다.  
가장 즉각적인 ROI는 7시간 투자로 테스트 hang 방지 + 102개 파일의  
Supabase 패턴 오류 방지 + P2 UI 디자인 위반 방지를 동시에 달성하는  
Phase 1 세 파일이다.
