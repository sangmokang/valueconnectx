-- ValueConnect X SQLite dev mirror
-- Supabase/Postgres가 불가할 때 로컬 SQL 개발과 핵심 데이터 흐름 검증에 사용한다.
-- 주의: RLS, Supabase Auth, SECURITY DEFINER RPC는 재현하지 않는다.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vcx_members (
  id TEXT PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  current_company TEXT,
  title TEXT,
  professional_fields TEXT NOT NULL DEFAULT '[]',
  years_of_experience INTEGER,
  bio TEXT,
  linkedin_url TEXT,
  member_tier TEXT NOT NULL CHECK (member_tier IN ('core', 'endorsed')),
  system_role TEXT NOT NULL DEFAULT 'member' CHECK (system_role IN ('super_admin', 'admin', 'member')),
  join_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  endorsed_by TEXT REFERENCES vcx_members(id),
  endorsed_by_name TEXT,
  avatar_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  industry TEXT,
  location TEXT,
  is_open_to_chat INTEGER NOT NULL DEFAULT 0 CHECK (is_open_to_chat IN (0, 1)),
  profile_visibility TEXT NOT NULL DEFAULT 'members_only'
    CHECK (profile_visibility IN ('public', 'members_only', 'private')),
  fts TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vcx_members_directory
  ON vcx_members(is_active, member_tier, industry, professional_fields);

CREATE TABLE IF NOT EXISTS vcx_corporate_users (
  id TEXT PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ceo', 'founder', 'c_level', 'hr_leader')),
  title TEXT,
  is_verified INTEGER NOT NULL DEFAULT 0 CHECK (is_verified IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vcx_recommendations (
  id TEXT PRIMARY KEY,
  recommender_id TEXT NOT NULL REFERENCES vcx_members(id),
  recommended_email TEXT NOT NULL,
  recommended_name TEXT NOT NULL,
  reason TEXT,
  member_tier TEXT NOT NULL CHECK (member_tier IN ('core', 'endorsed')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT REFERENCES vcx_members(id),
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vcx_recommendations_pending_email
  ON vcx_recommendations(recommended_email) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS vcx_invites (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  invited_by TEXT NOT NULL REFERENCES auth_users(id),
  invited_by_name TEXT NOT NULL,
  member_tier TEXT NOT NULL CHECK (member_tier IN ('core', 'endorsed')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  recommendation_id TEXT REFERENCES vcx_recommendations(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vcx_invites_token_hash ON vcx_invites(token_hash);
CREATE INDEX IF NOT EXISTS idx_vcx_invites_email ON vcx_invites(email);

CREATE TABLE IF NOT EXISTS vcx_ceo_coffee_sessions (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL REFERENCES vcx_corporate_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  session_date TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_participants INTEGER NOT NULL DEFAULT 5,
  location_type TEXT NOT NULL CHECK (location_type IN ('online', 'offline', 'hybrid')),
  location_detail TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed', 'cancelled')),
  target_tier TEXT CHECK (target_tier IN ('core', 'endorsed', 'all')),
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vcx_coffee_applications (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES vcx_ceo_coffee_sessions(id) ON DELETE CASCADE,
  applicant_id TEXT NOT NULL REFERENCES vcx_members(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (session_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_coffee_sessions_status_date
  ON vcx_ceo_coffee_sessions (status, session_date);
CREATE INDEX IF NOT EXISTS idx_coffee_applications_session_status
  ON vcx_coffee_applications (session_id, status);

CREATE TABLE IF NOT EXISTS peer_coffee_chats (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES auth_users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'career', 'hiring', 'mentoring')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS peer_coffee_applications (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES peer_coffee_chats(id) ON DELETE CASCADE,
  applicant_id TEXT NOT NULL REFERENCES auth_users(id),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chat_id, applicant_id)
);

CREATE TABLE IF NOT EXISTS vcx_feed_items (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  company_tag TEXT,
  role TEXT NOT NULL,
  level TEXT,
  team_size TEXT,
  salary_band TEXT,
  location TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  summary TEXT,
  exclusive INTEGER NOT NULL DEFAULT 0 CHECK (exclusive IN (0, 1)),
  published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT REFERENCES auth_users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vcx_feed_interests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth_users(id),
  chips TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS vcx_feed_responses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth_users(id),
  feed_item_id TEXT NOT NULL REFERENCES vcx_feed_items(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('yes', 'skip')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, feed_item_id)
);

CREATE TABLE IF NOT EXISTS vcx_feed_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES auth_users(id),
  email TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vcx_newsletter_campaigns (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  preview_text TEXT,
  html_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sending','sent','archived')),
  sent_at TEXT,
  created_by TEXT REFERENCES auth_users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vcx_newsletter_recipients (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES vcx_newsletter_campaigns(id) ON DELETE CASCADE,
  subscription_id TEXT REFERENCES vcx_feed_subscriptions(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  send_token TEXT UNIQUE NOT NULL,
  sent_at TEXT,
  opened_at TEXT,
  first_clicked_at TEXT,
  unsubscribed_at TEXT,
  bounce_reason TEXT,
  UNIQUE (campaign_id, email)
);

CREATE INDEX IF NOT EXISTS vcx_newsletter_recipients_token_idx
  ON vcx_newsletter_recipients (send_token);
CREATE INDEX IF NOT EXISTS vcx_newsletter_recipients_campaign_idx
  ON vcx_newsletter_recipients (campaign_id);

CREATE TABLE IF NOT EXISTS vcx_newsletter_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_id TEXT NOT NULL REFERENCES vcx_newsletter_recipients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sent','open','click','unsubscribe','bounce','complaint')),
  url TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS vcx_newsletter_events_recipient_idx
  ON vcx_newsletter_events (recipient_id);

CREATE VIEW IF NOT EXISTS vcx_newsletter_recipient_tokens AS
  SELECT *
  FROM vcx_newsletter_recipients;

CREATE TABLE IF NOT EXISTS vcx_company_jds (
  id TEXT PRIMARY KEY,
  corporate_user_id TEXT REFERENCES vcx_corporate_users(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  title TEXT NOT NULL,
  domain_sector TEXT NOT NULL,
  seniority TEXT,
  jd_text TEXT NOT NULL,
  required_skills TEXT NOT NULL DEFAULT '[]',
  preferred_skills TEXT NOT NULL DEFAULT '[]',
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'desktop', 'gdrive', 'supabase', 'sqlite')),
  source_uri TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  created_by TEXT REFERENCES auth_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vcx_company_jds_sector_status
  ON vcx_company_jds(domain_sector, status);

CREATE TABLE IF NOT EXISTS vcx_candidate_resumes (
  id TEXT PRIMARY KEY,
  member_id TEXT REFERENCES vcx_members(id) ON DELETE SET NULL,
  candidate_name TEXT,
  candidate_email TEXT,
  current_title TEXT,
  years_of_experience INTEGER,
  domain_sectors TEXT NOT NULL DEFAULT '[]',
  skills TEXT NOT NULL DEFAULT '[]',
  resume_text TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'desktop', 'gdrive', 'supabase', 'sqlite')),
  source_uri TEXT,
  consent_status TEXT NOT NULL DEFAULT 'internal_review'
    CHECK (consent_status IN ('internal_review', 'candidate_consented', 'expired')),
  created_by TEXT REFERENCES auth_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vcx_b2b_market_job_signals (
  id TEXT PRIMARY KEY,
  external_id TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  company_name TEXT NOT NULL,
  title TEXT NOT NULL,
  domain_sector TEXT,
  function_tags TEXT NOT NULL DEFAULT '[]',
  seniority TEXT,
  location TEXT,
  salary_band TEXT,
  jd_text TEXT,
  url TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_vcx_b2b_market_job_signals_sector
  ON vcx_b2b_market_job_signals(domain_sector);

CREATE TABLE IF NOT EXISTS vcx_b2b_match_runs (
  id TEXT PRIMARY KEY,
  jd_id TEXT REFERENCES vcx_company_jds(id) ON DELETE SET NULL,
  resume_id TEXT REFERENCES vcx_candidate_resumes(id) ON DELETE SET NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  jd_fit_percentile INTEGER NOT NULL CHECK (jd_fit_percentile BETWEEN 0 AND 100),
  market_percentile INTEGER NOT NULL CHECK (market_percentile BETWEEN 0 AND 100),
  structure_score INTEGER NOT NULL CHECK (structure_score BETWEEN 0 AND 100),
  ai_written_likelihood INTEGER NOT NULL CHECK (ai_written_likelihood BETWEEN 0 AND 100),
  verdict TEXT NOT NULL,
  reasons TEXT NOT NULL DEFAULT '[]',
  risks TEXT NOT NULL DEFAULT '[]',
  created_by TEXT REFERENCES auth_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
