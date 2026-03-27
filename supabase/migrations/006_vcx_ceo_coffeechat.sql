-- CEO Coffee Chat Board
-- Tables: vcx_ceo_coffee_sessions, vcx_coffee_applications

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

-- Updated_at trigger
CREATE TRIGGER trg_coffee_sessions_updated_at
  BEFORE UPDATE ON vcx_ceo_coffee_sessions
  FOR EACH ROW EXECUTE FUNCTION vcx_update_updated_at();

-- RLS
ALTER TABLE vcx_ceo_coffee_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_coffee_applications  ENABLE ROW LEVEL SECURITY;

-- Sessions: any authenticated member can read
CREATE POLICY "coffee_sessions_select"
  ON vcx_ceo_coffee_sessions FOR SELECT
  TO authenticated
  USING (true);

-- Sessions: only CEO/Founder corporate users can insert
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

-- Sessions: only host can update
CREATE POLICY "coffee_sessions_update"
  ON vcx_ceo_coffee_sessions FOR UPDATE
  TO authenticated
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- Applications: applicant sees own OR host sees all for their sessions
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

-- Applications: members can insert their own
CREATE POLICY "coffee_applications_insert"
  ON vcx_coffee_applications FOR INSERT
  TO authenticated
  WITH CHECK (applicant_id = auth.uid());

-- Applications: host can update (accept/reject)
CREATE POLICY "coffee_applications_update"
  ON vcx_coffee_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vcx_ceo_coffee_sessions s
      WHERE s.id = session_id AND s.host_id = auth.uid()
    )
  );

-- SECURITY DEFINER function: safe application count (no RLS leakage)
CREATE OR REPLACE FUNCTION vcx_coffee_application_count(p_session_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*) FROM vcx_coffee_applications WHERE session_id = p_session_id;
$$;
