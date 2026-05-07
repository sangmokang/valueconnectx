-- 030_vcx_invite_seed_fields.sql
-- Cold Start 자동화: 초대 시 인재 기본 정보 pre-seed
-- ADR-0010 Phase 2 Sprint 5

ALTER TABLE vcx_invites
  ADD COLUMN IF NOT EXISTS invitee_name    text,
  ADD COLUMN IF NOT EXISTS invitee_company text,
  ADD COLUMN IF NOT EXISTS invitee_title   text;

COMMENT ON COLUMN vcx_invites.invitee_name    IS '어드민이 초대 생성 시 입력한 인재 이름 (선택)';
COMMENT ON COLUMN vcx_invites.invitee_company IS '어드민이 초대 생성 시 입력한 인재 현 소속 (선택)';
COMMENT ON COLUMN vcx_invites.invitee_title   IS '어드민이 초대 생성 시 입력한 인재 직책 (선택)';
