# Phase 2 Proposal — 격리 산출물 인벤토리

> **Status**: 격리(Quarantined) — 본 디렉터리는 ADR-0007에 의해 Phase 1 종료 전까지 활성화 불가.
> **근거**: ADR-0006 (PRD v6.1 archive) + ADR-0007 (CDO rev 4 quarantine)
> **Phase 1 SoT**: `docs/prd-6.0.md` 단독

## 무엇이 들어 있나

2026-04-19 세션에서 PRD v6.1(지금은 archived) 기반 CDO 재검토 후 생성된 산출물을 그대로 보존한다. 어떤 파일도 **Phase 1 동안 production·staging 에 적용하지 말 것**.

### migrations/ — DB 스키마 11개

| 파일 | CDO 카테고리 | 목적 요약 |
|-----|-----------|---------|
| `022_vcx_directory_tiered.sql` | PRD v6.1 §Feature 3 | Tiered Disclosure RLS + Level 1 view + Level 0 집계 view |
| `023_vcx_member_reports.sql` | PRD v6.1 §Feature 8 | 멤버 단위 평판 + 24h throttle + 중복 신고 방지 |
| `024_vcx_activity_events.sql` | CDO rev 4 D1 | event_catalog + activity_events (event_version/idempotency/target 포함) |
| `025_vcx_tag_canonical.sql` | CDO rev 4 D3 | pgvector + tag_canonical 임베딩 + member_tag_mapping + members.interest_embedding |
| `025b_vcx_member_connections.sql` | CDO rev 4 D7 | peer-chat mutual denormalized + trigger + `vcx_has_mutual_peer_accept` O(1) |
| `025c_vcx_placements.sql` | CDO rev 4 B1 | Revenue SoT + fee(재무 전용) + attribution_path + masked self view |
| `025d_vcx_safe_count.sql` | CDO rev 4 D5 | k-anonymity floor 함수 3종 |
| `029_vcx_feed_newsletter_metrics.sql` | PRD v6.1 §Feature 2 | 뉴스레터 발송·오픈·클릭 지표 |
| `030_vcx_community_categories_v2.sql` | PRD v6.1 §1.5 | salary→compensation rename + 8 카테고리 + category meta |
| `031_vcx_concierge_onboarding.sql` | PRD v6.1 §Feature 1.1 + CDO B4 | LinkedIn 없는 VIP 경로 (pw_hash 제거, Supabase Auth 위임) |
| `033_vcx_tier_change_log.sql` | CDO rev 4 B2 | member_tier 변경 전수 감사 + 자동 트리거 + backfill |

### api-routes/directory/level0/ — Directory Level 0 집계 API

- `route.ts` — k-anonymity 적용 aggregate stats 엔드포인트
- 의존: `members_directory_level0_industry` view (022 migration) + `vcx_safe_count` 함수 (025d)
- Phase 2 재개 시 → `src/app/api/directory/level0/` 로 되돌리면 바로 동작

## 어디에 분산 보존되었나 (본 폴더 外)

| 파일 | 현재 위치 | 역할 | 즉시 위험? |
|-----|---------|-----|-----------|
| `src/types/vcx-schema-v61.ts` | `src/types/` 유지 | 신규 11개 엔티티의 Row/Insert/Update 타입 | ❌ (미 import 상태면 무해) |
| `scripts/qa-rls/*.sql` (4종) + README | `scripts/qa-rls/` 유지 | Staging 수동 실행용 RLS 테스트. Phase 2 전엔 실행 금지 | ❌ (CI 자동 실행 없음) |
| `docs/prd/_archive/prd-6.1-cdo-review.md` | archive 완료 (ADR-0006 일환) | CDO 재검토 원문 | ❌ 참조용 |

## Phase 2 재개 체크리스트

ADR-0007 §4 "Revival Criteria" 완수 후 다음 절차 순서대로:

1. **사전 검증 — Phase 1 종료 후 스키마 diff**
   - [ ] `vcx_members` 현재 컬럼 집합 vs 격리 migrations 가정 비교
   - [ ] `peer_coffee_applications`, `peer_coffee_chats` 컬럼·CHECK 변경 없음 확인
   - [ ] `community_posts.category` CHECK constraint 값 집합 확인 (030 재적용 가능성)
   - [ ] `vcx_corporate_users`, `positions` FK 유효성 (025c 의존)

2. **Extension 가용성**
   - [ ] Supabase Dashboard → Extensions → `vector` 활성
   - [ ] (Phase 2 후반) `pg_partman` 가용 여부 확인 — 활성 시 024 파티셔닝 추가 migration, 미활성 시 pg_cron fallback

3. **승격 이동**
   - [ ] `mv docs/prd/_archive/phase2-proposal/migrations/*.sql supabase/migrations/`
   - [ ] `mv docs/prd/_archive/phase2-proposal/api-routes/directory/level0 src/app/api/directory/`
   - [ ] Directory API 라우트 3개(`route.ts`, `[id]/route.ts`, `level0/route.ts`) — ADR-0007에서 언급된 원본(CDO 버전) 재적용 필요 여부 재평가

4. **Staging 순차 적용**
   - [ ] `022 → 025b(의존 없음) → 023 → 024 → 025 → 025c → 025d → 029 → 030 → 031 → 033` 순서로 1건씩 적용 후 RLS 테스트
   - [ ] `scripts/qa-rls/` 4종 실행 → 전건 PASS 확인

5. **문서 갱신**
   - [ ] 본 README `Status` 를 "Merged (Phase 2)" 로 변경
   - [ ] ADR-0007 `Status` 를 "Superseded by ADR-0008" 로 변경
   - [ ] 새 ADR-0008 발행 — 실제 Phase 2 결정 기록

## 하지 말 것 (Do NOT)

- ❌ 본 폴더의 migrations 를 `supabase db push` 로 적용
- ❌ `docs/prd/_archive/phase2-proposal/migrations/*.sql` 을 `supabase/migrations/` 로 복사/이동 (Phase 1 종료 전)
- ❌ `src/types/vcx-schema-v61.ts` 를 Phase 1 코드에서 import
- ❌ `scripts/qa-rls/*.sql` 을 현재 Staging 에 실행 (의존 함수·view 부재)
- ❌ 본 폴더 내용에 의존하는 새 PR 생성

## 문의

- **왜 삭제 안 했나?** — 매몰 비용 보존. Phase 2 재개 시 재설계 비용이 3일→0.5일로 단축.
- **왜 `src/types/vcx-schema-v61.ts` 는 이동 안 했나?** — TypeScript 파일은 import 없으면 무해. 격리가 과도.
- **Phase 1 중에 스키마 바뀌면?** — ADR-0007 §Negative/Risk 참조. Phase 2 재개 전 반드시 재검증.
