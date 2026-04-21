-- ============================================================================
-- 023_vcx_member_reports.sql
-- 목적: 멤버 단위 평판/신고 시스템 (Community content reports와 scope 분리).
-- 근거: PRD v6.1 §Feature 8 + ADR-004 + CDO Review §3 B2 (due process 강화)
-- ----------------------------------------------------------------------------
-- 자동 tier 강등은 하지 않는다 (CDO B2): 모든 강등은 Admin 2인 승인 + 사전고지 7일.
-- Reporter throttle: 동일 reporter 24h 내 3건 초과 시 INSERT 실패.
-- ============================================================================

CREATE TABLE IF NOT EXISTS vcx_member_reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reportee_id    UUID NOT NULL REFERENCES vcx_members(id) ON DELETE CASCADE,
  reporter_id    UUID NOT NULL REFERENCES vcx_members(id) ON DELETE CASCADE,
  context_type   TEXT NOT NULL CHECK (context_type IN ('directory','peer_chat','ceo_chat','community','concierge')),
  context_id     UUID,                                          -- 관련 엔티티 id (nullable)
  reason         TEXT NOT NULL,
  evidence       TEXT,                                          -- URL, 스크린샷 storage path 등
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','reviewing','dismissed','warned','tier_demoted','exited')),
  severity       TEXT NOT NULL DEFAULT 'normal'
                 CHECK (severity IN ('low','normal','high','critical')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by    UUID REFERENCES vcx_members(id),
  reviewed_at    TIMESTAMPTZ,
  review_notes   TEXT,
  CHECK (reportee_id <> reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_member_reports_reportee_status
  ON vcx_member_reports (reportee_id, status);
CREATE INDEX IF NOT EXISTS idx_member_reports_created
  ON vcx_member_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_reports_status_severity
  ON vcx_member_reports (status, severity, created_at DESC)
  WHERE status IN ('pending','reviewing');

ALTER TABLE vcx_member_reports ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
CREATE POLICY "reports_insert_self"
  ON vcx_member_reports FOR INSERT TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND reporter_id <> reportee_id
  );

CREATE POLICY "reports_select_admin_or_reporter"
  ON vcx_member_reports FOR SELECT TO authenticated
  USING (
    reporter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM vcx_members m
      WHERE m.id = auth.uid() AND m.system_role IN ('admin','super_admin')
    )
  );

CREATE POLICY "reports_update_admin"
  ON vcx_member_reports FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vcx_members m
      WHERE m.id = auth.uid() AND m.system_role IN ('admin','super_admin')
    )
  );

-- ----------------------------------------------------------------------------
-- Reporter throttle: 동일 reporter 24h 내 > 3건 block
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION vcx_tr_reports_throttle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_recent_count
    FROM vcx_member_reports
   WHERE reporter_id = NEW.reporter_id
     AND created_at > now() - INTERVAL '24 hours';

  IF v_recent_count >= 3 THEN
    RAISE EXCEPTION '동일 신고자는 24시간 내 최대 3건만 신고할 수 있습니다.';
  END IF;

  -- 동일 reportee 중복 신고 방지 (대기·심사 중인 건 존재 시)
  IF EXISTS (
    SELECT 1 FROM vcx_member_reports
    WHERE reporter_id = NEW.reporter_id
      AND reportee_id = NEW.reportee_id
      AND status IN ('pending','reviewing')
  ) THEN
    RAISE EXCEPTION '동일 대상에 대한 미처리 신고가 이미 존재합니다.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reports_throttle ON vcx_member_reports;
CREATE TRIGGER trg_reports_throttle
  BEFORE INSERT ON vcx_member_reports
  FOR EACH ROW EXECUTE FUNCTION vcx_tr_reports_throttle();

COMMENT ON TABLE vcx_member_reports IS
  'PRD v6.1 ADR-004 / CDO B2: member-level reputation reports. Auto-demotion NOT enabled — requires admin 2-eye review per CDO.';
