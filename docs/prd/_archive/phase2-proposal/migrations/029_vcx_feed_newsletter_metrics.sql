-- ============================================================================
-- 029_vcx_feed_newsletter_metrics.sql
-- 목적: Curation Feed 뉴스레터 발송·오픈·클릭 지표 수집.
-- 근거: PRD v6.1 §Feature 2 수락 기준 (주간 오픈율 ≥35%, 클릭율 ≥8%)
-- ----------------------------------------------------------------------------
-- 발송 단위 = (feed_item_id × member_id). 집계는 MV 또는 분석 쿼리에서.
-- PII: email은 저장하지 않음. member_id만 외부키.
-- ============================================================================

CREATE TABLE IF NOT EXISTS vcx_feed_newsletter_metrics (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id      UUID NOT NULL REFERENCES vcx_feed_items(id) ON DELETE CASCADE,
  member_id         UUID NOT NULL REFERENCES vcx_members(id) ON DELETE CASCADE,
  campaign_tag      TEXT,                              -- e.g. 'weekly-2026-04-22'
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at      TIMESTAMPTZ,                       -- bounce 미발생 확정 시각 (provider webhook)
  opened_at         TIMESTAMPTZ,
  first_click_at    TIMESTAMPTZ,
  click_count       INTEGER NOT NULL DEFAULT 0,
  bounced_at        TIMESTAMPTZ,
  bounce_reason     TEXT,
  unsubscribed_at   TIMESTAMPTZ,
  provider          TEXT NOT NULL DEFAULT 'resend' CHECK (provider IN ('resend','ses','postmark','internal')),
  provider_msg_id   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (feed_item_id, member_id, campaign_tag)
);

CREATE INDEX IF NOT EXISTS idx_nlm_sent
  ON vcx_feed_newsletter_metrics (sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_nlm_campaign
  ON vcx_feed_newsletter_metrics (campaign_tag, sent_at DESC)
  WHERE campaign_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nlm_member
  ON vcx_feed_newsletter_metrics (member_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_nlm_feed_item
  ON vcx_feed_newsletter_metrics (feed_item_id, sent_at DESC);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION vcx_tr_nlm_touch()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_nlm_touch ON vcx_feed_newsletter_metrics;
CREATE TRIGGER trg_nlm_touch
  BEFORE UPDATE ON vcx_feed_newsletter_metrics
  FOR EACH ROW EXECUTE FUNCTION vcx_tr_nlm_touch();

ALTER TABLE vcx_feed_newsletter_metrics ENABLE ROW LEVEL SECURITY;

-- Admin만 조회 (집계 리포트 용). 본인은 본인 수신 기록 확인 가능 (opt-out UI 대비).
CREATE POLICY "nlm_select_admin"
  ON vcx_feed_newsletter_metrics FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vcx_members m
      WHERE m.id = auth.uid() AND m.system_role IN ('admin','super_admin')
    )
  );

CREATE POLICY "nlm_select_self"
  ON vcx_feed_newsletter_metrics FOR SELECT TO authenticated
  USING (member_id = auth.uid());

-- write: service_role only (뉴스레터 발송 파이프라인이 기록)

COMMENT ON TABLE vcx_feed_newsletter_metrics IS
  'PRD v6.1 §Feature 2: Curation Feed 뉴스레터 지표. 집계는 별도 MV 또는 분석 쿼리.';
