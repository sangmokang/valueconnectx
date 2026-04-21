# ADR-0007: CDO rev 4 산출물 격리 보존 (Phase 2 proposal)

- **Status**: Accepted
- **Date**: 2026-04-19
- **Decider**: Sangmo Kang (CEO + CPO + CTO)
- **L-Tier**: L-Medium
- **Supersedes**: —
- **Related**: ADR-0004 (v6.0 단일 SoT), ADR-0006 (PRD v6.1 archive)

## Context

2026-04-19 세션에서 아카이브된 `docs/prd/_archive/prd-6.1.md` 에 대한 CDO 관점 전면 재검토가 수행되고, Top 5 "MUST+" 권고에 기초해 11개 마이그레이션·TypeScript 타입·API 라우트 수정·RLS 테스트 스크립트가 생성되었다.

직후 ADR-0006으로 PRD v6.1이 archive 되어 **Phase 1의 SoT는 v6.0만** 으로 고정되었다. 동일 세션 내에서 만들어진 v6.1 기반 산출물은 다음 두 리스크를 동시에 가진다:

1. **Landmine 리스크** — `supabase/migrations/` 경로에 22~33번 신규 migration 파일이 남아 있으면 다음 `supabase db push` 또는 `npx supabase db reset` 시 자동 적용되어 Phase 1 스키마를 무단 변경.
2. **매몰 비용 소실 리스크** — 아이디어·스키마·RLS 설계 가치(특히 `activity_events`·`tag_canonical` 벡터·`vcx_member_connections`)가 폐기되면 Phase 2 진입 시 동일 분석을 중복 수행해야 함.

## Decision

Top 5 MUST+ 산출물은 **삭제도 Phase 1 적용도 아닌 물리적 격리** 상태로 보존한다.

### 1) 물리적 격리 (Landmine 차단)

| 이동 전 경로 | 이동 후 경로 | 상태 |
|------------|-------------|-----|
| `supabase/migrations/022_vcx_directory_tiered.sql` | `docs/prd/_archive/phase2-proposal/migrations/` | 격리 |
| `supabase/migrations/023_vcx_member_reports.sql` | 〃 | 격리 |
| `supabase/migrations/024_vcx_activity_events.sql` | 〃 | 격리 |
| `supabase/migrations/025_vcx_tag_canonical.sql` | 〃 | 격리 |
| `supabase/migrations/025b_vcx_member_connections.sql` | 〃 | 격리 |
| `supabase/migrations/025c_vcx_placements.sql` | 〃 | 격리 |
| `supabase/migrations/025d_vcx_safe_count.sql` | 〃 | 격리 |
| `supabase/migrations/029_vcx_feed_newsletter_metrics.sql` | 〃 | 격리 |
| `supabase/migrations/030_vcx_community_categories_v2.sql` | 〃 | 격리 |
| `supabase/migrations/031_vcx_concierge_onboarding.sql` | 〃 | 격리 |
| `supabase/migrations/033_vcx_tier_change_log.sql` | 〃 | 격리 |
| `src/app/api/directory/level0/route.ts` | `docs/prd/_archive/phase2-proposal/api-routes/directory/level0/` | 격리 |

### 2) 되돌림 (Runtime 오염 제거)

| 파일 | 조치 | 이유 |
|-----|-----|------|
| `src/app/api/directory/route.ts` | `git checkout HEAD --` 로 pre-CDO 복귀 | Level 1 view 참조 제거 — Phase 1에는 해당 view 미존재 |
| `src/app/api/directory/[id]/route.ts` | 〃 | 동일 사유 |

### 3) 무해 유지 (Phase 2 즉시 활용 가능)

| 파일 | 현재 위치 | 판단 |
|-----|---------|------|
| `src/types/vcx-schema-v61.ts` | 그대로 유지 | 미사용 타입. Import 없으므로 번들·빌드 무영향 |
| `scripts/qa-rls/01-tier-disclosure.sql` 등 4종 + README | 그대로 유지 | Staging 전용 툴, 수동 실행만. CI 자동 실행 없음 |
| `docs/prd/_archive/prd-6.1-cdo-review.md` | 이미 archive 완료 (ADR-0006 일환) | 참조 전용 |

### 4) Phase 2 재개 조건 (Revival Criteria)

다음 조건이 모두 충족된 후에 `docs/prd/_archive/phase2-proposal/` 내용을 본선으로 승격한다:

1. **Phase 1 DoD 공식 종료** — v6.0 기반 MUST 전항목 production 반영 + `supabase db diff` clean
2. **새 ADR 작성** — 본 산출물을 기준으로 Phase 2 범위·비용·일정을 재평가한 ADR-0008+ 발행
3. **스키마 재검증** — Phase 1 완료 후 DB 최종 상태와 격리된 migrations의 호환성 재확인 (`vcx_members`·`peer_coffee_applications` 등 의존 테이블 변경 여부)
4. **CDO rev 4 핵심 가정 재확인**:
   - `activity_events` event-sourcing 필요성 (Phase 1 결과로 분석 요구가 실제 생겼는가?)
   - `tag_canonical` + pgvector 비용 (Phase 2 목표 멤버 수가 canonical 분리를 정당화하는가?)
   - `vcx_placements` 재무 모델 긴급성 (실 placement 발생 수 vs 수동 관리 한계)

### 5) 산출물 상세 매니페스트

총 규모: migrations 11개 + API route 1개(level0) + TS types 1개 + RLS SQL 4종 + CDO review doc 1개. 상세는 `docs/prd/_archive/phase2-proposal/README.md` (본 ADR 승인 시 별도 작성).

## Consequences

### Positive

- **Red Flag #2 (scope drift) 완전 해소** — ADR-0006의 결정이 runtime·DB 양쪽에서 물리적으로 강제됨.
- **매몰 비용 제로** — Phase 2 재개 시 격리 폴더 그대로 복구 가능.
- **Accidental 적용 불가** — `supabase/migrations/` 에는 022~033이 존재하지 않으므로 누구도 실수로 apply 할 수 없음.
- **Phase 1 집중도 회복** — 남은 26일을 v6.0 DoD 달성에 온전히 투입.

### Negative / Risk

- **`src/types/vcx-schema-v61.ts` 는 남아 있음** — 미사용이지만 신규 개발자가 오인할 수 있음. 다음 PR에서 파일 상단에 "Phase 2 RESERVED — DO NOT IMPORT" 배너 추가 권장 (차기 작업).
- **격리 해제 시 충돌 가능** — Phase 1에서 `vcx_members`·`peer_coffee_applications` 스키마가 변경되면 025b의 trigger·025c의 FK 가 깨질 수 있음. Phase 2 재개 전 반드시 재검증.
- **`scripts/qa-rls/` 는 현재 의존 스키마 없음** — 수동 실행 시 존재하지 않는 함수 호출로 실패. Phase 2 이전엔 실행 금지. README에 "Phase 2 전용" 주석 추가 권장.

## Enforcement

- Git 히스토리로 격리 추적: 이 ADR commit + 이동 commit 이 쌍을 이룸.
- `scripts/migration-number-check.sh` 실행 시 022~033이 존재하지 않아야 통과 (현재 기존 스크립트가 이를 강제하는지는 확인 필요 — 차기 작업).
- **Phase 2 재개 시** — 본 ADR을 superseded로 표시 + 새 ADR 발행.

## Follow-ups

1. `docs/prd/_archive/phase2-proposal/README.md` 작성 — 격리 산출물 인벤토리 + 재개 체크리스트.
2. `src/types/vcx-schema-v61.ts` 파일 상단 배너 추가 — "Phase 2 RESERVED".
3. `scripts/qa-rls/README.md` 경고 추가 — "격리된 migrations 선적용 필수, Phase 2 전엔 실행 금지".
4. CI 규칙 추가 검토: `docs/prd/_archive/phase2-proposal/migrations/*.sql` 내용이 `supabase/migrations/` 로 되돌아가는 경우 경고 발생.

## References

- `docs/prd/ADR/ADR-0006-archive-prd-6-1.md` — PRD v6.1 archive 결정 (선행)
- `docs/prd/_archive/prd-6.1-cdo-review.md` — CDO 재검토 원문
- `docs/prd/_archive/phase2-proposal/` — 격리 폴더 (신설)
- `docs/prd-6.0.md` — Phase 1 단일 SoT
