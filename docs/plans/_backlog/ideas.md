# Backlog — ValueConnect X 아이디어 백로그

> 본 파일은 **단일 파일**로 유지한다 (PROCESS §2.2, README §2.3).
> 새 아이디어는 모두 여기에 append. 개별 파일 생성 금지.
> 참조는 **Sprint retro 주간 (금요 Weekly Finish) 에만**. 평상시 열람 금지.

---

## 사용법

- 아이디어 발생 시 → 아래 "Entries" 섹션에 `### YYYY-MM-DD — <제목>` 형식으로 append.
- 각 항목 최소 형식:
  ```markdown
  ### YYYY-MM-DD — <제목>
  **Source**: (원본 plan 파일, 대화, 커밋 등)
  **One-liner**: (30단어 이내)
  **Phase candidate**: 2 | 3 | 3+
  **Kill criteria**: (어떤 조건이면 폐기하는가)
  ```
- 백로그 → 실행 승격은 ADR + `docs/plans/<codename>/` 생성 + 활성 plan 1개 archive 교체.

---

## Entries

### 2026-04-17 — Multi-vertical 확장 (미슐랭 3스타 비전)
**Source**: `.omc/plans/bmplan-multi-vertical-vision.md` (아카이브)
**One-liner**: IT/Tech에서 시작해 요리·음악·예술 등 각 분야 최정상 인재 네트워크로 확장.
**Phase candidate**: 3+
**Kill criteria**: IT/Tech Phase 1·2 완료 전에는 논의 동결. Phase 2 종료 후 시장성 재평가.

### 2026-04-17 — AI Resume Intelligence (이력서 AI 스튜디오)
**Source**: `.omc/plans/ai-resume-intelligence.md` (아카이브)
**One-liner**: 멤버 경력 데이터 → LLM 기반 이력서 자동 생성 + 개선 제안.
**Phase candidate**: 2
**Kill criteria**: Phase 1 AI Brief 품질(S4 E2E)이 기준 미달이면 AI 제품군 확장 동결.

### 2026-04-17 — Stibee 자동화 파이프라인 (Cold Start Feed V2)
**Source**: `docs/prd6.0.md` §1.4 Month 2~3 자동 큐레이션
**One-liner**: 관심 태그 기반 채용정보 자동 수집·분류·발송.
**Phase candidate**: 2
**Kill criteria**: Phase 1 수동 발송 오픈율 < 30%이면 Stibee 투자 보류.

### 2026-04-17 — LLM 기반 자연어 니즈 매칭 구독
**Source**: `docs/prd6.0.md` §1.4 Month 4~
**One-liner**: 멤버가 자연어로 관심사를 입력 → LLM이 실시간 매칭 채용정보 구독.
**Phase candidate**: 3
**Kill criteria**: Phase 2 Stibee 자동화 안정성 < 99% 이면 비용 구조 재검토.

### 2026-04-17 — AI Ops Agent 7요소 전체
**Source**: `.omc/plans/ai-ops-agent.md` (아카이브 `_archive/infra/`)
**One-liner**: 헬스체크 + 런북 + 3단계 안전 게이트 + Slack 통합 + 환경 스냅샷.
**Phase candidate**: 2
**Kill criteria**: Phase 1 헬스체크 1건이 월 uptime < 99.5% 이면 재설계.

### 2026-04-17 — Self Introduction / Peer Referral Reward
**Source**: `docs/prd6.0.md` §1.3 수익 모델
**One-liner**: 멤버 본인 추천 + 동료 추천 → 채용 성사 시 보상 지급.
**Phase candidate**: 2
**Kill criteria**: Phase 1 성사 건수 0건이면 보상 구조 논의 동결 (사전 수익 필요).

### 2026-04-17 — 프리미엄 기업 계정
**Source**: `docs/prd6.0.md` §1.3 수익 모델
**One-liner**: CEO Coffee Chat 우선권 + 인재 디렉터리 열람 등급 상향.
**Phase candidate**: 3
**Kill criteria**: B2B 수요 검증 (최소 5개 기업 인터뷰) 없이 구현 시작 금지.

---

## 폐기된 아이디어

(비어있음. 폐기 시 이 섹션에 이유와 일자를 남길 것.)
