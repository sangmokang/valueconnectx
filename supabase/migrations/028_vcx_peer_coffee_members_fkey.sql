-- 028_vcx_peer_coffee_members_fkey.sql
-- peer_coffee_* 테이블의 author_id/applicant_id/reviewer_id를 auth.users 대신 vcx_members 로 재연결.
-- PostgREST 가 `author:vcx_members(...)` 같은 embed 를 인식하려면 직접 FK 가 필요.
-- vcx_members.id 자체가 auth.users.id 를 REFERENCES + ON DELETE CASCADE 이므로 의미적으로 동등.

ALTER TABLE peer_coffee_chats
  DROP CONSTRAINT IF EXISTS peer_coffee_chats_author_id_fkey;
ALTER TABLE peer_coffee_chats
  ADD CONSTRAINT peer_coffee_chats_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES vcx_members(id) ON DELETE CASCADE;

ALTER TABLE peer_coffee_applications
  DROP CONSTRAINT IF EXISTS peer_coffee_applications_applicant_id_fkey;
ALTER TABLE peer_coffee_applications
  ADD CONSTRAINT peer_coffee_applications_applicant_id_fkey
  FOREIGN KEY (applicant_id) REFERENCES vcx_members(id) ON DELETE CASCADE;

ALTER TABLE peer_coffeechat_feedback
  DROP CONSTRAINT IF EXISTS peer_coffeechat_feedback_reviewer_id_fkey;
ALTER TABLE peer_coffeechat_feedback
  ADD CONSTRAINT peer_coffeechat_feedback_reviewer_id_fkey
  FOREIGN KEY (reviewer_id) REFERENCES vcx_members(id) ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';
