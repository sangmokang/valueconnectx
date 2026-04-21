---
name: vcx-history-digest
description: ValueConnect X raw 프롬프트 로그 (`.omc/state/user-prompts.raw.jsonl`) 를 `history.md` 의 요약 섹션으로 소화. vcx 제품 · 초대 · 커피챗 · AI Brief · 디렉토리 · 포지션 · 커뮤니티 · Galaxy 360 관련 요구사항 변경 이력 관리. 트리거 — "history digest", "프롬프트 요약", "히스토리 정리", "raw 로그 소화", "요구사항 이력", "vcx 변경 기록" 언급 시 호출.
---

# VCX-History-Digest · raw 로그 → history.md 요약 삽입

## Why

ValueConnect X 1인 팀 운영에서 세션 프롬프트 이력은 단일 원천 기억. raw jsonl 은 그 자체로 검색 가능한 원본, `history.md` 는 **요구사항 변경 이력**으로 선별된 사람이 읽는 narrative. 두 파일을 분리 관리하여:
- raw 는 감사 · 재분석용으로 append-only 보존
- digest 는 Sprint Review · Weekly Finish Ritual (`docs/PROCESS.md` §5.4) 에서 "이번 주 뭐 바꿨나" 를 1분에 훑을 수 있는 narrative

CLAUDE.md §7.1 에 따라 본 스킬이 직접 수정 허용하는 경로: `history.md` (repo 루트). raw 경로는 OMC 표준 `.omc/state/user-prompts.raw.jsonl`.

## 작업 순서

1. **raw 로그 읽기** — `.omc/state/user-prompts.raw.jsonl` 을 읽는다. 파일이 없으면 "기록된 프롬프트가 없습니다" 로 종료.
2. **digest 대상 파일 읽기** — `history.md` (repo 루트) 를 읽는다.
3. **선별** — raw 로그의 각 항목에서:
   - 단순 인사, `/clear`, 빈 프롬프트, 이전 대화 이어하기, 탐색성 질문 (“이 파일 뭐야”) 등 **요구사항 변경이 아닌 항목은 제외**.
   - 기능 요청 (초대 수락, 커피챗, AI Brief, 디렉토리, 커뮤니티, 포지션), 변경 요청 (Galaxy 360 모바일, RLS, Tailwind v4), 개선 제안, 버그 리포트, 디자인 지시 등 **요구사항 변경에 해당하는 항목만** 선별.
4. **요약 작성** — 선별된 항목을 `history.md` 의 기존 포맷에 맞춰 요약:
   - 날짜 헤더: `## YYYY-MM-DD` (KST 기준, DESC 정렬)
   - 시각: `### [HH:MM] 한줄 요약`
   - 본문:
     - `- **요청**: 사용자가 요청한 내용 1~2 문장`
     - `- **개선**: 실제 반영된 변경 사항 (아직 미반영이면 "미반영 — 대기 중")`
     - `- **영향 파일**: 변경된 파일 목록 (알 수 있는 경우 — `src/app/`, `src/components/`, `supabase/migrations/` 등)`
5. **삽입** — 새 항목을 `history.md` 의 **최상단 날짜 섹션에 DESC 삽입** (부록 B 정렬 규칙 준수).
6. **processed 이동** — 삽입 완료 후, 처리된 항목을 `.omc/state/user-prompts.processed.jsonl` 로 이동 (append) 하고 `.omc/state/user-prompts.raw.jsonl` 에서 제거하여 중복 방지.
7. **보고** — 결과를 사용자에게 보고: 추가된 항목 수, 제외된 항목 수, 1~2 문장 요약.

## 규칙

- `history.md` 상단 내러티브 섹션 (부록 위) 에만 삽입. **부록 A / B / C 는 건드리지 않는다**.
- 동일 세션에서 여러 프롬프트가 하나의 기능 (예: Peer 커피챗 + AI Brief 카드) 을 점진적으로 만들었다면, **하나의 항목으로 병합** 한다.
- 원본 raw 로그는 **절대 삭제하지 않는다** (processed 로 이동만).
- 이미 `history.md` 에 기록된 내용과 중복되는 항목은 건너뛴다.
- 수동으로 편집된 섹션 (예: 부록에 수기로 추가된 메모) 은 보호 — 덮어쓰기 금지.
- vcx 도메인 컨텍스트 유지: "인재 멤버" (`vcx_members`), "기업 사용자" (`vcx_corporate_users`), "초대 전용" 기조를 요약 카피에 반영.

## 경로 매핑

| 역할 | VCX 실제 경로 |
|---|---|
| raw 원본 (append-only 보존) | `.omc/state/user-prompts.raw.jsonl` |
| narrative digest (사람이 읽는) | `history.md` (repo 루트) |
| 처리 완료 아카이브 | `.omc/state/user-prompts.processed.jsonl` |

## 후속 작업

- Weekly Finish Ritual (금 18:00 KST, `docs/PROCESS.md` §5.4) 전에 본 스킬 자동 호출 권장 — 그 주의 요구사항 변경을 1분 데모 영상 + M1/M2/M3 스크린샷과 함께 제출.
- Sprint 종료 시점 (`docs/plans/VERTICAL_SLICE_PHASE1.md` §5 Sprint 1~4 종료일) 에도 호출 — Sprint 별 narrative 섹션 정리.
- 처리 과정에서 **진행 중 작업 (미반영 — 대기 중)** 항목을 발견하면 `.omc/plans/_backlog/ideas.md` (존재 시) 또는 `docs/sdd/DEBT_LEDGER.md` 로 상호 참조 링크 추가 권장.
