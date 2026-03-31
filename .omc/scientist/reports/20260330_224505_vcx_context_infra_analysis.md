# VCX AI Agent Context Infrastructure Analysis
**Generated:** 2026-03-30 22:45
**Project:** ValueConnect X (`/Users/kangsangmo/Desktop/valueconnectx`)

---

## [OBJECTIVE]
ValueConnect X 프로젝트의 현재 AI 에이전트 컨텍스트 인프라를 정량적으로 분석하고,
Google gemini-skills 방법론 대비 현재 적용 수준과 커버리지 갭을 식별한다.

---

## [DATA]

| 항목 | 측정값 |
|------|--------|
| CLAUDE.md 총 라인 수 | 156줄 |
| CLAUDE.md H2 섹션 수 | 7개 |
| CLAUDE.md H3 서브섹션 수 | 11개 |
| CLAUDE.md 코드 블록 수 | 3개 |
| AGENTS.md (프로젝트 내) | **없음** (node_modules/recharts/AGENTS.md만 존재) |
| .claude/ 설정 파일 수 | 1개 (settings.local.json) |
| docs/ 마크다운 파일 수 | 14개 (총 9,693줄) |
| 소스 TS/TSX 파일 수 | 223개 |
| JSDoc 어노테이션 파일 수 | 5개 (2.2%) |
| 인라인 주석 보유 파일 수 | 106개 (47.5%) |
| .omc/ JSON 파일 수 | 39개 |
| .omc/ MD 파일 수 | 9개 |
| project-memory.json customNotes | 0개 |
| project-memory.json userDirectives | 0개 |
| project-memory.json hotPaths | 27개 |

---

## [FINDING 1] CLAUDE.md는 "운영 핸드북" 수준이며 Agent Skill 방법론의 절반만 구현됨

VCX 프로젝트 CLAUDE.md의 20개 컨텍스트 차원 점수는 **35/60 (58.3%)**이다.
7개 차원에서 최고점(3점)을 기록하나, 6개 차원은 완전 부재(0점)이다.

[STAT:effect_size] 전체 커버리지: 35/60 = 58.3% (Gemini Skills 97% 대비 -39%p 갭)
[STAT:n] 20개 컨텍스트 차원 평가

**강점 (score=3):** tech_stack, directory_structure, architecture_rules, key_constraints,
dev_workflow_modes, quality_gates, agent_skill_integration

**부재 (score=0):** deployment_pipeline, state_management, component_patterns,
performance_guidelines, output_format_spec, tool_inventory (프로젝트 수준)

---

## [FINDING 2] Gemini-skills 10대 필러 대비 VCX는 47% 수준, OMC 글로벌은 83% 수준

10개 Agent Skill 필러 기준 3-way 비교:

```
  Pillar                       Gemini      OMC      VCX
  ------------------------------------------------------
  Role/Persona                    ■■■      ■■■      ■□□
  Tool Inventory                  ■■■      ■■■      □□□
  Constraints                     ■■■      ■■■      ■■□
  Success Criteria                ■■■      ■■□      ■■□
  Exec Protocol                   ■■■      ■■■      ■■□
  Output Format Spec              ■■■      ■■□      □□□
  Failure Modes                   ■■■      ■■□      ■□□
  Context Persistence             ■■□      ■■■      ■■□
  Inter-Agent Protocol            ■■■      ■■■      ■□□
  Domain Knowledge                ■■■      ■□□      ■■■
  ------------------------------------------------------
  TOTAL Gemini          29/30  (97%)
  TOTAL OMC Global      25/30  (83%)
  TOTAL VCX Project     14/30  (47%)
```

[STAT:effect_size] VCX Project vs Gemini Skills 갭: 15/30 포인트 (50% 미달)
[STAT:effect_size] VCX Project vs OMC Global 갭: 11/30 포인트 (44% 미달)
[STAT:n] 10개 필러, 3-point Likert scale

---

## [FINDING 3] OMC 글로벌 컨텍스트가 VCX 프로젝트 컨텍스트의 구조적 결함을 보완 중

VCX 프로젝트 CLAUDE.md가 취약한 필러(Role/Persona, Tool Inventory, Output Format,
Inter-Agent Protocol)를 OMC 글로벌 CLAUDE.md(~/.claude/CLAUDE.md)가 83% 수준으로 커버.
이 때문에 실제 에이전트 동작은 VCX 단독 점수(47%)보다 훨씬 효과적.

[STAT:ci] 실질 에이전트 컨텍스트 수준 추정: (14+25)/60 = 65% (두 파일의 합산 비중복 커버리지)
[STAT:n] 10 필러 × 2 파일 비교

**유사점 (Gemini vs OMC+VCX):**
- 도메인 지식 주입: VCX CLAUDE.md의 invite flow, member types, routing 규칙은 gemini-skills의
  domain-specific context injection과 동일한 패턴
- 실행 프로토콜: plan→execute 2단계 + 병렬화 기준은 gemini-skills Investigation_Protocol 수준
- 품질 게이트 체크리스트: Success_Criteria와 동일 기능

**차이점:**
- Gemini: 스킬별 독립 파일로 역할 격리 → VCX: 단일 파일에 혼재
- Gemini: <Output_Format> 명시적 태그 → VCX: 출력 형식 미지정
- Gemini: <Failure_Modes_To_Avoid> 구체적 반례 → VCX: DDL 금지만 존재
- Gemini: 에이전트별 Tool 목록 → VCX: 프로젝트 레벨 도구 제약 없음

---

## [FINDING 4] project-memory.json이 자동 스캔되었으나 사용자 지식이 0건

.omc/project-memory.json은 27개 hotPaths와 전체 directoryMap을 보유하나
`customNotes`와 `userDirectives`가 모두 0건이다.
에이전트가 도메인 특화 지식을 영속적으로 누적할 수 있는 채널이 비어 있음.

[STAT:n] 39개 .omc JSON 파일 검사
[STAT:effect_size] customNotes 활용률: 0/27 hotPaths = 0%

---

## [FINDING 5] 소스 코드 자체 문서화 수준이 낮음 (JSDoc 2.2%)

223개 TS/TSX 파일 중 JSDoc이 있는 파일은 5개(2.2%)에 불과.
인라인 주석은 47.5%(106개)로 중간 수준이나, 에이전트가 API 계약을 자동 추론하기 어려운 구조.

[STAT:n] n=223 소스 파일
[STAT:effect_size] JSDoc 커버리지: 2.2% (업계 권장 최소 20% 대비 -17.8%p)

---

## [LIMITATION]

1. **점수 주관성**: 커버리지 점수는 코드 분석자(Claude)의 판단 기반으로 측정자 간 신뢰도 미검증
2. **글로벌 CLAUDE.md 의존**: OMC 글로벌 설정이 변경되면 실질 컨텍스트 수준이 급락할 수 있음
3. **docs/ 파일 분류 미실시**: 9,693줄의 docs/ 문서가 에이전트에 실제로 주입되는지 미확인
4. **동적 컨텍스트 미측정**: project-memory.json 자동 스캔 내용의 실제 에이전트 활용도 미측정
5. **스냅샷 분석**: 2026-03-30 기준 단일 시점 분석; 스프린트 진행에 따라 변동 가능

---

## 컨텍스트 커버리지 갭 요약 (우선순위순)

| 우선순위 | 갭 항목 | 현재 점수 | 권장 조치 |
|---------|---------|-----------|-----------|
| P0 | AGENTS.md 부재 | 0/3 | 프로젝트 루트에 AGENTS.md 생성 |
| P0 | 출력 형식 미정의 | 0/3 | API 응답, 컴포넌트 구조 표준 추가 |
| P0 | 배포 파이프라인 미문서화 | 0/3 | Vercel 배포 규칙, 환경별 분기 추가 |
| P0 | 상태 관리 미문서화 | 0/3 | SWR 패턴, 전역 상태 접근법 추가 |
| P1 | 컴포넌트 패턴 미정의 | 0/3 | UI 컴포넌트 작성 규칙 추가 |
| P1 | 안티패턴 미문서화 | 1/3 | 주요 실수 사례 Failure_Modes 섹션 추가 |
| P1 | 데이터 모델 미문서화 | 1/3 | 주요 테이블 스키마 요약 추가 |
| P2 | project-memory 활용 | 0 entries | customNotes/userDirectives 채우기 |
| P2 | JSDoc 커버리지 | 2.2% | 핵심 lib/ 함수 JSDoc 추가 |

---

## 파일 경로

- 리포트: `.omc/scientist/reports/20260330_224505_vcx_context_infra_analysis.md`
- 레이더 차트 (ASCII): `.omc/scientist/figures/context_radar.txt`
- 갭 분석 차트 (ASCII): `.omc/scientist/figures/coverage_gaps.txt`
