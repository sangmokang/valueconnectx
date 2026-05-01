-- B2B Recruiter Intelligence: 기업 JD, 후보자 이력서, 시장 채용 시그널, 매칭 결과 저장

CREATE TABLE IF NOT EXISTS vcx_company_jds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_user_id UUID REFERENCES vcx_corporate_users(id) ON DELETE SET NULL,
  company_name    TEXT NOT NULL,
  title           TEXT NOT NULL,
  domain_sector   TEXT NOT NULL,
  seniority       TEXT,
  jd_text         TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  preferred_skills TEXT[] NOT NULL DEFAULT '{}',
  source_type     TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('manual', 'desktop', 'gdrive', 'supabase', 'sqlite')),
  source_uri      TEXT,
  status          TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'archived')),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vcx_candidate_resumes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id           UUID REFERENCES vcx_members(id) ON DELETE SET NULL,
  candidate_name      TEXT,
  candidate_email     TEXT,
  current_title       TEXT,
  years_of_experience INTEGER CHECK (years_of_experience IS NULL OR years_of_experience >= 0),
  domain_sectors      TEXT[] NOT NULL DEFAULT '{}',
  skills              TEXT[] NOT NULL DEFAULT '{}',
  resume_text         TEXT NOT NULL,
  source_type         TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('manual', 'desktop', 'gdrive', 'supabase', 'sqlite')),
  source_uri          TEXT,
  consent_status      TEXT NOT NULL DEFAULT 'internal_review'
    CHECK (consent_status IN ('internal_review', 'candidate_consented', 'expired')),
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vcx_b2b_market_job_signals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id    TEXT,
  source         TEXT NOT NULL DEFAULT 'manual',
  company_name   TEXT NOT NULL,
  title          TEXT NOT NULL,
  domain_sector  TEXT,
  function_tags  TEXT[] NOT NULL DEFAULT '{}',
  seniority      TEXT,
  location       TEXT,
  salary_band    TEXT,
  jd_text        TEXT,
  url            TEXT,
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source, external_id)
);

CREATE TABLE IF NOT EXISTS vcx_b2b_match_runs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jd_id                 UUID REFERENCES vcx_company_jds(id) ON DELETE SET NULL,
  resume_id             UUID REFERENCES vcx_candidate_resumes(id) ON DELETE SET NULL,
  overall_score         INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  jd_fit_percentile     INTEGER NOT NULL CHECK (jd_fit_percentile BETWEEN 0 AND 100),
  market_percentile     INTEGER NOT NULL CHECK (market_percentile BETWEEN 0 AND 100),
  structure_score       INTEGER NOT NULL CHECK (structure_score BETWEEN 0 AND 100),
  ai_written_likelihood INTEGER NOT NULL CHECK (ai_written_likelihood BETWEEN 0 AND 100),
  verdict               TEXT NOT NULL,
  reasons               JSONB NOT NULL DEFAULT '[]'::jsonb,
  risks                 JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE vcx_company_jds ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_candidate_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_b2b_market_job_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_b2b_match_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vcx_company_jds_admin_all"
  ON vcx_company_jds
  FOR ALL
  TO authenticated
  USING (vcx_is_admin(auth.uid()))
  WITH CHECK (vcx_is_admin(auth.uid()));

CREATE POLICY "vcx_company_jds_corporate_own_select"
  ON vcx_company_jds
  FOR SELECT
  TO authenticated
  USING (corporate_user_id = auth.uid());

CREATE POLICY "vcx_company_jds_corporate_own_insert"
  ON vcx_company_jds
  FOR INSERT
  TO authenticated
  WITH CHECK (corporate_user_id = auth.uid());

CREATE POLICY "vcx_candidate_resumes_admin_all"
  ON vcx_candidate_resumes
  FOR ALL
  TO authenticated
  USING (vcx_is_admin(auth.uid()))
  WITH CHECK (vcx_is_admin(auth.uid()));

CREATE POLICY "vcx_b2b_market_job_signals_admin_all"
  ON vcx_b2b_market_job_signals
  FOR ALL
  TO authenticated
  USING (vcx_is_admin(auth.uid()))
  WITH CHECK (vcx_is_admin(auth.uid()));

CREATE POLICY "vcx_b2b_market_job_signals_member_select"
  ON vcx_b2b_market_job_signals
  FOR SELECT
  TO authenticated
  USING (vcx_is_member(auth.uid()));

CREATE POLICY "vcx_b2b_match_runs_admin_all"
  ON vcx_b2b_match_runs
  FOR ALL
  TO authenticated
  USING (vcx_is_admin(auth.uid()))
  WITH CHECK (vcx_is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_vcx_company_jds_corporate_user
  ON vcx_company_jds(corporate_user_id);

CREATE INDEX IF NOT EXISTS idx_vcx_company_jds_sector_status
  ON vcx_company_jds(domain_sector, status);

CREATE INDEX IF NOT EXISTS idx_vcx_candidate_resumes_member
  ON vcx_candidate_resumes(member_id);

CREATE INDEX IF NOT EXISTS idx_vcx_b2b_market_job_signals_sector
  ON vcx_b2b_market_job_signals(domain_sector);

CREATE INDEX IF NOT EXISTS idx_vcx_b2b_match_runs_jd
  ON vcx_b2b_match_runs(jd_id, created_at DESC);

CREATE OR REPLACE FUNCTION update_b2b_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vcx_company_jds_updated_at
  BEFORE UPDATE ON vcx_company_jds
  FOR EACH ROW EXECUTE FUNCTION update_b2b_intelligence_updated_at();

CREATE TRIGGER vcx_candidate_resumes_updated_at
  BEFORE UPDATE ON vcx_candidate_resumes
  FOR EACH ROW EXECUTE FUNCTION update_b2b_intelligence_updated_at();
