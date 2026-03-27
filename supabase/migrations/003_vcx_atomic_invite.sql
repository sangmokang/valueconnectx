-- Atomic invite consumption to prevent race conditions
CREATE OR REPLACE FUNCTION vcx_consume_invite(p_token_hash TEXT)
RETURNS TABLE(
  id UUID, email TEXT, member_tier TEXT, invited_by UUID,
  invited_by_name TEXT, recommendation_id UUID, expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  UPDATE vcx_invites
  SET status = 'accepted', accepted_at = NOW()
  WHERE token_hash = p_token_hash AND status = 'pending'
  RETURNING vcx_invites.id, vcx_invites.email, vcx_invites.member_tier::TEXT,
    vcx_invites.invited_by, vcx_invites.invited_by_name,
    vcx_invites.recommendation_id, vcx_invites.expires_at;
END;
$$;
