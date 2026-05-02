-- 025_vcx_peer_coffeechat_brief_feedback.sql
-- Sprint 3: Peer Coffee Chat AI Brief fallback + post-session feedback

ALTER TABLE peer_coffee_applications
  ADD COLUMN IF NOT EXISTS host_brief text,
  ADD COLUMN IF NOT EXISTS applicant_brief text,
  ADD COLUMN IF NOT EXISTS brief_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS brief_error text;

CREATE TABLE IF NOT EXISTS peer_coffeechat_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES peer_coffee_chats(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES peer_coffee_applications(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_role text NOT NULL CHECK (reviewer_role IN ('host', 'applicant')),
  overall_rating int NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  would_connect_again boolean,
  feedback_tags text[] NOT NULL DEFAULT '{}',
  comment text,
  brief_helpful boolean,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(application_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_peer_coffeechat_feedback_chat_id
  ON peer_coffeechat_feedback(chat_id);

CREATE INDEX IF NOT EXISTS idx_peer_coffeechat_feedback_reviewer_id
  ON peer_coffeechat_feedback(reviewer_id);

ALTER TABLE peer_coffeechat_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "peer_feedback_insert_own"
  ON peer_coffeechat_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "peer_feedback_select_participant_or_admin"
  ON peer_coffeechat_feedback
  FOR SELECT
  TO authenticated
  USING (
    reviewer_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM peer_coffee_chats c
      WHERE c.id = chat_id
        AND c.author_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM vcx_members m
      WHERE m.id = auth.uid()
        AND m.system_role IN ('admin', 'super_admin')
    )
  );
