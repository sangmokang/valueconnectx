-- ============================================================================
-- 025c_vcx_placements.sql
-- 목적: Revenue 엔티티. 수수료·LTV:CAC·NRR·Cohort ARPU 측정의 source of truth.
-- 근거: CDO Review §3 B1
-- ----------------------------------------------------------------------------
-- UI 노출 금지 원칙 (PRD v6.1 §1.3): fee_amount_krw 컬럼은 절대 프론트 노출 안 함.
-- RLS: service_role only (재무/Admin 쿼리 전용). 본인은 마스킹 view로 접근.
-- ============================================================================

CREATE TABLE IF NOT EXISTS vcx_placements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id             UUID NOT NULL REFERENCES vcx_members(id),
  hiring_entity_id      UUID REFERENCES vcx_corporate_users(id),
  position_id           UUID REFERENCES positions(id),
  referral_type         TEXT NOT NULL CHECK (referral_type IN ('self','peer','curation','ceo_chat','concierge','external')),
  referrer_id           UUID REFERENCES vcx_members(id),
  placement_date        DATE NOT NULL,

  -- 재무 (UI 노출 금지)
  fee_amount_krw        NUMERIC(12,0) NOT NULL CHECK (fee_amount_krw >= 0),
  fee_currency          TEXT NOT NULL DEFAULT 'KRW',
  fee_invoiced_at       TIMESTAMPTZ,
  fee_received_at       TIMESTAMPTZ,

  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','invoiced','paid','refunded','cancelled')),
  attribution_path      JSONB,                      -- 여정 재구성 (activity_events에서 파생)
  notes                 TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by            UUID REFERENCES vcx_members(id)
);

CREATE INDEX IF NOT EXISTS idx_placements_member       ON vcx_placements (member_id, placement_date DESC);
CREATE INDEX IF NOT EXISTS idx_placements_date         ON vcx_placements (placement_date DESC);
CREATE INDEX IF NOT EXISTS idx_placements_status       ON vcx_placements (status);
CREATE INDEX IF NOT EXISTS idx_placements_referral     ON vcx_placements (referral_type, placement_date);
CREATE INDEX IF NOT EXISTS idx_placements_hiring       ON vcx_placements (hiring_entity_id, placement_date DESC)
  WHERE hiring_entity_id IS NOT NULL;

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION vcx_tr_placements_touch()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_placements_touch ON vcx_placements;
CREATE TRIGGER trg_placements_touch
  BEFORE UPDATE ON vcx_placements
  FOR EACH ROW EXECUTE FUNCTION vcx_tr_placements_touch();

ALTER TABLE vcx_placements ENABLE ROW LEVEL SECURITY;
-- default deny → service_role만 접근 가능

-- ----------------------------------------------------------------------------
-- 본인 열람용 마스킹 VIEW (GDPR/PIPA 열람권 대응, 금액 제외)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vcx_placements_self
WITH (security_invoker = true)
AS
SELECT
  id,
  member_id,
  position_id,
  referral_type,
  placement_date,
  status
  -- fee_amount_krw / fee_currency / fee_*_at / attribution_path / notes 는 제외
FROM vcx_placements
WHERE member_id = auth.uid();

GRANT SELECT ON vcx_placements_self TO authenticated;

COMMENT ON TABLE vcx_placements IS 'CDO rev 4 B1: Revenue SoT. service_role only. UI 노출 금지 (fee_amount_krw).';
COMMENT ON COLUMN vcx_placements.fee_amount_krw IS 'CDO rev 4 B1: 내부 재무 전용. 절대 API/UI 응답에 포함 금지.';
COMMENT ON COLUMN vcx_placements.attribution_path IS 'CDO rev 4 B1: activity_events에서 파생한 여정 JSON. LTV/Cohort 분석용.';
COMMENT ON VIEW vcx_placements_self IS 'CDO rev 4 B1: 본인 열람권 대응 마스킹 view (금액 제외).';
