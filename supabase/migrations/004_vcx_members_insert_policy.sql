-- Explicit INSERT policy: only service-role (adminClient) can insert members
-- This documents the intent and prevents accidental insertion via anon client
CREATE POLICY vcx_members_insert ON vcx_members
  FOR INSERT WITH CHECK (false);

-- Explicit DELETE policy: members cannot be deleted via client
CREATE POLICY vcx_members_delete ON vcx_members
  FOR DELETE USING (false);

-- Comment for documentation
COMMENT ON POLICY vcx_members_insert ON vcx_members IS 'Only service-role can insert members (via invite accept flow)';
COMMENT ON POLICY vcx_members_delete ON vcx_members IS 'Members cannot be deleted via client - admin action only via service-role';
