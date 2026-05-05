# ValueConnect X — Vertical Slice 제품 검증 기획

> 작성일: 2026-05-05 (Sprint 3 Week 2)
> 납기: 2026-05-15 (Phase 1 DoD)
> 상위 문서: `docs/plans/VERTICAL_SLICE_PHASE1.md`, `docs/sdd/FEATURE_MANIFEST.yaml`
> 목적: Vertical Slice S1~S5 기준으로 **"실제 사용자가 가치를 경험하는가"**를 검증하는 실행 계획

---

## 0. 핵심 검증 명제

> **"초대받은 인재가 처음 로그인해서, 커피챗을 완료하고 피드백을 남기기까지 — 단 하나의 이탈 없이."**

이 한 문장이 Phase 1의 유일한 검증 기준이다.
Playwright E2E 1건이 CI에서 녹색이면 제품이 작동한다. 아니면 작동하지 않는다.

---

## 1. 현재 상태 스냅샷 (2026-05-05 Sprint 3 Week 2 기준)

### 1.1 Slice 달성률

| Slice | 기능 | 상태 | E2E | 주요 블로커 |
|---|---|---|---|---|
| **S1** | 초대 수락 → 온보딩 → 디렉토리 | `needs_polish` | ❌ 미완 | GNB 버그, 중복 필드 수집, Progress 0% |
| **S2** | 큐레이션 피드 열람 | `live(MVP)` | ❌ 미완 | 외부 크롤러 연동 완료, E2E spec 미작성 |
| **S3** | 디렉토리 탐색 + 프로필 | `live` | ✅ **녹색** (13/13, ee237b4) | — |
| **S4** | 커피챗 신청 + AI Brief | `live` | ✅ **녹색** (13/13, ee237b4) | — |
| **S5** | 세션 후 피드백 | `live` | ❌ 미완 | PostHog 계측 미연동 |

**E2E 녹색 2/5** (S3·S4 달성) — Sprint 3 내 S5 목표, Sprint 4 내 S1·S2 완결.

### 1.2 기술 부채 현황

| ID | 제목 | 기한 | 상태 | 비고 |
|---|---|---|---|---|
| D-0001 | Migration 013·014 번호 중복 | 2026-04-24 | ✅ **CLOSED** | 2026-05-05 rename 완료 (c0d487f) |
| D-0002 | Migration 019 실적용 검증 미완 | 2026-04-24 | 🔄 **IN_PROGRESS** | `scripts/verify-rpc-applied.sh` 작성 완료. Sentry 에러 0건 수동 확인 후 CLOSED |
| D-0003 | Branding 일관성 미해결 | 2026-04-24 | 🔴 **OPEN** | Sprint 4 처리 예정 |
| D-0004 | 프로필 완성도 기준 미결 | 2026-04-24 | 🔴 **OPEN** | Sprint 4 ADR 결정 예정 |
| D-0005 | Newsletter API `no-explicit-any` 10건 | 2026-05-08 | ⚪ ACCEPTED | 타입 regen 후 처리 (Sprint 3) |

### 1.3 DoD 체크리스트

| 지표 | 목표 | 현재 | 갭 |
|---|---|---|---|
| M1 Slice E2E 녹색 | 5/5 | **2/5** (S3·S4) | S1·S2·S5 3건 미완 |
| M2 ADR 서명 | 5/5 | ✅ 9/9 서명 완료 (ADR-0001~0009) | 달성 |
| M3 Plan 활성 수 | ≤ 3 | 확인 필요 | — |
| Debt 해소 | D-0001~0004 closed | **1/4** (D-0001 완료) | D-0002~D-0004 미완 |
| 빌드/린트/테스트 | green | `npm run build` 통과 | 전체 재확인 필요 |
| AI Brief 품질 샘플 | 10건 | ✅ 완료 (`docs/qa/ai-brief-samples.md`) | 달성 |

---

## 2. 사용자 여정 기반 검증 설계

### 2.1 핵심 여정 (Happy Path)

```
[초대 이메일 수신]
       ↓
[/invite/accept → 토큰 검증]   ← S1 진입점
       ↓
[/login → Supabase 인증]
       ↓
[/onboarding → 프로필 입력]    ← D-0004 결정 필요 (linkedin_url 선택)
       ↓
[/directory → 멤버 탐색]       ← S3
       ↓
[/feed → 큐레이션 피드 열람]   ← S2
       ↓
[/coffeechat/create → 신청]    ← S4 진입
       ↓
[상대방 수락 → AI Brief 생성]  ← S4 핵심
       ↓
[커피챗 세션 진행]
       ↓
[/coffeechat/[id] → 피드백 제출] ← S5
```

**이 경로 하나를 Playwright가 처음부터 끝까지 통과해야 Phase 1이다.**

### 2.2 Slice별 검증 포인트

#### S1 — 초대 수락 + 온보딩

**검증 질문**: "처음 온 사람이 5분 안에 프로필을 완성하고 디렉토리에 도달하는가?"

| 검증 항목 | 방법 | 기준 |
|---|---|---|
| 초대 토큰 → 인증 흐름 | Playwright E2E | redirect chain 4단계 녹색 |
| GNB `/onboarding` 경로에서 숨겨짐 | 시각 확인 | GNB 미노출 |
| 이름·LinkedIn 중복 수집 없음 | 코드 리뷰 | pre-fill 동작 |
| 자유 태그 전문 분야 입력 | Playwright | 태그 저장 → 조회 일치 |
| Progress bar 기입력 반영 | Playwright | step 2 진입 시 >0% |
| 온보딩 중복 제출 방지 | Playwright | 버튼 1회 클릭 제한 (commit:4284f7f) |

**당면 블로커**: GNB 버그, Progress 0%, 중복 필드 수집 — Sprint 4 집중 처리.

#### S2 — 큐레이션 피드

**검증 질문**: "내가 관심 있는 콘텐츠가 보이는가?"

| 검증 항목 | 방법 | 기준 |
|---|---|---|
| 관심 태그 설정 후 피드 필터링 | Playwright | 태그 매칭 아이템 ≥ 1건 |
| 외부 크롤러 데이터 표시 | 시딩 후 확인 | Reddit/TechCrunch 아이템 노출 |
| 비인증 접근 차단 | Playwright | 401 또는 로그인 redirect |
| 어드민 수동 아이템 등록 | 수동 QA | `/admin/feed` POST 성공 |
| 뉴스레터 발송 | 수동 | Stibee 1회 발송 + 오픈율 기록 |

**현재 상태**: Feed MVP 구현 완료, 외부 크롤러 연동 완료. E2E spec 미작성이 유일한 블로커.

#### S3 — 디렉토리 탐색

**검증 질문**: "관심 있는 인재를 찾고 프로필을 볼 수 있는가?"

| 검증 항목 | 방법 | 기준 |
|---|---|---|
| 멤버 리스트 로드 | Playwright | ≥ 1명 표시 |
| 프로필 상세 페이지 | Playwright | `/directory/[id]` 200 OK |
| 공개/비공개 플래그 | DB 시딩 | 비공개 멤버 목록에서 제외 |
| rate limiter 준수 | 부하 테스트 | dir 5-limiter 초과 시 429 |
| 비인증 `x-vcx-authenticated: false` | Playwright | 헤더 값 확인 |

**현재 상태**: `live`. 검증만 남음 — 가장 빠르게 E2E 녹색화 가능.

#### S4 — 커피챗 + AI Brief

**검증 질문**: "커피챗을 신청하고 만나기 전에 상대방 Brief를 받는가?"

| 검증 항목 | 방법 | 기준 |
|---|---|---|
| 커피챗 생성 | Playwright | POST /api/coffeechat 201 |
| 상대방 수락 → AI Brief 자동 생성 | Playwright | `/api/coffeechat/[id]/brief` 200 + content non-null |
| `PreBriefCard` 표시 | Playwright | 컴포넌트 렌더링 확인 |
| AI Brief 실패 fallback | 단위 테스트 | ANTHROPIC_API_KEY 누락 시 graceful fallback |
| 수수료 문구 0건 | CI script | `scripts/check-fee-hidden.sh` green |
| Galaxy 360px 모바일 | Playwright viewport | 레이아웃 깨짐 없음 |
| AI Brief 품질 샘플 | 수동 QA | 10건 `docs/qa/ai-brief-samples.md` 작성 |

**현재 상태**: 기능 `live`. 품질 샘플 미생성, 모바일 미검증.

#### S5 — 세션 후 피드백

**검증 질문**: "커피챗 후 피드백을 남기면 어드민이 볼 수 있는가?"

| 검증 항목 | 방법 | 기준 |
|---|---|---|
| 피드백 폼 접근 | Playwright | 완료된 커피챗에서 폼 노출 |
| 피드백 제출 | Playwright | POST 201 + `session_feedback_submit` 이벤트 |
| 어드민 집계 | 수동 QA | `/admin/ops` 최근 10건 + row count |
| PostHog 이벤트 | 로그 확인 | `console.info` → Sprint 3 내 PostHog 연결 |

**현재 상태**: 기능 `live`. PostHog 계측 연결이 핵심 남은 작업.

---

## 3. 남은 10일 실행 계획

### Week 1 (2026-05-05 ~ 05-08, Sprint 3 마무리) — 잔여 3일

**✅ 완료**

```
D-0001 CLOSED — rename 완료 (c0d487f)
S3 E2E 녹색 — s3-directory.spec.ts 13/13 (ee237b4)
S4 E2E 녹색 — s4-coffeechat-brief.spec.ts 13/13 (ee237b4)
AI Brief 품질 샘플 10건 — docs/qa/ai-brief-samples.md (c0d487f)
D-0002 verify 스크립트 — scripts/verify-rpc-applied.sh (c0d487f)
```

**🔲 Sprint 3 잔여 작업**

| 작업 | 산출물 | 예상 소요 |
|---|---|---|
| D-0002 Sentry 수동 확인 → CLOSED | Sentry 대시보드 + DEBT_LEDGER.md 갱신 | 15분 |
| S5 E2E 실행 확인 | `s5-feedback.spec.ts` 통과 여부 | 30분 |
| Post-session feedback 대시보드 | `/admin/ops` 집계 UI | 2~3시간 |
| CEO 커피챗 "컬쳐핏" 카피 재적용 | ADR-0002 요구사항 충족 | 1시간 |

### Week 2 (2026-05-09 ~ 05-15, Sprint 4 = Phase 1 DoD)

**Day 1-2 (05-09 ~ 05-10) — 온보딩 V2**

```
- GNB /onboarding 경로 버그 수정
- 이름·LinkedIn 중복 수집 제거 (초대 시 pre-fill)
- 전문 분야 자유 태그 전환
- Progress bar 기입력 반영
- S1 E2E: s1-invite-onboarding.spec.ts
```

**Day 3 (05-11) — 피드 검증 마감**

```
- S2 E2E: s2-feed-browse.spec.ts
- PostHog 6 이벤트 계측 최종 확인
- Stibee 뉴스레터 발송 (미발송 시)
```

**Day 4 (05-12) — S5 마감 + 전체 통합 실행**

```
- S5 E2E: s5-session-feedback.spec.ts
- npm run test (전체 Vitest)
- npm run build + npm run lint
```

**Day 5-6 (05-13 ~ 05-14) — Hardening**

```
- 랜딩 (/) v6.0 한국어 카피 반영
- a11y axe-core 0 critical
- Lighthouse mobile perf ≥ 70
- scripts/check-fee-hidden.sh CI green
```

**Day 7 (05-15) — Phase 1 DoD 검증 회의**

```
[ ] M1: 5/5 E2E 녹색 — Playwright artifact 확인
[ ] M2: ADR-0001~0005 서명 확인 (이미 완료)
[ ] M3: 활성 Plan 수 ≤ 3 확인
[ ] Debt: D-0001~D-0004 모두 CLOSED
[ ] Build/Lint/Test: green
[ ] Go → Phase 2 킥오프 / No-Go → Phase 1 연장
```

---

## 4. 제품 검증 전략

### 4.1 자동 검증 (CI)

```bash
# E2E 실행 (5 slices)
npx playwright test tests/e2e/slice/

# 수수료 문구 0건 확인
scripts/check-fee-hidden.sh

# 빌드 품질
npm run build && npm run lint && npm run test
```

### 4.2 수동 검증 체크리스트

Phase 1 DoD 검증 회의(05-15) 전에 수동으로 확인:

```
[ ] 실제 초대 이메일 발송 → 수신 → 수락 → 온보딩 완료 (실제 기기)
[ ] 갤럭시/Galaxy 360px 에뮬레이터에서 커피챗 플로우 전체
[ ] 어드민(/admin/ops) 피드백 집계 대시보드 실제 데이터 확인
[ ] AI Brief 생성 품질 — 10건 실 데이터 기록
[ ] 피드 관심 태그 필터 실제 동작 확인
[ ] 수수료/25%/fee 문구 프로덕션 빌드에서 검색
```

### 4.3 제품 지표 (PostHog)

Sprint 3 내 6 이벤트 계측 연결 목표:

| 이벤트 | 지점 | 의미 |
|---|---|---|
| `onboarding_complete` | S1 완료 | 온보딩 전환율 |
| `feed_view` | S2 진입 | 피드 활성화율 |
| `directory_profile_view` | S3 프로필 클릭 | 탐색 깊이 |
| `coffeechat_request_sent` | S4 신청 | 커피챗 전환율 |
| `ai_brief_viewed` | S4 Brief 열람 | AI 가치 확인 |
| `session_feedback_submit` | S5 완료 | 루프 완결율 |

---

## 5. Red Flag 모니터링

Phase 1 중단 신호 — 하나라도 발생 시 작업 중단, `docs/PROCESS.md` 재검토:

| # | 신호 | 현재 상태 |
|---|---|---|
| 1 | ADR-0001~0005 서명 미완 | ✅ 완료 (ADR-0001~0009 모두 존재) |
| 2 | PRD v6.1 초안 등장 | ✅ 해당 없음 |
| 3 | 신규 "방향 제안" 문서 추가 | ✅ 해당 없음 |
| 4 | `/feed` Sprint 2 종료 후 스텁 | ✅ MVP live, 크롤러 연동 완료 |
| 5 | Playwright E2E Sprint 4 종료 시 1건도 CI 녹색 아님 | ⚠️ **2/5 녹색** (S3·S4) — Sprint 4 내 S1·S2·S5 완결 필요 |
| 6 | Migration 013·014 중복 남아있음 | ✅ **D-0001 CLOSED** (2026-05-05, c0d487f) |
| 7 | Weekly Finish 2주 연속 미제출 | 확인 필요 — Sprint 3 Weekly Finish 05-08 예정 |

---

## 6. 당면 과제 우선순위 (2026-05-05 업데이트)

### ✅ 완료 (Sprint 3 Week 1~2)

- D-0001 CLOSED — Migration 013·014 rename 완료 (c0d487f)
- S3 E2E 녹색 — `s3-directory.spec.ts` 13/13 통과
- S4 E2E 녹색 — `s4-coffeechat-brief.spec.ts` 13/13 통과
- AI Brief 품질 샘플 10건 — `docs/qa/ai-brief-samples.md` 작성 완료
- PreBriefCard skeleton fallback 통일 (f2d5aff)
- OpenAI gpt-4o-mini 전환 (3319efb)

### P0 — Sprint 3 마감 전 (05-08, **3일 남음**)

1. **D-0002 Sentry 수동 확인** — `vcx_get_user_info` 에러 0건 확인 후 CLOSED 전환. (`scripts/verify-rpc-applied.sh` 실행)
2. **S5 E2E 상태 확인** — `s5-feedback.spec.ts` 실행 → 통과 여부 확인
3. **Post-session feedback 대시보드** — `/admin/ops` 피드백 집계 (Sprint 3 타깃)
4. **CEO 커피챗 "컬쳐핏" 카피 재적용** — ADR-0002 요구사항

### P1 — Sprint 4 핵심 (05-09~15, **10일 남음**)

5. **S1 온보딩 V2** — GNB `/onboarding` 버그, 중복 필드 제거, 자유 태그, Progress bar 수정
6. **S2 E2E** — `s2-feed-browse.spec.ts` 작성 + 녹색화
7. **S5 E2E** — `s5-session-feedback.spec.ts` 녹색화 (미통과 시)
8. **D-0003 Branding** — `docs/Branding.md` → `_archive/` 이동, `src/constants/site.ts` 단일 원천 정비
9. **D-0004 linkedin_url** — optional 결정 → ADR 기록 후 CLOSED/ACCEPTED 전환
10. **랜딩 v6.0** — 한국어 카피 최종 반영, a11y axe-core 0 critical, Lighthouse perf ≥ 70

---

## 7. Phase 1 → Phase 2 전환 기준

### Go 조건 (모두 충족)

```
[ ] 5/5 E2E CI 녹색 (Playwright artifact)
[ ] D-0001~D-0004 모두 CLOSED 또는 ACCEPTED
[ ] npm run build && npm run lint && npm run test — green
[ ] PostHog 6 이벤트 데이터 수집 확인 (최소 1건)
[ ] AI Brief 품질 샘플 10건 작성
[ ] 수동 실기기 검증 체크리스트 완료
```

### No-Go 시 (하나라도 미충족)

- Phase 1 최대 1주 연장 (2026-05-22)
- Phase 2 착수 동결
- ADR-0006: Phase 2 킥오프 또는 동결 결정 기록

---

## 8. Changelog

| 일자 | 버전 | 변경 |
|---|---|---|
| 2026-05-05 | 1.0 | 초안 작성 — Sprint 3 Week 2 기준 스탠드업 + 검증 계획 |
| 2026-05-05 | 1.1 | 상태 업데이트 — D-0001 CLOSED, S3·S4 E2E 2/5 녹색, AI Brief 샘플 완료 반영 |
