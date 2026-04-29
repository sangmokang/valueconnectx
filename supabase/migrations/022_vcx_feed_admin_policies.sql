-- Admin UPDATE on feed_items
CREATE POLICY "feed_items_admin_update" ON vcx_feed_items FOR UPDATE TO authenticated
  USING (vcx_is_admin(auth.uid()))
  WITH CHECK (vcx_is_admin(auth.uid()));

-- Admin DELETE on feed_items
CREATE POLICY "feed_items_admin_delete" ON vcx_feed_items FOR DELETE TO authenticated
  USING (vcx_is_admin(auth.uid()));
