# CEO Memo — 2026년 4월

> Author: Sangmo Kang (CEO role per docs/roles/CEO.md)
> Published: 2026-04-19
> Purpose: Phase 1 최단 완주를 위한 의사결정·리스크·우선순위 공유
> Distribution: 프로젝트 SoT (1인 체제에서는 self + agents)

## 1. 북극성 재확인

- **VCX의 목적:** 검증된 인재와 기업 리더를 연결하는 초대 전용 Private Talent Network — 시장 독점적 "invite-only × 고품질 매칭" 포지션 확보.
- **Phase 1 North Star (2026-05-15):** "인재 로그인 → 큐레이션 피드 → 디렉토리 열람 → 커피챗(AI Brief) → 세션 후 피드백" 5단계 슬라이스가 실멤버에게 흐르게 만든다.
- **주주가치 방어선:** 26일 남은 기간 내 Phase 1 DoD(E2E 5/5 green + ADR 5건 서명 + Red Flag 해소)를 닫는다. 닫히지 못하면 Sprint 5로 연기하되, 그 전에 scope를 줄여서라도 "실사용 흐름"을 보존한다.

## 2. 2026-04-19 점검 결과

### 2.1 긍정적 사실 (예상 대비 호재)
- `npm run build` exit 0 — 14개 라우트 전부 컴파일 성공.
- `020_vcx_curation_feed.sql`의 `vcx_feed_items` 테이블 이미 존재 — Feed MVP DB 기반 확보.
- E2E 인프라(`e2e/auth-flow.spec.ts`, `coffeechat-flow.spec.ts`, `notification-flow.spec.ts`, `global-setup.ts`, `helpers/`) 이미 작동 — 제로부터 짓는 게 아니다.
- AI Brief 기능(f807e4f, 2026-04-03)과 세션 후 피드백 API(f904d70) 머지 완료.

### 2.2 Phase 1을 막는 블로커 TOP 3
1. **Migration 013·014 번호 중복 4파일** — `013_vcx_head_hunting_agreement.sql` + `013_vcx_notifications_insert_policy.sql`, `014_vcx_community_reactions.sql` + `014_vcx_profile_visibility.sql`. 다음 production deploy 시 서로 다른 환경에서 적용 순서가 흔들리면 장애 위험.
2. **ADR-0001~0005 미작성** — PROCESS.md §1.2 기한 2026-04-24, Red Flag #1 임박.
3. **`prd6.1.md` 이중 PRD** — Red Flag #2 기술적으로 이미 발동.

## 3. CEO 지시 (2026-04-19 실행)

사용자(주주) 승인에 따라 아래 3축을 즉시 실행.

| # | 지시 | 실행자 | 결과 (2026-04-19 기준) |
|---|------|-------|----------------------|
| D1 | ADR-0001~0005 배치 초안 작성 (Annex A §A.2 배치 타이머) | CPO → executor agent | ✅ 5개 파일 생성, 쿨다운 만료 2026-04-21, 머지 적격 2026-04-22 |
| D2 | `prd6.1.md` 및 CDO 리뷰 문서를 `docs/prd/_archive/`로 이관 + ADR-0006 기록 | CPO → executor agent | ✅ git mv 완료, Archive README 작성, ADR-0006 Accepted 상태 |
| D3 | Migration 번호 중복 검출 스크립트 (`scripts/migration-number-check.sh`) + pre-commit 연결 예고 | CDO → executor agent | ✅ 스크립트 작성·실행권한 부여, 현 상태(013/014 탐지) 확인. ADR-0007 + prod DB sync는 Sprint 1 잔여에 잔여 |

## 4. 2026-04-19 이후 최단 경로

### 4.1 Sprint 1 잔여 (2026-04-19 ~ 2026-04-24, D-5)

**반드시 닫을 것:**
- G02 ADR-0001~0005 48h 쿨다운 후 2차 서명 (2026-04-21~22)
- G05 `scripts/prd-freeze-check.sh` (pre-commit hook, PROCESS §1.3 작동 전제)
- G11 ADR-0007 "Historical migration duplicate" 서명 + prod `supabase_migrations` 테이블 상태 확인
- Phase 1 slice별 E2E spec 골격: `e2e/slice/s1-auth.spec.ts`, `s2-feed.spec.ts`, `s3-directory.spec.ts` 최소 3건 seed (나머지 S4·S5는 Sprint 2)

**Skip (Phase 1 밖으로 밀어냄):**
- G01의 디테일(월간 memo 포맷 정교화) — 본 memo로 최소 요건 충족.
- G04 채용 JD — Phase 2 이후.

### 4.2 Sprint 2 (2026-04-25 ~ 2026-05-01)

- G10 PII Inventory (PIPA, 필수 법적 게이트)
- G12 SLO 문서 (error budget 계산 근거)
- G15 DESIGN-SYSTEM.md (Feed UI 품질 보증 전)
- Phase 1 slice E2E S4·S5 + PostHog `session_feedback_submit` 이벤트 계측

### 4.3 Sprint 3 (2026-05-02 ~ 2026-05-08)

- fee-hidden enforcement 스크립트 (ADR-0001 자동화)
- `scripts/ci-local.sh` 4 gate 단일 커맨드
- 디자인 lint 스크립트 (G17)
- 전 slice regression run

### 4.4 Sprint 4 (2026-05-09 ~ 2026-05-15)

- E2E CI 녹색 일괄 확인 + DoD 검증
- Phase 1 완주 판정

## 5. 리스크 Top 3 (CEO 시야)

| 리스크 | 영향 | CEO 지시 |
|------|------|---------|
| 1인 체제의 번아웃 | Phase 1 미달 | Sprint 1 잔여 5일은 "블로커 해소만" — 신규 기능 금지. Critical path 외 요구는 거절 |
| ADR 배치 쿨다운 중 새로운 결정이 끼어들어 배치 깨짐 | Sprint 2 착수 지연 | 배치 서명 완료(04-22)까지 새 ADR 초안 작성 동결 |
| Sentry/SLO 없는 상태에서 production 사고 발생 | 고객 이탈 | G12 SLO + G13 smoke test를 Sprint 2 최우선. SRE role이 자동 watcher 설정 |

## 6. 글로벌 Reference Scan — 차기 분기 과제

Phase 1 완주 확정 후(2026-05-15 이후) CEO가 분기 `market-scan-2026Q2.md` 작성. 대상:
- Lunchclub (peer matching UX)
- Polywork (curated talent graph)
- Pallet (invite-only operator network)
- Y Combinator Co-founder matching (AI 추천 기준)
- LinkedIn Premium (B2C 고가 티어 가격 설계)

## 7. 다음 CEO 업데이트

- **2026-04-22 (ADR 배치 서명 직후):** 서명 완료 여부 한 줄 리포트
- **2026-04-25 (Sprint 1 close / Sprint 2 start):** 잔여 블로커 재점검
- **2026-05-01 (Sprint 2 close):** PII·SLO·Design 3건 상태
- **2026-05-15 (Phase 1 완주 판정):** DoD 체크리스트 일괄 검증

## References

- PROCESS SoT: `docs/PROCESS.md`
- Role harness: `docs/roles/` (Annex A)
- Active ADRs: `docs/prd/ADR/ADR-0001~0006`
- Phase 1 slice: `docs/plans/VERTICAL_SLICE_PHASE1.md`
- Gap tracking: `docs/roles/GAP-LEDGER.md`
- Approved plan (본 memo 배경): `.omc/plans/agent-roles-and-harness.md`
