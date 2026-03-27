-- Add directory columns to vcx_members
ALTER TABLE vcx_members ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE vcx_members ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE vcx_members ADD COLUMN IF NOT EXISTS is_open_to_chat boolean DEFAULT false;
ALTER TABLE vcx_members ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'members_only'
  CHECK (profile_visibility IN ('members_only', 'corporate_only', 'all'));

-- Search optimization indexes
CREATE INDEX IF NOT EXISTS idx_vcx_members_directory
  ON vcx_members(is_active, member_tier, industry, professional_fields);

-- Full-text search generated column + GIN index
ALTER TABLE vcx_members ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(current_company,'') || ' ' || coalesce(bio,''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_vcx_members_search
  ON vcx_members USING gin(fts);
