# 기술부채 단일 장부 (Debt Ledger)

> 상위 문서: `docs/PROCESS.md` §5.2.
> 매 커밋에서 부채를 추가하면 본 파일 append 강제 (pre-commit hook — Sprint 1 작성).
> **"알고 있는데 닫히지 않는 것"을 이 장부에 기록하여 가시화.**

---

## 초기 항목 (Sprint 1 내 해소 대상)

| ID | 제목 | 발견일 | 기한 | 상태 | 증거 | 해결 방법 |
|---|---|---|---|---|---|---|
| **D-0001** | Migration 013·014 번호 중복 | 2026-03-xx | 2026-04-24 | CLOSED | Filesystem 레벨 중복 해소 완료 (2026-05-05): `013_vcx_notifications_insert_policy.sql` → `024_vcx_notifications_insert_policy.sql`, `014_vcx_profile_visibility.sql` → `027_vcx_profile_visibility.sql`. 현재 마이그레이션 상태: `013_vcx_head_hunting_agreement.sql`, `014_vcx_community_reactions.sql`, `024_vcx_notifications_insert_policy.sql`, `027_vcx_profile_visibility.sql` | Rename으로 해소 완료 — 신규 022 마이그레이션 불필요 |
| **D-0002** | Migration 019 실적용 검증 미완 | 2026-03-31 | 2026-04-24 | CLOSED | 2026-05-07 supabase-js RPC 직접 호출 검증 완료: `vcx_get_user_info('00000000-0000-0000-0000-000000000000')` → `{"member":null,"corporate":null}` 정상 반환. 함수 존재 및 SECURITY DEFINER 설정 확인. psql 직접 접속은 DB 패스워드 불일치로 false negative 발생했으나 RPC 호출로 실증 완료. | supabase-js 클라이언트로 RPC 호출 성공 확인 |
| **D-0003** | Branding 일관성 5주 미해결 | 2026-03-13 | 2026-04-24 | CLOSED | 2026-05-07 확인: (1) `docs/Branding.md` 메인 브랜치에 미존재 — 이미 제거됨. (2) `src/constants/site.ts` — DESIGN_TOKENS, HERO_COPY JS 상수 단일 소스 운용 중. (3) `src/app/globals.css` — `--color-vcx-*` CSS 변수 단일 소스 운용 중 (vcx-gold:#c9a84c, vcx-dark:#1a1a1a 일치). (4) `npm run build` + `npm run lint` 0 errors. ADR 불필요 — 코드 상태로 결정. | 두 단일 소스(`site.ts` + `globals.css`) 이미 구축 완료, Branding.md 메인에 없음 |
| **D-0004** | 프로필 완성도 기준 미결 (linkedin_url 필수?) | 2026-03-31 | 2026-04-24 | CLOSED | 2026-05-05 구현 완료: `src/lib/validation/linkedin.ts` `optionalLinkedinUrlSchema` 추가, `onboarding-client.tsx` 필수 제거 + 라벨 `LinkedIn URL (선택)` 변경, `src/app/api/directory/me/route.ts` + `src/middleware.ts` isProfileIncomplete에서 linkedin_url 제거. vitest 48/48 pass. | linkedin_url optional + 미입력 시 온보딩 스킵 허용 구현 완료 (ADR 불필요 — 코드로 결정) |
| **D-0005** | Newsletter API 10건 `no-explicit-any` (Supabase RPC 타입) | 2026-05-01 | 2026-05-08 | CLOSED | 2026-05-05 확인: `src/types/supabase.ts` 에 `vcx_get_recipient_by_token` 반환 타입(`vcx_newsletter_recipients` Row) 이미 포함. route 파일 3건 any 키워드 0건. lint 에러 0건. 이전 시도 기록은 역사적 기록으로만 남김. | 타입 regen이 이미 적용된 상태였음 — 추가 조치 불필요 |

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
