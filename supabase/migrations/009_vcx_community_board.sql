-- Community Board: posts, comments, reports with RLS

CREATE TABLE community_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid REFERENCES auth.users(id) NOT NULL,
  category text NOT NULL CHECK (category IN ('career', 'leadership', 'salary', 'burnout', 'productivity', 'company_review')),
  title text NOT NULL,
  content text NOT NULL,
  is_anonymous boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE community_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) NOT NULL,
  content text NOT NULL,
  is_anonymous boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE community_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid REFERENCES auth.users(id) NOT NULL,
  post_id uuid REFERENCES community_posts(id),
  comment_id uuid REFERENCES community_comments(id),
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken')),
  created_at timestamptz DEFAULT now()
);

-- updated_at trigger for community_posts
CREATE OR REPLACE FUNCTION update_community_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_community_posts_updated_at();

-- RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

-- 멤버 글 조회
CREATE POLICY "Members can read active posts" ON community_posts
  FOR SELECT USING (status = 'active');

-- 작성자 관리
CREATE POLICY "Authors can manage posts" ON community_posts
  FOR ALL USING (author_id = auth.uid());

-- Admin 관리
CREATE POLICY "Admin can manage all posts" ON community_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- 댓글 정책
CREATE POLICY "Members can read active comments" ON community_comments
  FOR SELECT USING (status = 'active');

CREATE POLICY "Authors can manage comments" ON community_comments
  FOR ALL USING (author_id = auth.uid());

CREATE POLICY "Admin can manage all comments" ON community_comments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- 신고
CREATE POLICY "Members can create reports" ON community_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admin can read reports" ON community_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );
