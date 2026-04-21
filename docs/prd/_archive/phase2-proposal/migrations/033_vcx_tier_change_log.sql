-- ============================================================================
-- 033_vcx_tier_change_log.sql
-- 목적: vcx_members.member_tier 변경 이력 감사.
-- 근거: CDO Review §3 B2 — Reputation 거버넌스 (5년 보관, 법적 방어 가능)
-- ----------------------------------------------------------------------------
-- tier 강등·승격·수동 조정의 전수 기록. 자동 트리거로 변경 감지.
-- Admin UI에서 이 로그를 띄워 "왜 강등되었는지" 소명 창에 제시.
-- ============================================================================

CREATE TABLE IF NOT EXISTS vcx_tier_change_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES vcx_members(id) ON DELETE CASCADE,
  previous_tier   TEXT,
  new_tier        TEXT NOT NULL,
  change_type     TEXT NOT NULL CHECK (change_type IN ('promote','demote','manual_set','auto_initial')),
  reason_code     TEXT,                                     -- e.g. 'reports_threshold','admin_decision','initial_signup'
  reason_detail   TEXT,
  related_report_ids UUID[] DEFAULT '{}',                   -- vcx_member_reports.id 들
  effective_at    TIMESTAMPTZ NOT NULL DEFAULT now(),       -- 사전 고지 7일 후 발효 가능
  notified_at     TIMESTAMPTZ,                              -- 대상자에게 고지한 시각
  appeal_deadline TIMESTAMPTZ,                              -- 소명 마감
  decided_by      UUID REFERENCES vcx_members(id),          -- 결정 admin
  approved_by     UUID REFERENCES vcx_members(id),          -- 4-eye: 승인 admin (demote 필수)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tier_log_member
  ON vcx_tier_change_log (member_id, effective_at DESC);
CREATE INDEX IF NOT EXISTS idx_tier_log_type
  ON vcx_tier_change_log (change_type, effective_at DESC);

ALTER TABLE vcx_tier_change_log ENABLE ROW LEVEL SECURITY;

-- 본인은 자신의 tier 변경 이력 조회 가능 (소명권)
CREATE POLICY "tier_log_self_select"
  ON vcx_tier_change_log FOR SELECT TO authenticated
  USING (member_id = auth.uid());

-- Admin은 전체 조회
CREATE POLICY "tier_log_admin_select"
  ON vcx_tier_change_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vcx_members m
      WHERE m.id = auth.uid() AND m.system_role IN ('admin','super_admin')
    )
  );

-- write: service_role + trigger 만

-- ----------------------------------------------------------------------------
-- 자동 로깅 트리거: vcx_members.member_tier 변경 감지
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION vcx_tr_tier_change_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_change_type TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.member_tier IS NOT NULL THEN
      INSERT INTO vcx_tier_change_log
        (member_id, previous_tier, new_tier, change_type, reason_code, effective_at)
      VALUES
        (NEW.id, NULL, NEW.member_tier, 'auto_initial', 'initial_signup', now());
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.member_tier IS DISTINCT FROM OLD.member_tier THEN
    v_change_type := CASE
      WHEN OLD.member_tier = 'core'     AND NEW.member_tier = 'endorsed' THEN 'demote'
      WHEN OLD.member_tier = 'endorsed' AND NEW.member_tier = 'core'     THEN 'promote'
      ELSE 'manual_set'
    END;

    INSERT INTO vcx_tier_change_log
      (member_id, previous_tier, new_tier, change_type, reason_code, effective_at)
    VALUES
      (NEW.id, OLD.member_tier, NEW.member_tier, v_change_type, 'direct_db_change', now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tier_change_log ON vcx_members;
CREATE TRIGGER trg_tier_change_log
  AFTER INSERT OR UPDATE OF member_tier ON vcx_members
  FOR EACH ROW EXECUTE FUNCTION vcx_tr_tier_change_log();

-- ----------------------------------------------------------------------------
-- 기존 멤버 초기 로그 backfill (아직 로그 없으면 auto_initial 생성)
-- ----------------------------------------------------------------------------
INSERT INTO vcx_tier_change_log
  (member_id, previous_tier, new_tier, change_type, reason_code, effective_at)
SELECT
  m.id, NULL, m.member_tier, 'auto_initial', 'backfill_migration_033', m.created_at
FROM vcx_members m
WHERE NOT EXISTS (
  SELECT 1 FROM vcx_tier_change_log l WHERE l.member_id = m.id
);

COMMENT ON TABLE vcx_tier_change_log IS
  'CDO rev 4 B2: member_tier 변경 전수 감사. 5년 보관, 소명·이의제기 근거 자료.';
COMMENT ON COLUMN vcx_tier_change_log.approved_by IS
  'CDO rev 4 B2: demote 시 4-eye principle — decided_by와 다른 admin의 승인 필수 (애플리케이션 레벨 enforce)';
