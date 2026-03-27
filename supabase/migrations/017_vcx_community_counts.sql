-- Community Board: Add denormalized count columns + indexes + auto-update triggers

-- 1. Add count columns
ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count integer NOT NULL DEFAULT 0;

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_status ON community_posts(status);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_post_id ON vcx_community_reactions(post_id);

-- 3. Backfill existing counts
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

-- 4. Trigger: auto-update comments_count on INSERT/DELETE to community_comments
CREATE OR REPLACE FUNCTION vcx_update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_community_comments_count ON community_comments;
CREATE TRIGGER trg_community_comments_count
  AFTER INSERT OR DELETE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION vcx_update_comments_count();

-- 5. Trigger: auto-update likes_count on INSERT/DELETE to vcx_community_reactions
CREATE OR REPLACE FUNCTION vcx_update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_community_reactions_count ON vcx_community_reactions;
CREATE TRIGGER trg_community_reactions_count
  AFTER INSERT OR DELETE ON vcx_community_reactions
  FOR EACH ROW EXECUTE FUNCTION vcx_update_likes_count();
