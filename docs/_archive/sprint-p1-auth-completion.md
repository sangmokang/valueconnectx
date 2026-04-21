# P1 Auth Completion Sprint Plan

**Created:** 2026-03-25
**Status:** Ready for execution
**Estimated Total:** 36 tasks across 9 micro-sprints (~40-52 hours)

---

## Context

ValueConnect X invite-only auth system is ~80% implemented (higher than initially estimated).
The codebase already has:
- Full Supabase client stack (server/browser/admin/middleware)
- Complete DB schema + RLS policies (2 migrations)
- Two-layer auth (`getVcxUser` = Supabase session + `vcx_members` check)
- Route classification + middleware with auth checks
- Login form WITH real Supabase `signInWithPassword` integration (DONE)
- Invite accept form WITH token verify + account creation flow (DONE)
- Forgot/reset password forms WITH Supabase integration (DONE)
- All API routes fully implemented: recommendations CRUD, invite verify/accept/direct/revoke/list
- Admin components: recommendation-list, invite-list, admin-tabs, status-badge (all DONE)
- `src/lib/invite.ts` - token gen, hash, timing-safe compare (DONE)
- `src/lib/email.ts` - Resend + console.log fallback (DONE)
- `src/lib/rate-limit.ts` - in-memory rate limiter (DONE)
- Login wall component (DONE)
- User menu component with logout (DONE)
- GNB with auth-aware rendering (DONE)

**What's actually missing:**
1. Test infrastructure (Vitest + Playwright not installed/configured)
2. Unit tests for all utility functions
3. Integration tests for API routes
4. E2E tests for auth flows
5. Login wall integration into protected route pages (component exists but not wired)
6. Protected page layouts reading `x-vcx-authenticated` header to show login wall
7. Minor edge cases: invite accept form doesn't capture LinkedIn URL in submit
8. Session handling after invite accept (client-side cookie setting)
9. Security hardening: race conditions, O(n) user scan, missing password update, wildcard injection, error disambiguation

**Design Constraints:**
- Korean UI, Georgia serif, warm gold (#C9A84C), no border-radius, no shadows
- Tables: `vcx_` prefix
- Flow: Recommend -> Admin Approve -> Email -> Accept -> Account

---

## Sprint 0: Test Infrastructure Setup

### Task ID: S0.1
**Name:** Install and configure Vitest for Next.js 14
**Files:**
- `package.json` (add devDependencies)
- `vitest.config.ts` (create)
- `tsconfig.test.json` (create - extends tsconfig with test paths)
**Dependencies:** None
**Implementation:**
- Install `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@testing-library/user-event`
- Create `vitest.config.ts` with jsdom environment, path aliases matching `tsconfig.json` (`@/` -> `src/`)
- Add `"test"` and `"test:watch"` scripts to `package.json`
- Configure coverage with `@vitest/coverage-v8`
**Unit Tests (Vitest):**
- Run `npx vitest --run` with a trivial `src/__tests__/setup.test.ts` that asserts `1+1===2`
**Acceptance Criteria:**
- [ ] `npm run test` executes without errors
- [ ] Path alias `@/` resolves correctly in test files
- [ ] jsdom environment available for component tests

---

### Task ID: S0.2
**Name:** Install and configure Playwright for E2E
**Files:**
- `package.json` (add devDependency)
- `playwright.config.ts` (create)
- `e2e/example.spec.ts` (create trivial test)
**Dependencies:** None
**Implementation:**
- Install `@playwright/test`
- Create `playwright.config.ts` with baseURL `http://localhost:3000`, webServer config for `npm run dev`
- Create `e2e/` directory with a trivial navigation test
- Add `"test:e2e"` script to `package.json`
**Integration/E2E Tests (Playwright):**
- Navigate to `/` and verify page title contains "ValueConnect"
**Acceptance Criteria:**
- [ ] `npm run test:e2e` runs Playwright against dev server
- [ ] Trivial test passes

---

### Task ID: S0.3
**Name:** Create test utilities and Supabase mocks
**Files:**
- `src/__tests__/utils/supabase-mock.ts` (create)
- `src/__tests__/utils/test-helpers.ts` (create)
- `src/__tests__/setup.ts` (create - global test setup)
**Dependencies:** S0.1
**Implementation:**
- Create mock factory for Supabase client: `createMockSupabase()` returning chainable `.from().select().eq().single()` pattern
- Create mock for `createClient`, `createAdminClient` using `vi.mock`
- Create `mockRequest()` helper that builds `NextRequest` objects with configurable headers, body, cookies
- Create `mockVcxUser()` factory for test user data
- Wire global setup in `vitest.config.ts` via `setupFiles`
**Unit Tests (Vitest):**
- Verify `createMockSupabase()` returns proper chainable mock
- Verify `mockRequest()` creates valid NextRequest
**Acceptance Criteria:**
- [ ] Mocks import cleanly in test files
- [ ] Supabase mock supports `from().select().eq().single()` chain
- [ ] `vi.mock('@/lib/supabase/server')` pattern works

---

### Task ID: S0.4
**Name:** Create E2E test helpers and seed data utilities
**Files:**
- `e2e/helpers/auth.ts` (create)
- `e2e/helpers/seed.ts` (create)
- `e2e/helpers/constants.ts` (create)
**Dependencies:** S0.2
**Implementation:**
- Create `TEST_ADMIN`, `TEST_MEMBER`, `TEST_INVITE_EMAIL` constants
- Create `seedTestAdmin()` using Supabase admin client to create auth user + vcx_members row with `system_role: 'admin'`
- Create `seedTestMember()` for regular member
- Create `loginAs(page, email, password)` helper using Playwright page to fill login form
- Create `cleanupTestData()` to remove seeded rows after test
**Integration/E2E Tests (Playwright):**
- Seed admin, verify row exists in DB, cleanup
**Acceptance Criteria:**
- [ ] `seedTestAdmin()` creates both auth.users and vcx_members rows
- [ ] `loginAs()` successfully authenticates via the login page
- [ ] `cleanupTestData()` removes all seeded data

---

**Sprint 0 QA Gate:**
- [ ] `npm run test` passes (Vitest)
- [ ] `npm run test:e2e` passes (Playwright)
- [ ] All mock utilities importable and functional
- [ ] No regressions: `npm run build` still succeeds

---

## Sprint 1: Core Utilities Unit Tests

### Task ID: S1.1
**Name:** Unit tests for `src/lib/invite.ts`
**Files:**
- `src/__tests__/lib/invite.test.ts` (create)
**Dependencies:** S0.3
**Implementation:**
- Test `generateInviteToken()`: returns 64-char hex string, each call unique
- Test `hashToken()`: deterministic (same input = same output), returns 64-char hex
- Test `verifyTokenHash()`: returns true for matching token/hash, false for mismatched
- Test `calculateExpiry()`: returns ISO string 24h in the future (within 1s tolerance)
**Unit Tests (Vitest):**
- `generateInviteToken` returns 64-char hex string
- `generateInviteToken` produces unique tokens on consecutive calls
- `hashToken` is deterministic
- `hashToken` output differs from input
- `verifyTokenHash` returns true for valid pair
- `verifyTokenHash` returns false for invalid token
- `verifyTokenHash` returns false for tampered hash
- `calculateExpiry` returns ISO string ~24h from now
**Acceptance Criteria:**
- [ ] All 8 test cases pass
- [ ] 100% line coverage on `src/lib/invite.ts`

---

### Task ID: S1.2
**Name:** Unit tests for `src/lib/rate-limit.ts`
**Files:**
- `src/__tests__/lib/rate-limit.test.ts` (create)
**Dependencies:** S0.3
**Implementation:**
- Test basic rate limiting: first N calls succeed, N+1 fails
- Test window expiry: after windowMs, counter resets
- Test different keys are independent
- Test remaining count decrements correctly
**Unit Tests (Vitest):**
- `rateLimit` allows up to `limit` requests
- `rateLimit` blocks after `limit` exceeded
- `rateLimit` resets after window expires (use `vi.useFakeTimers`)
- `rateLimit` tracks separate keys independently
- `remaining` count decrements correctly
**Acceptance Criteria:**
- [ ] All 5 test cases pass
- [ ] 100% line coverage on `src/lib/rate-limit.ts`

---

### Task ID: S1.3
**Name:** Unit tests for `src/lib/email.ts`
**Files:**
- `src/__tests__/lib/email.test.ts` (create)
**Dependencies:** S0.3
**Implementation:**
- Mock `resend` module
- Test dev mode (no RESEND_API_KEY): returns `{ success: true, dev: true }`, logs to console
- Test production mode: calls `resend.emails.send` with correct params
- Test error handling: when Resend returns error
**Unit Tests (Vitest):**
- Without RESEND_API_KEY: returns dev success, calls console.log
- Without RESEND_API_KEY: invite URL contains correct token
- With RESEND_API_KEY: calls Resend with correct `from`, `to`, `subject`, `html`
- With RESEND_API_KEY: handles Resend error gracefully
**Acceptance Criteria:**
- [ ] All 4 test cases pass
- [ ] Console.log fallback verified with `vi.spyOn(console, 'log')`

---

### Task ID: S1.4
**Name:** Unit tests for `src/lib/auth/get-vcx-user.ts` and `src/lib/auth/routes.ts`
**Files:**
- `src/__tests__/lib/auth/get-vcx-user.test.ts` (create)
- `src/__tests__/lib/auth/routes.test.ts` (create)
**Dependencies:** S0.3
**Implementation:**
- Mock `@/lib/supabase/server` for getVcxUser tests
- Test `getVcxUser`: returns null when no session, returns null when no vcx_members row, returns VcxUser when both exist
- Test `isAdmin`: true for admin/super_admin, false for member, false for null
- Test all route classifiers with exact paths and sub-paths
**Unit Tests (Vitest):**
- `getVcxUser` returns null when `auth.getUser()` returns no user
- `getVcxUser` returns null when user exists but no vcx_members row
- `getVcxUser` returns null when member is inactive (`is_active: false`)
- `getVcxUser` returns correct VcxUser shape when both exist
- `isAdmin` returns true for `super_admin`
- `isAdmin` returns true for `admin`
- `isAdmin` returns false for `member`
- `isAdmin` returns false for null
- `isPublicRoute('/')` returns true
- `isPublicRoute('/service-overview')` returns true
- `isProtectedRoute('/coffeechat')` returns true
- `isAdminRoute('/admin')` returns true
- `isAdminRoute('/admin/recommendations')` returns true
- `isAuthRoute('/login')` returns true
- `isAuthRoute('/invite/accept')` returns true
- `isSemiPublicRoute('/positions')` returns true
- `isPublicRoute('/coffeechat')` returns false
**Acceptance Criteria:**
- [ ] All 17 test cases pass
- [ ] 100% line coverage on both files

---

**Sprint 1 QA Gate:**
- [ ] `npm run test -- --run` passes all Sprint 0 + Sprint 1 tests
- [ ] Coverage report shows 100% on `lib/invite.ts`, `lib/rate-limit.ts`, `lib/email.ts`, `lib/auth/`
- [ ] `npm run build` still succeeds

---

## Sprint 2: Auth Forms Integration Tests

### Task ID: S2.1
**Name:** Unit tests for LoginForm component
**Files:**
- `src/__tests__/components/auth/login-form.test.tsx` (create)
**Dependencies:** S0.3
**Implementation:**
- Mock `@/lib/supabase/client` to control `signInWithPassword` return
- Render `<LoginForm />` and verify form elements exist
- Simulate submit with valid credentials -> verify router.push called
- Simulate submit with invalid credentials -> verify error message shown
- Test loading state during submission
**Unit Tests (Vitest):**
- Renders email and password inputs
- Renders login button with text "로그인"
- Shows error message on auth failure: "이메일 또는 비밀번호가 올바르지 않습니다"
- Calls `signInWithPassword` with entered email/password
- Redirects to `redirectTo` prop on success
- Redirects to `/` when no redirectTo
- Button shows "로그인 중..." during loading
- Button is disabled during loading
**Acceptance Criteria:**
- [ ] All 8 test cases pass
- [ ] Form interaction tests use `@testing-library/user-event`

---

### Task ID: S2.2
**Name:** Unit tests for ForgotPasswordForm and ResetPasswordForm
**Files:**
- `src/__tests__/components/auth/forgot-password-form.test.tsx` (create)
- `src/__tests__/components/auth/reset-password-form.test.tsx` (create)
**Dependencies:** S0.3
**Implementation:**
- Mock `@/lib/supabase/client` for both
- ForgotPasswordForm: test submit calls `resetPasswordForEmail`, shows success message
- ResetPasswordForm: test password mismatch validation, min length validation, successful update
**Unit Tests (Vitest):**
- ForgotPasswordForm: renders email input and submit button
- ForgotPasswordForm: calls `resetPasswordForEmail` with email and redirectTo
- ForgotPasswordForm: shows success state "이메일을 확인해주세요" after send
- ForgotPasswordForm: shows error on failure
- ResetPasswordForm: renders password and confirm inputs
- ResetPasswordForm: shows error when passwords don't match
- ResetPasswordForm: shows error when password < 8 chars
- ResetPasswordForm: calls `updateUser` with new password
- ResetPasswordForm: redirects to `/login` on success
**Acceptance Criteria:**
- [ ] All 9 test cases pass

---

### Task ID: S2.3
**Name:** Unit tests for InviteAcceptForm component
**Files:**
- `src/__tests__/components/auth/invite-accept-form.test.tsx` (create)
**Dependencies:** S0.3
**Implementation:**
- Mock `fetch` globally for API calls to `/api/invites/verify/` and `/api/invites/accept`
- Test token verification step: shows token input when no initialToken
- Test with initialToken: auto-verifies and shows form
- Test form submission: sends token, password, name to accept endpoint
- Test error states: invalid token, expired token, account creation failure
**Unit Tests (Vitest):**
- Without initialToken: shows token input and "초대 확인하기" button
- With initialToken: auto-calls verify API
- On valid verify: shows invite info (inviter name, email, tier)
- On valid verify: shows name, password, confirm password fields
- Shows error on invalid token: "유효하지 않은 초대 링크입니다"
- Submit calls `/api/invites/accept` with token, password, name
- Shows password mismatch error
- Shows min length error
- Redirects on success
**Acceptance Criteria:**
- [ ] All 9 test cases pass
- [ ] Both steps (token verify + form) tested

---

### Task ID: S2.4
**Name:** Fix invite-accept-form LinkedIn URL not submitted + unit test for UserMenu
**Files:**
- `src/components/auth/invite-accept-form.tsx` (modify - add linkedin_url to state and submit body)
- `src/__tests__/components/auth/user-menu.test.tsx` (create)
**Dependencies:** S0.3
**Implementation:**
- In `invite-accept-form.tsx`: add `linkedinUrl` state, bind to LinkedIn input, include in POST body
- UserMenu tests: verify renders username, dropdown toggle, logout calls signOut, admin link shown for admins
**Unit Tests (Vitest):**
- InviteAcceptForm: LinkedIn URL included in submit body
- UserMenu: renders user name
- UserMenu: toggles dropdown on click
- UserMenu: shows "관리" link when isAdmin=true
- UserMenu: hides "관리" link when isAdmin=false
- UserMenu: calls signOut on "로그아웃" click
**Acceptance Criteria:**
- [ ] LinkedIn URL bug fixed (included in POST body as `linkedin_url`)
- [ ] All 6 test cases pass

---

**Sprint 2 QA Gate:**
- [ ] All Sprint 0-2 tests pass (`npm run test -- --run`)
- [ ] All auth form components have test coverage
- [ ] LinkedIn URL fix verified
- [ ] `npm run build` still succeeds

---

## Sprint 3: API Route Tests - Recommendations

### Task ID: S3.1
**Name:** Unit tests for POST `/api/recommendations` (create recommendation)
**Files:**
- `src/__tests__/api/recommendations/route.test.ts` (create)
**Dependencies:** S0.3
**Implementation:**
- Mock Supabase server client
- Test 401 when not authenticated
- Test 403 when not core member
- Test 400 when missing required fields
- Test 409 when email already a member
- Test 409 when pending recommendation exists
- Test 201 successful creation
**Unit Tests (Vitest):**
- Returns 401 when no auth session
- Returns 403 when user is not core member
- Returns 403 when member is inactive
- Returns 400 when `recommended_email` missing
- Returns 400 when invalid `member_tier`
- Returns 409 when email already in vcx_members
- Returns 409 when pending recommendation exists for email
- Returns 201 with recommendation data on success
**Acceptance Criteria:**
- [ ] All 8 test cases pass
- [ ] All error paths verified

---

### Task ID: S3.2
**Name:** Unit tests for POST `/api/recommendations/[id]/approve`
**Files:**
- `src/__tests__/api/recommendations/approve.test.ts` (create)
**Dependencies:** S0.3
**Implementation:**
- Mock Supabase server + admin clients
- Test full approval workflow: updates recommendation status, generates token, creates invite, sends email
- Test error cases: not admin, recommendation not found, not pending
**Unit Tests (Vitest):**
- Returns 401 when no auth
- Returns 403 when not admin
- Returns 404 when recommendation not found or not pending
- Returns 201 and creates vcx_invites row on success
- Updates recommendation status to 'approved' with reviewer info
- Generates token and hashes it for invite
- Calls `sendInviteEmail` with correct params
**Acceptance Criteria:**
- [ ] All 7 test cases pass
- [ ] Full approve -> invite -> email chain verified

---

### Task ID: S3.3
**Name:** Unit tests for POST `/api/recommendations/[id]/reject` and GET `/api/recommendations/list`
**Files:**
- `src/__tests__/api/recommendations/reject.test.ts` (create)
- `src/__tests__/api/recommendations/list.test.ts` (create)
**Dependencies:** S0.3
**Implementation:**
- Reject: test auth, admin check, 404 for not found, successful rejection
- List: test auth, admin check, pagination params, status filter, response shape
**Unit Tests (Vitest):**
- Reject: returns 401 without auth
- Reject: returns 403 for non-admin
- Reject: returns 404 when not found/not pending
- Reject: returns 200 with updated recommendation
- Reject: sets `reviewed_by` and `reviewed_at`
- List: returns 401 without auth
- List: returns 403 for non-admin
- List: returns paginated data with `total`, `page`, `limit`
- List: filters by status query param
- List: default page=1, limit=20
**Acceptance Criteria:**
- [ ] All 10 test cases pass

---

**Sprint 3 QA Gate:**
- [ ] All Sprint 0-3 tests pass
- [ ] All recommendation API routes have full test coverage
- [ ] `npm run build` still succeeds

---

## Sprint 4: API Route Tests - Invites

### Task ID: S4.1
**Name:** Unit tests for GET `/api/invites/verify/[token]`
**Files:**
- `src/__tests__/api/invites/verify.test.ts` (create)
**Dependencies:** S0.3
**Implementation:**
- Mock admin client and rate limiter
- Test rate limiting (429 after 5 attempts)
- Test invalid token (no matching hash)
- Test already used invite (status !== 'pending')
- Test expired invite
- Test valid invite returns email, inviterName, memberTier
**Unit Tests (Vitest):**
- Returns 429 when rate limited
- Returns `{ valid: false }` for unknown token hash
- Returns `{ valid: false, reason: '이미 사용된...' }` for non-pending status
- Returns `{ valid: false, reason: '초대가 만료...' }` for expired invite
- Returns `{ valid: true, email, invitedByName, memberTier }` for valid invite
**Acceptance Criteria:**
- [ ] All 5 test cases pass
- [ ] Rate limiting verified with mock

---

### Task ID: S4.2
**Name:** Unit tests for POST `/api/invites/accept`
**Files:**
- `src/__tests__/api/invites/accept.test.ts` (create)
**Dependencies:** S0.3
**Note:** S4.5.1 and S4.5.2 MUST be applied before these tests are finalized. Tests should verify the atomic pattern (single `UPDATE ... WHERE status='pending' RETURNING *` and `getUserByEmail`), NOT the original sequential read-check-update pattern or `listUsers()` scan.
**Implementation:**
- Mock admin client with `auth.admin.createUser`, `auth.admin.getUserByEmail`
- Test full accept flow: atomic invite consume -> create/find auth user -> create vcx_members -> confirm accepted
- Test edge cases: expired invite auto-updates to 'expired', existing auth user reuse with password update
**Unit Tests (Vitest):**
- Returns 429 when rate limited
- Returns 400 when missing token/password/name
- Returns 400 when password < 8 chars
- Returns 400 for invalid token hash
- Returns 400 for expired invite (and updates status to 'expired')
- Creates new auth user when email not in auth.users
- Reuses existing auth user when email already in auth.users
- Updates password for existing auth user on re-invite (via `updateUserById`)
- Creates vcx_members row with correct fields
- Sets `endorsed_by` for 'endorsed' tier from recommendation
- Atomic invite status update: concurrent accept calls result in only one success
- Returns `{ success: true }` with session or login redirect
**Acceptance Criteria:**
- [ ] All 12 test cases pass (updated from 11 to include atomic + password update tests)
- [ ] Both new-user and existing-user paths tested
- [ ] Concurrent accept verified: only first caller succeeds

---

### Task ID: S4.3
**Name:** Unit tests for POST `/api/invites/direct`, POST `/api/invites/[id]/revoke`, GET `/api/invites/list`
**Files:**
- `src/__tests__/api/invites/direct.test.ts` (create)
- `src/__tests__/api/invites/revoke.test.ts` (create)
- `src/__tests__/api/invites/list.test.ts` (create)
**Dependencies:** S0.3
**Implementation:**
- Direct: auth + admin check, duplicate member/invite check, creates invite + sends email
- Revoke: auth + admin check, updates status to 'revoked'
- List: auth + admin check, pagination, status filter, email search
**Unit Tests (Vitest):**
- Direct: returns 401/403 for auth/admin
- Direct: returns 409 for existing member
- Direct: returns 409 for existing pending invite
- Direct: returns 201, creates invite, calls sendInviteEmail
- Revoke: returns 401/403 for auth/admin
- Revoke: returns 404 for non-pending invite
- Revoke: returns 200 with revoked invite
- List: returns 401/403 for auth/admin
- List: returns paginated results
- List: filters by status and search
**Acceptance Criteria:**
- [ ] All 10 test cases pass

---

**Sprint 4 QA Gate:**
- [ ] All Sprint 0-4 tests pass
- [ ] All invite API routes have full test coverage
- [ ] `npm run build` still succeeds

---

## Sprint 4.5: Security Hardening

> **CRITICAL:** These tasks address race conditions, O(n) scans, and missing security controls discovered in architecture review. S4.5.1 and S4.5.2 must be completed before S4.2 tests are finalized.

### Task ID: S4.5.1
**Name:** Atomic invite acceptance to prevent race condition (CRITICAL)
**Files:**
- `src/app/api/invites/accept/route.ts` (modify)
- `supabase/migrations/YYYYMMDDHHMMSS_add_vcx_consume_invite_rpc.sql` (create)
**Dependencies:** S0.3
**Implementation:**
- Create Supabase RPC function `vcx_consume_invite(p_token_hash text, p_new_status text)` that executes:
  ```sql
  UPDATE vcx_invites
  SET status = p_new_status, accepted_at = now()
  WHERE token_hash = p_token_hash AND status = 'pending'
  RETURNING *;
  ```
- Replace the current sequential read-then-update pattern in `route.ts` with a single call to `supabase.rpc('vcx_consume_invite', { p_token_hash, p_new_status: 'accepted' })`
- If RPC returns no rows, the invite was already consumed by a concurrent request — return 400 "이미 처리된 초대입니다"
- The atomicity guarantee comes from the `WHERE status='pending'` predicate executing inside a single DB statement
**Unit Tests (Vitest):**
- Concurrent accept calls: mock RPC to return rows on first call and empty on second call
- First caller receives `{ success: true }`, second caller receives 400
- Single DB round-trip verified: `rpc` called once, no separate SELECT before UPDATE
**Acceptance Criteria:**
- [ ] Migration file created with correct SQL function
- [ ] `route.ts` uses `supabase.rpc('vcx_consume_invite', ...)` instead of SELECT + UPDATE
- [ ] Concurrent accept results in only first caller succeeding
- [ ] All 3 test cases pass

---

### Task ID: S4.5.2
**Name:** Replace listUsers() with getUserByEmail() to eliminate O(n) scan (CRITICAL)
**Files:**
- `src/app/api/invites/accept/route.ts:30-31` (modify)
**Dependencies:** S0.3
**Implementation:**
- Remove: `const { data: { users } } = await adminClient.auth.admin.listUsers()`
- Remove: `const existingUser = users.find(u => u.email === email)`
- Replace with: `const { data: { user: existingUser } } = await adminClient.auth.admin.getUserByEmail(email)`
- This is a one-line replacement — no other logic changes needed
**Unit Tests (Vitest):**
- Mock `adminClient.auth.admin.getUserByEmail` and verify it is called with the invite email
- Verify `adminClient.auth.admin.listUsers` is never called
- Verify behavior is identical: found user reuses existing auth record, not-found user triggers createUser
**Acceptance Criteria:**
- [ ] `listUsers` call removed from `accept/route.ts`
- [ ] `getUserByEmail(email)` used in its place
- [ ] All 3 test cases pass

---

### Task ID: S4.5.3
**Name:** Update password for existing auth user on re-invite (HIGH)
**Files:**
- `src/app/api/invites/accept/route.ts:34-35` (modify)
**Dependencies:** S4.5.2
**Implementation:**
- After `getUserByEmail` returns an existing user, call:
  `await adminClient.auth.admin.updateUserById(existingUser.id, { password })`
- This ensures the user can log in with the password they set during invite acceptance, even if they already had an auth account
- Do NOT skip this step when `existingUser` is found — the password from the form is their intended credential
**Unit Tests (Vitest):**
- When `getUserByEmail` returns existing user: `updateUserById` is called with correct `userId` and `password`
- Existing user can subsequently authenticate with the new password (mock `signInWithPassword` succeeds)
- When `getUserByEmail` returns null: `createUser` is called instead (no `updateUserById`)
**Acceptance Criteria:**
- [ ] `updateUserById` called for existing users with the submitted password
- [ ] `createUser` still called for new users
- [ ] All 3 test cases pass

---

### Task ID: S4.5.4
**Name:** Wrap approve flow in DB transaction to prevent partial failure (HIGH)
**Files:**
- `src/app/api/recommendations/[id]/approve/route.ts:28-51` (modify)
- `supabase/migrations/YYYYMMDDHHMMSS_add_vcx_approve_recommendation_rpc.sql` (create)
- `supabase/schema.sql` or existing migration (modify - add `email_sent` boolean to `vcx_invites`)
**Dependencies:** S0.3
**Implementation:**
- Add `email_sent boolean NOT NULL DEFAULT false` column to `vcx_invites` table
- Create Supabase RPC function `vcx_approve_recommendation(p_rec_id uuid, p_reviewer_id uuid, p_token_hash text, p_expires_at timestamptz, p_email text, p_tier text, p_invited_by uuid)` that atomically:
  1. Updates `vcx_recommendations` status to 'approved'
  2. Inserts into `vcx_invites` with `email_sent = false`
  3. Returns the new invite row
- In `route.ts`: replace sequential update + insert with single `supabase.rpc('vcx_approve_recommendation', ...)`
- After RPC succeeds, call `sendInviteEmail()`; on success update `email_sent = true`
- If email fails, the recommendation + invite are still committed — retry is possible via `email_sent = false` flag
**Unit Tests (Vitest):**
- RPC called once with all required params
- On RPC success + email success: both recommendation and invite rows exist, `email_sent = true`
- On RPC success + email failure: both rows still exist (no rollback), `email_sent = false`
- On RPC failure: 500 returned, no partial state
**Acceptance Criteria:**
- [ ] Migration files created for both column and RPC
- [ ] `approve/route.ts` uses RPC for atomic DB operation
- [ ] `email_sent` flag allows email retry without duplicate invite creation
- [ ] All 4 test cases pass

---

### Task ID: S4.5.5
**Name:** Escape wildcards in ilike search parameter (HIGH)
**Files:**
- `src/app/api/invites/list/route.ts:22` (modify)
**Dependencies:** S0.3
**Implementation:**
- Before interpolating `search` into the `.ilike('email', \`%${search}%\`)` call, escape special characters:
  ```ts
  const safeSearch = search.replace(/%/g, '\\%').replace(/_/g, '\\_')
  ```
- Use `safeSearch` in the ilike call: `.ilike('email', \`%${safeSearch}%\`)`
- This prevents a search string of `%` from matching every row, and `_` from acting as a single-character wildcard
**Unit Tests (Vitest):**
- Search with `%` as input: mock verifies `.ilike` called with `\\%`, not raw `%`
- Search with `_` as input: mock verifies `.ilike` called with `\\_`, not raw `_`
- Normal search term (e.g., `"user@example"`) passes through unchanged
**Acceptance Criteria:**
- [ ] `%` and `_` in search param are escaped before ilike interpolation
- [ ] All 3 test cases pass

---

### Task ID: S4.5.6
**Name:** Distinguish auth errors from connectivity errors in getVcxUser (HIGH)
**Files:**
- `src/lib/auth/get-vcx-user.ts:36-38` (modify)
**Dependencies:** S0.3
**Implementation:**
- Wrap the `supabase.auth.getUser()` call in a try/catch
- If `error` is present on the result AND `error.status` is in `[401, 403]`: return `null` (expected — not logged in)
- If a thrown exception is caught (network/connectivity failure): return an explicit error sentinel, e.g. `{ error: 'network', user: null }` or throw a typed error that callers can distinguish
- Update callers (middleware, server components) to handle the new error state: treat network errors as "indeterminate" rather than "not authenticated", to avoid locking out users during transient outages
- Export a `VcxUserResult` type: `VcxUser | null | { error: 'network' | 'unknown' }`
**Unit Tests (Vitest):**
- `auth.getUser()` returns 401 error: `getVcxUser` returns `null`
- `auth.getUser()` returns 403 error: `getVcxUser` returns `null`
- `auth.getUser()` throws (network error): `getVcxUser` returns `{ error: 'network' }`
- Middleware receiving `{ error: 'network' }`: does not redirect to login, passes request through
**Acceptance Criteria:**
- [ ] Auth errors (401/403) return `null` as before
- [ ] Network/connectivity errors return distinguishable error state
- [ ] Middleware updated to handle `{ error: 'network' }` without false logout
- [ ] All 4 test cases pass

---

### Task ID: S4.5.7
**Name:** Replace in-memory rate limiter with Supabase-backed persistent store
**Files:**
- `src/lib/rate-limit.ts` (rewrite)
- `supabase/migrations/003_vcx_rate_limit.sql` (create)
**Dependencies:** S0.3
**Severity:** CRITICAL (in-memory Map resets on every serverless cold start — rate limiting is effectively a no-op on Vercel)
**Implementation:**
- Create `vcx_rate_limits` table: `key TEXT, count INT, window_start TIMESTAMPTZ, PRIMARY KEY (key)`
- Create Supabase RPC `vcx_check_rate_limit(p_key TEXT, p_limit INT, p_window_ms INT)` that atomically increments counter or resets if window expired, returns `{ allowed: BOOLEAN, remaining: INT }`
- Rewrite `src/lib/rate-limit.ts` to call the RPC via adminClient
- Keep the same external API: `rateLimit(key, { limit, windowMs })` returns `{ success, remaining }`
- Add cleanup: auto-expire rows older than 24h via Supabase cron or lazy cleanup
**Unit Tests (Vitest):**
- `rateLimit` calls Supabase RPC with correct params
- Returns `{ success: true }` when under limit
- Returns `{ success: false }` when limit exceeded
- Resets after window expires
- Different keys tracked independently
**Acceptance Criteria:**
- [ ] Rate limiting persists across serverless cold starts
- [ ] All 5 test cases pass
- [ ] Existing rate limit callers (verify, accept endpoints) work without changes

---

### Task ID: S4.5.8
**Name:** Add explicit INSERT RLS policy on vcx_members
**Files:**
- `supabase/migrations/004_vcx_members_insert_policy.sql` (create)
**Dependencies:** None
**Severity:** HIGH (defense-in-depth — currently safe because invite accept uses adminClient, but any non-admin client INSERT would silently fail)
**Implementation:**
- Add INSERT policy: `CREATE POLICY vcx_members_insert ON vcx_members FOR INSERT WITH CHECK (false);`
- This explicitly documents that ONLY service-role (adminClient) can insert members
- Also add DELETE policy: `CREATE POLICY vcx_members_delete ON vcx_members FOR DELETE USING (false);`
- Document in migration comment why these are restrictive
**Unit Tests (Vitest):**
- Verify migration SQL is syntactically valid
- (Integration) Confirm anon client cannot INSERT into vcx_members
- (Integration) Confirm admin client CAN INSERT into vcx_members
**Acceptance Criteria:**
- [ ] Migration applies without errors
- [ ] INSERT and DELETE policies exist on vcx_members
- [ ] Service-role client still works for invite acceptance flow

---

**Sprint 4.5 QA Gate:**
- [ ] All Sprint 0-4.5 tests pass
- [ ] Atomic invite accept verified (no race condition)
- [ ] `listUsers()` removed from codebase
- [ ] Existing user password updated on re-invite
- [ ] Approve flow atomic (partial failure = rollback)
- [ ] Search wildcards escaped in list route
- [ ] Network errors distinguished from auth errors in getVcxUser
- [ ] Rate limiting uses persistent storage
- [ ] RLS INSERT policy verified on vcx_members
- [ ] `npm run build` still succeeds

---

## Sprint 5: Admin Dashboard Component Tests

### Task ID: S5.1
**Name:** Unit tests for RecommendationList component
**Files:**
- `src/__tests__/components/admin/recommendation-list.test.tsx` (create)
**Dependencies:** S0.3
**Implementation:**
- Mock `fetch` for list and action endpoints
- Test renders filter buttons (전체, 대기, 승인, 거절)
- Test data fetching and rendering recommendation items
- Test approve/reject button actions
- Test pagination
**Unit Tests (Vitest):**
- Renders filter buttons with correct labels
- Fetches data on mount with `status=pending` default
- Renders recommendation items with name, email, tier badge
- Shows "승인" and "거절" buttons for pending items
- Hides action buttons for non-pending items
- Clicking "승인" calls `/api/recommendations/{id}/approve`
- Clicking "거절" calls `/api/recommendations/{id}/reject`
- Changing filter refetches with new status param
- Shows "추천이 없습니다" when empty
**Acceptance Criteria:**
- [ ] All 9 test cases pass

---

### Task ID: S5.2
**Name:** Unit tests for InviteList component
**Files:**
- `src/__tests__/components/admin/invite-list.test.tsx` (create)
**Dependencies:** S0.3
**Implementation:**
- Mock `fetch` for list, direct invite, and revoke endpoints
- Test filter buttons, search input, "직접 초대" button
- Test direct invite form submission
- Test revoke action
**Unit Tests (Vitest):**
- Renders all 5 filter buttons
- Renders search input
- Renders "직접 초대" button
- Fetches data on mount
- Shows invite items with email, status badge, tier, inviter
- Shows "취소" button only for pending invites
- Clicking "직접 초대" shows create form
- Create form submits to `/api/invites/direct`
- Shows error from API in create form
- Clicking "취소" calls `/api/invites/{id}/revoke`
**Acceptance Criteria:**
- [ ] All 10 test cases pass

---

### Task ID: S5.3
**Name:** Unit tests for AdminTabs, StatusBadge, and admin layout redirect
**Files:**
- `src/__tests__/components/admin/admin-tabs.test.tsx` (create)
- `src/__tests__/components/admin/status-badge.test.tsx` (create)
**Dependencies:** S0.3
**Implementation:**
- AdminTabs: renders both tab links, active state based on pathname
- StatusBadge: renders correct label and color for each status
**Unit Tests (Vitest):**
- AdminTabs: renders "추천 심사" and "초대 관리" links
- AdminTabs: active tab has gold border-bottom
- StatusBadge: renders "대기" with gold color for 'pending'
- StatusBadge: renders "승인" with green for 'approved'
- StatusBadge: renders "거절" with red for 'rejected'
- StatusBadge: renders "수락" with green for 'accepted'
- StatusBadge: renders "만료" with gray for 'expired'
- StatusBadge: renders "취소" with red for 'revoked'
- StatusBadge: renders raw status for unknown status
**Acceptance Criteria:**
- [ ] All 9 test cases pass

---

**Sprint 5 QA Gate:**
- [ ] All Sprint 0-5 tests pass
- [ ] All admin components have test coverage
- [ ] `npm run build` still succeeds

---

## Sprint 6: Route Protection & UX Polish

### Task ID: S6.1
**Name:** Implement login wall integration for protected routes
**Files:**
- `src/app/(protected)/coffeechat/page.tsx` (create or modify - wire LoginWall)
- `src/app/(protected)/community/page.tsx` (create or modify)
- `src/app/(protected)/ceo-coffeechat/page.tsx` (create or modify)
- `src/app/(protected)/directory/page.tsx` (create or modify)
- `src/components/layout/protected-page-wrapper.tsx` (create)
**Dependencies:** None
**Implementation:**
- Create `ProtectedPageWrapper` server component that:
  - Reads `x-vcx-authenticated` header from middleware
  - If `false`: renders children with `<LoginWall>` overlay
  - If `true`: renders children normally
- Wrap each protected page with `ProtectedPageWrapper`
- Alternative: use `getVcxUser()` in each page's server component
**Unit Tests (Vitest):**
- ProtectedPageWrapper: renders LoginWall when not authenticated
- ProtectedPageWrapper: renders children when authenticated
**Integration/E2E Tests (Playwright):**
- Navigate to `/coffeechat` without auth -> see blur overlay + login prompt
- Navigate to `/coffeechat` with auth -> see page content
**Acceptance Criteria:**
- [ ] All 4 protected routes show login wall for unauthenticated users
- [ ] Login wall has blur overlay and "멤버 전용 콘텐츠입니다" text
- [ ] Login button in wall links to `/login?redirect={currentPath}`

---

### Task ID: S6.2
**Name:** Wire authenticated redirect after login (post-login redirect)
**Files:**
- `src/components/auth/login-form.tsx` (verify - already implemented)
- `src/app/(auth)/login/page.tsx` (verify - already passes redirect param)
**Dependencies:** S6.1
**Implementation:**
- Verify login form reads `redirectTo` prop and passes to `router.push`
- Verify login page reads `?redirect` from searchParams and passes to LoginForm
- Test that clicking login wall -> login -> authenticate -> redirects back to original page
**Unit Tests (Vitest):**
- LoginForm with redirectTo="/coffeechat" -> pushes "/coffeechat" on success
**Integration/E2E Tests (Playwright):**
- Visit `/coffeechat` -> click login wall "로그인" -> login -> verify redirected to `/coffeechat`
**Acceptance Criteria:**
- [ ] Post-login redirect works for all protected routes
- [ ] Default redirect is `/` when no redirect param

---

### Task ID: S6.3
**Name:** Middleware unit tests
**Files:**
- `src/__tests__/middleware.test.ts` (create)
**Dependencies:** S0.3
**Implementation:**
- Mock `@supabase/ssr` createServerClient
- Test each route category handling:
  - Static/asset routes: pass through
  - Auth routes: pass through
  - Public routes: pass through
  - Semi-public: set `x-vcx-authenticated` header
  - Protected: set `x-vcx-authenticated` header based on membership
  - Admin: redirect to login if not authed, redirect to `/` if not admin
  - API: return 401/403 for unauthed/non-member
**Unit Tests (Vitest):**
- Bypasses `/_next` routes
- Bypasses routes with file extensions
- Allows auth routes through
- Allows public routes through
- Sets `x-vcx-authenticated: false` for semi-public without auth
- Sets `x-vcx-authenticated: true` for semi-public with auth
- Returns 401 JSON for unauthenticated API requests
- Returns 403 JSON for non-member API requests
- Redirects to `/login?redirect=` for unauthenticated admin access
- Redirects to `/` for non-admin users on admin routes
- Allows admin users through on admin routes
- Sets `x-vcx-authenticated` correctly for protected routes
**Acceptance Criteria:**
- [ ] All 12 test cases pass
- [ ] All route categories have coverage

---

**Sprint 6 QA Gate:**
- [ ] All Sprint 0-6 tests pass
- [ ] Login wall visible on protected pages for unauthenticated users
- [ ] Post-login redirect works
- [ ] Middleware fully tested
- [ ] `npm run build` still succeeds

---

## Sprint 7: E2E Integration & Final QA

### Task ID: S7.1
**Name:** E2E test: Login flow
**Files:**
- `e2e/auth/login.spec.ts` (create)
**Dependencies:** S0.4
**Implementation:**
- Seed test member in DB
- Test successful login with valid credentials
- Test failed login with wrong password
- Test redirect after login
- Test login page redirects to `/` if already logged in
**Integration/E2E Tests (Playwright):**
- Visit `/login` -> fill form -> submit -> verify redirected to `/`
- Visit `/login` with wrong password -> verify error message visible
- Visit `/login` when already authenticated -> verify redirected away
- Visit `/coffeechat` -> login wall -> login -> verify back at `/coffeechat`
**Acceptance Criteria:**
- [ ] All 4 E2E scenarios pass
- [ ] Tests clean up seeded data after run

---

### Task ID: S7.2
**Name:** E2E test: Invite acceptance flow
**Files:**
- `e2e/auth/invite-accept.spec.ts` (create)
**Dependencies:** S0.4
**Implementation:**
- Seed admin + create invite via API (generate token, insert invite with known hash)
- Test full flow: visit `/invite/accept?token=X` -> verify info shown -> fill form -> submit -> account created
- Test expired token
- Test invalid token
**Integration/E2E Tests (Playwright):**
- Visit with valid token -> see inviter name and email -> fill name/password -> submit -> redirected
- Visit with invalid token -> see error "유효하지 않은 초대 링크입니다"
- Visit with expired token -> see error "초대가 만료되었습니다"
- After accept, new user can login with created credentials
**Acceptance Criteria:**
- [ ] All 4 E2E scenarios pass
- [ ] New vcx_members row created with correct fields

---

### Task ID: S7.3
**Name:** E2E test: Admin recommendation approval workflow
**Files:**
- `e2e/admin/recommendations.spec.ts` (create)
**Dependencies:** S0.4
**Implementation:**
- Seed admin + core member + pending recommendation
- Test admin views recommendations list
- Test approve action -> invite created
- Test reject action -> status updated
**Integration/E2E Tests (Playwright):**
- Login as admin -> navigate to `/admin/recommendations` -> see pending recommendation
- Click "승인" -> verify recommendation disappears from pending list
- Verify invite email logged to console (dev mode)
- Click "거절" on another recommendation -> verify updated
**Acceptance Criteria:**
- [ ] All 4 E2E scenarios pass
- [ ] Full Recommend -> Approve -> Invite chain verified

---

### Task ID: S7.4
**Name:** E2E test: Admin invite management + forgot/reset password
**Files:**
- `e2e/admin/invites.spec.ts` (create)
- `e2e/auth/password-reset.spec.ts` (create)
**Dependencies:** S0.4
**Implementation:**
- Admin invites: direct invite creation, list filtering, revoke
- Password reset: forgot password form submission, reset password form
**Integration/E2E Tests (Playwright):**
- Admin: visit `/admin/invites` -> click "직접 초대" -> fill email -> submit -> appears in list
- Admin: filter by status -> verify filtered results
- Admin: click "취소" on pending invite -> verify status changes
- Password: visit `/forgot-password` -> enter email -> submit -> see success message
- Password: visit `/reset-password` (with mocked session) -> enter new password -> submit -> redirect to login
**Acceptance Criteria:**
- [ ] All 5 E2E scenarios pass

---

### Task ID: S7.5
**Name:** Full regression test + coverage report + build verification
**Files:**
- `package.json` (add `"test:coverage"` script)
**Dependencies:** S7.1, S7.2, S7.3, S7.4
**Implementation:**
- Run full unit test suite with coverage
- Run full E2E test suite
- Run `npm run build` to verify production build
- Generate coverage report and verify critical files have >80% coverage
- Fix any flaky tests
**Acceptance Criteria:**
- [ ] `npm run test -- --run --coverage` passes with >80% overall coverage
- [ ] `npm run test:e2e` all scenarios pass
- [ ] `npm run build` succeeds without errors
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Critical paths covered: login, invite accept, admin approve, route protection

**Security Regression Checklist:**
- [ ] No race condition on concurrent invite accept (atomic `UPDATE ... WHERE status='pending'`)
- [ ] No full user list scan (`listUsers()` absent, `getUserByEmail()` used instead)
- [ ] Existing user password updated on re-invite (`updateUserById` called with submitted password)
- [ ] Approve flow atomic: partial failure (RPC success + email failure) leaves both rows committed, `email_sent=false` for retry
- [ ] Search wildcards escaped: `%` and `_` in search param are escaped before ilike interpolation
- [ ] Network errors distinguished from auth errors in `getVcxUser` (no false logout during outages)
- [ ] Rate limiting persists across serverless cold starts (not in-memory)
- [ ] vcx_members has explicit INSERT/DELETE RLS policies

---

**Sprint 7 QA Gate (FINAL):**
- [ ] ALL unit tests pass (expected: ~130+ test cases)
- [ ] ALL E2E tests pass (expected: ~17 scenarios)
- [ ] Production build succeeds
- [ ] Coverage >80% on critical auth files
- [ ] Security regression checklist fully checked
- [ ] Complete auth flow verified end-to-end: Recommend -> Admin Approve -> Email (console.log) -> Invite Accept -> Account Created -> Login -> Access Protected Content

---

## Dependency Graph

```
S0.1 (Vitest) ─────┬── S0.3 (Test utils) ──┬── S1.1 (invite tests)
                    │                        ├── S1.2 (rate-limit tests)
S0.2 (Playwright) ──┼── S0.4 (E2E helpers)  ├── S1.3 (email tests)
                    │                        ├── S1.4 (auth util tests)
                    │                        ├── S2.1 (LoginForm tests)
                    │                        ├── S2.2 (Password form tests)
                    │                        ├── S2.3 (InviteAcceptForm tests)
                    │                        ├── S2.4 (Fix + UserMenu tests)
                    │                        ├── S3.1 (Rec create tests)
                    │                        ├── S3.2 (Rec approve tests)
                    │                        ├── S3.3 (Rec reject/list tests)
                    │                        ├── S4.1 (Invite verify tests)
                    │                        ├── S4.2 (Invite accept tests) ←── S4.5.1, S4.5.2 must land first
                    │                        ├── S4.3 (Invite direct/revoke/list)
                    │                        ├── S4.5.1 (Atomic invite accept) ─┐
                    │                        ├── S4.5.2 (getUserByEmail)        ├── S4.5.3 (Update existing user pw)
                    │                        ├── S4.5.4 (Atomic approve flow)   │
                    │                        ├── S4.5.5 (Escape wildcards)      │
                    │                        ├── S4.5.6 (getVcxUser errors)     │
                    │                        ├── S5.1 (RecommendationList tests)│
                    │                        ├── S5.2 (InviteList tests)        │
                    │                        ├── S5.3 (AdminTabs/StatusBadge)   │
                    │                        ├── S6.1 (Login wall integration)  │
                    │                        ├── S6.2 (Redirect verification)   │
                    │                        └── S6.3 (Middleware tests)        │
                    │                                                            │
                    └── S0.4 ───────────────┬── S7.1 (E2E login)               │
                                            ├── S7.2 (E2E invite accept)        │
                                            ├── S7.3 (E2E admin recommend)      │
                                            ├── S7.4 (E2E admin invite + pw)    │
                                            └── S7.5 (Final QA) ───────────────┘
                                                        ^
                                                   depends on S4.5.* completion
```

**Parallelizable groups:**
- S0.1 + S0.2 (independent installs)
- S1.1 + S1.2 + S1.3 + S1.4 (all depend only on S0.3)
- S2.1 + S2.2 + S2.3 (independent component tests)
- S3.1 + S3.2 + S3.3 (independent API tests)
- S4.1 + S4.3 (independent API tests, S4.2 depends on S4.5.1 + S4.5.2)
- S4.5.1 + S4.5.2 + S4.5.4 + S4.5.5 + S4.5.6 (independent security fixes, all depend only on S0.3)
- S4.5.3 depends on S4.5.2 (needs getUserByEmail in place first)
- S5.* and S6.* can run in parallel with S4.5.* (no interdependency)
- S7.1 + S7.2 + S7.3 + S7.4 (independent E2E tests, all need S0.4)
- S7.5 depends on S7.1-S7.4 AND S4.5.* completion

---

## Success Criteria

1. **Functional completeness:** All auth flows work end-to-end (login, invite accept, admin approve, password reset, route protection)
2. **Test coverage:** >80% line coverage on all files under `src/lib/` and `src/app/api/`
3. **E2E verification:** 17+ E2E scenarios passing across login, invite, admin, and password flows
4. **Build health:** `npm run build` and `npx tsc --noEmit` pass cleanly
5. **Single bug fix:** LinkedIn URL captured in invite accept form submission
6. **Login wall:** All 4 protected routes show blur overlay for unauthenticated users
7. **Security hardening:** All 6 security tasks in S4.5 completed and verified — no race conditions, no O(n) scans, no missing password updates, no wildcard injection, no false logouts on network errors

---

## Changelog

- **v2 (2026-03-25):** Integrated architect security review findings
  - Added Sprint 4.5: Security Hardening (6 tasks → S4.5.1 through S4.5.6)
  - Added S4.2 dependency on S4.5.1 + S4.5.2
  - Added security regression checklist to S7.5
- **v3 (2026-03-25):** Addressed critic review feedback
  - Added S4.5.7: Persistent rate limiting (CRITICAL)
  - Added S4.5.8: RLS INSERT policy on vcx_members (HIGH)
  - Fixed parallelizability error: S4.2 removed from S4.1+S4.3 parallel group
  - Total tasks: 28 → 36
