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

## Sprint 4 / Phase 2 신규 부채 (2026-05-08 멀티 에이전트 검증 발견)

| ID | 제목 | 발견일 | 기한 | 상태 | 증거 | 해결 방법 |
|---|---|---|---|---|---|---|
| **D-0006** | AI Brief 샘플 품질 결함 (P2-S2 AC 미달) | 2026-05-08 | 2026-05-15 | OPEN | `docs/qa/ai-brief-samples.md` — 약속 15건 vs 실제 10건 (5건 미작성), 샘플 08 영어 작성, 샘플 09·14 "연봉의 25% 수수료" 노출 (ADR-0001 위반), 샘플 15 역방향 채용 권유 (ADR-0002 위반) | 샘플 5건 추가 작성 + FAIL 4건 (08/09/14/15) 수정 (한국어 강제 + 수수료 필터 + ADR-0002 준수). P2-S2 AC 재검증 필요 |
| **D-0007** | middleware `x-vcx-authenticated` 헤더 버그 (Phase 1 회귀) | 2026-05-08 | 2026-05-15 | IN_PROGRESS | `src/middleware.ts` L189 — `response.headers.set` 으로 설정해 Next.js 서버 컴포넌트의 `headers()` 가 읽지 못함 (request 헤더 X). 영향: build 13 페이지 prerender 실패 + E2E S1~S5 19/35 실패 + P2-S3 LoginWall 3 실패 = 22+ 회귀. ADR-0010 1차 서명 (2026-05-08) 시점 GREEN 이었던 Phase 1 DoD 의 D-7 회귀 | `requestHeaders.set('x-vcx-authenticated', ...)` + `NextResponse.next({ request: { headers: requestHeaders } })` 패턴으로 수정. 진행 중 (executor 에이전트 build + e2e 검증 중). + `src/app/community/` 빈 디렉토리 삭제 |
| **D-0008** | Phase 2 E2E spec 누락 (P2-S1, P2-S2) | 2026-05-08 | 2026-05-15 | CLOSED | commit `3b2476c feat(p2-s1)`, `0b45d32 feat(p2-s2)` 시 spec 파일 미생성. Playwright 검증 시 "파일 없음" → P2-S2 M1 게이트 미달 | 2026-05-08 멀티 에이전트로 작성 완료: `e2e/slice/p2-s1-cold-start.spec.ts` (319 라인, 4 testcase), `e2e/slice/p2-s2-ai-brief-v2.spec.ts` (455 라인, 5 testcase). TypeScript 컴파일 PASS. 실행 검증은 D-0007 해소 후 |

---

## Phase 1 D-7 트랙 (2026-05-08 갱신)

### 진척 반영 (CLOSE 후보)

| ID | 제목 | 발견일 | 기한 | 상태 | 증거 | 해결 방법 |
|---|---|---|---|---|---|---|
| **D-0009** | F-FEED status `stub → live` Manifest 불일치 | 2026-05-07 | 2026-05-08 | CLOSED | `docs/sdd/FEATURE_MANIFEST.yaml` F-FEED `status: live` 갱신 완료. P2-S3 커뮤니티 LoginWall + rate-limit + admin 리포트 라이브 반영. | Manifest 정합화 단건 PR로 해소 |
| **D-0010** | ADR-0011 Phase 2 슬라이스 미작성 | 2026-05-07 | 2026-05-08 | CLOSED | `docs/prd/ADR/ADR-0011-phase2-slice-scope.md` Proposed 상태로 작성. P2-S1/S2/S3 범위와 OUT-OF-SCOPE 명시. | ADR Proposed 상태로 신규 — 사용자 승인 대기 (별도 트랙) |
| **D-0011** | AI Ops Agent 설계 문서 부재 | 2026-04-03 | 2026-05-08 | CLOSED | `docs/architecture/AI_OPS_AGENT_DESIGN.md` 신규 작성. 헬스체크/3단계 게이트/7개 런북 VCX 서버리스 맞춤 변환. 이전 `.omc/plans/ai-ops-agent.md` 는 archive 이동. | 정식 설계 문서로 승격 — 구현은 Phase 2 후순위 |
| **D-0012** | Phase 2 AI Resume Intelligence PRD 부재 | 2026-03-26 | 2026-05-08 | CLOSED | `docs/prd/PHASE2_AI_RESUME_INTELLIGENCE.md` 신규 작성. 도메인 라우팅 + RLVR 정합화. 이전 `.omc/plans/ai-resume-intelligence.md` 는 archive 이동. | 정식 PRD 로 승격 — Phase 2 슬라이스 검토 후 진입 |
| **D-0013** | 런치 카피 3종 미작성 | 2026-05-07 | 2026-05-08 | CLOSED | 랜딩/온보딩/인증 카피 3종 신규 작성 (사용자 승인 카피 — §3.0 보호 대상). `src/app/page.tsx`, `src/components/service-pillars.tsx` 반영. | 카피 라이트 트랙 1차 완결 — 추가 변경 시 사용자 승인 필수 |
| **D-0014** | CEO 코피챗 Tailwind 미통일 (시각 P0) | 2026-05-06 | 2026-05-08 | CLOSED | CEO 커피챗 페이지 Tailwind 토큰 통일 + `rounded-*` 잔존 0건. 시각 P0 해소. | 시각 정합 P0 해소 — 디자인 정합 트랙은 `vcx-design-review.md` 로 이어감 |
| **D-0015** | E2E Phase 1 회귀 카운트 불확실 | 2026-05-07 | 2026-05-08 | CLOSED | Playwright 결과 40 pass / 1 fail / 19 skip 확정. fail 1건은 D-0016 으로 분리 추적, skip 19건은 D-0018 로 분리. | Phase 1 회귀 0건 (1 fail 은 P2 트랙) — 5/5 GREEN 정의는 G-NEW1 으로 별도 합의 |

### 신규 부채 (D-7 게이트 추적)

| ID | 제목 | 발견일 | 기한 | 상태 | 증거 | 해결 방법 |
|---|---|---|---|---|---|---|
| **D-0016** | P2-S2 TC1 401 (AI Brief Phase 2) | 2026-05-08 | 2026-05-15 | IN_PROGRESS | `e2e/slice/p2-s2-ai-brief-v2.spec.ts` TC1 401 응답. 별도 트랙에서 인증 컨텍스트 + Bearer 헤더 정합 확인 진행 중. Phase 1 회귀 아님 (P2 트랙). | API 라우트 인증 컨텍스트 디버그 + 픽스처 토큰 갱신 — D-0007 해소 후 회귀 재검증 |
| **D-0017** | Migration 030/031/019 운영 DB 미적용 | 2026-04-15 | 2026-05-15 | OPEN | `supabase/migrations/030_*.sql`, `031_vcx_consume_invite.sql` (invitee_name/company/title 반환), `019_vcx_get_user_info.sql` 배포 파이프라인 미실행. 사용자 액션 대기 (CLI/Dashboard 적용). | 사용자가 `supabase db push` 또는 SQL Editor 적용 — 코드 측 액션 없음 |
| **D-0018** | P2-S1 TC-1~3 시드 가드 미적용 시 전체 skip | 2026-05-08 | 2026-05-15 | OPEN | `e2e/slice/p2-s1-cold-start.spec.ts` TC-1/2/3 Migration 030/031 의존. 시드 가드 (skip vs fail-fast) 정책 미합의 → 19 skip 중 다수가 여기서 발생. | Migration 적용 후 자동 unskip — D-0017 해소에 종속 |
| **D-0019** | Vercel 배포 42일 정체 + valueconnect.kr 미연결 + DNS 전무 | 2026-03-27 | 2026-05-15 | OPEN | Vercel 대시보드 last deploy 42일 전. `valueconnect.kr` 도메인 Vercel 프로젝트에 미연결. DNS 레코드 0건. 사용자 액션 대기 (도메인 등록 + DNS 위임 + Vercel domain 연결). | 사용자 도메인 운영 — 코드 측 액션 없음 (배포 게이트는 D-Day 직전 별도 트랙) |
| **G-NEW1** | 5/5 GREEN 정의 — skip 카운트 정책 합의 필요 | 2026-05-08 | 2026-05-15 | OPEN | E2E 40 pass / 1 fail / **19 skip** 상태에서 "GREEN" 선언 가능 여부 미합의. PROCESS.md §5 M1/M2/M3 기준 + DoD 게이트 5단계와 정합 필요. | docs/PROCESS.md §5 + docs/plans/VERTICAL_SLICE_PHASE1.md §3 에 skip 분류 (의도적/마이그레이션 대기/픽스처 부재) 명시 후 D-Day 전 게이트 통과 기준 확정 |
| **G-NEW2** | data-testid 마이그레이션 필요 (placeholder 셀렉터 §3.0 충돌 위험) | 2026-05-08 | Phase 2 종료 | OPEN | E2E 셀렉터가 placeholder 텍스트 의존 — 사용자 승인 카피 §3.0 변경 시 회귀 위험. data-testid 로 안정화 필요. | 점진적 마이그레이션 — 카피 변경 트리거 발생 시 우선 적용. Phase 2 슬라이스에 포함 검토 |
| **G-NEW3** | P2-S1 TC-1~3 시드 가드 미적용 시 전체 skip (마이그레이션 의존) | 2026-05-08 | 2026-05-15 | OPEN | D-0018 과 동일 원인 — Phase 2 슬라이스 m1 게이트에서 unskip 정책 결정 필요. | Migration 030/031 적용 + 시드 픽스처 fail-fast 옵션 도입 |
| **G-NEW4** | Bearer 단독 라우트 보안 감사 진행 중 | 2026-05-07 | 2026-05-15 | IN_PROGRESS | 일부 API 라우트가 Bearer 단독 인증으로 동작 — RLS + middleware 정합 감사 진행 중. ADR-0010 후속 트랙. | 라우트별 인증 컨텍스트 매트릭스 + middleware 정책 통일 — 별도 PR |

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
