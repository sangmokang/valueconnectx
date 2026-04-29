-- ============================================================================
-- 02-member-reports.sql
-- 대상: 023 vcx_member_reports (throttle 트리거 + RLS + 중복 신고 방지)
-- ============================================================================

BEGIN;

SET LOCAL client_min_messages = NOTICE;

-- ----------------------------------------------------------------------------
-- Fixture
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_reporter UUID := 'PLACEHOLDER-0000-0000-0000-000000001001';
  v_reportee UUID := 'PLACEHOLDER-0000-0000-0000-000000001002';
  v_admin    UUID := 'PLACEHOLDER-0000-0000-0000-000000001003';
BEGIN
  INSERT INTO auth.users (id, email, created_at) VALUES
    (v_reporter, 'reporter@test.vcx', now()),
    (v_reportee, 'reportee@test.vcx', now()),
    (v_admin,    'admin@test.vcx',    now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO vcx_members (id, name, email, member_tier, system_role, is_active)
  VALUES
    (v_reporter, 'Reporter', 'reporter@test.vcx', 'core', 'member',      true),
    (v_reportee, 'Reportee', 'reportee@test.vcx', 'core', 'member',      true),
    (v_admin,    'Admin',    'admin@test.vcx',    'core', 'admin',       true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ----------------------------------------------------------------------------
-- Test 1: 자기 자신 신고 → RLS WITH CHECK 위반 OR CHECK 제약 위반
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_reporter UUID := 'PLACEHOLDER-0000-0000-0000-000000001001';
  v_err TEXT;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_reporter, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  BEGIN
    INSERT INTO vcx_member_reports (reportee_id, reporter_id, context_type, reason)
    VALUES (v_reporter, v_reporter, 'directory', '자신 신고 시도');
    RAISE EXCEPTION 'FAIL Test1: self-report should be rejected';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    RAISE NOTICE 'PASS Test1: self-report rejected (%)', v_err;
  END;

  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

-- ----------------------------------------------------------------------------
-- Test 2: 정상 신고 1건 삽입
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_reporter UUID := 'PLACEHOLDER-0000-0000-0000-000000001001';
  v_reportee UUID := 'PLACEHOLDER-0000-0000-0000-000000001002';
  v_count INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_reporter, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  INSERT INTO vcx_member_reports (reportee_id, reporter_id, context_type, reason)
  VALUES (v_reportee, v_reporter, 'directory', '부적절한 행동 1');

  SELECT COUNT(*) INTO v_count
    FROM vcx_member_reports
   WHERE reporter_id = v_reporter AND reportee_id = v_reportee;

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'FAIL Test2: expected 1 report, got %', v_count;
  END IF;

  RAISE NOTICE 'PASS Test2: valid report inserted';

  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

-- ----------------------------------------------------------------------------
-- Test 3: 동일 대상 중복 신고 (pending 존재) → 트리거 거부
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_reporter UUID := 'PLACEHOLDER-0000-0000-0000-000000001001';
  v_reportee UUID := 'PLACEHOLDER-0000-0000-0000-000000001002';
  v_err TEXT;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_reporter, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  BEGIN
    INSERT INTO vcx_member_reports (reportee_id, reporter_id, context_type, reason)
    VALUES (v_reportee, v_reporter, 'directory', '중복 신고 시도');
    RAISE EXCEPTION 'FAIL Test3: duplicate pending report should be rejected';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    IF v_err NOT ILIKE '%미처리 신고가 이미 존재%' THEN
      RAISE EXCEPTION 'FAIL Test3: rejected for wrong reason: %', v_err;
    END IF;
    RAISE NOTICE 'PASS Test3: duplicate pending report rejected';
  END;

  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

-- ----------------------------------------------------------------------------
-- Test 4: 24h 3건 throttle (서로 다른 reportee 3명에게 신고하면 4번째 차단)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_reporter UUID := 'PLACEHOLDER-0000-0000-0000-000000001001';
  v_r1 UUID := 'PLACEHOLDER-0000-0000-0000-000000002001';
  v_r2 UUID := 'PLACEHOLDER-0000-0000-0000-000000002002';
  v_r3 UUID := 'PLACEHOLDER-0000-0000-0000-000000002003';
  v_err TEXT;
BEGIN
  -- 3 명의 reportee 추가 fixture
  INSERT INTO auth.users (id, email, created_at) VALUES
    (v_r1, 't1@test.vcx', now()),
    (v_r2, 't2@test.vcx', now()),
    (v_r3, 't3@test.vcx', now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO vcx_members (id, name, email, member_tier, system_role, is_active) VALUES
    (v_r1, 'T1', 't1@test.vcx', 'core', 'member', true),
    (v_r2, 'T2', 't2@test.vcx', 'core', 'member', true),
    (v_r3, 'T3', 't3@test.vcx', 'core', 'member', true)
  ON CONFLICT (id) DO NOTHING;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_reporter, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  -- Test2에서 이미 1건 삽입됨. 여기서 2·3건 추가 (성공해야 함).
  INSERT INTO vcx_member_reports (reportee_id, reporter_id, context_type, reason)
  VALUES (v_r1, v_reporter, 'directory', '2nd');

  INSERT INTO vcx_member_reports (reportee_id, reporter_id, context_type, reason)
  VALUES (v_r2, v_reporter, 'directory', '3rd');

  -- 4번째 → throttle 발동
  BEGIN
    INSERT INTO vcx_member_reports (reportee_id, reporter_id, context_type, reason)
    VALUES (v_r3, v_reporter, 'directory', '4th');
    RAISE EXCEPTION 'FAIL Test4: 4th report should be throttled';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    IF v_err NOT ILIKE '%24시간 내 최대 3건%' THEN
      RAISE EXCEPTION 'FAIL Test4: throttled for wrong reason: %', v_err;
    END IF;
    RAISE NOTICE 'PASS Test4: 24h throttle enforced (4th blocked)';
  END;

  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

-- ----------------------------------------------------------------------------
-- Test 5: 일반 멤버는 타인의 신고를 조회 불가
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_reportee UUID := 'PLACEHOLDER-0000-0000-0000-000000001002';
  v_visible_count INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_reportee, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT COUNT(*) INTO v_visible_count
    FROM vcx_member_reports
   WHERE reportee_id = v_reportee;

  IF v_visible_count > 0 THEN
    RAISE EXCEPTION 'FAIL Test5: reportee should NOT see reports against them, got %', v_visible_count;
  END IF;

  RAISE NOTICE 'PASS Test5: reportee cannot see reports against themselves';

  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

-- ----------------------------------------------------------------------------
-- Test 6: Admin은 모든 신고 조회 가능
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_admin UUID := 'PLACEHOLDER-0000-0000-0000-000000001003';
  v_count INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT COUNT(*) INTO v_count FROM vcx_member_reports;

  IF v_count < 3 THEN
    RAISE EXCEPTION 'FAIL Test6: admin should see ≥3 reports, got %', v_count;
  END IF;

  RAISE NOTICE 'PASS Test6: admin sees all reports (count=%)' , v_count;

  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

DO $$ BEGIN
  RAISE NOTICE '=== 02-member-reports: ALL TESTS PASSED ===';
END $$;

ROLLBACK;
