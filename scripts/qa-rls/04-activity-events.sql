-- ============================================================================
-- 04-activity-events.sql
-- 대상: 024 activity_events + event_catalog (default deny, self-select, FK enforce)
-- ============================================================================

BEGIN;

SET LOCAL client_min_messages = NOTICE;

-- ----------------------------------------------------------------------------
-- Fixture
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_alice UUID := 'PLACEHOLDER-0000-0000-0000-000000eeeee1';
  v_bob   UUID := 'PLACEHOLDER-0000-0000-0000-000000eeeee2';
BEGIN
  INSERT INTO auth.users (id, email, created_at) VALUES
    (v_alice, 'eve-alice@test.vcx', now()),
    (v_bob,   'eve-bob@test.vcx',   now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO vcx_members (id, name, email, member_tier, system_role, is_active) VALUES
    (v_alice, 'EveAlice', 'eve-alice@test.vcx', 'core', 'member', true),
    (v_bob,   'EveBob',   'eve-bob@test.vcx',   'core', 'member', true)
  ON CONFLICT (id) DO NOTHING;

  -- service_role (postgres) 로 이벤트 2건 삽입
  INSERT INTO activity_events
    (actor_id, actor_type, event_type, event_version, context)
  VALUES
    (v_alice, 'member', 'directory_view', 1, '{"level":1}'::jsonb),
    (v_bob,   'member', 'directory_view', 1, '{"level":0}'::jsonb);
END $$;

-- ----------------------------------------------------------------------------
-- Test 1: event_catalog 시드 확인 (최소 15개 타입 등록됨)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM event_catalog;

  IF v_count < 15 THEN
    RAISE EXCEPTION 'FAIL Test1: expected ≥15 seeded event types, got %', v_count;
  END IF;

  RAISE NOTICE 'PASS Test1: event_catalog has % seeded types', v_count;
END $$;

-- ----------------------------------------------------------------------------
-- Test 2: 미등록 event_type 삽입 시도 → FK 위반으로 거부
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_alice UUID := 'PLACEHOLDER-0000-0000-0000-000000eeeee1';
  v_err TEXT;
BEGIN
  BEGIN
    INSERT INTO activity_events (actor_id, actor_type, event_type, event_version)
    VALUES (v_alice, 'member', 'invalid_fake_event_xyz', 1);
    RAISE EXCEPTION 'FAIL Test2: unregistered event_type should fail FK';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASS Test2: unregistered event_type rejected by event_catalog FK';
  WHEN OTHERS THEN
    v_err := SQLERRM;
    RAISE EXCEPTION 'FAIL Test2: expected FK violation, got: %', v_err;
  END;
END $$;

-- ----------------------------------------------------------------------------
-- Test 3: Alice(authenticated) 본인 이벤트만 조회 가능
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_alice UUID := 'PLACEHOLDER-0000-0000-0000-000000eeeee1';
  v_count INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_alice, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT COUNT(*) INTO v_count FROM activity_events;

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'FAIL Test3: Alice should see only her 1 event (self-select policy), got %', v_count;
  END IF;

  RAISE NOTICE 'PASS Test3: self-select policy limits visibility';

  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

-- ----------------------------------------------------------------------------
-- Test 4: Idempotency — 동일 (actor, event_type, idempotency_key) 중복 거부
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_alice UUID := 'PLACEHOLDER-0000-0000-0000-000000eeeee1';
  v_idem  UUID := gen_random_uuid();
  v_err TEXT;
BEGIN
  INSERT INTO activity_events
    (actor_id, actor_type, event_type, event_version, idempotency_key, context)
  VALUES
    (v_alice, 'member', 'directory_view', 1, v_idem, '{"level":1}'::jsonb);

  BEGIN
    INSERT INTO activity_events
      (actor_id, actor_type, event_type, event_version, idempotency_key, context)
    VALUES
      (v_alice, 'member', 'directory_view', 1, v_idem, '{"level":1}'::jsonb);
    RAISE EXCEPTION 'FAIL Test4: duplicate idempotency_key should be rejected';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS Test4: duplicate idempotency_key rejected';
  WHEN OTHERS THEN
    v_err := SQLERRM;
    RAISE EXCEPTION 'FAIL Test4: expected unique_violation, got: %', v_err;
  END;
END $$;

-- ----------------------------------------------------------------------------
-- Test 5: actor_type CHECK constraint
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_err TEXT;
BEGIN
  BEGIN
    INSERT INTO activity_events (actor_type, event_type, event_version)
    VALUES ('invalid_actor_type', 'directory_view', 1);
    RAISE EXCEPTION 'FAIL Test5: invalid actor_type should be rejected';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS Test5: actor_type CHECK constraint enforced';
  WHEN OTHERS THEN
    v_err := SQLERRM;
    RAISE EXCEPTION 'FAIL Test5: expected check_violation, got: %', v_err;
  END;
END $$;

-- ----------------------------------------------------------------------------
-- Test 6: 인덱스 존재 확인 (성능 보증)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_has_actor_idx    BOOLEAN;
  v_has_type_idx     BOOLEAN;
  v_has_idem_idx     BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_indexes
                 WHERE schemaname='public' AND tablename='activity_events' AND indexname='idx_act_actor_time')
    INTO v_has_actor_idx;
  SELECT EXISTS (SELECT 1 FROM pg_indexes
                 WHERE schemaname='public' AND tablename='activity_events' AND indexname='idx_act_type_time')
    INTO v_has_type_idx;
  SELECT EXISTS (SELECT 1 FROM pg_indexes
                 WHERE schemaname='public' AND tablename='activity_events' AND indexname='uq_activity_events_idempotency')
    INTO v_has_idem_idx;

  IF NOT (v_has_actor_idx AND v_has_type_idx AND v_has_idem_idx) THEN
    RAISE EXCEPTION 'FAIL Test6: missing expected indexes (actor=%, type=%, idem=%)',
      v_has_actor_idx, v_has_type_idx, v_has_idem_idx;
  END IF;

  RAISE NOTICE 'PASS Test6: all performance indexes present';
END $$;

DO $$ BEGIN
  RAISE NOTICE '=== 04-activity-events: ALL TESTS PASSED ===';
END $$;

ROLLBACK;
