# Phase 1 Vertical Slice — ValueConnect X

> 납기: 2026-05-15 (4주)
> 책임: CTO = CPO = Sangmo Kang (1-hand + 48h 쿨다운)
> 상위 문서: `docs/PROCESS.md`, `docs/process-review-2026-04-17.md`, `docs/prd6.0.md`
> 본 문서는 Phase 1의 **유일한 스코프 SoT**. Manifest(`docs/sdd/FEATURE_MANIFEST.yaml`)와 1:1 대응.

---

## 0. 한 문장 목표

> **"초대받은 인재가 로그인해서, 자신의 관심 기반 큐레이션 피드를 보고, 디렉토리에서 관심 있는 인재를 찾고, 커피챗을 신청해서 AI Brief를 확인하고, 세션 후 피드백을 남긴다."**

이 한 여정이 **Playwright E2E 1건으로 CI에서 녹색**이 되면 Phase 1 DoD 달성.

---

## 1. Slice 5 Steps

| # | Step | 페이지 | 상태 (2026-04-17) | Sprint 타깃 |
|---|---|---|---|---|
| **S1** | 초대 수락 + 로그인 + 온보딩 | `/invite/accept` → `/login` → `/onboarding` → `/directory` | UX 버그 3종 잔존 | Sprint 1 (수정) |
| **S2** | 큐레이션 피드 열람 + 관심 설정 | `/feed` | **스텁만 존재** | Sprint 2 (MVP 구현) |
| **S3** | 디렉토리 탐색 + 프로필 열람 | `/directory`, `/directory/[id]` | live | Sprint 1 (검증) |
| **S4** | 커피챗 신청 + AI Brief 확인 | `/coffeechat/create`, `/coffeechat/[id]` | live (AI Brief 신규) | Sprint 3 (품질 검증) |
| **S5** | 세션 후 피드백 제출 | `/coffeechat/[id]` 피드백 폼 | live (최근 추가) | Sprint 3 (계측) |

---

## 2. Acceptance Criteria (per step)

### S1 — 초대 수락 → 온보딩 → 디렉토리 진입
- [x] 초대 이메일 링크 클릭 → `/invite/accept` → `/login` → `/onboarding` → `/directory` 리다이렉트 체인 녹색
- [x] 온보딩 GNB 노출 버그 수정 (`gnb-visibility.tsx`에 `/onboarding` 포함)
- [x] 이름·LinkedIn 중복 수집 제거 (초대 수락 시 받은 값 pre-fill)
- [x] 전문 분야 한/영 혼재 해소 (자유 태그로 전환)
- [x] Progress bar 0% 시작 버그 수정 (기입력 데이터 반영)
- [x] Playwright: `tests/e2e/slice/s1-invite-onboarding.spec.ts` 녹색

### S2 — 큐레이션 피드 MVP
- [x] `supabase/migrations/022_vcx_feed_items.sql` — `vcx_feed_items` 테이블 (company, tags, url, published_at, curator_note)
- [ ] 관심 분야 태깅 UI (온보딩에서 수집, 프로필에서 편집)
- [x] `/api/feed?limit=&tags=` Route Handler + Zod 검증
- [x] `/feed` 페이지: 관심 태그 기반 필터링된 10건 + 매주 수동 업데이트
- [ ] Stibee 뉴스레터 1회 발송 + 오픈율/클릭율 측정 (prd6.0 §1.4 Week 1~4)
- [x] Playwright: `tests/e2e/slice/s2-feed-browse.spec.ts` 녹색

### S3 — 디렉토리 탐색
- [ ] 페이지네이션/무한스크롤 성능 점검 (rate limiter 정책 검토)
- [x] 비인증 사용자에 대한 `x-vcx-authenticated: false` 처리 경로 검증
- [ ] 프로필 페이지 공개/비공개 플래그 (015 migration 기반) 재검증
- [x] Playwright: `tests/e2e/slice/s3-directory.spec.ts` 녹색

### S4 — 커피챗 신청 + AI Brief
- [x] Peer 커피챗 생성 플로우 재검증 (수수료 문구 0건 — `scripts/check-fee-hidden.sh` 통과)
- [ ] 커피챗 수락 시 AI Brief 자동 생성 (`f807e4f` 이후 동작 확인)
- [ ] `PreBriefCard` UI 모바일 (Galaxy 360px) 녹색
- [x] Brief 생성 실패 시 fallback (ANTHROPIC_API_KEY 미설정 케이스 — skeleton UI + catch 구현 확인)
- [x] Playwright: `tests/e2e/slice/s4-coffeechat-brief.spec.ts` 녹색

### S5 — 세션 후 피드백
- [x] `post-session feedback form` (migration 021) 접근 가능
- [x] 제출 시 `session_feedback_submit` 이벤트 발화 (PostHog Sprint 2 통합 전까지는 `console.info`)
- [x] 어드민 `/admin/ops` 에서 피드백 집계 대시보드 (row count + 최근 10건)
- [x] Playwright: `tests/e2e/slice/s5-session-feedback.spec.ts` 녹색

---

## 3. Phase 1 DoD (Definition of Done)

| 지표 | 목표 | 측정 |
|---|---|---|
| **M1 Slice Pages Green** | 5/5 | Playwright artifact 5건 녹색 |
| **M2 ADR Closed** | 5/5 | `docs/prd/ADR/ADR-000{1..5}-*.md` 존재 + 서명 |
| **M3 Plan Active Count** | ≤ 3 | `docs/plans/**/*.md` + `.omc/plans/**/*.md` 활성 |
| **Debt Ledger 초기 4건 해소** | 4/4 | D-0001 ~ D-0004 closed |
| **Tech Quality** | green | `npm run build` ✅ `npm run lint` ✅ `npm test` ✅ |

미달 시 **Phase 2 착수 금지**. Sprint 5+ (Cold Start 자동화, AI Brief V2, 등)은 논의 동결.

---

## 4. Slice 밖 (Phase 1 아님)

아래 항목은 Phase 1 스코프가 아니다. **이번 4주간 수정/개선 금지** (bug fix 및 보안 패치 예외):

- CEO 커피챗 심화 기능 (기본 플로우만 유지)
- 커뮤니티 신규 카테고리/이모지 반응 개선 (017 migration 유지)
- 포지션 게시판 신규 기능 (018 migration 유지)
- Admin 신규 기능 (기존 9개 유지, `/admin/ops` 피드백 대시보드만 추가)
- AI Resume Intelligence (Phase 2 후보)
- Multi-vertical 확장 (Phase 3+ 백로그)
- Domain Expert Routing (VCX 제품 아님)
- AI Ops Agent 7요소 (Sprint 1에서 헬스체크 1건만)

---

## 5. Sprint-by-Sprint 작업 분해

### Sprint 1 (2026-04-18 ~ 04-24) — "Close Decisions & Fix Debt"

| 작업 | Owner | Manifest ID | 산출물 |
|---|---|---|---|
| ADR-0001 ~ 0005 작성 + 서명 | Self | — | 5개 ADR 파일 |
| PROCESS.md 48h 쿨다운 재서명 | Self | — | §8 서명 완료 |
| Migration 013·014 중복 정리 | Self | D-0001 | `022_vcx_dedupe_013_014.sql` |
| Migration 019 실적용 검증 | Self | D-0002 | `scripts/verify-rpc-applied.sh` |
| 온보딩 UX 버그 3종 | Self | S1 | 관련 컴포넌트 수정 |
| open-questions 트리아지 | Self | D-0003 | `docs/plans/_open_questions_triaged.md` |
| Plan 아카이브 9건 이동 | Self | — | `docs/plans/_archive/INDEX.md` |
| FEATURE_MANIFEST.yaml v1 | Self | — | 7 features 선언 |
| Playwright S1 + S3 E2E | Self | S1, S3 | 2 specs 녹색 |
| `scripts/prd-freeze-check.sh` | Self | — | pre-commit hook |
| `scripts/check-fee-hidden.sh` | Self | ADR-0001 | CI script |
| 헬스체크 endpoint `/api/health` | Self | — | Vercel Cron 5분 |

### Sprint 2 (2026-04-25 ~ 05-01) — "Cold Start Feed MVP"

| 작업 | Owner | Manifest ID | 산출물 |
|---|---|---|---|
| `022_vcx_feed_items` (또는 020 확장) | Self | S2 | 마이그레이션 + RLS |
| 관심 태그 온보딩 UI | Self | S2 | `/onboarding` 확장 |
| 관심 태그 프로필 편집 | Self | S2 | `/directory/me` 섹션 |
| `/api/feed` Route Handler | Self | S2 | 테스트 포함 |
| `/feed` MVP | Self | S2 | SWR + 필터 |
| Admin 피드 생성 UI | Self | — | `/admin/feed` |
| Stibee 수동 뉴스레터 1회 | Self | — | 오픈율 측정 |
| PostHog 무료 tier 통합 | Self | — | 6 이벤트 계측 |
| Playwright S2 E2E | Self | S2 | spec 녹색 |
| `scripts/weekly-metrics.sh` | Self | — | `.omc/state/weekly-metrics.json` append |

### Sprint 3 (2026-05-02 ~ 05-08) — "Coffee Chat Loop + AI Brief Quality"

| 작업 | Owner | Manifest ID | 산출물 |
|---|---|---|---|
| Peer 커피챗 E2E 재검증 | Self | S4 | Playwright spec |
| AI Brief 생성 품질 샘플 (10건) | Self | S4 | `docs/qa/ai-brief-samples.md` |
| AI Brief 실패 fallback 검증 | Self | S4 | 테스트 |
| Post-session feedback 대시보드 | Self | S5 | `/admin/ops` |
| CEO 커피챗 "컬쳐핏" 카피 재적용 | Self | ADR-0002 | UI 텍스트 |
| `scripts/check-fee-hidden.sh` CI | Self | ADR-0001 | green |
| Playwright S4 + S5 E2E | Self | S4, S5 | 2 specs 녹색 |

### Sprint 4 (2026-05-09 ~ 05-15) — "Onboarding V2 + Landing + Phase 1 DoD"

| 작업 | Owner | Manifest ID | 산출물 |
|---|---|---|---|
| Landing (`/`) v6.0 카피 반영 | Self | — | 한국어 카피 정리 |
| 온보딩 V2 (중복 제거 + 자유 태그) | Self | S1 | `/onboarding` V2 |
| 5개 Slice E2E 전체 녹색 | Self | S1~S5 | CI green batch |
| a11y 점검 (axe-core) | Self | — | 0 critical |
| Lighthouse 예산 (mobile) | Self | — | perf ≥ 70 |
| **Phase 1 DoD 검증 회의** | Self (자기 리뷰) | — | Go/No-Go 기록 |
| Phase 2 Kick-off 또는 동결 결정 | Self | — | ADR-0006 |

---

## 6. Red Flag — Phase 1 중단 신호

(상위 `docs/process-review-2026-04-17.md` §6과 동기화)

1. ADR-0001~0005 중 Sprint 1 종료 시점 서명 < 5개
2. PRD v6.1 초안이 Sprint 2 전에 등장
3. `.omc/plans/` 또는 `docs/plans/` 에 신규 "방향 제안" 문서 추가
4. `/feed` 가 Sprint 2 종료 시점에도 스텁 상태
5. Playwright E2E가 Sprint 4 종료 시점에 1건도 CI 녹색 아님
6. Migration 013·014 중복이 Sprint 1 이후 남아있음
7. Weekly Finish 2주 연속 미제출

하나라도 발생 시 → 작업 중단, `docs/process-review-2026-04-17.md` 재검토.

---

## 7. Changelog

| 일자 | 버전 | 변경 | 서명 |
|---|---|---|---|
| 2026-04-17 | 1.0 | 초안 작성 | ________ (48h 쿨다운 중) |
| 2026-04-19 | 1.0 | 재서명 + 강제력 발생 | ________ |
