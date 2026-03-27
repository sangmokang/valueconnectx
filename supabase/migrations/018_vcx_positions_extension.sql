-- Extend positions table with additional fields for matching and detailed info

ALTER TABLE positions ADD COLUMN IF NOT EXISTS requirements text[] DEFAULT '{}';
ALTER TABLE positions ADD COLUMN IF NOT EXISTS benefits text[] DEFAULT '{}';
ALTER TABLE positions ADD COLUMN IF NOT EXISTS required_fields text[] DEFAULT '{}';
ALTER TABLE positions ADD COLUMN IF NOT EXISTS min_experience integer DEFAULT 0;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS location text;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_position_interests_position_id ON position_interests(position_id);
