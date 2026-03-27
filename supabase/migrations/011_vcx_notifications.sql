-- Notifications table
CREATE TABLE IF NOT EXISTS vcx_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vcx_notifications_user_unread
  ON vcx_notifications(user_id, is_read) WHERE is_read = false;

-- RLS
ALTER TABLE vcx_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users can read own notifications" ON vcx_notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications" ON vcx_notifications
  FOR UPDATE USING (user_id = auth.uid());
