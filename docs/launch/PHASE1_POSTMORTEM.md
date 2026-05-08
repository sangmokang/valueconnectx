# Phase 1 Postmortem — ValueConnect X

> **Status**: `Template` (D+7 작성 후 `Active` 로 전환)
> **D-day**: 2026-05-15
> **POSTMORTEM 작성 시점**: 2026-05-22 (D+7)
> **Owner**: TBD — `docs/plans/PHASE1_TO_PHASE2_TRANSITION.md` §6 Owner 매트릭스에서 지정 (vcx-cpo 권고)
> **권위 문서**:
> - `docs/plans/PHASE1_TO_PHASE2_TRANSITION.md` §3 E2 (본 문서 작성이 Phase 2 진입 조건)
> - `docs/plans/VERTICAL_SLICE_PHASE1.md` §3 DoD
> - `docs/PROCESS.md` §5.1 Weekly Metrics
> - `docs/sdd/DEBT_LEDGER.md` (부채 변화 추적)

---

## §1 Executive Summary

> 3~5줄. 비-기술자도 읽을 수 있는 톤.

// TODO(D+7): Phase 1 출시 GO/NO-GO 결과 (D-day 17:00 KST 결재 결과)
// TODO(D+7): 운영 7일간 핵심 지표 한 줄 — 예: "초대 N건 발송, 수락 N%, 온보딩 완료 N%"
// TODO(D+7): Phase 2 진입 가능 여부 — `PHASE1_TO_PHASE2_TRANSITION.md` §3 E1~E4 충족 여부

---

## §2 출시 흐름 (D-day → D+7)

### 2.1 D-day (2026-05-15) 발송 결과

| 항목 | 계획 | 실측 | 비고 |
|---|---|---|---|
| 초대 발송 건수 | TBD | // TODO(D+7) | `docs/launch/INVITE_EMAIL_TEMPLATE.md` 기반 |
| 초대 수락 건수 | TBD | // TODO(D+7) | `vcx_consume_invite` RPC 로그 기준 |
| 온보딩 완료 건수 | TBD | // TODO(D+7) | `onboarding_complete` 이벤트 기준 |

### 2.2 Wave 발송 패턴

// TODO(D+7): 1차 wave (D-day 09:00) / 2차 (D+1 또는 D+3) / 3차 (D+7) 발송 인원·시점·수락률
// TODO(D+7): wave 간격 학습 — 다음 launch 시 적용 사항 1~2줄

### 2.3 응급 롤백 발생 여부

// TODO(D+7): 롤백 트리거 발생했는가? (Y/N) — `PHASE1_TO_PHASE2_TRANSITION.md` §2 NO-GO 조건 기준
// TODO(D+7): 발생했다면 사유, 복구 시간(MTTR), 재배포 시점, 영향 사용자 수
// TODO(D+7): Sentry P0 발생 시각·해결 시각·근본 원인

---

## §3 핵심 지표 (Weekly Metrics)

> 출처: `docs/PROCESS.md` §5.1 Weekly Metrics + Phase 1 운영 KPI.
> 측정 윈도우: 2026-05-15 09:00 KST ~ 2026-05-22 09:00 KST (D-day ~ D+7).

| 지표 | 목표 | 실측 | PASS/FAIL |
|---|---|---|---|
| **초대 수락률** | TBD% | // TODO(D+7) | // TODO(D+7) |
| **온보딩 완료율** (수락 → 완료) | TBD% | // TODO(D+7) | // TODO(D+7) |
| **디렉토리 첫 7일 사용률** (`feed_item_click` ≥1회) | TBD% | // TODO(D+7) | // TODO(D+7) |
| **커피챗 신청률** (`coffeechat_request_submit`) | TBD% | // TODO(D+7) | // TODO(D+7) |
| **AI Brief 자동 생성 성공률** (`ai_brief_viewed` / 자격 사용자) | TBD% | // TODO(D+7) | // TODO(D+7) |
| **Sentry P0 24h 누적** | 0건 | // TODO(D+7) | // TODO(D+7) |
| **Vercel 가동률** (uptime) | ≥99.5% | // TODO(D+7) | // TODO(D+7) |

### 3.1 PROCESS.md M1/M2/M3 정산

// TODO(D+7): M1 Slice Pages Green = ?/5 (Phase 1 DoD: 5)
// TODO(D+7): M2 ADR Closed = ?/5 (Phase 1 DoD: 5 — ADR-0001~0005)
// TODO(D+7): M3 Plan Active Count = ? (Phase 1 DoD: ≤3)

---

## §4 잘된 것 (What worked)

// TODO(D+7): 1. ____________________
// TODO(D+7): 2. ____________________
// TODO(D+7): 3. ____________________
// TODO(D+7): 4. ____________________
// TODO(D+7): 5. ____________________

> 작성 가이드: 구체적인 사건·수치·인용을 1~2줄로. "팀워크가 좋았다" 류 추상 금지.

---

## §5 부족했던 것 (What didn't)

// TODO(D+7): 1. ____________________ — 재발 방지책: ____________________
// TODO(D+7): 2. ____________________ — 재발 방지책: ____________________
// TODO(D+7): 3. ____________________ — 재발 방지책: ____________________
// TODO(D+7): 4. ____________________ — 재발 방지책: ____________________
// TODO(D+7): 5. ____________________ — 재발 방지책: ____________________

> 작성 가이드: "사람"이 아닌 "프로세스/시스템"의 결함을 지적. 재발 방지책은 가능한 ADR 또는 DEBT_LEDGER 항목으로 연결.

---

## §6 사용자 피드백 요약

### 6.1 정량 (S5 슬라이스 데이터)

// TODO(D+7): `session_feedback_submit` 이벤트 누적 N건
// TODO(D+7): NPS 또는 만족도 평균 (1~5)
// TODO(D+7): 카테고리별 빈도 — UX / 성능 / 콘텐츠 / 버그 / 기타

### 6.2 정성 인용 (직접 인터뷰 + 피드백 폼)

// TODO(D+7): 인용 1 — "____________________" (사용자 익명 ID, 직군)
// TODO(D+7): 인용 2 — "____________________"
// TODO(D+7): 인용 3 — "____________________"
// TODO(D+7): 인용 4 — "____________________"
// TODO(D+7): 인용 5 — "____________________"

### 6.3 카테고리별 빈도

| 카테고리 | 건수 | 대표 인용 ID |
|---|---|---|
| UX/플로우 | // TODO(D+7) | // TODO(D+7) |
| 성능/속도 | // TODO(D+7) | // TODO(D+7) |
| AI Brief 정확도 | // TODO(D+7) | // TODO(D+7) |
| 디렉토리 발견 | // TODO(D+7) | // TODO(D+7) |
| 커피챗 흐름 | // TODO(D+7) | // TODO(D+7) |
| 버그 리포트 | // TODO(D+7) | // TODO(D+7) |

---

## §7 부채 변화

### 7.1 DEBT_LEDGER 정산

// TODO(D+7): D-day 직전 (2026-05-15) DEBT_LEDGER 활성 항목 N=24 (기준치)
// TODO(D+7): D+7 (2026-05-22) DEBT_LEDGER 활성 항목 N=?
// TODO(D+7): CLOSE 처리된 항목 ID 목록 — D-XXXX, D-XXXX, ...

### 7.2 신규 부채 (D-day 이후 발생)

| ID | 카테고리 | 요약 | 우선순위 | 등록일 |
|---|---|---|---|---|
| // TODO(D+7) | D-Track 또는 G-NEW | // TODO(D+7) | P0/P1/P2 | // TODO(D+7) |

> 작성 가이드: 신규 부채는 동시에 `docs/sdd/DEBT_LEDGER.md` append 필수 (PROCESS.md §5.2 pre-commit hook).

---

## §8 Phase 2 권고

### 8.1 진입 결정

// TODO(D+7): GO / NO-GO / 연기 (택1)
// TODO(D+7): 근거 — `PHASE1_TO_PHASE2_TRANSITION.md` §3 E1~E4 충족 여부 (E1 7일 운영 / E2 본 문서 작성 / E3 / E4)

### 8.2 우선 슬라이스

// TODO(D+7): P2-S1 (Cold Start) / P2-S2 (AI Brief V2) / P2-S3 (Community) 중 첫 머지 대상
// TODO(D+7): 선택 근거 — Phase 1 사용자 피드백 §6 + 부채 §7 + 비즈니스 우선순위

### 8.3 차단 항목

// TODO(D+7): Phase 2 진입을 늦추거나 막는 항목 (AI Resume Q1~Q7 미결재, 신규 P0 부채, 인프라 한계 등)
// TODO(D+7): 차단 항목별 해소 ETA + 책임자 (HARNESS.md role)

---

## §9 결재 / 변경 이력

### 9.1 결재 슬롯

| Role | 책임 | 서명 | 일자 |
|---|---|---|---|
| **vcx-ceo** | Phase 1 종료 인정, Phase 2 진입 GO/NO-GO 최종 결재 | ________ | // TODO(D+7) |
| **vcx-cpo** | 본 POSTMORTEM 작성 책임, Phase 2 우선순위 결재 | ________ | // TODO(D+7) |
| **vcx-cto** | 기술 부채 §7 정합성 확인, G1~G5 게이트 회고 | ________ | // TODO(D+7) |

### 9.2 변경 이력

| 일자 | 작성자 | 변경 | 서명 |
|---|---|---|---|
| 2026-05-08 | vcx-cpo | 본 템플릿 신설 — D-7 시점 운영 준비 | (템플릿 단계, 서명 불요) |
| 2026-05-22 | TBD | (예정) D+7 정산 — §1~§9 데이터 채움 + 1차 서명 | ________ |
| 2026-05-29 | TBD | (예정) D+14 시점 후속 학습 항목 append (있다면) | ________ |
| // TODO | // TODO | // TODO | // TODO |

---

## 부록 A — 측정 명령 / 증거 위치

> D+7 작성자가 데이터를 수집할 때 사용할 명령·경로 모음.

- `npm run build` / `npm run lint` / `npm test` — 회귀 게이트 (`PHASE1_TO_PHASE2_TRANSITION.md` §1 G1~G3)
- `npx playwright test e2e/slice/ --reporter=line --workers=1` — 슬라이스 E2E 회귀
- `scripts/weekly-metrics.sh` (있다면) — M1/M2/M3 산출
- `docs/qa/PHASE1_E2E_EVIDENCE_2026-05-08.md` — D-7 시점 베이스라인 (40 pass / 1 fail / 19 skip)
- Sentry 대시보드 — P0 24h 누적
- Vercel Analytics — uptime
- Supabase logs — `vcx_consume_invite`, `onboarding_complete` RPC 호출 카운트
- PostHog (PROCESS.md §5.3 6개 이벤트) — `login_success`, `onboarding_complete`, `feed_item_click`, `coffeechat_request_submit`, `ai_brief_viewed`, `session_feedback_submit`

---

## 부록 B — Out of Scope

- 본 문서는 회고·정산 전용. **신규 기능 결정·코드 변경 지시 금지** (`PHASE1_TO_PHASE2_TRANSITION.md` §8 준용).
- 사용자 노출 카피 변경은 `CLAUDE.md` §3.0 절대 보호 — 본 회고에서 카피 변경 결의 금지.
- src/** , e2e/** , supabase/** 변경은 별도 PR + ADR 발행 후 진행.
