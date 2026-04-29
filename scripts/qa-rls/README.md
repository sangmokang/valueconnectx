# RLS 검증 스크립트 (Phase 2 RESERVED)

> ⚠️ **현재 상태: Phase 1 동안 실행 금지.**
> 본 스크립트는 `docs/prd/_archive/phase2-proposal/migrations/` 에 격리된 신규 마이그레이션(022~033)에 의존한다. 해당 마이그레이션이 production/staging 에 적용되지 않은 상태에서 실행하면 "function does not exist"·"relation does not exist" 로 실패한다.
>
> **언제 실행 가능한가**: ADR-0007 §4 Revival Criteria 가 충족되고 격리 migrations 가 `supabase/migrations/` 로 승격된 이후.
>
> **관련 ADR**: ADR-0006 (PRD v6.1 archive), ADR-0007 (CDO rev 4 quarantine)

---

## 원래 용도

Supabase Staging DB에 격리된 마이그레이션(022~033) 적용 후, 아래 SQL 파일을
**순서대로** Supabase SQL Editor 또는 `psql`로 실행해 RLS 정책·트리거·함수의 동작을
회귀 검증한다.

## 실행 환경

- Supabase Staging 프로젝트 (또는 로컬 `supabase start` + `supabase db reset`)
- `supabase/config.toml` 기본 `service_role` 키 있어야 함 (일부 fixture 삽입용)
- 각 스크립트는 `BEGIN; ... ROLLBACK;` 로 감싸서 **프로덕션 데이터에 영향 없음**

## 실행 순서

| # | 파일 | 대상 | 의존 마이그레이션 |
|---|------|------|---------------|
| 1 | `01-tier-disclosure.sql` | Directory RLS Level 1/2 + `vcx_has_mutual_peer_accept` + Level 0 집계 | 022, 025b, 025d |
| 2 | `02-member-reports.sql` | `vcx_member_reports` throttle + admin scope | 023 |
| 3 | `03-placements.sql` | `vcx_placements` service-role-only + `vcx_placements_self` 마스킹 | 025c |
| 4 | `04-activity-events.sql` | `activity_events` default deny + self-select + `event_catalog` FK | 024 |

## 결과 판정

- 각 스크립트 끝에 `PASS` / `FAIL` RAISE NOTICE 출력
- `FAIL`은 RAISE EXCEPTION 으로 트랜잭션 중단 → 에러 메시지 확인 후 정책 재점검
- 전체 통과 시 `=== ALL TESTS PASSED ===` 메시지 출력

## 사용 예 (psql)

```bash
export STAGING_DB_URL='postgres://...'
psql "$STAGING_DB_URL" -f scripts/qa-rls/01-tier-disclosure.sql
psql "$STAGING_DB_URL" -f scripts/qa-rls/02-member-reports.sql
psql "$STAGING_DB_URL" -f scripts/qa-rls/03-placements.sql
psql "$STAGING_DB_URL" -f scripts/qa-rls/04-activity-events.sql
```

## 사용 예 (Supabase Dashboard → SQL Editor)

1. 파일 내용을 복사
2. 새 쿼리에 붙여넣기
3. Run 실행
4. Results 탭에서 NOTICE 메시지 확인

## 주의

- 스크립트는 `BEGIN; ROLLBACK;` 감싸므로 프로덕션에서 실행해도 커밋되지 않음
- 단, 트리거·함수 조회는 실제 정의를 조회하므로 프로덕션 실행 시 성능에 미미한 부하
- **DDL 변경 없음** (테이블·정책·함수 정의 조회만)
