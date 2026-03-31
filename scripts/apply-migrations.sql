-- =============================================================================
-- apply-migrations.sql
--
-- Combined idempotent migration script for ValueConnect X.
-- Applies migrations 005–019 in order (012 DDL protection is intentionally
-- SKIPPED to avoid blocking the rest of these migrations).
--
-- Duplicate numbering (013a/013b and 014a/014b) is handled by running both
-- variants sequentially under clearly labelled sections.
--
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / ADD COLUMN IF NOT EXISTS
-- throughout.  The one exception is the positions table rename (positions →
-- positions_legacy) which is guarded with a DO block so it only fires when
-- the legacy schema (snapshot_date column) is still present.
-- =============================================================================


-- =============================================================================
-- PRE-FLIGHT: rename legacy positions table if it still has the old schema
-- (columns: snapshot_date, raw_titles, segment, platforms, …)
-- Migration 007 will then CREATE TABLE positions with the new schema.
-- =============================================================================
DO $$
BEGIN
  -- Only rename when the OLD column set is present (snapshot_date is a reliable
  -- sentinel that exists only on the legacy scraper table).
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'positions'
      AND column_name  = 'snapshot_date'
  ) THEN
    ALTER TABLE positions RENAME TO positions_legacy;
    RAISE NOTICE 'Renamed legacy positions table to positions_legacy';
  END IF;
END
$$;


-- =============================================================================
-- MIGRATION 005 — vcx_member_directory
-- Add directory columns + FTS to vcx_members
-- =============================================================================

ALTER TABLE vcx_members ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE vcx_members ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE vcx_members ADD COLUMN IF NOT EXISTS is_open_to_chat boolean DEFAULT false;
ALTER TABLE vcx_members ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'members_only'
  CHECK (profile_visibility IN ('members_only', 'corporate_only', 'all'));

-- Search optimisation indexes
CREATE INDEX IF NOT EXISTS idx_vcx_members_directory
  ON vcx_members(is_active, member_tier, industry, professional_fields);

-- Full-text search generated column + GIN index
-- Guard with DO block: generated columns cannot use ADD COLUMN IF NOT EXISTS
-- safely when the expression references other columns — skip if already present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'vcx_members'
      AND column_name  = 'fts'
  ) THEN
    ALTER TABLE vcx_members ADD COLUMN fts tsvector
      GENERATED ALWAYS AS (
        to_tsvector('simple',
          coalesce(name,'') || ' ' ||
          coalesce(current_company,'') || ' ' ||
          coalesce(bio,''))
      ) STORED;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_vcx_members_search
  ON vcx_members USING gin(fts);


-- =============================================================================
-- MIGRATION 006 — vcx_ceo_coffeechat
-- CEO Coffee Chat sessions + applications
-- =============================================================================

CREATE TABLE IF NOT EXISTS vcx_ceo_coffee_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id          uuid NOT NULL REFERENCES vcx_corporate_users(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text NOT NULL,
  session_date     timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  max_participants integer NOT NULL DEFAULT 5,
  location_type    text NOT NULL CHECK (location_type IN ('online', 'offline', 'hybrid')),
  location_detail  text,
  status           text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed', 'cancelled')),
  target_tier      text CHECK (target_tier IN ('core', 'endorsed', 'all')),
  tags             text[] NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vcx_coffee_applications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES vcx_ceo_coffee_sessions(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES vcx_members(id) ON DELETE CASCADE,
  message      text,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  reviewed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, applicant_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coffee_sessions_status_date
  ON vcx_ceo_coffee_sessions (status, session_date);

CREATE INDEX IF NOT EXISTS idx_coffee_applications_session_status
  ON vcx_coffee_applications (session_id, status);

-- updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_coffee_sessions_updated_at'
  ) THEN
    CREATE TRIGGER trg_coffee_sessions_updated_at
      BEFORE UPDATE ON vcx_ceo_coffee_sessions
      FOR EACH ROW EXECUTE FUNCTION vcx_update_updated_at();
  END IF;
END
$$;

-- RLS
ALTER TABLE vcx_ceo_coffee_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_coffee_applications  ENABLE ROW LEVEL SECURITY;

-- Sessions: any authenticated member can read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vcx_ceo_coffee_sessions' AND policyname = 'coffee_sessions_select'
  ) THEN
    CREATE POLICY "coffee_sessions_select"
      ON vcx_ceo_coffee_sessions FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- Sessions: only CEO/Founder corporate users can insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vcx_ceo_coffee_sessions' AND policyname = 'coffee_sessions_insert'
  ) THEN
    CREATE POLICY "coffee_sessions_insert"
      ON vcx_ceo_coffee_sessions FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM vcx_corporate_users
          WHERE id = host_id
            AND id = auth.uid()
            AND role IN ('ceo', 'founder')
        )
      );
  END IF;
END
$$;

-- Sessions: only host can update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vcx_ceo_coffee_sessions' AND policyname = 'coffee_sessions_update'
  ) THEN
    CREATE POLICY "coffee_sessions_update"
      ON vcx_ceo_coffee_sessions FOR UPDATE
      TO authenticated
      USING (host_id = auth.uid())
      WITH CHECK (host_id = auth.uid());
  END IF;
END
$$;

-- Applications: applicant sees own OR host sees all for their sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vcx_coffee_applications' AND policyname = 'coffee_applications_select'
  ) THEN
    CREATE POLICY "coffee_applications_select"
      ON vcx_coffee_applications FOR SELECT
      TO authenticated
      USING (
        applicant_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM vcx_ceo_coffee_sessions s
          WHERE s.id = session_id AND s.host_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- Applications: members can insert their own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vcx_coffee_applications' AND policyname = 'coffee_applications_insert'
  ) THEN
    CREATE POLICY "coffee_applications_insert"
      ON vcx_coffee_applications FOR INSERT
      TO authenticated
      WITH CHECK (applicant_id = auth.uid());
  END IF;
END
$$;

-- Applications: host can update (accept/reject)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vcx_coffee_applications' AND policyname = 'coffee_applications_update'
  ) THEN
    CREATE POLICY "coffee_applications_update"
      ON vcx_coffee_applications FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM vcx_ceo_coffee_sessions s
          WHERE s.id = session_id AND s.host_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- SECURITY DEFINER helper: safe application count (no RLS leakage)
CREATE OR REPLACE FUNCTION vcx_coffee_application_count(p_session_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*) FROM vcx_coffee_applications WHERE session_id = p_session_id;
$$;


-- =============================================================================
-- MIGRATION 007 — vcx_position_board
-- Position board: positions + position_interests tables with RLS
-- NOTE: The legacy positions table (if it existed) was renamed to positions_legacy
--       in the PRE-FLIGHT block above.
-- =============================================================================

CREATE TABLE IF NOT EXISTS positions (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name     text NOT NULL,
  title            text NOT NULL,
  team_size        text,
  role_description text NOT NULL,
  salary_range     text,
  status           text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  created_by       uuid REFERENCES auth.users(id),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS position_interests (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id   uuid REFERENCES positions(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id),
  interest_type text NOT NULL CHECK (interest_type IN ('interested', 'not_interested', 'bookmark')),
  created_at    timestamptz DEFAULT now(),
  UNIQUE(position_id, user_id)
);

-- updated_at trigger function for positions
CREATE OR REPLACE FUNCTION update_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'positions_updated_at'
  ) THEN
    CREATE TRIGGER positions_updated_at
      BEFORE UPDATE ON positions
      FOR EACH ROW EXECUTE FUNCTION update_positions_updated_at();
  END IF;
END
$$;

-- RLS
ALTER TABLE positions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_interests ENABLE ROW LEVEL SECURITY;

-- Members can read active positions (or their own drafts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'positions' AND policyname = 'Members can read active positions'
  ) THEN
    CREATE POLICY "Members can read active positions" ON positions
      FOR SELECT USING (status = 'active' OR auth.uid() = created_by);
  END IF;
END
$$;

-- Admin can manage positions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'positions' AND policyname = 'Admin can manage positions'
  ) THEN
    CREATE POLICY "Admin can manage positions" ON positions
      FOR ALL USING (
        EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
      );
  END IF;
END
$$;

-- Users can manage their own interests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'position_interests' AND policyname = 'Users can manage own interests'
  ) THEN
    CREATE POLICY "Users can manage own interests" ON position_interests
      FOR ALL USING (user_id = auth.uid());
  END IF;
END
$$;

-- Users can read interest counts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'position_interests' AND policyname = 'Users can read interests'
  ) THEN
    CREATE POLICY "Users can read interests" ON position_interests
      FOR SELECT USING (true);
  END IF;
END
$$;


-- =============================================================================
-- MIGRATION 008 — vcx_peer_coffeechat
-- Peer Coffee Chat tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS peer_coffee_chats (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id  uuid REFERENCES auth.users(id) NOT NULL,
  title      text NOT NULL,
  content    text NOT NULL,
  category   text DEFAULT 'general' CHECK (category IN ('general', 'career', 'hiring', 'mentoring')),
  status     text DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS peer_coffee_applications (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id      uuid REFERENCES peer_coffee_chats(id) ON DELETE CASCADE,
  applicant_id uuid REFERENCES auth.users(id) NOT NULL,
  message      text NOT NULL,
  status       text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at   timestamptz DEFAULT now(),
  UNIQUE(chat_id, applicant_id)
);

-- RLS
ALTER TABLE peer_coffee_chats        ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_coffee_applications ENABLE ROW LEVEL SECURITY;

-- 모든 멤버가 글 조회 가능
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'peer_coffee_chats' AND policyname = 'Members can read chats'
  ) THEN
    CREATE POLICY "Members can read chats" ON peer_coffee_chats
      FOR SELECT USING (true);
  END IF;
END
$$;

-- 작성자만 글 작성/수정/삭제
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'peer_coffee_chats' AND policyname = 'Authors can insert chats'
  ) THEN
    CREATE POLICY "Authors can insert chats" ON peer_coffee_chats
      FOR INSERT WITH CHECK (author_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'peer_coffee_chats' AND policyname = 'Authors can update own chats'
  ) THEN
    CREATE POLICY "Authors can update own chats" ON peer_coffee_chats
      FOR UPDATE USING (author_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'peer_coffee_chats' AND policyname = 'Authors can delete own chats'
  ) THEN
    CREATE POLICY "Authors can delete own chats" ON peer_coffee_chats
      FOR DELETE USING (author_id = auth.uid());
  END IF;
END
$$;

-- 멤버가 신청 가능
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'peer_coffee_applications' AND policyname = 'Members can apply'
  ) THEN
    CREATE POLICY "Members can apply" ON peer_coffee_applications
      FOR INSERT WITH CHECK (applicant_id = auth.uid());
  END IF;
END
$$;

-- 작성자만 신청 목록 열람, 본인 신청 본인만 열람
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'peer_coffee_applications' AND policyname = 'Authors can read applications'
  ) THEN
    CREATE POLICY "Authors can read applications" ON peer_coffee_applications
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM peer_coffee_chats WHERE id = chat_id AND author_id = auth.uid())
        OR applicant_id = auth.uid()
      );
  END IF;
END
$$;

-- 작성자만 수락/거절
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'peer_coffee_applications' AND policyname = 'Authors can update applications'
  ) THEN
    CREATE POLICY "Authors can update applications" ON peer_coffee_applications
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM peer_coffee_chats WHERE id = chat_id AND author_id = auth.uid())
      );
  END IF;
END
$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_peer_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'peer_coffee_chats_updated_at'
  ) THEN
    CREATE TRIGGER peer_coffee_chats_updated_at
      BEFORE UPDATE ON peer_coffee_chats
      FOR EACH ROW EXECUTE FUNCTION update_peer_chat_updated_at();
  END IF;
END
$$;


-- =============================================================================
-- MIGRATION 009 — vcx_community_board
-- Community Board: posts, comments, reports with RLS
-- =============================================================================

CREATE TABLE IF NOT EXISTS community_posts (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id    uuid REFERENCES auth.users(id) NOT NULL,
  category     text NOT NULL CHECK (category IN ('career', 'leadership', 'salary', 'burnout', 'productivity', 'company_review')),
  title        text NOT NULL,
  content      text NOT NULL,
  is_anonymous boolean DEFAULT false,
  status       text DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_comments (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id      uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id    uuid REFERENCES auth.users(id) NOT NULL,
  content      text NOT NULL,
  is_anonymous boolean DEFAULT false,
  status       text DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_reports (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid REFERENCES auth.users(id) NOT NULL,
  post_id     uuid REFERENCES community_posts(id),
  comment_id  uuid REFERENCES community_comments(id),
  reason      text NOT NULL,
  status      text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken')),
  created_at  timestamptz DEFAULT now()
);

-- updated_at trigger for community_posts
CREATE OR REPLACE FUNCTION update_community_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'community_posts_updated_at'
  ) THEN
    CREATE TRIGGER community_posts_updated_at
      BEFORE UPDATE ON community_posts
      FOR EACH ROW EXECUTE FUNCTION update_community_posts_updated_at();
  END IF;
END
$$;

-- RLS
ALTER TABLE community_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports  ENABLE ROW LEVEL SECURITY;

-- 멤버 글 조회
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_posts' AND policyname = 'Members can read active posts'
  ) THEN
    CREATE POLICY "Members can read active posts" ON community_posts
      FOR SELECT USING (status = 'active');
  END IF;
END
$$;

-- 작성자 관리 (FOR ALL — will be replaced in migration 010)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_posts' AND policyname = 'Authors can manage posts'
  ) THEN
    CREATE POLICY "Authors can manage posts" ON community_posts
      FOR ALL USING (author_id = auth.uid());
  END IF;
END
$$;

-- Admin 관리
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_posts' AND policyname = 'Admin can manage all posts'
  ) THEN
    CREATE POLICY "Admin can manage all posts" ON community_posts
      FOR ALL USING (
        EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
      );
  END IF;
END
$$;

-- 댓글 정책
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_comments' AND policyname = 'Members can read active comments'
  ) THEN
    CREATE POLICY "Members can read active comments" ON community_comments
      FOR SELECT USING (status = 'active');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_comments' AND policyname = 'Authors can manage comments'
  ) THEN
    CREATE POLICY "Authors can manage comments" ON community_comments
      FOR ALL USING (author_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_comments' AND policyname = 'Admin can manage all comments'
  ) THEN
    CREATE POLICY "Admin can manage all comments" ON community_comments
      FOR ALL USING (
        EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
      );
  END IF;
END
$$;

-- 신고
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_reports' AND policyname = 'Members can create reports'
  ) THEN
    CREATE POLICY "Members can create reports" ON community_reports
      FOR INSERT WITH CHECK (reporter_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_reports' AND policyname = 'Admin can read reports'
  ) THEN
    CREATE POLICY "Admin can read reports" ON community_reports
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
      );
  END IF;
END
$$;


-- =============================================================================
-- MIGRATION 010 — fix_rls_policies
-- Split FOR ALL policies into INSERT/UPDATE/DELETE to prevent SELECT leakage
-- =============================================================================

-- community_posts: replace FOR ALL with fine-grained policies
DROP POLICY IF EXISTS "Authors can manage posts" ON community_posts;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_posts' AND policyname = 'Authors can insert posts'
  ) THEN
    CREATE POLICY "Authors can insert posts" ON community_posts
      FOR INSERT WITH CHECK (author_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_posts' AND policyname = 'Authors can update own posts'
  ) THEN
    CREATE POLICY "Authors can update own posts" ON community_posts
      FOR UPDATE USING (author_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_posts' AND policyname = 'Authors can delete own posts'
  ) THEN
    CREATE POLICY "Authors can delete own posts" ON community_posts
      FOR DELETE USING (author_id = auth.uid());
  END IF;
END
$$;

-- community_comments: replace FOR ALL with fine-grained policies
DROP POLICY IF EXISTS "Authors can manage comments" ON community_comments;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_comments' AND policyname = 'Authors can insert comments'
  ) THEN
    CREATE POLICY "Authors can insert comments" ON community_comments
      FOR INSERT WITH CHECK (author_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_comments' AND policyname = 'Authors can update own comments'
  ) THEN
    CREATE POLICY "Authors can update own comments" ON community_comments
      FOR UPDATE USING (author_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_comments' AND policyname = 'Authors can delete own comments'
  ) THEN
    CREATE POLICY "Authors can delete own comments" ON community_comments
      FOR DELETE USING (author_id = auth.uid());
  END IF;
END
$$;

-- positions: refine SELECT to also allow admins to see non-active rows
DROP POLICY IF EXISTS "Members can read active positions" ON positions;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'positions' AND policyname = 'Members can read active positions'
  ) THEN
    CREATE POLICY "Members can read active positions" ON positions
      FOR SELECT USING (
        status = 'active'
        OR EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
      );
  END IF;
END
$$;


-- =============================================================================
-- MIGRATION 011 — vcx_notifications
-- Notifications table
-- =============================================================================

CREATE TABLE IF NOT EXISTS vcx_notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text NOT NULL,
  body       text,
  link       text,
  is_read    boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vcx_notifications_user_unread
  ON vcx_notifications(user_id, is_read) WHERE is_read = false;

-- RLS
ALTER TABLE vcx_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vcx_notifications' AND policyname = 'Users can read own notifications'
  ) THEN
    CREATE POLICY "Users can read own notifications" ON vcx_notifications
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vcx_notifications' AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications" ON vcx_notifications
      FOR UPDATE USING (user_id = auth.uid());
  END IF;
END
$$;


-- =============================================================================
-- MIGRATION 012 — vcx_ddl_protection
-- INTENTIONALLY SKIPPED: DDL protection event trigger would block the
-- subsequent CREATE TABLE / ALTER TABLE statements in this script.
-- Apply 012_vcx_ddl_protection.sql separately after all other migrations.
-- =============================================================================


-- =============================================================================
-- MIGRATION 013-A — vcx_head_hunting_agreement
-- Add agreement_accepted_at to CEO coffee sessions
-- =============================================================================

ALTER TABLE vcx_ceo_coffee_sessions
  ADD COLUMN IF NOT EXISTS agreement_accepted_at TIMESTAMPTZ;


-- =============================================================================
-- MIGRATION 013-B — vcx_notifications_insert_policy
-- Deny authenticated role from inserting notifications (defense-in-depth)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vcx_notifications' AND policyname = 'Users cannot insert notifications'
  ) THEN
    CREATE POLICY "Users cannot insert notifications" ON vcx_notifications
      FOR INSERT TO authenticated
      WITH CHECK (false);
  END IF;
END
$$;


-- =============================================================================
-- MIGRATION 014-A — vcx_community_reactions
-- Community reactions (likes) on posts
-- =============================================================================

CREATE TABLE IF NOT EXISTS vcx_community_reactions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id       UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at    TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT vcx_community_reactions_unique UNIQUE (post_id, user_id, reaction_type)
);

-- RLS
ALTER TABLE vcx_community_reactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vcx_community_reactions' AND policyname = 'Authenticated users can read reactions'
  ) THEN
    CREATE POLICY "Authenticated users can read reactions" ON vcx_community_reactions
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vcx_community_reactions' AND policyname = 'Users can insert own reactions'
  ) THEN
    CREATE POLICY "Users can insert own reactions" ON vcx_community_reactions
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vcx_community_reactions' AND policyname = 'Users can delete own reactions'
  ) THEN
    CREATE POLICY "Users can delete own reactions" ON vcx_community_reactions
      FOR DELETE USING (user_id = auth.uid());
  END IF;
END
$$;


-- =============================================================================
-- MIGRATION 014-B — vcx_profile_visibility
-- Ensure profile_visibility column exists with correct NOT NULL constraint
-- (idempotent — no-op if column already exists from migration 005)
-- =============================================================================

ALTER TABLE vcx_members
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT
    NOT NULL DEFAULT 'members_only'
    CHECK (profile_visibility IN ('members_only', 'corporate_only', 'all'));


-- =============================================================================
-- MIGRATION 015 — vcx_privacy_model
-- Helper function + safe view for company_review author masking
-- =============================================================================

CREATE OR REPLACE FUNCTION vcx_is_corporate_user(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM vcx_corporate_users WHERE id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- View: mask author_id for corporate users viewing company_review posts
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


-- =============================================================================
-- MIGRATION 016 — vcx_fee_tracking
-- Hiring records: fee + Self Introduction Reward tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS vcx_hiring_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coffeechat_type   TEXT NOT NULL CHECK (coffeechat_type IN ('ceo', 'peer')),
  coffeechat_id     UUID,
  candidate_id      UUID REFERENCES vcx_members(id) ON DELETE SET NULL,
  company_id        UUID REFERENCES vcx_corporate_users(id) ON DELETE SET NULL,
  introducer_id     UUID REFERENCES vcx_members(id) ON DELETE SET NULL,
  position_title    TEXT NOT NULL,
  annual_salary     BIGINT NOT NULL CHECK (annual_salary > 0),
  fee_percentage    NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (fee_percentage >= 0 AND fee_percentage <= 100),
  fee_amount        BIGINT NOT NULL CHECK (fee_amount >= 0),
  reward_percentage NUMERIC(5,2) NOT NULL DEFAULT 1.00 CHECK (reward_percentage >= 0 AND reward_percentage <= 100),
  reward_amount     BIGINT NOT NULL CHECK (reward_amount >= 0),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
  confirmed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE vcx_hiring_records ENABLE ROW LEVEL SECURITY;

-- Admin: 전체 CRUD
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vcx_hiring_records' AND policyname = 'Admin full access on hiring_records'
  ) THEN
    CREATE POLICY "Admin full access on hiring_records"
      ON vcx_hiring_records
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM vcx_members
          WHERE id = auth.uid() AND system_role IN ('admin', 'super_admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM vcx_members
          WHERE id = auth.uid() AND system_role IN ('admin', 'super_admin')
        )
      );
  END IF;
END
$$;

-- 후보자: 본인 레코드 SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vcx_hiring_records' AND policyname = 'Candidate can read own hiring record'
  ) THEN
    CREATE POLICY "Candidate can read own hiring record"
      ON vcx_hiring_records
      FOR SELECT TO authenticated
      USING (candidate_id = auth.uid());
  END IF;
END
$$;

-- 소개자: 본인 레코드 SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vcx_hiring_records' AND policyname = 'Introducer can read own hiring record'
  ) THEN
    CREATE POLICY "Introducer can read own hiring record"
      ON vcx_hiring_records
      FOR SELECT TO authenticated
      USING (introducer_id = auth.uid());
  END IF;
END
$$;

-- 기업: 본인 레코드 SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vcx_hiring_records' AND policyname = 'Company can read own hiring record'
  ) THEN
    CREATE POLICY "Company can read own hiring record"
      ON vcx_hiring_records
      FOR SELECT TO authenticated
      USING (company_id = auth.uid());
  END IF;
END
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hiring_records_candidate_id ON vcx_hiring_records(candidate_id);
CREATE INDEX IF NOT EXISTS idx_hiring_records_company_id   ON vcx_hiring_records(company_id);
CREATE INDEX IF NOT EXISTS idx_hiring_records_status       ON vcx_hiring_records(status);
CREATE INDEX IF NOT EXISTS idx_hiring_records_created_at   ON vcx_hiring_records(created_at DESC);


-- =============================================================================
-- MIGRATION 017 — vcx_community_counts
-- Denormalized count columns + auto-update triggers on community_posts
-- =============================================================================

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS likes_count    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count integer NOT NULL DEFAULT 0;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_category      ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_status        ON community_posts(status);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id    ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_post_id   ON vcx_community_reactions(post_id);

-- Backfill existing counts
UPDATE community_posts p
SET comments_count = (
  SELECT count(*) FROM community_comments c
  WHERE c.post_id = p.id AND c.status = 'active'
);

UPDATE community_posts p
SET likes_count = (
  SELECT count(*) FROM vcx_community_reactions r
  WHERE r.post_id = p.id
);

-- Trigger: auto-update comments_count on INSERT/DELETE to community_comments
CREATE OR REPLACE FUNCTION vcx_update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_community_comments_count ON community_comments;
CREATE TRIGGER trg_community_comments_count
  AFTER INSERT OR DELETE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION vcx_update_comments_count();

-- Trigger: auto-update likes_count on INSERT/DELETE to vcx_community_reactions
CREATE OR REPLACE FUNCTION vcx_update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_community_reactions_count ON vcx_community_reactions;
CREATE TRIGGER trg_community_reactions_count
  AFTER INSERT OR DELETE ON vcx_community_reactions
  FOR EACH ROW EXECUTE FUNCTION vcx_update_likes_count();


-- =============================================================================
-- MIGRATION 018 — vcx_positions_extension
-- Extend positions table with matching + detail fields
-- =============================================================================

ALTER TABLE positions ADD COLUMN IF NOT EXISTS requirements    text[] DEFAULT '{}';
ALTER TABLE positions ADD COLUMN IF NOT EXISTS benefits        text[] DEFAULT '{}';
ALTER TABLE positions ADD COLUMN IF NOT EXISTS required_fields text[] DEFAULT '{}';
ALTER TABLE positions ADD COLUMN IF NOT EXISTS min_experience  integer DEFAULT 0;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS location        text;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_positions_status              ON positions(status);
CREATE INDEX IF NOT EXISTS idx_position_interests_position_id ON position_interests(position_id);


-- =============================================================================
-- MIGRATION 019 — vcx_fix_get_user_info
-- RPC: member + corporate info in a single call (v2 — adds profile completeness fields)
-- =============================================================================

CREATE OR REPLACE FUNCTION vcx_get_user_info(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'member', (
      SELECT json_build_object(
        'system_role',     m.system_role,
        'member_tier',     m.member_tier,
        'is_active',       m.is_active,
        'name',            m.name,
        'current_company', m.current_company,
        'title',           m.title,
        'linkedin_url',    m.linkedin_url
      )
      FROM vcx_members m
      WHERE m.id = p_user_id AND m.is_active = true
    ),
    'corporate', (
      SELECT json_build_object('role', c.role)
      FROM vcx_corporate_users c
      WHERE c.id = p_user_id
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public, pg_temp;


-- =============================================================================
-- END OF COMBINED MIGRATIONS
-- Reminder: apply 012_vcx_ddl_protection.sql separately as a final step.
-- =============================================================================
