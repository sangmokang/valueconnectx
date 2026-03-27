-- VCX DDL Protection Migration
-- Created: 2026-03-25
-- 애플리케이션 역할(anon, authenticated, service_role)의 DDL 작업 차단
-- CREATE TABLE, ALTER TABLE, DROP TABLE 등 스키마 변경 불가

-- 1. public 스키마에서 CREATE 권한 회수
-- anon/authenticated/service_role이 새 테이블을 생성할 수 없도록 차단
REVOKE CREATE ON SCHEMA public FROM anon;
REVOKE CREATE ON SCHEMA public FROM authenticated;
REVOKE CREATE ON SCHEMA public FROM service_role;

-- 2. ALTER/DROP 보호
-- PostgreSQL에서 테이블 소유자만 ALTER/DROP 가능
-- 모든 vcx_ 테이블은 postgres 역할이 소유하므로 애플리케이션 역할은 변경/삭제 불가
-- (추가 보호 불필요 — 소유권 기반 보호가 기본 적용됨)

-- 3. Event Trigger — DDL 방어 심층 보호 (Defense-in-Depth)
-- 허용된 관리자 역할 외 모든 DDL 명령을 차단
CREATE OR REPLACE FUNCTION vcx_block_ddl_commands()
RETURNS event_trigger AS $$
DECLARE
  allowed_roles text[] := ARRAY['postgres', 'supabase_admin', 'supabase_auth_admin'];
BEGIN
  IF NOT (current_user = ANY(allowed_roles)) THEN
    RAISE EXCEPTION '[VCX] DDL 작업이 차단되었습니다. 현재 역할: %. 스키마 변경은 마이그레이션을 통해서만 가능합니다.', current_user;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP EVENT TRIGGER IF EXISTS vcx_prevent_ddl;
CREATE EVENT TRIGGER vcx_prevent_ddl
  ON ddl_command_start
  EXECUTE FUNCTION vcx_block_ddl_commands();

-- 4. 확인: 현재 vcx_ 테이블 소유자가 postgres인지 검증
DO $$
DECLARE
  bad_owner record;
BEGIN
  FOR bad_owner IN
    SELECT tablename, tableowner
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename LIKE 'vcx_%'
      AND tableowner NOT IN ('postgres', 'supabase_admin')
  LOOP
    RAISE WARNING '[VCX] 테이블 %의 소유자가 %입니다. postgres로 변경을 권장합니다.',
      bad_owner.tablename, bad_owner.tableowner;
  END LOOP;
END;
$$;
