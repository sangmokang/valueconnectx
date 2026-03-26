-- custom_access_token_hook: Supabase Auth Hook으로 JWT에 VCX 클레임 삽입
-- 활성화 방법: Supabase 대시보드 → Authentication → Hooks → Custom Access Token
-- 이 Hook이 활성화되면 middleware에서 DB 쿼리를 완전히 제거할 수 있음 (3회 → 0회)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims        jsonb;
  member_info   RECORD;
  corporate_info RECORD;
BEGIN
  claims := event->'claims';

  -- vcx_members 조회
  SELECT system_role, member_tier, is_active
    INTO member_info
    FROM vcx_members
   WHERE id = (claims->>'sub')::uuid
     AND is_active = true;

  IF FOUND THEN
    claims := claims || jsonb_build_object(
      'vcx_user_type',    'member',
      'vcx_system_role',  member_info.system_role,
      'vcx_member_tier',  member_info.member_tier
    );
  ELSE
    -- vcx_corporate_users 조회 (member가 아닌 경우에만)
    SELECT role
      INTO corporate_info
      FROM vcx_corporate_users
     WHERE id = (claims->>'sub')::uuid;

    IF FOUND THEN
      claims := claims || jsonb_build_object(
        'vcx_user_type',       'corporate',
        'vcx_corporate_role',  corporate_info.role
      );
    END IF;
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$ LANGUAGE plpgsql;
