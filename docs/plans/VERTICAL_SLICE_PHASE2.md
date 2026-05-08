# Phase 2 Vertical Slice — ValueConnect X

> 납기: 2026-06-12 (4주, Sprint 5~8)
> 책임: CTO = CPO = Sangmo Kang (1-hand + 48h 쿨다운)
> 착수 조건: ADR-0010 2차 서명(2026-05-10) + Sprint 4 종료(2026-05-15) 이후
> 상위 문서: `docs/plans/VERTICAL_SLICE_PHASE1.md`, `docs/prd/ADR/ADR-0010-phase2-kickoff.md`
> 본 문서는 Phase 2의 **유일한 스코프 SoT**.

---

## 0. 한 문장 목표

> **"운영자가 초대를 발송해서 멤버 데이터가 자동으로 시드되고, AI Brief가 CEO·Peer 커피챗 모두에서 고품질 한국어 질문을 생성하며, 커뮤니티에서 반응과 댓글로 멤버 간 상호작용이 일어난다."**

---

## 1. Slice 3 Steps

| # | Step | 페이지/기능 | 상태 (2026-05-10) | Sprint 타깃 |
|---|---|---|---|---|
| **P2-S1** | Cold Start 자동화 | `/admin/invite` → 초대 시드 | 미구현 | Sprint 5 |
| **P2-S2** | AI Brief V2 | `/coffeechat/[id]` AI Brief | 기본 구현 있음 | Sprint 6 |
| **P2-S3** | Community 강화 | `/community` 반응·댓글·신고 | 기본 구현 있음 | Sprint 7 |

---

## 2. Acceptance Criteria (per step)

### P2-S1 — Cold Start 자동화

- [ ] `/admin/invite` 또는 기존 초대 플로우에서 이름·직책·회사 자동 수집
- [ ] 초대 수락 시 `vcx_members` 레코드 자동 생성 (name, company, title pre-fill)
- [ ] 중복 초대 방지 (이메일 기준 idempotent)
- [ ] S1 E2E 회귀 없음 (`tests/e2e/slice/s1-invite-onboarding.spec.ts` 유지)
- [ ] Playwright: `tests/e2e/slice/p2-s1-cold-start.spec.ts` 녹색

### P2-S2 — AI Brief V2

- [ ] CEO 커피챗 + Peer 커피챗 통합 Brief 생성 파이프라인 (공통 util)
- [ ] 한국어 강제 출력 프롬프트 (샘플 08 FAIL 케이스 방지)
- [ ] 수수료/fee/commission 문구 필터 (ADR-0001 enforce, 샘플 09 FAIL 케이스 방지)
- [ ] Brief 생성 실패율 < 5% (fallback skeleton 유지)
- [ ] 품질 샘플 추가 5건 → `docs/qa/ai-brief-samples.md` (총 15건)
- [ ] Playwright: `tests/e2e/slice/p2-s2-ai-brief-v2.spec.ts` 녹색

### P2-S3 — Community 강화

- [ ] 반응(이모지) 토글: 로그인 사용자만 가능, 비로그인 시 로그인 유도
- [ ] 댓글 작성·조회·삭제 (작성자 본인만 삭제)
- [ ] 신고 기능: `vcx_community_reports` 테이블 + 어드민 `/admin/ops` 집계
- [ ] Rate-limit: 댓글 10건/분, 반응 30건/분 (Upstash)
- [ ] Playwright: `tests/e2e/slice/p2-s3-community.spec.ts` 녹색

---

## 3. Phase 2 DoD (Definition of Done)

| 지표 | 목표 | 측정 |
|---|---|---|
| **M1 Slice Pages Green** | 3/3 | Playwright artifact 3건 녹색 |
| **M2 Phase 1 E2E 회귀** | 0건 | S1~S5 25건 유지 |
| **M3 Plan Active Count** | ≤ 3 | `docs/plans/**/*.md` 활성 |
| **Tech Quality** | green | `npm run build` ✅ `npm run lint` ✅ `npm test` ✅ |

미달 시 **Phase 3 착수 금지**.

---

## 4. Slice 밖 (Phase 2 아님)

아래 항목은 Phase 2 스코프가 아니다 (ADR-0010 동결):

- AI Resume Intelligence
- Domain Expert Routing (RLVR)
- PRD v6.1 확장 기능
- Multi-Vertical Vision
- 포지션 게시판 신규 기능
- 뉴스레터 자동화 (ADR-0009 자체 인프라 위에서 수동 운영 유지)

---

## 5. Sprint-by-Sprint 작업 분해

### Sprint 5 (2026-05-16 ~ 05-22) — "Cold Start 자동화"

| 작업 | Owner | 산출물 |
|---|---|---|
| 초대 시 멤버 데이터 자동 시드 설계 | Self | ADR-0011 (필요 시) |
| migration: 초대 메타데이터 컬럼 추가 | Self | `NNN_vcx_invite_seed.sql` |
| 초대 수락 플로우 자동 시드 구현 | Self | `/api/invite/accept` 수정 |
| S1 E2E 회귀 확인 | Self | `s1-invite-onboarding.spec.ts` 유지 |
| Playwright P2-S1 E2E | Self | `p2-s1-cold-start.spec.ts` 녹색 |

### Sprint 6 (2026-05-23 ~ 05-29) — "AI Brief V2"

| 작업 | Owner | 산출물 |
|---|---|---|
| CEO + Peer 공통 Brief util 추출 | Self | `src/lib/ai/brief.ts` |
| 한국어 강제 + 수수료 필터 프롬프트 | Self | Prompt 개선 |
| Brief 품질 샘플 +5건 | Self | `docs/qa/ai-brief-samples.md` |
| Playwright P2-S2 E2E | Self | `p2-s2-ai-brief-v2.spec.ts` 녹색 |

### Sprint 7 (2026-05-30 ~ 06-05) — "Community 강화"

| 작업 | Owner | 산출물 |
|---|---|---|
| migration: `vcx_community_reports` | Self | `NNN_vcx_community_reports.sql` |
| 댓글 CRUD API + RLS | Self | `/api/community/[id]/comments` |
| 반응 토글 UI (비로그인 유도) | Self | 컴포넌트 수정 |
| 신고 버튼 + 어드민 집계 | Self | `/admin/ops` 추가 |
| Rate-limit (Upstash) | Self | `src/lib/rate-limit.ts` 확장 |
| Playwright P2-S3 E2E | Self | `p2-s3-community.spec.ts` 녹색 |

### Sprint 8 (2026-06-06 ~ 06-12) — "Phase 2 DoD 검증"

| 작업 | Owner | 산출물 |
|---|---|---|
| 3개 Slice E2E 전체 녹색 | Self | CI green batch |
| Phase 1 E2E 회귀 0건 확인 | Self | S1~S5 25건 유지 |
| a11y 점검 (axe-core) | Self | 0 critical |
| **Phase 2 DoD 검증 회의** | Self | Go/No-Go 기록 |
| Phase 3 Kick-off 결정 | Self | ADR-0012 |

---

## 6. Changelog

| 일자 | 버전 | 변경 | 서명 |
|---|---|---|---|
| 2026-05-08 | 0.1 | 초안 작성 (ADR-0010 착수 조건 #2) | Sangmo Kang |
