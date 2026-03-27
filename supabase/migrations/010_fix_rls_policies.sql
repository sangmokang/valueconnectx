-- Fix: FOR ALL 정책을 INSERT/UPDATE/DELETE로 분리하여 SELECT 누출 방지

-- ============================================
-- community_posts
-- ============================================
DROP POLICY IF EXISTS "Authors can manage posts" ON community_posts;

CREATE POLICY "Authors can insert posts" ON community_posts
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own posts" ON community_posts
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own posts" ON community_posts
  FOR DELETE USING (author_id = auth.uid());

-- ============================================
-- community_comments
-- ============================================
DROP POLICY IF EXISTS "Authors can manage comments" ON community_comments;

CREATE POLICY "Authors can insert comments" ON community_comments
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own comments" ON community_comments
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own comments" ON community_comments
  FOR DELETE USING (author_id = auth.uid());

-- ============================================
-- positions (일관성 수정)
-- ============================================
-- positions의 Admin FOR ALL은 의도된 동작이므로 유지
-- Members SELECT 정책에서 created_by 조건 제거 (admin만 생성하므로 불필요)
DROP POLICY IF EXISTS "Members can read active positions" ON positions;

CREATE POLICY "Members can read active positions" ON positions
  FOR SELECT USING (
    status = 'active'
    OR EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );
