# Phase 1 → Phase 2 Transition — 단일 권위 게이트 문서

> **Status**: Active
> **납기 (Phase 1 D-day)**: 2026-05-15
> **작성 시점**: 2026-05-08 (D-7)
> **작성자**: vcx-cpo (CEO/CPO/CTO 1인 팀)
> **상위 권위**: `CLAUDE.md` 권위 순서 §0 — `docs/plans/VERTICAL_SLICE_PHASE1.md` > `docs/PROCESS.md` > `docs/sdd/FEATURE_MANIFEST.yaml` > `docs/prd/ADR/`
> **목적**: Phase 1 종료(2026-05-15)와 Phase 2 진입(2026-05-16~) 사이 게이트 기준이 다수 문서에 분산되어 있어, **D-day 직전 1시간 Go/No-Go 의사결정과 Phase 2 진입 기준**을 단일 문서로 고정한다.

---

## 0. 권위 문서 참조 표

본 문서는 아래 권위 문서의 **요약·통합 게이트**이며, 충돌 시 권위 문서가 우선한다.

| 게이트 항목 | 권위 문서 | 정확 위치 |
|---|---|---|
| Phase 1 DoD M1/M2/M3 | `docs/plans/VERTICAL_SLICE_PHASE1.md` | §3 |
| Slice S1~S5 AC | `docs/plans/VERTICAL_SLICE_PHASE1.md` | §2 |
| Phase 1 Red Flag | `docs/plans/VERTICAL_SLICE_PHASE1.md` | §6 |
| 48h 쿨다운 / L-High 결재 | `docs/PROCESS.md` | §1.4 |
| Weekly Metrics 정의 | `docs/PROCESS.md` | §5.1 |
| Authorization Matrix | `docs/PROCESS.md` | §4.1 |
| Phase 2 Slice 정의 | `docs/plans/VERTICAL_SLICE_PHASE2.md`, `docs/prd/ADR/ADR-0011-phase-2-slices.md` | 전체 |
| Phase 2 Kick-off 결정 | `docs/prd/ADR/ADR-0010-phase2-kickoff.md` | 전체 |
| 1인 팀 Harness opt-in | `docs/prd/ADR/ADR-0008-sprint-evidence-ledger-harness-opt-in.md` | 전체 |
| 운영 미적용 부채 (D-0007/16/17/18/19) | `docs/sdd/DEBT_LEDGER.md` | "Phase 1 D-7 트랙" 섹션 |
| E2E 회귀 evidence (40 pass / 1 fail / 19 skip) | `docs/qa/PHASE1_E2E_EVIDENCE_2026-05-08.md` | 전체 |
| AI Resume PRD 미결 결정 7건 | `docs/prd/PHASE2_AI_RESUME_INTELLIGENCE.md` | §11 |
| 카피 불가침 원칙 | `CLAUDE.md` | §3.0 |

---

## §1 Phase 1 Closure Criteria — DoD 7 Gates (G1~G7)

`docs/plans/VERTICAL_SLICE_PHASE1.md` §3 **M1 Slice Pages Green / M2 ADR Closed / M3 Plan Active Count / Tech Quality** 를 운영 게이트로 분해한다. 모든 게이트는 **D-day 직전 1시간(2026-05-15 17:00 KST)** 시점 최신 실행 증거를 기준으로 한다.

| 게이트 | 정의 | 검증 명령 / 증거 위치 | 권위 |
|---|---|---|---|
| **G1 build/typecheck** | `npm run build` exit 0 + TypeScript strict 컴파일 0 errors | 터미널 출력 캡쳐 + `.omc/state/last-build.txt` | VERTICAL_SLICE_PHASE1.md §3 Tech Quality |
| **G2 lint** | `npm run lint` exit 0 (warning 무시 가능, error 0건) | 터미널 출력 | VERTICAL_SLICE_PHASE1.md §3 Tech Quality |
| **G3 vitest** | `npm test` 전체 spec PASS, 0 failed | 터미널 출력 | VERTICAL_SLICE_PHASE1.md §3 Tech Quality |
| **G4 Playwright S1~S5** | `npx playwright test e2e/slice/ --reporter=line --workers=1` 결과 **Phase 1 슬라이스 회귀 0건** | `docs/qa/PHASE1_E2E_EVIDENCE_2026-05-08.md` §2 (현재 40 pass / 1 fail / 19 skip — fail 1건은 P2-S2 트랙으로 분리됨) | VERTICAL_SLICE_PHASE1.md §3 M1 |
| **G5 code-review** | 변경된 src/** 에 대한 `code-review` 통과 또는 architect 검증 evidence 1건 이상 | `.omc/state/` 또는 PR 코멘트 | PROCESS.md §4.1 (L-Std), ADR-0008 (1인 팀 변형) |
| **G6 운영 환경 가동** | Vercel 최신 배포 (D-7 시점 42일 정체 해소) + `valueconnect.kr` 도메인 연결 + DNS 레코드(SPF/DKIM/DMARC 포함) 설정 + `/api/health` 200 | Vercel 대시보드, `dig` 결과, 헬스 응답 | DEBT_LEDGER D-0019 |
| **G7 마이그레이션 030/031/032/019 운영 적용** | `vcx_invitations.invitee_name/company/title` 컬럼 + `vcx_consume_invite` 시드 반환 + 019 RPC 운영 DB 적용 | Supabase Dashboard 스키마 확인, `scripts/verify-rpc-applied.sh` | DEBT_LEDGER D-0017, D-0018 |

### G4 Skip 정책 (5/5 GREEN 정의 합의)

DEBT_LEDGER **G-NEW1**과 동기화. D-day 게이트 통과 기준:

- **Phase 1 회귀 fail 0건** = 절대 조건 (현재 0건 충족).
- **Skip 19건의 분류**:
  - (a) 의도적 음성 케이스 (예: invalid-token) → 회귀 무관, 카운트 무시.
  - (b) 마이그레이션 030/031 미적용 가드 (P2-S1 4건) → **G7 적용 후 자동 unskip**, Phase 1 GREEN 정의에서 제외.
  - (c) 시드 픽스처/`ANTHROPIC_API_KEY` 부재 (s4-coffeechat-brief 3건, s5-feedback 3건) → Phase 1 회귀 아님, **YELLOW 표기 + Phase 2 트랙 인계**.
- **결론**: D-day 1시간 전 기준 Phase 1 슬라이스(S1~S5) **회귀 fail 0건**이면 G4 PASS. P2-S2 TC1 1건 fail은 **Phase 2 트랙(D-0016)**이므로 G4 무관.

---

## §2 Go/No-Go Gate — D-day 직전 1시간 의사결정

**의사결정 시점**: 2026-05-15 17:00 KST (D-day 종료 1시간 전)
**의사결정자**: 사용자 (CEO 권한 — `docs/prd/ADR/ADR-0008-sprint-evidence-ledger-harness-opt-in.md` 1인 팀 변형)

### GO 조건 (전체 AND)

1. §1의 G1~G7 **전부 PASS**.
2. Sentry P0 알림 **최근 24시간 0건** (운영 환경 모니터링).
3. 카피 불가침 원칙(`CLAUDE.md` §3.0) 위반 0건 — 사용자 승인 카피의 무단 변경 없음.
4. DEBT_LEDGER OPEN 부채 중 **Phase 1 회귀 유발 항목** (D-0007 등) **CLOSED**.

### NO-GO 조건 (단 한 항목이라도)

- G1~G7 중 한 게이트 FAIL
- Sentry P0 알림 발생
- 카피 무단 변경 적발
- 회귀 유발 부채 OPEN 잔존

### NO-GO 처리

- D-day **연기** (PROCESS.md §1.4 48h 쿨다운 — "이 변경은 48시간 지나도 여전히 옳다"는 증거 원칙을 D-day 결정에도 적용).
- Postmortem 초안 작성 후 새 D-day 재서명.
- ADR-0010 supersede 또는 새 ADR로 변경 사유 기록.

### 의사결정 기록

- D-day 의사결정은 **본 문서 §7 변경 이력**에 1줄 기록 + ADR 발행 (GO인 경우 ADR-0012, NO-GO인 경우 새 번호).
- "침묵의 승인 금지" (PROCESS.md §4.3) — 결재는 명시 서명으로만.

---

## §3 Phase 2 Entrance Criteria

Phase 2(2026-05-16 ~ 06-12) 진입은 다음 4가지를 **AND**로 만족해야 한다 (`docs/plans/VERTICAL_SLICE_PHASE2.md` §0 착수 조건 + ADR-0010 강화).

| # | 기준 | 증거 |
|---|---|---|
| **E1** | Phase 1 GA 안정 진입 후 **≥ 7일 운영** (D+7 정산, 2026-05-22 이전 Phase 2 sprint 5 첫 머지 금지) | Sentry/Vercel 운영 로그, weekly-metrics.sh 1주차 산출 |
| **E2** | `docs/plans/_archive/PHASE1_POSTMORTEM.md` **작성 완료** (Phase 1 회고 — 무엇이 되었고, 무엇이 부채로 남았는지) | 파일 존재 + Section: GO 결정 근거, 잔존 부채, 학습 |
| **E3** | **ADR-0011 2차 서명 완료** (PROCESS.md §1.4 48h 쿨다운) | ADR-0011 §"서명" 2차 체크박스 + 일자 |
| **E4** | Phase 2 슬라이스 운영 미적용 항목 **모두 적용**: 마이그레이션 030/031 운영 DB 반영, `ANTHROPIC_API_KEY` Vercel/CI 시크릿 주입, P2-S2 TC1 401 수정 | DEBT_LEDGER D-0016/0017/0018 CLOSED |

E1~E4 미달 시 Phase 2 sprint 5 진입 보류. 보류 기간 동안 Phase 1 hot-fix·문서 정비만 허용 (ADR-0010 §"착수 조건").

---

## §4 미해결 사용자 결정 7건 (AI Resume PRD §11 인용)

`docs/prd/PHASE2_AI_RESUME_INTELLIGENCE.md` §11 의문점/사용자 결재 필요 항목을 **그대로 인용**한다. Phase 2 sprint 6 (AI Brief V2) 또는 Phase 2 후속 슬라이스 진입 전에 결재되어야 한다.

| # | 결재 항목 | 본 문서 권고 (PRD §11 인용) |
|---|---|---|
| **Q1** | 모델 비용 상한 — 멤버당 월 5회 분석이 적정한지 (영업 캠페인 시 상향 필요할 수 있음) | 미정 — 사용자 결재 필요 |
| **Q2** | 이력서 원본 보존 기간 — 30일/90일/영구 중 어디 (개인정보보호법 "수집 목적 달성 후 지체 없이 파기" vs. 멤버 재분석 편의 상충) | 미정 — 사용자 결재 필요 |
| **Q3** | 추출 시그널 기본 공개 범위 — 디폴트 공개 vs 비공개 | PRD 권고: **기본 비공개 + 멤버가 항목별 opt-in** |
| **Q4** | CEO Brief에 시그널 인용 시 출처 표기 의무 — "이력서에 따르면 ..." prefix 강제 vs 자연 문장 | 미정 — 사용자 결재 필요 |
| **Q5** | F-2-AI-RESUME-5 구현 위치 — `src/lib/ai/brief.ts` 직접 확장 vs `src/lib/ai/resume-brief.ts` 신규 모듈 | PRD 권고: **후자(영향 범위 최소화)** |
| **Q6** | 운영자 권한 분리 — 원본 다운로드 super_admin only vs admin 도 가능(감사 로그 강제) | 미정 — 사용자 결재 필요 |
| **Q7** | Phase 2 진입 트리거 — Phase 1 D-day(2026-05-15) DoD **100% 도달 vs 80% 도달 시 병렬 시작** | 본 문서 §3 권고: **100% 도달 후 진입** (Q7 결재로 확정 필요) |

> Q7은 본 문서 §3 E1~E4 정의의 전제이다. 사용자가 80% 도달 병렬 시작을 채택할 경우, 본 문서 §3 갱신 + ADR 발행 필요.

---

## §5 운영 액션 체크리스트 (사용자 직접 수행)

코드 트랙으로 해결 불가, **사용자 본인의 외부 시스템 조작이 필수**인 항목 (DEBT_LEDGER D-0017/0018/0019 + ADR-0011 잔존 결재).

### 5.1 마이그레이션 운영 적용 (4건)

```bash
# 사용자 워크스테이션에서 실행
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push  # 030, 031, 032, 019 일괄 반영
```

| 마이그레이션 | 영향 | 게이트 |
|---|---|---|
| `019_vcx_get_user_info.sql` | middleware RPC | G7 |
| `030_vcx_invite_seed_fields.sql` | invitee_company/title 컬럼 추가 | G7, P2-S1 unskip |
| `031_vcx_consume_invite.sql` | RPC 시드 필드 반환 | G7, P2-S1 unskip |
| `032_*` (해당 시) | Phase 2 슬라이스 후속 | E4 |

### 5.2 Vercel Redeploy

- Vercel 대시보드 → 프로젝트 → "Redeploy" (D-7 시점 last deploy 42일 정체 해소).
- 환경변수 `ANTHROPIC_API_KEY` Production 주입 확인.
- `valueconnect.kr` 도메인 프로젝트 연결.

### 5.3 Cloudflare DNS — SPF / DKIM / DMARC

- `valueconnect.kr` Cloudflare 위임 후:
  - **SPF**: `v=spf1 include:_spf.google.com ~all` (메일 발송자에 맞게)
  - **DKIM**: 발송 도구(Resend / Stibee) 콘솔에서 생성한 셀렉터 TXT
  - **DMARC**: `v=DMARC1; p=quarantine; rua=mailto:dmarc@valueconnect.kr`
- Vercel 도메인 연결용 A/CNAME 추가.

### 5.4 5/5 GREEN 정의 결재

- 본 문서 §1 G4 "Skip 정책" 합의를 **사용자 명시 결재**로 닫음.
- DEBT_LEDGER **G-NEW1** CLOSED 처리 — 결재 evidence는 본 문서 §7 변경 이력 1줄.

### 5.5 ADR-0011 2차 서명

- 1차 서명 2026-05-08, 2차 서명 가능 시점 **2026-05-10 이후** (PROCESS.md §1.4 48h 쿨다운).
- ADR-0011 §"서명" 2차 체크박스 + 일자 기입 → Phase 2 진입 조건 E3 충족.

### 5.6 Stibee 발송 이력 확인

- ADR-0009 자체 뉴스레터 1회 발송 evidence 확인 (오픈율/클릭율).
- VERTICAL_SLICE_PHASE1.md §2 S2 미체크 항목 — 미발송 시 Phase 1 GA 후 첫 주 발송으로 전환 (ADR로 기록).

---

## §6 Owner 매트릭스

1인 팀이지만 역할 모자(role hat)별로 책임 영역을 구분한다 (`docs/roles/HARNESS.md`).

| Role | 책임 | 본 게이트 매핑 |
|---|---|---|
| **vcx-ceo** | Go/No-Go 의사결정, ADR 결재, 카피 승인 | §2 GO/NO-GO, §5.4 / §5.5 결재 |
| **vcx-cpo** | Phase 2 우선순위 + AI Resume 결정 7건 클로즈, Feature Manifest 정합 | §4 Q1~Q7, FEATURE_MANIFEST 갱신 |
| **vcx-cto** | 코드 게이트 (G1~G5), P2-S2 401 마무리 | §1 G1~G5, D-0016 CLOSE |
| **vcx-cdo** | 마이그레이션 적용, RLS 검증 | §5.1 (사용자 손에서 실행), G7 |
| **vcx-sre** | 배포(Vercel), DNS(Cloudflare), 모니터링(Sentry) | §5.2, §5.3, §1 G6, §2 GO 조건 #2 |
| **vcx-designer** | 시각 폴리시 (P0/P1 완료, P2 후속 트랙) | Phase 2 sprint 6~7 후속 |

---

## §7 변경 이력 (D-7 이후 갱신)

| 일자 | 작성자 | 변경 | 서명 |
|---|---|---|---|
| 2026-05-08 | vcx-cpo | 초안 작성 — Phase 1 → Phase 2 전이 단일 게이트 문서 신설 | ________ (1차, 48h 쿨다운 시작) |
| 2026-05-10 | vcx-ceo | (예정) ADR-0011 2차 서명과 동시에 본 문서 강제력 발생 | ________ (2차) |
| 2026-05-15 17:00 | vcx-ceo | (예정) D-day Go/No-Go 결재 1줄 — GO 시 ADR-0012, NO-GO 시 새 D-day | ________ |
| 2026-05-22 | vcx-cpo | (예정) Phase 2 진입 전 §3 E1~E4 충족 확인 + AI Resume Q1~Q7 결재 1줄 | ________ |

---

## §8 Out of Scope (본 문서가 다루지 않는 것)

- src/** 코드 변경 — 본 문서는 게이트 정의만, 구현은 vcx-cto 트랙
- e2e/** spec 작성 — `docs/plans/VERTICAL_SLICE_PHASE2.md` §5 sprint 5/6/7
- supabase/migrations/** 신규 작성 — vcx-cdo 트랙
- AI Resume Intelligence 구현 — Phase 2 후속, AI Resume PRD §11 결재 후
- 카피 변경 — `CLAUDE.md` §3.0 절대 보호 (본 문서 변경 시에도 사용자 노출 카피 무관)

---

## §9 참조 (전체)

- `CLAUDE.md` (특히 §3.0, §권위 순서)
- `docs/PROCESS.md` (특히 §1.4, §4.1, §5.1)
- `docs/plans/VERTICAL_SLICE_PHASE1.md` (특히 §2 AC, §3 DoD, §6 Red Flag)
- `docs/plans/VERTICAL_SLICE_PHASE2.md`
- `docs/prd/ADR/ADR-0008-sprint-evidence-ledger-harness-opt-in.md`
- `docs/prd/ADR/ADR-0010-phase2-kickoff.md`
- `docs/prd/ADR/ADR-0011-phase-2-slices.md`
- `docs/prd/PHASE2_AI_RESUME_INTELLIGENCE.md` §11
- `docs/sdd/DEBT_LEDGER.md` (D-0007 / D-0016 / D-0017 / D-0018 / D-0019 / G-NEW1)
- `docs/qa/PHASE1_E2E_EVIDENCE_2026-05-08.md`
- `docs/sdd/FEATURE_MANIFEST.yaml`
