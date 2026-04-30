# 기술부채 단일 장부 (Debt Ledger)

> 상위 문서: `docs/PROCESS.md` §5.2.
> 매 커밋에서 부채를 추가하면 본 파일 append 강제 (pre-commit hook — Sprint 1 작성).
> **"알고 있는데 닫히지 않는 것"을 이 장부에 기록하여 가시화.**

---

## 초기 항목 (Sprint 1 내 해소 대상)

| ID | 제목 | 발견일 | 기한 | 상태 | 증거 | 해결 방법 |
|---|---|---|---|---|---|---|
| **D-0001** | Migration 013·014 번호 중복 | 2026-03-xx | 2026-04-24 | OPEN | `CLAUDE.md` "013, 014번 중복 존재 — 주의", `supabase/migrations/013_vcx_head_hunting_agreement.sql` + `013_vcx_notifications_insert_policy.sql` / `014_vcx_community_reactions.sql` + `014_vcx_profile_visibility.sql` | 새 마이그레이션 `022_vcx_dedupe_013_014.sql` 로 merge 또는 rename 처리 |
| **D-0002** | Migration 019 실적용 검증 미완 | 2026-03-31 | 2026-04-24 | OPEN | `.omc/plans/open-questions.md` 'P0 Critical Bugs' 섹션, `019_vcx_fix_get_user_info.sql` | `scripts/verify-rpc-applied.sh` 작성 + Sentry 에러 0건 확인 |
| **D-0003** | Branding 일관성 5주 미해결 | 2026-03-13 | 2026-04-24 | OPEN | `.omc/plans/vcx-design-review.md`, `open-questions.md` 'vcx-design-review' 섹션 | Branding.md를 archive로 이동 + `src/constants/site.ts` + `src/app/globals.css` 를 single source로 ADR-0006 (선택적) 작성 |
| **D-0004** | 프로필 완성도 기준 미결 (linkedin_url 필수?) | 2026-03-31 | 2026-04-24 | OPEN | `open-questions.md` P0 섹션 | Sprint 1 내 결정: linkedin_url optional + 미입력 시 온보딩 스킵 허용 (제안) → ADR 선택 |
| **D-0005** | Newsletter API 10건 `no-explicit-any` (Supabase RPC 타입) | 2026-05-01 | 2026-05-08 | ACCEPTED | commit `ffc99d7`, `src/app/api/newsletter/{track/click,track/open,unsubscribe}/route.ts`, `supabase/migrations/023_vcx_newsletter.sql` 신규 RPC `vcx_get_recipient_by_token` | Sprint 3 진입 시 `npx supabase gen types typescript --local > src/types/supabase.ts` 재생성 후 `any` → 자동 추론 타입으로 교체. 시도 1: build-fixer-low → `as Promise<...>` 캐스팅 실패. 시도 2: executor sonnet → `unknown` 캐스팅, lint PASS but build FAIL ("vcx_get_recipient_by_token" 미정의). 결론: 타입 regen 선행 필수. |

---

## 열 설명

- **ID**: `D-NNNN` 4자리 zero-pad.
- **발견일**: 처음 인지된 커밋/문서 일자.
- **기한**: 닫혀야 하는 목표 일자 (대부분 현재 Sprint 종료일).
- **상태**: `OPEN` | `IN_PROGRESS` | `CLOSED` | `ACCEPTED` (의도적 허용).
- **증거**: 원인을 보여주는 파일/커밋/이슈 경로.
- **해결 방법**: 구체적 조치.

---

## 규칙

1. **부채 추가는 같은 PR에서 해소 계획과 함께** 또는 별도 PR로 open 상태로만 append.
2. 부채를 의도적으로 수용하려면 (`ACCEPTED`) ADR 작성 필요 — "이 부채를 안 갚는다"는 결정도 결정이다.
3. Phase 경계에서 open 부채 수 조회 가능해야 함 — `scripts/debt-count.sh` (Sprint 2 작성).
4. 3개월 이상 open 상태인 부채는 자동으로 "이번 Sprint에 close하거나 ACCEPTED로 전환" 트리거.

---

## 역사적 기록 (CLOSED 예시 — Sprint 1 종료 후 채워짐)

(비어있음. Sprint 1 종료 후 해소된 항목이 여기로 이동.)
