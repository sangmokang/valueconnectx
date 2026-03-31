-- vcx_get_user_info: member + corporate 정보를 단일 RPC 호출로 반환
-- middleware에서 vcx_members + vcx_corporate_users 2회 쿼리를 1회로 줄이기 위해 사용
-- v2: 프로필 완성도 판단용 필드 4개 추가 (name, current_company, title, linkedin_url)
CREATE OR REPLACE FUNCTION vcx_get_user_info(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'member', (
      SELECT json_build_object(
        'system_role',    m.system_role,
        'member_tier',    m.member_tier,
        'is_active',      m.is_active,
        'name',           m.name,
        'current_company', m.current_company,
        'title',          m.title,
        'linkedin_url',   m.linkedin_url
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
