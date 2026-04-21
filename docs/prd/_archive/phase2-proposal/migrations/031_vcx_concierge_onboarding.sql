-- ============================================================================
-- 031_vcx_concierge_onboarding.sql
-- 목적: LinkedIn 없는 초특급 인재용 1:1 수동 온보딩 경로.
-- 근거: PRD v6.1 §Feature 1.1 + CDO Review §3 B4 (pw_hash 제거, Supabase Auth 위임)
-- ----------------------------------------------------------------------------
-- 핵심 CDO 변경: vcx_concierge_credentials 는 "발급 이력/배송 경로 감사" 전용.
-- 비밀번호 자체는 Supabase Auth의 auth.users.encrypted_password 가 유일한 SoT.
-- pw_hash 컬럼 미포함 — 자체 해시 보관은 이중화의 원천.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) vcx_members에 온보딩 채널 · 검증 · 2FA 메타 컬럼 추가
-- ----------------------------------------------------------------------------
ALTER TABLE vcx_members
  ADD COLUMN IF NOT EXISTS onboarding_channel TEXT NOT NULL DEFAULT 'invite'
    CHECK (onboarding_channel IN ('invite','concierge','self_signup_blocked')),
  ADD COLUMN IF NOT EXISTS external_verification_doc_url TEXT,
  ADD COLUMN IF NOT EXISTS verified_by TEXT
    CHECK (verified_by IS NULL OR verified_by IN ('linkedin','concierge','peer_referral')),
  ADD COLUMN IF NOT EXISTS first_login_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mfa_enrolled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_members_onboarding_channel
  ON vcx_members (onboarding_channel)
  WHERE onboarding_channel <> 'invite';

-- ----------------------------------------------------------------------------
-- 2) vcx_concierge_credentials — 발급 감사 테이블 (pw 저장 X)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vcx_concierge_credentials (
  member_id       UUID PRIMARY KEY REFERENCES vcx_members(id) ON DELETE CASCADE,
  issued_by       UUID NOT NULL REFERENCES vcx_members(id),
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '72 hours'),
  delivered_via   TEXT NOT NULL
                  CHECK (delivered_via IN ('sealed_envelope','signal','in_person','encrypted_email')),
  delivered_at    TIMESTAMPTZ,                       -- 실제 전달 확인 시각
  consumed_at     TIMESTAMPTZ,                       -- first_login_completed_at와 동일 값
  invalidated_at  TIMESTAMPTZ,                       -- 만료·재발급 등
  invalidation_reason TEXT,
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_concierge_cred_issued_by
  ON vcx_concierge_credentials (issued_by, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_concierge_cred_expiry
  ON vcx_concierge_credentials (expires_at)
  WHERE consumed_at IS NULL AND invalidated_at IS NULL;

ALTER TABLE vcx_concierge_credentials ENABLE ROW LEVEL SECURITY;

-- Admin 조회 전용 (service_role은 RLS bypass)
CREATE POLICY "concierge_cred_select_admin"
  ON vcx_concierge_credentials FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vcx_members m
      WHERE m.id = auth.uid() AND m.system_role IN ('admin','super_admin')
    )
  );
-- write: service_role only

-- ----------------------------------------------------------------------------
-- 3) 72시간 만료 정리 함수 (pg_cron daily 호출 대상)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION vcx_concierge_expire_stale()
RETURNS TABLE (invalidated_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH updated AS (
    UPDATE vcx_concierge_credentials
       SET invalidated_at = now(),
           invalidation_reason = 'expired_72h'
     WHERE consumed_at IS NULL
       AND invalidated_at IS NULL
       AND expires_at < now()
    RETURNING member_id
  )
  SELECT COUNT(*)::INTEGER INTO v_count FROM updated;

  invalidated_count := v_count;
  RETURN NEXT;
END;
$$;

COMMENT ON TABLE vcx_concierge_credentials IS
  'PRD v6.1 Feature 1.1 / CDO B4: Concierge 발급·배송 감사 전용. 비밀번호는 Supabase Auth가 SoT.';
COMMENT ON FUNCTION vcx_concierge_expire_stale() IS
  'PRD v6.1 Feature 1.1: 72h 미사용 credential 자동 invalidate. pg_cron daily 예정.';

COMMENT ON COLUMN vcx_members.onboarding_channel IS
  'PRD v6.1 Feature 1.1: ''invite'' (기본) | ''concierge'' (VIP 수동) | ''self_signup_blocked''';
COMMENT ON COLUMN vcx_members.verified_by IS
  'PRD v6.1 Feature 1.1: 본인 확인 방식 — linkedin (기본) / concierge (운영팀 확인) / peer_referral';
