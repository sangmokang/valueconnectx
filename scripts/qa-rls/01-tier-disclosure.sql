-- ============================================================================
-- 01-tier-disclosure.sql
-- 대상: 022 Directory Tiered + 025b Member Connections + 025d Safe Count
-- 실행: psql $STAGING_DB_URL -f scripts/qa-rls/01-tier-disclosure.sql
-- 원칙: BEGIN..ROLLBACK 으로 감싸므로 데이터 커밋되지 않음.
-- ============================================================================

BEGIN;

SET LOCAL client_min_messages = NOTICE;

-- ----------------------------------------------------------------------------
-- Fixture 생성 (service_role 권한 — RLS bypass)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_alice UUID := 'PLACEHOLDER-0000-0000-0000-00000000a1a1';
  v_bob   UUID := 'PLACEHOLDER-0000-0000-0000-00000000b2b2';
  v_charlie UUID := 'PLACEHOLDER-0000-0000-0000-00000000c3c3';
BEGIN
  -- auth.users 가상 레코드가 필요하므로 FK 우회: 직접 vcx_members INSERT.
  -- 실제 Supabase 환경에선 auth.users 에도 먼저 삽입 필요.
  INSERT INTO auth.users (id, email, created_at)
  VALUES
    (v_alice,   'alice@test.vcx',   now()),
    (v_bob,     'bob@test.vcx',     now()),
    (v_charlie, 'charlie@test.vcx', now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO vcx_members
    (id, name, email, member_tier, system_role, is_active, profile_visibility, professional_fields)
  VALUES
    (v_alice,   'Alice A', 'alice@test.vcx',   'core',     'member', true, 'members_only', ARRAY['fintech']),
    (v_bob,     'Bob B',   'bob@test.vcx',     'core',     'member', true, 'members_only', ARRAY['fintech']),
    (v_charlie, 'Charlie', 'charlie@test.vcx', 'endorsed', 'member', true, 'members_only', ARRAY['healthtech'])
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ----------------------------------------------------------------------------
-- Test 1: Alice가 Bob을 조회 시 Level 1 마스킹 (name/company/linkedin NULL)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_alice UUID := 'PLACEHOLDER-0000-0000-0000-00000000a1a1';
  v_bob   UUID := 'PLACEHOLDER-0000-0000-0000-00000000b2b2';
  v_name  TEXT;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_alice, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT name INTO v_name FROM members_directory_level1 WHERE id = v_bob;

  IF v_name IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL Test1: Level 1 name should be NULL before mutual accept, got: %', v_name;
  END IF;

  RAISE NOTICE 'PASS Test1: Level 1 view masks name before mutual accept';

  -- 원상복구
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

-- ----------------------------------------------------------------------------
-- Test 2: vcx_member_connections INSERT (service_role 로 직접) 후 Level 2 unlock
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_alice UUID := 'PLACEHOLDER-0000-0000-0000-00000000a1a1';
  v_bob   UUID := 'PLACEHOLDER-0000-0000-0000-00000000b2b2';
  v_unlocked BOOLEAN;
  v_name TEXT;
BEGIN
  -- peer-chat accept 효과를 직접 INSERT로 시뮬레이션
  INSERT INTO vcx_member_connections (user_a_id, user_b_id, connection_type)
  VALUES (LEAST(v_alice, v_bob), GREATEST(v_alice, v_bob), 'peer_chat_mutual')
  ON CONFLICT DO NOTHING;

  v_unlocked := vcx_has_mutual_peer_accept(v_alice, v_bob);

  IF NOT v_unlocked THEN
    RAISE EXCEPTION 'FAIL Test2: vcx_has_mutual_peer_accept should be true after connection insert';
  END IF;

  -- Alice 세션으로 Bob 조회 → 이제 name 노출
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_alice, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT name INTO v_name FROM members_directory_level1 WHERE id = v_bob;

  IF v_name IS NULL THEN
    RAISE EXCEPTION 'FAIL Test2: Level 1 name should be revealed after mutual accept, got NULL';
  END IF;

  RAISE NOTICE 'PASS Test2: mutual accept unlocks Level 2 (name=%)' , v_name;

  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

-- ----------------------------------------------------------------------------
-- Test 3: vcx_has_mutual_peer_accept 가 반대 방향 인수에서도 동일 결과
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_alice UUID := 'PLACEHOLDER-0000-0000-0000-00000000a1a1';
  v_bob   UUID := 'PLACEHOLDER-0000-0000-0000-00000000b2b2';
  v_forward  BOOLEAN;
  v_backward BOOLEAN;
BEGIN
  v_forward  := vcx_has_mutual_peer_accept(v_alice, v_bob);
  v_backward := vcx_has_mutual_peer_accept(v_bob, v_alice);

  IF v_forward <> v_backward THEN
    RAISE EXCEPTION 'FAIL Test3: vcx_has_mutual_peer_accept asymmetric (forward=%, backward=%)', v_forward, v_backward;
  END IF;

  RAISE NOTICE 'PASS Test3: helper function is symmetric';
END $$;

-- ----------------------------------------------------------------------------
-- Test 4: Charlie(연결 없음)는 Alice에게 여전히 마스킹된 상태
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_alice   UUID := 'PLACEHOLDER-0000-0000-0000-00000000a1a1';
  v_charlie UUID := 'PLACEHOLDER-0000-0000-0000-00000000c3c3';
  v_name TEXT;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_alice, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT name INTO v_name FROM members_directory_level1 WHERE id = v_charlie;

  IF v_name IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL Test4: Charlie should remain masked for Alice, got: %', v_name;
  END IF;

  RAISE NOTICE 'PASS Test4: non-connected members remain masked';

  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

-- ----------------------------------------------------------------------------
-- Test 5: vcx_safe_count k-anonymity floor
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_low  TEXT;
  v_mid  TEXT;
  v_high TEXT;
  v_null TEXT;
BEGIN
  v_low  := vcx_safe_count(7);
  v_mid  := vcx_safe_count(37);
  v_high := vcx_safe_count(237);
  v_null := vcx_safe_count(NULL);

  IF v_low IS DISTINCT FROM '10명 미만' THEN
    RAISE EXCEPTION 'FAIL Test5a: vcx_safe_count(7) expected "10명 미만", got: %', v_low;
  END IF;

  IF v_mid IS DISTINCT FROM '30+' THEN
    RAISE EXCEPTION 'FAIL Test5b: vcx_safe_count(37) expected "30+", got: %', v_mid;
  END IF;

  IF v_high IS DISTINCT FROM '200+' THEN
    RAISE EXCEPTION 'FAIL Test5c: vcx_safe_count(237) expected "200+", got: %', v_high;
  END IF;

  IF v_null IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL Test5d: vcx_safe_count(NULL) expected NULL, got: %', v_null;
  END IF;

  RAISE NOTICE 'PASS Test5: k-anonymity floor (7→10명 미만, 37→30+, 237→200+, NULL→NULL)';
END $$;

-- ----------------------------------------------------------------------------
-- Test 6: vcx_safe_count_excluding_self 본인 -1 적용
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_with_self    TEXT;
  v_without_self TEXT;
BEGIN
  -- 11명 중 본인 포함 → 10명으로 표시 (10+)
  v_with_self    := vcx_safe_count_excluding_self(11, true);
  v_without_self := vcx_safe_count_excluding_self(11, false);

  IF v_with_self IS DISTINCT FROM '10+' THEN
    RAISE EXCEPTION 'FAIL Test6a: excluding_self(11,true) expected "10+", got: %', v_with_self;
  END IF;

  IF v_without_self IS DISTINCT FROM '10+' THEN
    RAISE EXCEPTION 'FAIL Test6b: excluding_self(11,false) expected "10+", got: %', v_without_self;
  END IF;

  -- 10명 중 본인 포함 → 9로 강제됨 → "10명 미만"
  v_with_self := vcx_safe_count_excluding_self(10, true);
  IF v_with_self IS DISTINCT FROM '10명 미만' THEN
    RAISE EXCEPTION 'FAIL Test6c: excluding_self(10,true) expected "10명 미만", got: %', v_with_self;
  END IF;

  RAISE NOTICE 'PASS Test6: excluding_self variant handles viewer-in-set';
END $$;

DO $$ BEGIN
  RAISE NOTICE '=== 01-tier-disclosure: ALL TESTS PASSED ===';
END $$;

ROLLBACK;
