-- ============================================================================
-- 025_vcx_tag_canonical.sql
-- 목적: 태그 이원화 — raw (vcx_members.interest_tags) + canonical (여기).
-- 근거: PRD v6.1 §4.3 + CDO Review §2 D3 (pgvector embedding 사전 투입)
-- ----------------------------------------------------------------------------
-- Phase 1: 테이블만 생성. Edge fn `normalize-tags`는 Phase 2 (ADR-002).
-- 임베딩 컬럼은 Phase 3 AI Match를 위한 선 투입 (rev 4 D3).
-- ============================================================================

-- pgvector extension (Supabase 기본 지원)
CREATE EXTENSION IF NOT EXISTS vector;

-- ----------------------------------------------------------------------------
-- tag_canonical: 표준화된 태그 사전
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tag_canonical (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_slug      TEXT NOT NULL UNIQUE,
  display_ko          TEXT NOT NULL,
  display_en          TEXT,
  category            TEXT NOT NULL CHECK (category IN ('industry','function','stage','skill','topic')),
  synonyms            TEXT[] NOT NULL DEFAULT '{}',
  usage_count         INTEGER NOT NULL DEFAULT 0,
  -- CDO rev 4 D3: semantic matching용 임베딩 (Phase 2 edge fn에서 population)
  embedding           VECTOR(1024),
  embed_model         TEXT,
  embed_updated_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tag_canonical_synonyms
  ON tag_canonical USING gin(synonyms);

CREATE INDEX IF NOT EXISTS idx_tag_canonical_category
  ON tag_canonical (category);

-- HNSW 벡터 인덱스 (cosine similarity)
CREATE INDEX IF NOT EXISTS idx_tag_canonical_embed
  ON tag_canonical USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

ALTER TABLE tag_canonical ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tag_canonical_select_authenticated"
  ON tag_canonical FOR SELECT TO authenticated USING (true);
-- write: service_role only (Admin UI 경유)

-- ----------------------------------------------------------------------------
-- member_tag_mapping: raw tag → canonical 매핑 + 신뢰도 + 출처
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_tag_mapping (
  member_id       UUID NOT NULL REFERENCES vcx_members(id) ON DELETE CASCADE,
  canonical_id    UUID NOT NULL REFERENCES tag_canonical(id) ON DELETE CASCADE,
  raw_value       TEXT NOT NULL,
  confidence      NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (confidence BETWEEN 0 AND 1),
  -- CDO rev 4: 매핑 출처 추적 (re-labeling 시 필요)
  source          TEXT NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('manual','llm','synonym_match','exact')),
  source_model    TEXT,                                   -- e.g. 'claude-sonnet-4-6'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, canonical_id, raw_value)
);

CREATE INDEX IF NOT EXISTS idx_mtm_member    ON member_tag_mapping (member_id);
CREATE INDEX IF NOT EXISTS idx_mtm_canonical ON member_tag_mapping (canonical_id);

ALTER TABLE member_tag_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mtm_self_select"
  ON member_tag_mapping FOR SELECT TO authenticated
  USING (member_id = auth.uid());
-- write: service_role only

-- ----------------------------------------------------------------------------
-- vcx_members.interest_embedding: 멤버 관심사 집합 벡터 (Phase 2 계산)
-- ----------------------------------------------------------------------------
ALTER TABLE vcx_members
  ADD COLUMN IF NOT EXISTS interest_embedding VECTOR(1024),
  ADD COLUMN IF NOT EXISTS interest_embed_model TEXT,
  ADD COLUMN IF NOT EXISTS interest_embed_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_members_interest_embed
  ON vcx_members USING hnsw (interest_embedding vector_cosine_ops)
  WHERE interest_embedding IS NOT NULL;

COMMENT ON TABLE tag_canonical IS 'PRD v6.1 §4.3 / CDO rev 4 D3: canonical tag registry with embedding for Phase 3 AI Match';
COMMENT ON COLUMN tag_canonical.embedding IS 'CDO rev 4 D3: semantic embedding. Populated by Phase 2 normalize-tags edge fn.';
COMMENT ON COLUMN vcx_members.interest_embedding IS 'CDO rev 4 D3: aggregated member interest vector (avg/centroid of tag embeddings)';
