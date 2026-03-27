-- VCX Auth Schema Migration
-- Created: 2026-03-25
-- All tables use vcx_ prefix for shared Supabase instance isolation

-- 1. vcx_members (must be first - referenced by other tables)
CREATE TABLE IF NOT EXISTS vcx_members (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  current_company text,
  title text,
  professional_fields text[] DEFAULT '{}',
  years_of_experience int,
  bio text,
  linkedin_url text,
  member_tier text NOT NULL CHECK (member_tier IN ('core', 'endorsed')),
  system_role text NOT NULL DEFAULT 'member' CHECK (system_role IN ('super_admin', 'admin', 'member')),
  join_date timestamptz DEFAULT now(),
  endorsed_by uuid REFERENCES vcx_members(id),
  endorsed_by_name text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. vcx_recommendations (references vcx_members)
CREATE TABLE IF NOT EXISTS vcx_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommender_id uuid NOT NULL REFERENCES vcx_members(id),
  recommended_email text NOT NULL,
  recommended_name text NOT NULL,
  reason text,
  member_tier text NOT NULL CHECK (member_tier IN ('core', 'endorsed')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES vcx_members(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vcx_recommendations_pending_email
  ON vcx_recommendations(recommended_email) WHERE status = 'pending';

-- 3. vcx_invites (references vcx_recommendations)
CREATE TABLE IF NOT EXISTS vcx_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  invited_by_name text NOT NULL,
  member_tier text NOT NULL CHECK (member_tier IN ('core', 'endorsed')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  token_hash text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  recommendation_id uuid REFERENCES vcx_recommendations(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vcx_invites_token_hash ON vcx_invites(token_hash);
CREATE INDEX IF NOT EXISTS idx_vcx_invites_email ON vcx_invites(email);

-- 4. vcx_corporate_users
CREATE TABLE IF NOT EXISTS vcx_corporate_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  company text NOT NULL,
  role text NOT NULL CHECK (role IN ('ceo', 'founder', 'c_level', 'hr_leader')),
  title text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION vcx_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vcx_members_updated_at ON vcx_members;
CREATE TRIGGER vcx_members_updated_at
  BEFORE UPDATE ON vcx_members
  FOR EACH ROW EXECUTE FUNCTION vcx_update_updated_at();

DROP TRIGGER IF EXISTS vcx_corporate_users_updated_at ON vcx_corporate_users;
CREATE TRIGGER vcx_corporate_users_updated_at
  BEFORE UPDATE ON vcx_corporate_users
  FOR EACH ROW EXECUTE FUNCTION vcx_update_updated_at();
