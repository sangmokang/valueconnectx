-- Fee Tracking: 채용 성사 시 수수료 및 Self Introduction Reward 추적
-- vcx_hiring_records 테이블

-- ============================================================
-- vcx_hiring_records 테이블
-- ============================================================
CREATE TABLE vcx_hiring_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coffeechat_type   TEXT NOT NULL CHECK (coffeechat_type IN ('ceo', 'peer')),
  coffeechat_id     UUID,
  candidate_id      UUID REFERENCES vcx_members(id) ON DELETE SET NULL,
  company_id        UUID REFERENCES vcx_corporate_users(id) ON DELETE SET NULL,
  introducer_id     UUID REFERENCES vcx_members(id) ON DELETE SET NULL,
  position_title    TEXT NOT NULL,
  annual_salary     BIGINT NOT NULL CHECK (annual_salary > 0),
  fee_percentage    NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (fee_percentage >= 0 AND fee_percentage <= 100),
  fee_amount        BIGINT NOT NULL CHECK (fee_amount >= 0),
  reward_percentage NUMERIC(5,2) NOT NULL DEFAULT 1.00 CHECK (reward_percentage >= 0 AND reward_percentage <= 100),
  reward_amount     BIGINT NOT NULL CHECK (reward_amount >= 0),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
  confirmed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS 활성화
-- ============================================================
ALTER TABLE vcx_hiring_records ENABLE ROW LEVEL SECURITY;

-- Admin: 전체 CRUD
CREATE POLICY "Admin full access on hiring_records"
  ON vcx_hiring_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vcx_members
      WHERE id = auth.uid()
        AND system_role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vcx_members
      WHERE id = auth.uid()
        AND system_role IN ('admin', 'super_admin')
    )
  );

-- 후보자(candidate): 본인 레코드 SELECT
CREATE POLICY "Candidate can read own hiring record"
  ON vcx_hiring_records
  FOR SELECT
  TO authenticated
  USING (candidate_id = auth.uid());

-- 소개자(introducer): 본인 레코드 SELECT
CREATE POLICY "Introducer can read own hiring record"
  ON vcx_hiring_records
  FOR SELECT
  TO authenticated
  USING (introducer_id = auth.uid());

-- 기업(company): 본인 레코드 SELECT
CREATE POLICY "Company can read own hiring record"
  ON vcx_hiring_records
  FOR SELECT
  TO authenticated
  USING (company_id = auth.uid());

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_hiring_records_candidate_id ON vcx_hiring_records(candidate_id);
CREATE INDEX idx_hiring_records_company_id ON vcx_hiring_records(company_id);
CREATE INDEX idx_hiring_records_status ON vcx_hiring_records(status);
CREATE INDEX idx_hiring_records_created_at ON vcx_hiring_records(created_at DESC);
