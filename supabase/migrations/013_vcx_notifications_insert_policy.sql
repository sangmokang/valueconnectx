-- Notifications INSERT policy (defense-in-depth)
--
-- The sendNotification() function in src/lib/notification.ts uses createAdminClient()
-- (service_role), which bypasses RLS entirely. This policy is added for defense-in-depth:
-- it ensures that even if a request somehow reaches the DB under the authenticated role,
-- regular users cannot insert notifications on behalf of themselves or others.
--
-- Only service_role (admin client) may insert notifications.
-- Authenticated users are explicitly denied by omitting an INSERT policy for that role —
-- RLS default-deny applies when no matching policy exists.

-- Explicitly deny authenticated role INSERT attempts
CREATE POLICY "Users cannot insert notifications" ON vcx_notifications
  FOR INSERT TO authenticated
  WITH CHECK (false);
