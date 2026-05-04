-- Migration 014: profile_visibility enforcement notes
--
-- profile_visibility values: 'members_only' | 'corporate_only' | 'all'
--
-- Enforcement strategy: API-level (directory route handlers) rather than RLS,
-- because Supabase RLS policies are OR'd — an existing SELECT policy that allows
-- members to read active member rows cannot be made more restrictive by adding
-- another policy. API-level filtering is reliable and auditable.
--
-- This migration ensures the column exists with the correct constraint.
-- If the column was added in an earlier migration, this is a no-op.

ALTER TABLE vcx_members
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT
    NOT NULL DEFAULT 'members_only'
    CHECK (profile_visibility IN ('members_only', 'corporate_only', 'all'));
