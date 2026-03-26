-- vcx_get_user_info: member + corporate 정보를 단일 RPC 호출로 반환
-- middleware에서 vcx_members + vcx_corporate_users 2회 쿼리를 1회로 줄이기 위해 사용
CREATE OR REPLACE FUNCTION vcx_get_user_info(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'member', (
      SELECT json_build_object(
        'system_role', m.system_role,
        'member_tier', m.member_tier,
        'is_active',   m.is_active
      )
      FROM vcx_members m
      WHERE m.id = p_user_id AND m.is_active = true
    ),
    'corporate', (
      SELECT json_build_object('role', c.role)
      FROM vcx_corporate_users c
      WHERE c.id = p_user_id
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
