-- Community Reactions: likes and other reactions on posts

CREATE TABLE vcx_community_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT vcx_community_reactions_unique UNIQUE (post_id, user_id, reaction_type)
);

-- RLS
ALTER TABLE vcx_community_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reactions" ON vcx_community_reactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own reactions" ON vcx_community_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reactions" ON vcx_community_reactions
  FOR DELETE USING (user_id = auth.uid());
