-- ============================================================================
-- 03-placements.sql
-- 대상: 025c vcx_placements — service-role only + vcx_placements_self 마스킹 view
-- ============================================================================

BEGIN;

SET LOCAL client_min_messages = NOTICE;

-- ----------------------------------------------------------------------------
-- Fixture
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_member UUID := 'PLACEHOLDER-0000-0000-0000-00000000f001';
  v_other  UUID := 'PLACEHOLDER-0000-0000-0000-00000000f002';
BEGIN
  INSERT INTO auth.users (id, email, created_at) VALUES
    (v_member, 'placement-member@test.vcx', now()),
    (v_other,  'placement-other@test.vcx',  now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO vcx_members (id, name, email, member_tier, system_role, is_active) VALUES
    (v_member, 'Member', 'placement-member@test.vcx', 'core', 'member', true),
    (v_other,  'Other',  'placement-other@test.vcx',  'core', 'member', true)
  ON CONFLICT (id) DO NOTHING;

  -- service_role 권한 하에 placement 1건 삽입 (현재 세션은 postgres)
  INSERT INTO vcx_placements
    (member_id, referral_type, placement_date, fee_amount_krw, status)
  VALUES
    (v_member, 'peer', CURRENT_DATE, 5000000, 'paid');
END $$;

-- ----------------------------------------------------------------------------
-- Test 1: authenticated 역할로는 vcx_placements 직접 SELECT 불가 (default deny)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_member UUID := 'PLACEHOLDER-0000-0000-0000-00000000f001';
  v_count INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_member, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT COUNT(*) INTO v_count FROM vcx_placements;

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FAIL Test1: authenticated should see 0 rows (default deny), got %', v_count;
  END IF;

  RAISE NOTICE 'PASS Test1: authenticated denied direct SELECT on vcx_placements';

  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

-- ----------------------------------------------------------------------------
-- Test 2: vcx_placements_self view는 본인 레코드만 반환
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_member UUID := 'PLACEHOLDER-0000-0000-0000-00000000f001';
  v_count  INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_member, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT COUNT(*) INTO v_count FROM vcx_placements_self;

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'FAIL Test2: self view should return 1 row for member, got %', v_count;
  END IF;

  RAISE NOTICE 'PASS Test2: vcx_placements_self returns own placement';

  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

-- ----------------------------------------------------------------------------
-- Test 3: vcx_placements_self view에 fee_amount_krw 컬럼이 존재하지 않음
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_has_fee BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'vcx_placements_self'
       AND column_name  = 'fee_amount_krw'
  ) INTO v_has_fee;

  IF v_has_fee THEN
    RAISE EXCEPTION 'FAIL Test3: vcx_placements_self must NOT expose fee_amount_krw';
  END IF;

  RAISE NOTICE 'PASS Test3: fee_amount_krw correctly hidden from self view';
END $$;

-- ----------------------------------------------------------------------------
-- Test 4: 다른 멤버(other)는 본인 placement가 없어 view에서 0 rows
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_other UUID := 'PLACEHOLDER-0000-0000-0000-00000000f002';
  v_count INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT COUNT(*) INTO v_count FROM vcx_placements_self;

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FAIL Test4: other member should see 0 rows, got %', v_count;
  END IF;

  RAISE NOTICE 'PASS Test4: other member sees no placements in self view';

  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

-- ----------------------------------------------------------------------------
-- Test 5: authenticated 역할로 INSERT 시도 → 거부
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_member UUID := 'PLACEHOLDER-0000-0000-0000-00000000f001';
  v_err TEXT;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_member, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  BEGIN
    INSERT INTO vcx_placements
      (member_id, referral_type, placement_date, fee_amount_krw, status)
    VALUES
      (v_member, 'self', CURRENT_DATE, 1000000, 'paid');
    RAISE EXCEPTION 'FAIL Test5: authenticated INSERT should be rejected';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    RAISE NOTICE 'PASS Test5: authenticated INSERT rejected (%)', v_err;
  END;

  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

DO $$ BEGIN
  RAISE NOTICE '=== 03-placements: ALL TESTS PASSED ===';
END $$;

ROLLBACK;
