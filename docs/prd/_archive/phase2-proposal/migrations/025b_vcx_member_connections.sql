-- ============================================================================
-- 025b_vcx_member_connections.sql
-- 목적: peer coffee chat 상호 수락 관계 denormalize.
--        Directory Level 2 RLS 평가를 O(N) 스캔에서 O(1) 인덱스 조회로 전환.
-- 근거: CDO Review §2 D7
-- ----------------------------------------------------------------------------
-- 정렬된 unordered pair (user_a_id < user_b_id) → 단일 인덱스로 양방향 조회.
-- peer_coffee_applications.status='accepted' 전환 시 트리거가 자동 INSERT.
-- ============================================================================

CREATE TABLE IF NOT EXISTS vcx_member_connections (
  user_a_id                      UUID NOT NULL REFERENCES vcx_members(id) ON DELETE CASCADE,
  user_b_id                      UUID NOT NULL REFERENCES vcx_members(id) ON DELETE CASCADE,
  connection_type                TEXT NOT NULL CHECK (connection_type IN ('peer_chat_mutual')),
  established_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  established_by_application_id  UUID,                     -- peer_coffee_applications.id trace
  PRIMARY KEY (user_a_id, user_b_id, connection_type),
  CHECK (user_a_id < user_b_id)                            -- unordered pair 정규화
);

-- 역방향 조회용 인덱스 (user_b_id 주어지면 user_a_id 찾기)
CREATE INDEX IF NOT EXISTS idx_conn_user_b
  ON vcx_member_connections (user_b_id, user_a_id);

ALTER TABLE vcx_member_connections ENABLE ROW LEVEL SECURITY;

-- 본인이 포함된 관계만 조회 가능
CREATE POLICY "conn_select_if_party"
  ON vcx_member_connections FOR SELECT TO authenticated
  USING (user_a_id = auth.uid() OR user_b_id = auth.uid());
-- write: trigger만 (service_role SECURITY DEFINER)

-- ----------------------------------------------------------------------------
-- 트리거: peer_coffee_applications.status='accepted' 전환 시 자동 INSERT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION vcx_tr_peer_chat_accept_connect()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author    UUID;
  v_applicant UUID;
  v_a         UUID;
  v_b         UUID;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    SELECT pc.author_id INTO v_author
    FROM peer_coffee_chats pc
    WHERE pc.id = NEW.chat_id;

    v_applicant := NEW.applicant_id;

    -- 가드: 자기 자신·NULL·vcx_members 미가입자 skip (무결성 보호)
    IF v_author IS NULL OR v_applicant IS NULL OR v_author = v_applicant THEN
      RETURN NEW;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM vcx_members WHERE id = v_author)
       OR NOT EXISTS (SELECT 1 FROM vcx_members WHERE id = v_applicant) THEN
      RETURN NEW;
    END IF;

    -- 정렬 (user_a < user_b)
    IF v_author < v_applicant THEN
      v_a := v_author;    v_b := v_applicant;
    ELSE
      v_a := v_applicant; v_b := v_author;
    END IF;

    INSERT INTO vcx_member_connections
      (user_a_id, user_b_id, connection_type, established_at, established_by_application_id)
    VALUES (v_a, v_b, 'peer_chat_mutual', now(), NEW.id)
    ON CONFLICT (user_a_id, user_b_id, connection_type) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_peer_chat_accept_connect ON peer_coffee_applications;
CREATE TRIGGER trg_peer_chat_accept_connect
  AFTER UPDATE OF status ON peer_coffee_applications
  FOR EACH ROW
  EXECUTE FUNCTION vcx_tr_peer_chat_accept_connect();

-- ----------------------------------------------------------------------------
-- 헬퍼: RLS USING 절에서 O(1) 호출
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION vcx_has_mutual_peer_accept(a UUID, b UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM vcx_member_connections
    WHERE connection_type = 'peer_chat_mutual'
      AND user_a_id = LEAST(a, b)
      AND user_b_id = GREATEST(a, b)
  );
$$;

-- ----------------------------------------------------------------------------
-- Backfill: 기존 accepted 상태의 peer_coffee_applications 이관
-- ----------------------------------------------------------------------------
INSERT INTO vcx_member_connections
  (user_a_id, user_b_id, connection_type, established_by_application_id)
SELECT
  LEAST(pc.author_id, pa.applicant_id),
  GREATEST(pc.author_id, pa.applicant_id),
  'peer_chat_mutual',
  pa.id
FROM peer_coffee_applications pa
JOIN peer_coffee_chats pc ON pc.id = pa.chat_id
WHERE pa.status = 'accepted'
  AND pc.author_id <> pa.applicant_id
  AND EXISTS (SELECT 1 FROM vcx_members WHERE id = pc.author_id)
  AND EXISTS (SELECT 1 FROM vcx_members WHERE id = pa.applicant_id)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE vcx_member_connections IS 'CDO rev 4 D7: denormalized peer-chat mutual accept. O(1) RLS lookup for Directory Level 2.';
COMMENT ON FUNCTION vcx_has_mutual_peer_accept(UUID, UUID) IS 'CDO rev 4 D7: replaces the EXISTS subquery — backed by vcx_member_connections index.';
