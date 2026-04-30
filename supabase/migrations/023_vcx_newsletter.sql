-- 023_vcx_newsletter.sql
-- 뉴스레터 자체 구현 — 캠페인·수신자·이벤트 테이블 (ADR-0009)

CREATE TABLE vcx_newsletter_campaigns (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text        UNIQUE NOT NULL,
  subject      text        NOT NULL,
  preview_text text,
  html_body    text        NOT NULL,
  status       text        NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft','sending','sent','archived')),
  sent_at      timestamptz,
  created_by   uuid        REFERENCES auth.users(id),
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE vcx_newsletter_recipients (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      uuid        NOT NULL REFERENCES vcx_newsletter_campaigns(id) ON DELETE CASCADE,
  subscription_id  uuid        REFERENCES vcx_feed_subscriptions(id) ON DELETE SET NULL,
  email            text        NOT NULL,
  send_token       text        UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  sent_at          timestamptz,
  opened_at        timestamptz,
  first_clicked_at timestamptz,
  unsubscribed_at  timestamptz,
  bounce_reason    text,
  UNIQUE (campaign_id, email)
);

CREATE INDEX vcx_newsletter_recipients_token_idx ON vcx_newsletter_recipients (send_token);
CREATE INDEX vcx_newsletter_recipients_campaign_idx ON vcx_newsletter_recipients (campaign_id);

CREATE TABLE vcx_newsletter_events (
  id           bigserial   PRIMARY KEY,
  recipient_id uuid        NOT NULL REFERENCES vcx_newsletter_recipients(id) ON DELETE CASCADE,
  type         text        NOT NULL CHECK (type IN ('sent','open','click','unsubscribe','bounce','complaint')),
  url          text,
  user_agent   text,
  ip_hash      text,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX vcx_newsletter_events_recipient_idx ON vcx_newsletter_events (recipient_id);

-- RLS
ALTER TABLE vcx_newsletter_campaigns   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_newsletter_recipients  ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_newsletter_events      ENABLE ROW LEVEL SECURITY;

-- 캠페인: 어드민만 읽기/쓰기
CREATE POLICY "newsletter_campaigns_admin" ON vcx_newsletter_campaigns
  FOR ALL TO authenticated
  USING (vcx_is_admin(auth.uid()))
  WITH CHECK (vcx_is_admin(auth.uid()));

-- 수신자: 어드민만 (토큰 기반 접근은 service_role RPC로)
CREATE POLICY "newsletter_recipients_admin" ON vcx_newsletter_recipients
  FOR ALL TO authenticated
  USING (vcx_is_admin(auth.uid()))
  WITH CHECK (vcx_is_admin(auth.uid()));

-- 이벤트: 어드민만 읽기, 삽입은 service_role
CREATE POLICY "newsletter_events_admin_select" ON vcx_newsletter_events
  FOR SELECT TO authenticated
  USING (vcx_is_admin(auth.uid()));

-- service_role: 토큰 기반 수신자 조회 함수
CREATE OR REPLACE FUNCTION vcx_get_recipient_by_token(p_token text)
RETURNS vcx_newsletter_recipients
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM vcx_newsletter_recipients WHERE send_token = p_token LIMIT 1;
$$;
