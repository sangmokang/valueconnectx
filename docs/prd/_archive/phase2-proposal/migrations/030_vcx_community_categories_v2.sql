-- ============================================================================
-- 030_vcx_community_categories_v2.sql
-- 목적: Community Lounge 카테고리 재설계 — 기존 6 + 신규 2 (learning, free).
--        salary → compensation rename (보너스/이퀴티 포함 의미 확장).
-- 근거: PRD v6.1 §1.5 (C12)
-- ----------------------------------------------------------------------------
-- 최종 8 카테고리:
--   career, leadership, compensation (← salary), burnout, productivity,
--   company_review, learning (신규), free (신규)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) 기존 데이터 마이그레이션: salary → compensation
-- ----------------------------------------------------------------------------
UPDATE community_posts
   SET category = 'compensation'
 WHERE category = 'salary';

-- ----------------------------------------------------------------------------
-- 2) 기존 CHECK constraint 제거 + 재생성
--    (constraint 이름이 환경마다 다를 수 있어 동적 drop)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class        rel ON rel.oid = con.conrelid
      JOIN pg_namespace    ns  ON ns.oid  = rel.relnamespace
     WHERE ns.nspname = 'public'
       AND rel.relname = 'community_posts'
       AND con.contype = 'c'
       AND pg_get_constraintdef(con.oid) ILIKE '%category%'
  LOOP
    EXECUTE format('ALTER TABLE community_posts DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE community_posts
  ADD CONSTRAINT community_posts_category_check
  CHECK (category IN (
    'career',
    'leadership',
    'compensation',
    'burnout',
    'productivity',
    'company_review',
    'learning',
    'free'
  ));

-- ----------------------------------------------------------------------------
-- 3) 기본값 변경: 신규 글 작성 시 default는 'free' (분류 부담 완화)
--    기존 default가 없거나 다른 경우 덮어쓴다.
-- ----------------------------------------------------------------------------
ALTER TABLE community_posts
  ALTER COLUMN category SET DEFAULT 'free';

-- ----------------------------------------------------------------------------
-- 4) 카테고리 메타 테이블 (탭 순서·라벨·프라이버시 힌트 — 프론트 조회용)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_category_meta (
  slug              TEXT PRIMARY KEY,
  display_ko        TEXT NOT NULL,
  display_order     INTEGER NOT NULL,
  privacy_hint      TEXT NOT NULL CHECK (privacy_hint IN ('anonymous_default','anonymous_forced','optional')),
  description_ko    TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO community_category_meta (slug, display_ko, display_order, privacy_hint, description_ko) VALUES
  ('career',         '커리어·이직',   1, 'anonymous_default', '이직 고민, 커리어 전환, 협상'),
  ('leadership',     '리더십',        2, 'anonymous_default', '팀 빌딩, 의사결정, 피드백'),
  ('compensation',   '보상·처우',     3, 'anonymous_forced',  '연봉·스톡옵션·베네핏'),
  ('burnout',        '번아웃·워라밸', 4, 'anonymous_forced',  '정신 건강, 회복, 워라밸'),
  ('productivity',   '생산성·도구',   5, 'optional',          '생산성 시스템, 툴, 루틴'),
  ('learning',       '학습·독서',     6, 'optional',          '책·아티클·강의 추천·후기'),
  ('company_review', '회사 리뷰',     7, 'anonymous_forced',  '재직/퇴직 회사 솔직 리뷰'),
  ('free',           '자유',          8, 'optional',          '어디에도 안 맞는 글을 위한 공간')
ON CONFLICT (slug) DO UPDATE SET
  display_ko     = EXCLUDED.display_ko,
  display_order  = EXCLUDED.display_order,
  privacy_hint   = EXCLUDED.privacy_hint,
  description_ko = EXCLUDED.description_ko;

ALTER TABLE community_category_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ccm_select_authenticated"
  ON community_category_meta FOR SELECT TO authenticated USING (true);
-- write: service_role only

COMMENT ON TABLE community_category_meta IS
  'PRD v6.1 §1.5: Community 카테고리 프론트 메타(탭 순서·라벨·프라이버시 힌트).';
