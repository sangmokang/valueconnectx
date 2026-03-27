-- VCX RLS Policies
-- All policies include application-level membership check for shared Supabase

ALTER TABLE vcx_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_corporate_users ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION vcx_is_member(user_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM vcx_members WHERE id = user_id AND is_active = true)
      OR EXISTS (SELECT 1 FROM vcx_corporate_users WHERE id = user_id);
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION vcx_is_admin(user_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM vcx_members WHERE id = user_id AND system_role IN ('admin', 'super_admin') AND is_active = true);
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION vcx_is_core_member(user_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM vcx_members WHERE id = user_id AND member_tier = 'core' AND is_active = true);
$$ LANGUAGE sql SECURITY DEFINER;

-- vcx_members policies
DROP POLICY IF EXISTS "vcx_members_select" ON vcx_members;
CREATE POLICY "vcx_members_select" ON vcx_members
  FOR SELECT USING (vcx_is_member(auth.uid()));

DROP POLICY IF EXISTS "vcx_members_update" ON vcx_members;
CREATE POLICY "vcx_members_update" ON vcx_members
  FOR UPDATE USING (auth.uid() = id);

-- vcx_recommendations policies
DROP POLICY IF EXISTS "vcx_recommendations_insert" ON vcx_recommendations;
CREATE POLICY "vcx_recommendations_insert" ON vcx_recommendations
  FOR INSERT WITH CHECK (vcx_is_core_member(auth.uid()));

DROP POLICY IF EXISTS "vcx_recommendations_select" ON vcx_recommendations;
CREATE POLICY "vcx_recommendations_select" ON vcx_recommendations
  FOR SELECT USING (vcx_is_admin(auth.uid()) OR (auth.uid() = recommender_id));

DROP POLICY IF EXISTS "vcx_recommendations_update" ON vcx_recommendations;
CREATE POLICY "vcx_recommendations_update" ON vcx_recommendations
  FOR UPDATE USING (vcx_is_admin(auth.uid()));

-- vcx_invites policies
DROP POLICY IF EXISTS "vcx_invites_insert" ON vcx_invites;
CREATE POLICY "vcx_invites_insert" ON vcx_invites
  FOR INSERT WITH CHECK (vcx_is_admin(auth.uid()));

DROP POLICY IF EXISTS "vcx_invites_select" ON vcx_invites;
CREATE POLICY "vcx_invites_select" ON vcx_invites
  FOR SELECT USING (vcx_is_admin(auth.uid()));

DROP POLICY IF EXISTS "vcx_invites_update" ON vcx_invites;
CREATE POLICY "vcx_invites_update" ON vcx_invites
  FOR UPDATE USING (vcx_is_admin(auth.uid()));

-- vcx_corporate_users policies
DROP POLICY IF EXISTS "vcx_corporate_users_select" ON vcx_corporate_users;
CREATE POLICY "vcx_corporate_users_select" ON vcx_corporate_users
  FOR SELECT USING (vcx_is_member(auth.uid()) AND is_verified = true);

DROP POLICY IF EXISTS "vcx_corporate_users_admin" ON vcx_corporate_users;
CREATE POLICY "vcx_corporate_users_admin" ON vcx_corporate_users
  FOR ALL USING (vcx_is_admin(auth.uid()));
