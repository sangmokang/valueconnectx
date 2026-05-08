-- 033_vcx_invites_unique_pending_lower.sql
-- 설명: 032 의 case-sensitive partial unique index 를 lower(email) 함수 인덱스로 강화
-- 배경:
--   - 032 가 추가한 idx_vcx_invites_pending_email_unique 는 vcx_invites(email) 그대로 비교.
--   - 동일 메일이라도 'Foo@x.com' 와 'foo@x.com' 가 별개 row 로 취급되어
--     race condition 우회가 가능 (실제 유저 입력은 케이싱 일관성 보장 안 됨).
--   - 본 마이그레이션은 lower(email) 함수 인덱스로 대체하여 케이스 무관 unique 강제.
--
-- 032 와의 관계: **대체** (DROP 후 함수 인덱스 신규 생성)
--   - 032 의 idx_vcx_invites_pending_email_unique 를 제거하고
--     idx_vcx_invites_pending_email_lower_unique 로 교체.
--   - 함수 인덱스만 남는다.
--
-- DDL 보호 영향:
--   - Event Trigger vcx_prevent_ddl 은 postgres/supabase_admin/supabase_auth_admin 일 때 통과.
--   - `npx supabase db push --linked` 는 postgres 역할로 연결되므로 정상 적용.
--
-- RLS 영향: 없음 (인덱스 변경만, 정책 변경 없음).
--
-- 031 vcx_consume_invite RPC 정합성:
--   - RPC 는 token_hash 기반 lookup + UPDATE pending → accepted.
--   - 함수 인덱스는 status='pending' partial 조건은 그대로 유지하므로
--     accepted 로 status 가 바뀌면 인덱스에서 자동 제외 → RPC 와 충돌 없음.
--   - INSERT 경로(direct route)에서만 새 lower(email) unique 가 강제됨.
--
-- 앱 라우트 갭 (별도 부채로 식별):
--   - src/app/api/invites/direct/route.ts 의 사전 check 는 .eq('email', email) 으로 case-sensitive.
--   - DB 인덱스는 lower 비교로 차단하지만, 앱 사전 check 가 통과 후 INSERT 단계에서
--     unique violation 23505 로 실패 → 사용자 메시지 변경 필요.
--   - 권장 후속 조치 (D-NEW): direct route 에서 email = email.trim().toLowerCase() 정규화 +
--     사전 check 를 .ilike(email) 또는 RPC 화. 본 마이그레이션 트랙 외.

-- ============================================================
-- 사전 검증: lower(email) 기준 중복 pending 초대 확인
-- ============================================================
DO $$
DECLARE
  dup_count int;
BEGIN
  SELECT count(*) INTO dup_count
  FROM (
    SELECT lower(email) AS lemail
    FROM vcx_invites
    WHERE status = 'pending'
    GROUP BY lower(email)
    HAVING count(*) > 1
  ) d;

  IF dup_count > 0 THEN
    RAISE EXCEPTION
      '[VCX] vcx_invites 에 lower(email) 기준 중복 pending 초대 % 건이 존재합니다. 아래 dedupe SQL 가이드를 먼저 실행하세요. (033 마이그레이션 주석 참고)',
      dup_count;
  END IF;
END;
$$;

-- ============================================================
-- 032 의 case-sensitive 인덱스 제거
-- ============================================================
DROP INDEX IF EXISTS idx_vcx_invites_pending_email_unique;

-- ============================================================
-- lower(email) 함수 partial unique index — 케이스 무관 race 차단
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_vcx_invites_pending_email_lower_unique
  ON vcx_invites (lower(email))
  WHERE status = 'pending';

COMMENT ON INDEX idx_vcx_invites_pending_email_lower_unique IS
  '동일 email (대소문자 무관) 의 pending 초대 중복 차단. status 가 accepted/expired/revoked 로 바뀌면 자동 해제.';

-- ============================================================
-- Rollback (운영 적용 후 문제 발생 시 수동 실행)
-- ============================================================
-- DROP INDEX IF EXISTS idx_vcx_invites_pending_email_lower_unique;
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_vcx_invites_pending_email_unique
--   ON vcx_invites(email)
--   WHERE status = 'pending';

-- ============================================================
-- Dedupe 가이드 SQL (인덱스 생성 실패 시 운영자가 사전 실행)
-- 1) lower(email) 기준 중복 현황
--      SELECT lower(email) AS lemail, count(*) AS cnt
--        FROM vcx_invites
--       WHERE status = 'pending'
--       GROUP BY lower(email)
--      HAVING count(*) > 1
--       ORDER BY cnt DESC;
--
-- 2) 가장 최신 1건만 남기고 나머지를 revoked 로 정리
--      WITH ranked AS (
--        SELECT id,
--               row_number() OVER (
--                 PARTITION BY lower(email)
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
