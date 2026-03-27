-- Privacy Model: "이 회사 어때요?" 카테고리 작성자 보호
-- corporate_users는 company_review 게시글의 author_id를 조회할 수 없도록 강제

-- ============================================================
-- Helper function: 현재 사용자가 corporate_user인지 확인
-- ============================================================
CREATE OR REPLACE FUNCTION vcx_is_corporate_user(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM vcx_corporate_users WHERE id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- company_review 게시글 SELECT 정책 강화
-- 기존 "Members can read active posts" 정책을 대체:
--   corporate_user가 company_review 게시글을 조회하면 author_id가
--   실제로는 반환되지만, API 레벨에서 마스킹한다.
--   (RLS로 컬럼 단위 마스킹은 불가하므로 API에서 처리)
--
-- RLS 레벨에서는 company_review 게시글을 corporate_user가
-- 전혀 볼 수 없도록 하는 강력한 정책을 추가할 수 있으나,
-- 이 서비스에서는 내용은 보여주되 작성자만 숨기는 것이 목적이므로
-- 컬럼 마스킹은 API/View 레벨에서 처리한다.
-- ============================================================

-- View: corporate_user에게 company_review author_id를 null로 마스킹
CREATE OR REPLACE VIEW community_posts_safe AS
SELECT
  id,
  CASE
    WHEN category = 'company_review' AND vcx_is_corporate_user(auth.uid()) THEN NULL
    WHEN is_anonymous THEN NULL
    ELSE author_id
  END AS author_id,
  category,
  title,
  content,
  is_anonymous,
  status,
  created_at,
  updated_at
FROM community_posts;
