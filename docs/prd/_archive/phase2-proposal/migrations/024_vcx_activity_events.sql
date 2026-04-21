-- ============================================================================
-- 024_vcx_activity_events.sql
-- 목적: 분석·AI Match의 source of truth. Append-only event store.
-- 근거: PRD v6.1 §4.2 + CDO Review §2 D1 (rev 4 columns baked in)
-- ----------------------------------------------------------------------------
-- Phase 1은 단일 비파티션 테이블로 시작.
-- pg_partman 또는 pg_cron 월별 파티션은 G1 pre-flight gate 통과 후 별도 migration.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- event_catalog: 이벤트 타입 레지스트리 (자유 문자열 금지 — enum 강제)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_catalog (
  event_type       TEXT PRIMARY KEY,
  version          SMALLINT NOT NULL DEFAULT 1,
  context_schema   JSONB NOT NULL,                -- JSON Schema (Draft 2020-12)
  pii_fields       TEXT[] NOT NULL DEFAULT '{}',  -- anonymize 시 제거할 키
  deprecated_at    TIMESTAMPTZ,
  owner_team       TEXT NOT NULL DEFAULT 'vcx',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE event_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_catalog_select_authenticated"
  ON event_catalog FOR SELECT TO authenticated USING (true);
-- write: service_role only (default deny)

COMMENT ON TABLE event_catalog IS 'CDO rev 4 D1: event type registry. activity_events.event_type FK target.';

-- 초기 이벤트 타입 시드
INSERT INTO event_catalog (event_type, version, context_schema, pii_fields) VALUES
  ('position_interest_add',      1, '{"type":"object","properties":{"interest_type":{"type":"string","enum":["interested","not_interested","bookmark"]}},"required":["interest_type"]}'::jsonb, '{}'),
  ('position_interest_remove',   1, '{"type":"object"}'::jsonb, '{}'),
  ('peer_chat_apply',            1, '{"type":"object","properties":{"message_hash":{"type":"string"}}}'::jsonb, '{}'),
  ('peer_chat_accept',           1, '{"type":"object"}'::jsonb, '{}'),
  ('peer_chat_reject',           1, '{"type":"object"}'::jsonb, '{}'),
  ('ceo_chat_apply',             1, '{"type":"object"}'::jsonb, '{}'),
  ('ceo_chat_accept',            1, '{"type":"object"}'::jsonb, '{}'),
  ('ceo_chat_reject',            1, '{"type":"object"}'::jsonb, '{}'),
  ('community_post_create',      1, '{"type":"object","properties":{"category":{"type":"string"}}}'::jsonb, '{}'),
  ('community_comment_create',   1, '{"type":"object"}'::jsonb, '{}'),
  ('community_reaction_add',     1, '{"type":"object","properties":{"emoji":{"type":"string"}}}'::jsonb, '{}'),
  ('community_report',           1, '{"type":"object","properties":{"reason":{"type":"string"}}}'::jsonb, '{"reason"}'),
  ('directory_view',             1, '{"type":"object","properties":{"level":{"type":"integer","enum":[0,1,2]}}}'::jsonb, '{}'),
  ('directory_level2_unlock',    1, '{"type":"object"}'::jsonb, '{}'),
  ('feed_response',              1, '{"type":"object","properties":{"response":{"type":"string","enum":["yes","skip"]}}}'::jsonb, '{}'),
  ('feed_item_view',             1, '{"type":"object"}'::jsonb, '{}'),
  ('ai_brief_generate',          1, '{"type":"object","properties":{"model":{"type":"string"},"tokens_in":{"type":"integer"},"tokens_out":{"type":"integer"}},"required":["model"]}'::jsonb, '{}'),
  ('member_report',              1, '{"type":"object","properties":{"context_type":{"type":"string"}}}'::jsonb, '{}'),
  ('tag_canonical_mapped',       1, '{"type":"object","properties":{"raw_value":{"type":"string"},"canonical_slug":{"type":"string"},"source":{"type":"string"}}}'::jsonb, '{}'),
  ('placement_created',          1, '{"type":"object","properties":{"referral_type":{"type":"string"}}}'::jsonb, '{}')
ON CONFLICT (event_type) DO NOTHING;

-- ----------------------------------------------------------------------------
-- activity_events: append-only 이벤트 테이블
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_events (
  id                BIGSERIAL PRIMARY KEY,
  actor_id          UUID,                                    -- NULL 허용 (anonymize / system 이벤트)
  actor_type        TEXT NOT NULL CHECK (actor_type IN ('member','corporate','system')),
  event_type        TEXT NOT NULL REFERENCES event_catalog(event_type),
  event_version     SMALLINT NOT NULL DEFAULT 1,             -- 스키마 진화 (rev 4 D1)
  target_id         UUID,                                    -- polymorphic target
  target_type       TEXT,                                    -- 'position'|'peer_chat'|'ceo_chat'|'post'|'comment'|'member'|'feed_item'
  session_id        UUID,                                    -- 세션 경로 분석
  idempotency_key   UUID,                                    -- 클라이언트 재시도 dedupe
  client_ts         TIMESTAMPTZ,                             -- 클라이언트 시각 (drift 탐지)
  schema_ref        TEXT,                                    -- 'event_type@version' (e.g. 'peer_chat_accept@1')
  context           JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- idempotency: (actor_id, event_type, idempotency_key) UNIQUE where not null
CREATE UNIQUE INDEX IF NOT EXISTS uq_activity_events_idempotency
  ON activity_events (actor_id, event_type, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_act_actor_time  ON activity_events (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_act_type_time   ON activity_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_act_target      ON activity_events (target_type, target_id)
  WHERE target_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_act_session     ON activity_events (session_id, created_at)
  WHERE session_id IS NOT NULL;

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- 기본: default deny (service_role 만 write)
-- GDPR Art.15 열람권: 본인 이벤트는 본인이 조회 가능
CREATE POLICY "activity_events_self_select"
  ON activity_events FOR SELECT TO authenticated
  USING (actor_id = auth.uid());

COMMENT ON TABLE activity_events IS 'PRD v6.1 §4.2 / CDO rev 4: append-only event store. Analytics SoT.';
COMMENT ON COLUMN activity_events.event_version IS 'CDO rev 4: schema evolution — matches event_catalog.version at insert';
COMMENT ON COLUMN activity_events.idempotency_key IS 'CDO rev 4: client UUID for retry dedupe';
COMMENT ON COLUMN activity_events.target_type IS 'CDO rev 4: polymorphic target kind (not in context JSON)';
COMMENT ON COLUMN activity_events.client_ts IS 'CDO rev 4: client-reported ts — compare vs created_at for drift';
COMMENT ON COLUMN activity_events.schema_ref IS 'CDO rev 4: event_type@version for schema registry lookup';
