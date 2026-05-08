# Phase 1 CEO Brief — 운영팀 내부 노트

> **대상 독자**: ValueConnect X 운영팀 (CTO=CPO=Founder + 운영 인원)
> **외부 공개 금지**: 본 문서는 내부 운영 자료입니다. 멤버에게 노출하지 않습니다.
> **작성 시점**: 2026-05-08 (D-7 to GA)
> **GA 일자**: 2026-05-15 (Phase 1 D-day)
> **상위 문서**: `docs/plans/VERTICAL_SLICE_PHASE1.md`, `docs/prd-6.0.md`, `docs/PROCESS.md`

---

## 1. Phase 1 한 줄 정의

> **"초대받은 인재가 로그인해서, 자신의 관심 기반 큐레이션 피드를 보고, 디렉토리에서 인재를 찾고, 커피챗을 신청해 AI Brief를 확인하고, 세션 후 피드백을 남긴다."**

이 한 여정이 Playwright E2E **1건**으로 CI에서 녹색이면 Phase 1 DoD 달성.

---

## 2. 무엇을 만들었는가 (스코프 SoT 대응)

### 2.1 Slice 5 Steps 현재 상태

| # | Step | 페이지 | 상태 |
|---|---|---|---|
| S1 | 초대 수락 + 로그인 + 온보딩 | `/invite/accept` → `/login` → `/onboarding` → `/directory` | live (UX 버그 4종 수정 완료) |
| S2 | 큐레이션 피드 + 관심 설정 | `/feed` | MVP live, 뉴스레터 1회 발송 운영 작업 잔존 |
| S3 | 디렉토리 탐색 + 프로필 | `/directory`, `/directory/[id]` | live, 공개·비공개 플래그 정합성 재검증 잔존 |
| S4 | 커피챗 신청 + AI Brief | `/coffeechat/create`, `/coffeechat/[id]` | live, AI Brief 자동 생성 동작 + 모바일 검증 잔존 |
| S5 | 세션 후 피드백 | `/coffeechat/[id]` 피드백 폼 | live, 어드민 집계 dashboard 포함 |

### 2.2 6 Pillars 상태

| Pillar | 구현 | 비고 |
|---|---|---|
| 멤버 디렉토리 | live | Core/Endorsed 등급, 공개 플래그 |
| 포지션 보드 | live | MATCH score, 어드민 CRUD, 관심 추적 |
| CEO 커피챗 | live | AI Brief, 컬쳐핏 점수 피드백 |
| 커뮤니티 라운지 | live | 6 카테고리, 익명 게시, rate-limit + admin reports (P2-S3) |
| 멤버 커피챗 | live | P2P 매칭, 사연 게시, 편집/신청 |
| 큐레이션 피드 | live | 관심 칩, yes/skip, 뉴스레터 구독 |

### 2.3 AI 레이어

- AI Brief 자동 생성 (`Anthropic Claude API`, ANTHROPIC_API_KEY 의존)
- PreBriefCard UI (모바일 360px 검증 잔존)
- 세션 후 피드백 루프 — overall rating, culture fit score, would-connect-again, brief helpfulness

---

## 3. D-7 잔여 작업 체크리스트 (2026-05-15 기준 역산)

### 3.1 Tech Quality (필수, GA 차단 가능)

- [ ] `npm run build` 녹색
- [ ] `npm run lint` 녹색
- [ ] `npm test` 녹색
- [ ] Playwright 5건 (`s1` ~ `s5`) CI 녹색
- [ ] `scripts/check-fee-hidden.sh` 0건 (멤버 UI + 이메일 템플릿 본문 모두)
- [ ] middleware 변경(`src/middleware.ts`) 회귀 검증

### 3.2 Slice별 잔여 (Definition of Done 표 기준)

- [ ] **S2**: 자체 뉴스레터 1회 발송 + 오픈율/클릭율 측정 (Resend, ADR-0009)
- [ ] **S3**: 디렉토리 페이지네이션 성능 점검 + rate limiter 정책 검토
- [ ] **S3**: 프로필 공개·비공개 플래그(015 migration) 재검증
- [ ] **S4**: 커피챗 수락 시 AI Brief 자동 생성(`f807e4f` 이후) 실측
- [ ] **S4**: PreBriefCard Galaxy 360px 모바일 녹색

### 3.3 ADR / Debt Ledger

- [ ] `docs/prd/ADR/ADR-000{1..5}-*.md` 5건 모두 존재 + 서명
- [ ] Debt Ledger D-0001 ~ D-0004 closed
- [ ] `.omc/plans/**` 활성 plan ≤ 3

### 3.4 운영 준비

- [ ] 초대 이메일 템플릿(`docs/launch/INVITE_EMAIL_TEMPLATE.md`) 운영팀 검토 완료
- [ ] Release Notes(`docs/launch/PHASE1_RELEASE_NOTES.md`) 멤버 1차 노출 채널 결정 (인앱? 메일? Both?)
- [ ] 발송 도메인(`valueconnect.kr`) SPF/DKIM/DMARC 점검
- [ ] `vcx_consume_invite` RPC 단일 트랜잭션 동작 재검증 (031 migration: invitee_name/company/title 반환 추가됨)
- [ ] Sentry / 로깅 알림 채널 활성 (D-day 24h 모니터링)

### 3.5 마이그레이션 정합성

- 적용 완료 (메모리 기준): 015, 021, 022, 031
- 미확인: 019 마이그레이션 (sprint progress 메모 기준 pending — D-7에 상태 재확인 필요)

---

## 4. Phase 2 진입 기준 (Hard Gate)

> **아래 조건을 충족하지 못하면 Phase 2 착수 금지.** Sprint 5+ (Cold Start 자동화, AI Brief V2 등) 논의는 동결.

| 지표 | 목표 | 측정 방법 |
|---|---|---|
| **M1 Slice Pages Green** | 5 / 5 | Playwright artifact 5건 녹색 |
| **M2 ADR Closed** | 5 / 5 | `docs/prd/ADR/ADR-000{1..5}-*.md` 존재 + 서명 |
| **M3 Plan Active Count** | ≤ 3 | `docs/plans/**/*.md` + `.omc/plans/**/*.md` 활성 |
| **Debt Ledger 초기 4건 해소** | 4 / 4 | D-0001 ~ D-0004 closed |
| **Tech Quality** | green | `npm run build` + `lint` + `test` 모두 녹색 |
| **GA 후 1주 안정성** | Sentry P1 incident 0건 | 알림 채널 + 로그 확인 |
| **첫 멤버 funnel 관측** | 초대 → 수락 → 온보딩 완료율 ≥ 50% | 운영팀 수동 시트 집계 |

DoD 미달 시:
1. 미달 항목을 Debt Ledger에 신규 D-NNNN으로 등재
2. Sprint 단위로 해소 일정 확정
3. 모든 항목 closed 후 Phase 2 kick-off 회의 개시

---

## 5. Phase 2 후보 주제 (착수 전 동결 상태)

> 아래는 **참고용 백로그**입니다. Phase 1 DoD 통과 전에는 착수하지 않습니다.

- Cold Start 자동화 — Stibee/뉴스레터 파이프라인 + 자연어 구독 UI
- AI Brief V2 — 멀티 모델 또는 맥락 다층화, 양측 피드백 학습 루프
- 커뮤니티 시맨틱 검색 / 추천
- 디렉토리 시맨틱 검색
- Peer Referral Reward 운영 자동화
- 프리미엄 기업 계정 (CEO 커피챗 우선권 등)

> 위 주제 중 일부는 메모리에 진행 흔적(P2-S1, P2-S2, P2-S3)이 보임. **D-7 단계에서 추가 착수 금지**, GA 이후 정식 plan으로 승격.

---

## 6. 사용자 검토 필요 부분 (운영팀 결정 필요)

다음 항목은 **운영팀 결정**이 필요합니다. 결정 전까지 발송·공개 보류:

1. **D-day 발송 시간**: 2026-05-15 일자 안에서 정확한 발송 슬롯 (오전/오후/저녁)
2. **초대 코드 발송 방식**:
   - (a) 일괄 발송 — 전체 초대 명단을 한 번에
   - (b) Wave 발송 — 30~50명 단위로 나눠 24h 간격
   - (c) Hand-curated — CTO가 직접 한 명씩 confirm 후 발송
   - 권장: 첫 wave는 (c), 이후 안정 확인 시 (b)
3. **Release Notes 노출 채널**: 인앱 공지 / 메일 본문 인용 / 별도 페이지 — Both 권장
4. **초대 수량 상한**: 1차 wave에서 발송할 총 인원 (현재 메모리 기준 약 30명 데이터셋 언급)
5. **응급 롤백 트리거**: D-day 후 어떤 신호가 보이면 신규 가입을 일시 차단할지 사전 합의
   - 후보: AI Brief 생성 실패율 > 20%, 매직 링크 발송 실패율 > 5%, 미들웨어 무한 리다이렉트 재발 등

---

## 7. 운영 리듬 (D-7 → D-day → D+7)

| 시점 | 액션 |
|---|---|
| D-7 (2026-05-08) | 본 노트 검토, 잔여 체크리스트 owner 배정 |
| D-5 (2026-05-10) | Tech Quality 녹색 1차 확인, 이메일 템플릿 finalize |
| D-3 (2026-05-12) | 초대 명단 lock, 발송 wave 결정, dry-run 발송 1건 |
| D-1 (2026-05-14) | 모니터링 대시보드 / Sentry 알림 채널 점검 |
| D-day (2026-05-15) | 1차 wave 발송, 24h 모니터링 |
| D+1 ~ D+7 | funnel 측정, 긴급 이슈 trace, Phase 2 진입 기준 충족 여부 판정 |

---

## 8. 기록 의무

- 본 노트는 GA 이후 `docs/launch/CEO_BRIEF_INTERNAL_NOTE.md` 그대로 archive (수정 시 commit history로 추적)
- D-day 운영 결과는 `docs/launch/PHASE1_POSTMORTEM.md`(차후 작성)에 정리
- DoD 미달 항목은 즉시 `docs/sdd/DEBT_LEDGER.md`에 신규 D-NNNN으로 등재

---

## 9. 한 줄 마무리

> 우리는 **6개의 기둥**과 **AI Brief 한 겹**을 올렸다.
> 이제 남은 일은, 그 위에 들어오시는 분들이 **머물 이유**를 매주 갱신하는 것이다.
