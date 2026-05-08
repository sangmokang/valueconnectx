-- 032_vcx_invites_unique_pending.sql
-- 설명: vcx_invites 테이블의 race condition 방어를 위한 partial unique index 추가
-- 배경:
--   - src/app/api/invites/direct/route.ts 의 사전 check (SELECT ... eq('status', 'pending'))
--     만으로는 동시성(race) 보호 불가. 두 동시 요청이 모두 통과 가능.
--   - DB 레이어에 partial unique index 를 추가하여 중복 INSERT 를 PostgreSQL 이 차단하도록 함.
--   - 동일 패턴의 선례: 001_vcx_auth_schema.sql 의 idx_vcx_recommendations_pending_email
--
-- DDL 보호 영향:
--   - Event Trigger vcx_prevent_ddl 은 current_user IN ('postgres','supabase_admin','supabase_auth_admin') 일 때 통과.
--   - `npx supabase db push --linked` 는 postgres 역할로 연결되므로 정상 적용됨.
--   - 우회 불필요.
--
-- RLS 영향: 없음 (인덱스 추가만, 정책 변경 없음).
--
-- 기존 RPC(vcx_consume_invite, 031) 정합성:
--   - RPC 는 UPDATE 만 수행 (status pending → accepted). 인덱스는 status='pending' 인 row 에만 적용.
--   - UPDATE 로 status 가 'accepted' 로 바뀌면 partial index 에서 자동 제외 → 향후 동일 email 재초대 가능.
--   - INSERT 경로(direct route)에서만 새 unique 가 강제됨.
--
-- 주의: CREATE UNIQUE INDEX CONCURRENTLY 는 트랜잭션 블록 내 실행 불가.
--   Supabase CLI 는 각 마이그레이션을 트랜잭션으로 감싸므로 일반 CREATE UNIQUE INDEX 를 사용.
--   vcx_invites 는 운영 데이터가 작아 짧은 lock 으로 충분히 수용 가능.

-- ============================================================
-- 사전 검증: 기존 데이터에 중복 pending 초대가 있으면 인덱스 생성 실패.
-- 실패 시 아래 dedupe 가이드 SQL 을 먼저 실행하고 다시 push 할 것.
-- ============================================================
DO $$
DECLARE
  dup_count int;
BEGIN
  SELECT count(*) INTO dup_count
  FROM (
    SELECT email
    FROM vcx_invites
    WHERE status = 'pending'
    GROUP BY email
    HAVING count(*) > 1
  ) d;

  IF dup_count > 0 THEN
    RAISE EXCEPTION
      '[VCX] vcx_invites 에 중복 pending 초대 % 건이 존재합니다. dedupe SQL 가이드를 먼저 실행하세요. (032 마이그레이션 주석 참고)',
      dup_count;
  END IF;
END;
$$;

-- ============================================================
-- Partial unique index — 동시 INSERT 시 race condition 차단
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_vcx_invites_pending_email_unique
  ON vcx_invites(email)
  WHERE status = 'pending';

COMMENT ON INDEX idx_vcx_invites_pending_email_unique IS
  '동일 email 의 pending 초대 중복 차단 (race condition 방어). status 가 accepted/expired/revoked 로 바뀌면 자동 해제.';

-- ============================================================
-- Rollback (운영 적용 후 문제 발생 시 수동 실행)
-- ============================================================
-- DROP INDEX IF EXISTS idx_vcx_invites_pending_email_unique;

-- ============================================================
-- Dedupe 가이드 SQL (인덱스 생성 실패 시 운영자가 사전 실행)
-- 1) 중복 현황 확인
--      SELECT email, count(*) AS cnt
--        FROM vcx_invites
--       WHERE status = 'pending'
--       GROUP BY email
--      HAVING count(*) > 1
--       ORDER BY cnt DESC;
--
-- 2) 가장 최신 1건만 남기고 나머지를 revoked 로 정리
--      WITH ranked AS (
--        SELECT id,
--               row_number() OVER (
--                 PARTITION BY email
--                 ORDER BY created_at DESC, id DESC
--               ) AS rn
--          FROM vcx_invites
--         WHERE status = 'pending'
--      )
--      UPDATE vcx_invites
--         SET status = 'revoked'
--       WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
--
-- 3) 다시 `npx supabase db push --linked` 실행
-- ============================================================
