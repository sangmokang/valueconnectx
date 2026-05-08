# ADR-0011 — Phase 2 슬라이스 정의 (P2-S1 / P2-S2 / P2-S3)

**상태**: Proposed (사용자 결재 전 — 48h 쿨다운 필요)
**레벨**: L-High (Phase 2 스코프 확정, FEATURE_MANIFEST 영향)
**작성일**: 2026-05-08
**작성자**: Sangmo Kang (CEO/CPO/CTO)
**Supersedes**: —
**Related**: `docs/prd/ADR/ADR-0010-phase2-kickoff.md`, `docs/plans/VERTICAL_SLICE_PHASE2.md`, `docs/sdd/FEATURE_MANIFEST.yaml`

---

## 컨텍스트

ADR-0010(Phase 2 Kick-off)에서 우선순위 P1~P3가 합의됐으나, 각 슬라이스의 **DoD·코드 진척·E2E 스펙 위치**가 단일 문서에 정리되지 않은 상태이다. Phase 1 D-day(2026-05-15)를 7일 앞두고 Manifest 드리프트와 슬라이스 권위 문서 부재가 겹치면 회귀 리스크가 커진다.

본 ADR은 ADR-0010의 우선순위(P1 Cold Start, P2 AI Brief V2, P3 Community 강화)를 **3개 슬라이스(P2-S1/P2-S2/P2-S3)**로 분해하고, 각 슬라이스의 입출력·증거 위치를 권위 문서로 고정한다.

## 결정

### P2-S1 — Cold Start 자동화 (초대 → 시드 데이터)

- **목적**: 초대 수락 직후 멤버 프로필이 0으로 시작하는 문제 해소. 추천인이 입력한 이름/회사/직함이 즉시 디렉토리·매칭에 반영되도록 함.
- **코드 진척**:
  - `supabase/migrations/030_vcx_invite_seed_fields.sql` — invite payload에 시드 필드 추가
  - `supabase/migrations/031_vcx_consume_invite_seed_fields.sql` — `vcx_consume_invite` RPC가 invitee_name/company/title 반환 (커밋 a8a5569 참조)
  - 초대 수락 → 온보딩 V2 pre-fill 경로(F-INVITE/F-ONBOARDING) 통합 완료
- **E2E**: `e2e/slice/p2-s1-cold-start.spec.ts`
- **DoD**: 초대 수락 후 첫 온보딩 화면에서 추천인이 기입한 3개 필드(이름/회사/직함)가 자동 채워지고, 사용자가 1번 클릭으로 디렉토리 노출까지 도달.

### P2-S2 — AI Brief V2 (CEO + Peer 통합 품질)

- **목적**: S4의 Peer Brief와 CEO 커피챗 Brief 간 구조·문체 편차를 좁히고, fallback(API 키 누락) 메시지를 한국어로 통일.
- **코드 진척**:
  - 기존 F-PEER-COFFEECHAT 스택 위에서 prompt 통합 진행 중
  - 마이그레이션은 추가 없음 (021/025 재활용)
  - PreBriefCard 한국어 폴백 카피 확인 필요 (CLAUDE.md §3.0 승인 카피 보호)
- **E2E**: `e2e/slice/p2-s2-ai-brief-v2.spec.ts`
- **DoD**: CEO/Peer 양쪽 Brief가 동일한 5섹션 구조(상대 요약 / 가치 / 질문 / 후속 / 메모)를 갖추고, 모바일 Galaxy 360px에서 한 화면에 첫 섹션이 출력.

### P2-S3 — Community 기능 강화 (반응·신고·rate-limit)

- **목적**: 체류 시간 증가를 위한 반응·댓글·신고 운영 안정화. 어뷰즈 차단을 위한 rate-limit + admin CommunityReports.
- **코드 진척**:
  - 커밋 f93905c — rate-limit 미들웨어 + admin CommunityReports + E2E 스펙 추가
  - `supabase/migrations/014_vcx_community_reactions.sql`, `017_vcx_community_counts.sql` 재활용
- **E2E**: `e2e/slice/p2-s3-community.spec.ts`
- **DoD**: 신고 1회 → 어드민 큐 노출 + 작성자 자동 알림. Rate-limit 초과 시 한국어 에러 응답.

### 공통 슬라이스 게이트

1. 각 슬라이스는 별도 Feature Manifest 항목 또는 기존 항목의 status 업그레이드로 표현 (드리프트 금지).
2. E2E 스펙이 통과하기 전에는 status `live`로 승급 금지.
3. UI 카피 변경 시 CLAUDE.md §3.0 (승인 카피 불가침) 준수.
4. Tailwind v4 / `rounded-*` 금지 / 한국어 UI / TypeScript strict 등 Hard Rules 유지.

## 영향

- `docs/sdd/FEATURE_MANIFEST.yaml` — F-FEED status 정합화는 본 ADR과 함께 진행. P2-S1/S2/S3 각각의 manifest 항목은 후속 PR에서 추가.
- `docs/plans/VERTICAL_SLICE_PHASE2.md` — 본 ADR이 기준 권위 문서.
- `docs/prd/ADR/ADR-0010-phase2-kickoff.md` — 본 ADR이 슬라이스 분해본으로 보완.
- `e2e/slice/p2-s1-cold-start.spec.ts`, `e2e/slice/p2-s2-ai-brief-v2.spec.ts`, `e2e/slice/p2-s3-community.spec.ts` — 권위 증거 위치.

## 트레이드오프

| 항목 | 채택 (3-슬라이스 분해) | 대안 (단일 Phase 2 묶음) |
|---|---|---|
| 진척 가시성 | 슬라이스별 E2E 통과 여부로 추적 가능 | Phase 단위 커밋만 가능 |
| ADR 수 | +1 (0011) | 0 |
| Manifest 정합성 | 각 슬라이스가 status 독립 | 단일 status로 흐려짐 |
| 회귀 차단 | E2E 분리로 격리 | 전체 회귀 시 원인 추적 어려움 |
| 결재 부담 | 1차 ADR 결재 1회 + 48h 쿨다운 | 동일 |

## 서명

- [ ] 1차 서명: 2026-05-08 (작성자)
- [ ] 2차 서명: 2026-05-10 이후 (48h 쿨다운 완료, PROCESS.md §1.4)

## References

- `docs/prd/ADR/ADR-0010-phase2-kickoff.md`
- `docs/plans/VERTICAL_SLICE_PHASE2.md`
- `docs/sdd/FEATURE_MANIFEST.yaml`
- `e2e/slice/p2-s1-cold-start.spec.ts`
- `e2e/slice/p2-s2-ai-brief-v2.spec.ts`
- `e2e/slice/p2-s3-community.spec.ts`
- `docs/PROCESS.md` §1.2 / §1.4
