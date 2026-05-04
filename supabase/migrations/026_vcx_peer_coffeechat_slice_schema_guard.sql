-- 026_vcx_peer_coffeechat_slice_schema_guard.sql
-- Phase 1 S4/S5 schema guard for environments that missed earlier peer coffeechat migrations.

CREATE TABLE IF NOT EXISTS peer_coffee_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'career', 'hiring', 'mentoring')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS peer_coffee_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES peer_coffee_chats(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chat_id, applicant_id)
);

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
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(application_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_peer_coffee_chats_status_created
  ON peer_coffee_chats(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_peer_coffee_applications_chat_status
  ON peer_coffee_applications(chat_id, status);

CREATE INDEX IF NOT EXISTS idx_peer_coffee_applications_applicant
  ON peer_coffee_applications(applicant_id);

CREATE INDEX IF NOT EXISTS idx_peer_coffeechat_feedback_chat_id
  ON peer_coffeechat_feedback(chat_id);

CREATE INDEX IF NOT EXISTS idx_peer_coffeechat_feedback_reviewer_id
  ON peer_coffeechat_feedback(reviewer_id);

ALTER TABLE peer_coffee_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_coffee_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_coffeechat_feedback ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION update_peer_chat_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'peer_coffee_chats_updated_at'
  ) THEN
    CREATE TRIGGER peer_coffee_chats_updated_at
      BEFORE UPDATE ON peer_coffee_chats
      FOR EACH ROW EXECUTE FUNCTION update_peer_chat_updated_at();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'peer_coffee_chats'
      AND policyname = 'Members can read chats'
  ) THEN
    CREATE POLICY "Members can read chats"
      ON peer_coffee_chats
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'peer_coffee_chats'
      AND policyname = 'Authors can insert chats'
  ) THEN
    CREATE POLICY "Authors can insert chats"
      ON peer_coffee_chats
      FOR INSERT
      TO authenticated
      WITH CHECK (author_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'peer_coffee_chats'
      AND policyname = 'Authors can update own chats'
  ) THEN
    CREATE POLICY "Authors can update own chats"
      ON peer_coffee_chats
      FOR UPDATE
      TO authenticated
      USING (author_id = auth.uid())
      WITH CHECK (author_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'peer_coffee_chats'
      AND policyname = 'Authors can delete own chats'
  ) THEN
    CREATE POLICY "Authors can delete own chats"
      ON peer_coffee_chats
      FOR DELETE
      TO authenticated
      USING (author_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'peer_coffee_applications'
      AND policyname = 'Members can apply'
  ) THEN
    CREATE POLICY "Members can apply"
      ON peer_coffee_applications
      FOR INSERT
      TO authenticated
      WITH CHECK (applicant_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'peer_coffee_applications'
      AND policyname = 'Authors can read applications'
  ) THEN
    CREATE POLICY "Authors can read applications"
      ON peer_coffee_applications
      FOR SELECT
      TO authenticated
      USING (
        applicant_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM peer_coffee_chats
          WHERE id = chat_id
            AND author_id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'peer_coffee_applications'
      AND policyname = 'Authors can update applications'
  ) THEN
    CREATE POLICY "Authors can update applications"
      ON peer_coffee_applications
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM peer_coffee_chats
          WHERE id = chat_id
            AND author_id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'peer_coffeechat_feedback'
      AND policyname = 'peer_feedback_insert_own'
  ) THEN
    CREATE POLICY "peer_feedback_insert_own"
      ON peer_coffeechat_feedback
      FOR INSERT
      TO authenticated
      WITH CHECK (reviewer_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'peer_coffeechat_feedback'
      AND policyname = 'peer_feedback_select_participant_or_admin'
  ) THEN
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
  END IF;
END
$$;
