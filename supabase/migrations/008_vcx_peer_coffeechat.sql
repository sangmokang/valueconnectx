-- Peer Coffee Chat tables

CREATE TABLE peer_coffee_chats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general' CHECK (category IN ('general', 'career', 'hiring', 'mentoring')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE peer_coffee_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id uuid REFERENCES peer_coffee_chats(id) ON DELETE CASCADE,
  applicant_id uuid REFERENCES auth.users(id) NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(chat_id, applicant_id)
);

-- RLS
ALTER TABLE peer_coffee_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_coffee_applications ENABLE ROW LEVEL SECURITY;

-- 모든 멤버가 글 조회 가능
CREATE POLICY "Members can read chats" ON peer_coffee_chats
  FOR SELECT USING (true);

-- 작성자만 글 작성/수정/삭제
CREATE POLICY "Authors can insert chats" ON peer_coffee_chats
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own chats" ON peer_coffee_chats
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own chats" ON peer_coffee_chats
  FOR DELETE USING (author_id = auth.uid());

-- 멤버가 신청 가능
CREATE POLICY "Members can apply" ON peer_coffee_applications
  FOR INSERT WITH CHECK (applicant_id = auth.uid());

-- 작성자만 신청 목록 열람 (비밀), 본인 신청 본인만 열람
CREATE POLICY "Authors can read applications" ON peer_coffee_applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM peer_coffee_chats WHERE id = chat_id AND author_id = auth.uid())
    OR applicant_id = auth.uid()
  );

-- 작성자만 수락/거절
CREATE POLICY "Authors can update applications" ON peer_coffee_applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM peer_coffee_chats WHERE id = chat_id AND author_id = auth.uid())
  );

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_peer_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER peer_coffee_chats_updated_at
  BEFORE UPDATE ON peer_coffee_chats
  FOR EACH ROW EXECUTE FUNCTION update_peer_chat_updated_at();
