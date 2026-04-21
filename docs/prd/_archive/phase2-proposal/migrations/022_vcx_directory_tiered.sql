-- ============================================================================
-- 022_vcx_directory_tiered.sql
-- 목적: Directory Tiered Disclosure (Level 0 / 1 / 2) + double opt-in 기반 Level 2.
-- 근거: PRD v6.1 §2 Feature 3 + §4.6 + ADR-001
-- ----------------------------------------------------------------------------
-- 전제: 025b_vcx_member_connections.sql 가 선행 적용되어
--       vcx_has_mutual_peer_accept(uuid, uuid) 함수가 O(1)로 동작해야 함.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) vcx_members: full_reveal_on_mutual_accept 컬럼 추가 + 기본값 true
-- ----------------------------------------------------------------------------
ALTER TABLE vcx_members
  ADD COLUMN IF NOT EXISTS full_reveal_on_mutual_accept BOOLEAN NOT NULL DEFAULT true;

-- Level 1 마스킹 기본 적용을 위해 profile_visibility 디폴트를 members_only로 (이미 그러하면 no-op)
-- 기존 'all' 로 설정된 멤버는 본인 선택이므로 건드리지 않음.
UPDATE vcx_members
   SET profile_visibility = 'members_only'
 WHERE profile_visibility IS NULL;

-- ----------------------------------------------------------------------------
-- 2) SELECT RLS 재정의: Tiered Disclosure
--    기존 "vcx_members_select" 정책을 교체한다.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "vcx_members_select" ON vcx_members;

CREATE POLICY "vcx_members_select"
  ON vcx_members FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (
      id = auth.uid()                                                     -- 본인
      OR vcx_has_mutual_peer_accept(auth.uid(), id) = true                -- Level 2 unlock
      OR profile_visibility IN ('members_only','all')                     -- Level 1 (VIEW에서 마스킹)
      OR EXISTS (
        SELECT 1 FROM vcx_members m
        WHERE m.id = auth.uid() AND m.system_role IN ('admin','super_admin')
      )
    )
  );

-- ----------------------------------------------------------------------------
-- 3) Level 1 마스킹 VIEW (security_invoker — 호출자 권한 존중)
--    name / current_company / linkedin_url 은 mutual_accept 전까지 NULL
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW members_directory_level1
WITH (security_invoker = true)
AS
SELECT
  id,
  CASE WHEN id = auth.uid() OR vcx_has_mutual_peer_accept(auth.uid(), id)
       THEN name ELSE NULL END AS name,
  CASE WHEN id = auth.uid() OR vcx_has_mutual_peer_accept(auth.uid(), id)
       THEN current_company ELSE NULL END AS current_company,
  CASE WHEN id = auth.uid() OR vcx_has_mutual_peer_accept(auth.uid(), id)
       THEN linkedin_url ELSE NULL END AS linkedin_url,
  title,                                        -- Level 1에서도 표시
  member_tier,
  years_of_experience,
  professional_fields,
  bio,
  profile_visibility,
  is_active
FROM vcx_members
WHERE is_active = true
  AND profile_visibility IN ('members_only','all');

GRANT SELECT ON members_directory_level1 TO authenticated;

-- ----------------------------------------------------------------------------
-- 4) Level 0 집계 helper VIEW (k-anonymity 적용, 025d 의존)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW members_directory_level0_industry
WITH (security_invoker = false)
AS
SELECT
  COALESCE(unnest(professional_fields), '기타') AS industry,
  vcx_safe_count(COUNT(*)) AS safe_count,
  vcx_safe_count_numeric(COUNT(*)) AS safe_num
FROM vcx_members
WHERE is_active = true
GROUP BY industry
HAVING COUNT(*) >= 10;

GRANT SELECT ON members_directory_level0_industry TO authenticated;

COMMENT ON POLICY "vcx_members_select" ON vcx_members IS
  'CDO rev 4 / PRD §4.6: Tiered Disclosure — 본인·admin 전체, mutual accept 후 Level 2, 그 외 Level 1 (VIEW 경유).';
COMMENT ON VIEW members_directory_level1 IS
  'PRD §4.6 Level 1 masked view. name/company/linkedin NULL until peer_chat mutual accept.';
COMMENT ON VIEW members_directory_level0_industry IS
  'CDO rev 4 D5: Level 0 산업별 집계. k<10 suppress.';
