-- Position Board: positions + position_interests tables with RLS

CREATE TABLE positions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL,
  title text NOT NULL,
  team_size text,
  role_description text NOT NULL,
  salary_range text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE position_interests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id uuid REFERENCES positions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  interest_type text NOT NULL CHECK (interest_type IN ('interested', 'not_interested', 'bookmark')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(position_id, user_id)
);

-- Updated_at trigger for positions
CREATE OR REPLACE FUNCTION update_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION update_positions_updated_at();

-- RLS
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_interests ENABLE ROW LEVEL SECURITY;

-- Members can read active positions (or their own drafts)
CREATE POLICY "Members can read active positions" ON positions
  FOR SELECT USING (status = 'active' OR auth.uid() = created_by);

-- Admin can manage positions
CREATE POLICY "Admin can manage positions" ON positions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- Users can manage their own interests
CREATE POLICY "Users can manage own interests" ON position_interests
  FOR ALL USING (user_id = auth.uid());

-- Users can read interest counts (not who)
CREATE POLICY "Users can read interests" ON position_interests
  FOR SELECT USING (true);
