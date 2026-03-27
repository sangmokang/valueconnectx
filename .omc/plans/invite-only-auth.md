# Invite-Only Authentication System - Implementation Plan (Revised)

**Created:** 2026-03-24
**Revised:** 2026-03-24 (v2 - Architect + Critic feedback incorporated)
**Status:** Draft - Awaiting Approval
**Estimated Complexity:** HIGH
**Estimated Files:** ~30 new, ~7 modified

---

## Context

ValueConnect X is a Private Talent Network with zero public signup. All members enter through invitation only, following a two-step flow: Core Member recommends, Admin approves and sends invite. Currently the project has:
- Next.js 14 App Router with 2 pages (`/`, `/coffeechat`)
- `@supabase/supabase-js` installed but NOT configured (no `.env`, no middleware, no client)
- GNB (`src/components/layout/gnb.tsx`) with hardcoded `menuItems` array (lines 6-16) — does NOT import from any shared navigation config
- Design system in `globals.css` with VCX color tokens (`--color-beige`, `--color-dark`, `--color-gold`, etc.) but NO Deep Navy token yet
- Complete data model spec in `src/specs/data-models.md` using `MemberTier` naming, while `src/types/index.ts` uses `MemberType` — these are misaligned
- `layout.tsx` is a Server Component that renders `<GNB />` directly — no providers wrapper exists
- No existing auth pages, no middleware, no Supabase client setup

**CRITICAL: Shared Supabase Instance.** The Supabase project is shared with other applications. All VCX tables MUST use the `vcx_` prefix to avoid collisions. All RLS policies MUST include application-level membership checks (user must exist in `vcx_members` or `vcx_corporate_users`), because `auth.users` is shared across all projects in the same Supabase instance.

---

## Auth Approach: Hybrid (Magic Link + Password)

**Flow:**
1. **Recommendation**: Core Member recommends a candidate via the app
2. **Approval**: Admin reviews and approves the recommendation, which creates an invite and sends the email
3. **Invite acceptance**: Magic link (token in URL -> verify -> create account with password)
4. **Subsequent logins**: Email + password (fast, no email check needed)
5. **Forgot password**: Magic link recovery via Supabase built-in

---

## Work Objectives

0. Audit shared database and establish VCX namespace
1. Set up Supabase infrastructure (client, env, types, providers)
2. Create database schema with RLS policies for all VCX tables (vcx_ prefix)
3. Build the recommendation -> approval -> invite -> acceptance flow
4. Build premium login/signup pages matching the design system
5. Implement route protection (middleware with two-layer auth check + login wall)
6. Update GNB with auth state awareness (refactor to use shared navigation config)
7. Create admin interface (recommendations review + invite management)

---

## Guardrails

### Must Have
- `vcx_` prefix on ALL database tables (shared Supabase instance)
- Two-layer auth: valid Supabase session AND row in `vcx_members` or `vcx_corporate_users`
- Two-step invite: Core Member recommends -> Admin approves -> invite sent
- Invite tokens: store SHA-256 hash in DB, send raw token in email
- 24-hour token expiration on invites
- RLS on all tables with application-level membership check
- Idempotent migrations (IF NOT EXISTS)
- Premium visual quality (zero border-radius, Georgia serif, beige/dark/gold)
- Korean UI copy with exclusive tone
- Protected routes show blur overlay + lock modal
- GNB imports from shared navigation config (no hardcoded menu items)

### Must NOT Have
- Public "회원가입" (Sign Up) button anywhere
- Border-radius on any auth UI elements
- Shadows or gradients on auth pages
- Direct Supabase calls from client components (use server actions or API routes)
- Hardcoded secrets in source code
- Tables without `vcx_` prefix
- Auth checks that rely solely on Supabase session (must also check VCX membership)

---

## Task Flow (Dependency Graph)

```
Step 0: Database Audit (prerequisite for all)
    |
Step 1: Supabase Infrastructure + Type Alignment
    |
Step 2: Database Schema + RLS (vcx_ prefixed)
    |
    +------+------+
    |             |
    v             v
Step 3:       Step 5:
Recommend +   Route Protection
Invite Flow   (two-layer auth)
    |             |
    v             v
Step 4:       Step 6:
Login UX      GNB Refactor
    |
    v
Step 7: Admin Interface (Recommendations + Invites)
```

---

## Step 0: Database Audit & Namespace Verification

**Goal:** Confirm no table name collisions exist in the shared Supabase instance before creating any VCX tables. Establish the `vcx_` namespace convention.

### Actions
1. Query `information_schema.tables` for any existing tables matching `vcx_*`
2. Query for any existing tables named `members`, `invites`, `corporate_users`, `recommendations` (without prefix) to confirm they belong to other projects
3. Document findings

### Files to Create
| File | Purpose |
|------|---------|
| `supabase/migrations/000_audit_existing.sql` | SELECT-only audit query (no mutations) to verify namespace is clear |

### Acceptance Criteria
- [ ] Executor has run the audit query against the live Supabase instance and confirmed zero `vcx_*` tables exist
- [ ] If any `vcx_*` tables already exist, executor has documented them and asked for resolution before proceeding
- [ ] Audit results are logged in a comment at the top of the first migration file

### Dependencies
- Supabase project URL + service role key available

---

## Step 1: Supabase Infrastructure Setup

**Goal:** Establish Supabase client, environment variables, auth helpers, providers wrapper, and align type naming conventions.

### Files to Create
| File | Purpose |
|------|---------|
| `.env.local` | Supabase URL + anon key + service role key + Resend key + site URL |
| `.env.example` | Template with empty values and comments explaining each variable |
| `src/lib/supabase/client.ts` | Browser Supabase client (singleton, uses `@supabase/ssr` `createBrowserClient`) |
| `src/lib/supabase/server.ts` | Server-side Supabase client (cookies-based via `@supabase/ssr` `createServerClient`) |
| `src/lib/supabase/middleware.ts` | Middleware helper to refresh auth session (uses `@supabase/ssr`) |
| `src/lib/supabase/admin.ts` | Service-role client for admin operations (bypassing RLS) |
| `src/types/supabase.ts` | Generated database types matching `vcx_*` table schemas from data-models.md |
| `src/app/providers.tsx` | `"use client"` component wrapping children with any client-side providers needed |

### Files to Modify
| File | Change |
|------|--------|
| `src/app/layout.tsx` | Import and wrap children with `<Providers>` component. Do NOT convert layout.tsx to a client component. |
| `src/types/index.ts` | Rename `MemberType` to `MemberTier` to align with `src/specs/data-models.md`. Update all references. |
| `src/app/globals.css` | Add `--color-deep-navy: #0F172A;` to the VCX Design System Colors section. Add `.bg-vcx-deep-navy { background-color: #0F172A; }` and `.text-vcx-deep-navy { color: #0F172A; }` utilities. |
| `package.json` | Add `@supabase/ssr` to dependencies. Keep `@supabase/supabase-js` as peer dependency. Add `resend`. |

### Type Naming Alignment
The spec (`src/specs/data-models.md`) uses `MemberTier` (`'core' | 'endorsed'`), but `src/types/index.ts` currently defines `MemberType`. The plan aligns on `MemberTier` as the canonical name. All existing references to `MemberType` in `src/types/index.ts` and any components using it must be updated.

### Acceptance Criteria
- [ ] `@supabase/ssr` and `resend` appear in `package.json` dependencies and install without error
- [ ] `.env.example` exists with all required variable names and descriptive comments
- [ ] Browser client can call `supabase.auth.getSession()` without error
- [ ] Server client can query tables from a Server Component
- [ ] `src/app/providers.tsx` is a `"use client"` component; `layout.tsx` remains a Server Component
- [ ] `MemberType` is renamed to `MemberTier` in `src/types/index.ts`; no TypeScript errors from the rename
- [ ] `--color-deep-navy: #0F172A` exists in `globals.css` VCX color section
- [ ] TypeScript types exist for all `vcx_*` tables defined in data-models.md

### Dependencies
- A Supabase project must exist (user provides URL + keys)

### Risks
- **Risk:** User hasn't created a Supabase project yet. **Mitigation:** `.env.example` serves as template. Step 0 audit will confirm connectivity.

---

## Step 2: Database Schema + RLS Policies

**Goal:** Create all VCX auth-related tables in Supabase with proper Row Level Security and application-level membership checks. All tables use `vcx_` prefix.

### Files to Create
| File | Purpose |
|------|---------|
| `supabase/migrations/001_vcx_auth_schema.sql` | Core tables: `vcx_members`, `vcx_invites`, `vcx_corporate_users`, `vcx_recommendations` |
| `supabase/migrations/002_vcx_rls_policies.sql` | RLS policies for all tables |
| `supabase/migrations/001_rollback.sql` | DROP TABLE IF EXISTS for all vcx_ tables (rollback) |
| `supabase/migrations/002_rollback.sql` | DROP POLICY IF EXISTS for all policies (rollback) |

### Tables

All migrations MUST use `CREATE TABLE IF NOT EXISTS` and `CREATE POLICY IF NOT EXISTS` for idempotency.

**`vcx_members` table:**
```sql
CREATE TABLE IF NOT EXISTS vcx_members (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  current_company text,
  title text,
  professional_fields text[],
  years_of_experience int,
  bio text,
  linkedin_url text,
  member_tier text NOT NULL CHECK (member_tier IN ('core', 'endorsed')),
  system_role text NOT NULL DEFAULT 'member' CHECK (system_role IN ('super_admin', 'admin', 'member')),
  join_date timestamptz DEFAULT now(),
  endorsed_by uuid REFERENCES vcx_members(id),
  endorsed_by_name text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**`vcx_invites` table:**
```sql
CREATE TABLE IF NOT EXISTS vcx_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  invited_by_name text NOT NULL,
  member_tier text NOT NULL CHECK (member_tier IN ('core', 'endorsed')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  token_hash text UNIQUE NOT NULL,  -- SHA-256 hash of the raw token
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  recommendation_id uuid REFERENCES vcx_recommendations(id),
  created_at timestamptz DEFAULT now()
);
```

**`vcx_corporate_users` table:**
```sql
CREATE TABLE IF NOT EXISTS vcx_corporate_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  company text NOT NULL,
  role text NOT NULL CHECK (role IN ('ceo', 'founder', 'c_level', 'hr_leader')),
  title text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**`vcx_recommendations` table (NEW - two-step invite flow):**
```sql
CREATE TABLE IF NOT EXISTS vcx_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommender_id uuid NOT NULL REFERENCES vcx_members(id),
  recommended_email text NOT NULL,
  recommended_name text NOT NULL,
  reason text,
  member_tier text NOT NULL CHECK (member_tier IN ('core', 'endorsed')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES vcx_members(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### RLS Policies

**CRITICAL:** Every policy must include an application-level check verifying the requesting user exists in `vcx_members` or `vcx_corporate_users`. A valid Supabase session alone is NOT sufficient (shared instance).

Helper function (created in migration 002):
```sql
CREATE OR REPLACE FUNCTION vcx_is_member(user_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM vcx_members WHERE id = user_id AND is_active = true)
      OR EXISTS (SELECT 1 FROM vcx_corporate_users WHERE id = user_id);
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION vcx_is_admin(user_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM vcx_members WHERE id = user_id AND system_role IN ('admin', 'super_admin') AND is_active = true);
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION vcx_is_core_member(user_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM vcx_members WHERE id = user_id AND member_tier = 'core' AND is_active = true);
$$ LANGUAGE sql SECURITY DEFINER;
```

| Table | Policy | Rule |
|-------|--------|------|
| `vcx_members` | SELECT | `vcx_is_member(auth.uid())` — only VCX members can read |
| `vcx_members` | UPDATE | `auth.uid() = id` — owner only |
| `vcx_members` | INSERT | Service role only (via admin client during invite acceptance) |
| `vcx_invites` | SELECT (by token) | `true` for token-based lookup (public verify endpoint uses service role anyway) |
| `vcx_invites` | INSERT | `vcx_is_admin(auth.uid())` |
| `vcx_invites` | UPDATE | `vcx_is_admin(auth.uid())` |
| `vcx_corporate_users` | SELECT | `vcx_is_member(auth.uid())` AND `is_verified = true` |
| `vcx_corporate_users` | ALL | `vcx_is_admin(auth.uid())` |
| `vcx_recommendations` | INSERT | `vcx_is_core_member(auth.uid())` — Core Members can recommend |
| `vcx_recommendations` | SELECT | `vcx_is_admin(auth.uid()) OR (auth.uid() = recommender_id)` — Admin sees all, recommender sees own |
| `vcx_recommendations` | UPDATE | `vcx_is_admin(auth.uid())` — Admin approves/rejects |

### Acceptance Criteria
- [ ] All four `vcx_*` tables exist in Supabase with correct column types and constraints
- [ ] Running migrations twice does not error (idempotent: IF NOT EXISTS)
- [ ] RLS is enabled on ALL four tables
- [ ] `vcx_is_member()`, `vcx_is_admin()`, `vcx_is_core_member()` helper functions exist
- [ ] A user with valid Supabase session but NO row in `vcx_members` CANNOT read `vcx_members` (two-layer auth verified)
- [ ] Authenticated VCX member can read other members but only update own row
- [ ] `token_hash` column on `vcx_invites` has unique index
- [ ] Core Member can INSERT into `vcx_recommendations` but cannot UPDATE
- [ ] Admin can UPDATE `vcx_recommendations` status
- [ ] Rollback scripts exist and can cleanly drop all `vcx_*` tables/policies

### Dependencies
- Step 0 (audit passed), Step 1 (Supabase connection)

---

## Step 3: Recommendation + Invite System (Backend + Email)

**Goal:** Implement the two-step flow: Core Member recommends -> Admin approves (creates invite + sends email) -> Recipient accepts invite. Tokens are stored as SHA-256 hashes for security.

### Files to Create
| File | Purpose |
|------|---------|
| `src/app/api/recommendations/route.ts` | POST: Core Member creates a recommendation |
| `src/app/api/recommendations/[id]/approve/route.ts` | POST: Admin approves recommendation -> creates invite + sends email |
| `src/app/api/recommendations/[id]/reject/route.ts` | POST: Admin rejects recommendation |
| `src/app/api/invites/verify/[token]/route.ts` | GET: Verify raw token validity (public). Rate limited: 5 attempts/IP/minute |
| `src/app/api/invites/accept/route.ts` | POST: Accept invite + create auth user + vcx_members row |
| `src/lib/invite.ts` | Token generation (`crypto.randomBytes(32).toString('hex')`), SHA-256 hashing, expiry calc |
| `src/lib/email.ts` | Resend SDK wrapper for sending invite emails |
| `src/lib/email-templates/invite.ts` | HTML email template (premium design, Korean copy) |

### Token Security
1. **Generation:** `crypto.randomBytes(32).toString('hex')` — 256-bit random token
2. **Storage:** SHA-256 hash stored in `vcx_invites.token_hash`. Raw token is NEVER stored in DB.
3. **Verification:** Hash the incoming token, compare against DB using timing-safe comparison (`crypto.timingSafeEqual`)
4. **Rate limiting:** Verify endpoint allows max 5 attempts per IP per minute (use simple in-memory map or middleware-level rate limiter)

### Recommendation Flow
1. **POST /api/recommendations** — Core Member submits `{ recommended_email, recommended_name, reason, member_tier }`
   - Validates caller is a Core Member (`vcx_is_core_member`)
   - Checks email is not already a member or has a pending invite
   - Inserts into `vcx_recommendations` with status `pending`
   - Returns recommendation record

2. **POST /api/recommendations/[id]/approve** — Admin approves
   - Validates caller is admin
   - Updates recommendation status to `approved`, sets `reviewed_by` and `reviewed_at`
   - Generates secure token, stores SHA-256 hash in `vcx_invites`
   - Sends invite email via Resend with link: `{SITE_URL}/invite/accept?token={raw_token}`
   - Returns created invite record

3. **POST /api/recommendations/[id]/reject** — Admin rejects
   - Validates caller is admin
   - Updates recommendation status to `rejected`, sets `reviewed_by` and `reviewed_at`
   - Returns updated recommendation

### Invite Acceptance Flow
4. **GET /api/invites/verify/[token]** — Public, rate-limited
   - Hashes incoming token with SHA-256
   - Checks `vcx_invites` for matching `token_hash` with status `pending` and `expires_at > now()`
   - Returns `{ valid: true, email, invitedByName, memberTier }` or `{ valid: false, reason }`

5. **POST /api/invites/accept** — Public
   - Receives `{ token, password, name }`
   - Verifies token (same hash + timing-safe compare)
   - **If email already exists in `auth.users`**: Skip auth user creation, just link existing `auth.users.id` to new `vcx_members` row
   - **If email is new**: Create Supabase auth user with `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
   - Insert row into `vcx_members` with data from invite + recommendation
   - Update invite status to `accepted`, set `accepted_at`
   - Return session tokens for immediate login

### Acceptance Criteria
- [ ] Core Member can POST to `/api/recommendations` and receive a recommendation record
- [ ] Non-Core-Member receives 403 when trying to create a recommendation
- [ ] Admin can approve a recommendation, which creates a `vcx_invites` row and sends an email
- [ ] Admin can reject a recommendation with a status update
- [ ] Invite email contains a link with the raw token (not the hash)
- [ ] Token is generated with `crypto.randomBytes(32)` (256-bit)
- [ ] Only SHA-256 hash is stored in `vcx_invites.token_hash`; raw token never persisted
- [ ] Token verification uses timing-safe comparison
- [ ] Verify endpoint returns 429 after 5 rapid requests from the same IP
- [ ] Accepting an invite where the email already exists in `auth.users` creates only the `vcx_members` row (no duplicate auth user error)
- [ ] Accepting a valid invite creates both auth.users entry (if needed) AND `vcx_members` row
- [ ] Accepting an expired or already-accepted token returns clear error message
- [ ] Duplicate recommendation for same email (while pending) is rejected

### Dependencies
- Step 1 (Supabase client), Step 2 (tables exist)
- Resend API key in `.env.local`

### Risks
- **Risk:** Resend not configured. **Mitigation:** Abstract email behind `src/lib/email.ts`. Log email content to console in development.
- **Risk:** Email already exists in shared `auth.users`. **Mitigation:** Explicit handling — check first, create `vcx_members` row linked to existing `auth.users.id`.

---

## Step 4: Login & Invite Acceptance UX

**Goal:** Premium, exclusive-feeling authentication pages matching the VCX design language. Uses Deep Navy (#0F172A) background (token added in Step 1).

### Files to Create
| File | Purpose |
|------|---------|
| `src/app/(auth)/layout.tsx` | Auth route group layout (Deep Navy `bg-vcx-deep-navy` background, centered content, no GNB) |
| `src/app/(auth)/login/page.tsx` | Login page: email + password form |
| `src/app/(auth)/invite/accept/page.tsx` | Invite acceptance: token verification + account creation form |
| `src/app/(auth)/forgot-password/page.tsx` | Password reset request (magic link via Supabase) |
| `src/app/(auth)/reset-password/page.tsx` | New password form (after magic link click) |
| `src/components/auth/login-form.tsx` | Login form component |
| `src/components/auth/invite-accept-form.tsx` | Invite acceptance form (name, password, LinkedIn) |
| `src/components/auth/auth-input.tsx` | Styled input (zero border-radius, `bg-vcx-beige-light` background) |
| `src/lib/actions/auth.ts` | Server Actions: login, acceptInvite, forgotPassword, resetPassword |

### Login Page Design
- Background: Deep Navy (`bg-vcx-deep-navy` / `#0F172A`)
- Centered card (max-width 420px) with beige (`bg-vcx-beige`) background
- "ValueConnect X" logo at top with gold accent
- Headline: "당신은 이미 검증되었습니다" (Georgia serif, 22px)
- Sub-headline: "초대된 멤버만 접근할 수 있습니다" (system-ui, 14px, muted)
- Email + Password inputs (zero border-radius, `bg-vcx-beige-light`)
- "로그인" button (`bg-vcx-dark`, `text-vcx-beige`, zero border-radius)
- "비밀번호를 잊으셨나요?" link below
- Bottom: "초대 코드가 있으신가요?" -> link to `/invite/accept`
- NO "회원가입" button

### Invite Accept Page Design
- Same Deep Navy background
- Step 1: Token input or auto-populated from URL query param
- Step 2: Shows "OOO님이 당신을 초대했습니다" with inviter name from verify API
- Step 3: Account creation form (name, password, confirm password, LinkedIn URL)
- "계정 생성하기" button
- After success: redirect to home or profile completion

### Acceptance Criteria
- [ ] Login page renders with `#0F172A` background (verified via computed style or visual inspection)
- [ ] Every element on auth pages has `border-radius: 0` (no rounded corners)
- [ ] Login form submits email+password via Server Action, shows Korean error messages on failure
- [ ] Invite accept page calls `/api/invites/verify/[token]` on load and displays inviter info
- [ ] Invalid/expired token shows "초대가 만료되었습니다" with option to contact referrer
- [ ] Account creation validates: password min 8 chars, name required, LinkedIn URL format (optional but validated if provided)
- [ ] After successful invite acceptance, user is logged in and redirected to `/`
- [ ] Forgot password sends Supabase magic link email and shows confirmation message
- [ ] No "회원가입" or public signup CTA anywhere on auth pages
- [ ] All auth pages are responsive (tested at 375px and 1440px widths)

### Dependencies
- Step 1 (Supabase client + Deep Navy token), Step 3 (invite API endpoints)

---

## Step 5: Route Protection (Middleware + Login Wall)

**Goal:** Protect member-only pages with two-layer auth check. Show premium blur overlay + lock modal for unauthenticated users.

### Files to Create
| File | Purpose |
|------|---------|
| `src/middleware.ts` | Next.js middleware: two-layer auth (Supabase session + VCX membership) |
| `src/components/auth/login-wall.tsx` | Blur overlay + centered lock modal component |
| `src/lib/auth/routes.ts` | Route configuration: public vs protected vs admin lists |

### Two-Layer Auth Check (CRITICAL)
The middleware MUST verify BOTH layers:
1. **Layer 1:** Valid Supabase session exists (via `@supabase/ssr` middleware helper)
2. **Layer 2:** The authenticated user has a row in `vcx_members` (or `vcx_corporate_users`)

A user who has a valid Supabase session from another project sharing the same instance but NO `vcx_members` row must be treated as unauthenticated for VCX purposes.

### Route Classification
| Route | Access | Behavior when not authenticated for VCX |
|-------|--------|----------------------------------------|
| `/` | Public | Normal render |
| `/service-overview` | Public | Normal render |
| `/positions` | Semi-public | List visible, details blurred |
| `/coffeechat` | Protected | Blur + login wall modal |
| `/ceo-coffeechat` | Protected | Blur + login wall modal |
| `/community` | Protected | Blur + login wall modal |
| `/directory` | Protected | Blur + login wall modal |
| `/admin/*` | Admin only | Redirect to `/login` |
| `/api/*` | Varies | 401 JSON response |
| `/(auth)/*` | Public | Normal render (login, invite accept) |

### Login Wall Modal Design
- Full-page blur overlay (`backdrop-filter: blur(8px)`, `rgba(15,12,8,0.75)`)
- Centered modal (zero border-radius, zero shadow)
- Lock icon at top
- "멤버 전용 콘텐츠입니다" headline
- "초대된 멤버만 열람할 수 있습니다" sub-text
- "로그인" primary button -> `/login?redirect={currentPath}`
- "초대 코드 입력" secondary button -> `/invite/accept`

### Middleware Logic
```
1. Skip middleware for: static assets, _next, favicon, (auth) routes
2. Get Supabase session via middleware helper (Layer 1)
3. If route is public -> allow, pass isAuthenticated flag
4. If no session -> for protected routes: allow render with isAuthenticated=false (blur overlay)
                  -> for admin routes: redirect to /login
                  -> for API routes: return 401 JSON
5. If session exists -> query vcx_members/vcx_corporate_users for user (Layer 2)
6. If VCX member not found -> treat as unauthenticated (same behavior as step 4)
7. If admin route AND system_role not in (admin, super_admin) -> redirect to /
8. Refresh session token if needed
```

### Acceptance Criteria
- [ ] User with valid Supabase session but NO `vcx_members` row sees the login wall on protected pages (two-layer auth working)
- [ ] User with valid session AND `vcx_members` row sees protected content normally
- [ ] Unauthenticated user visiting `/coffeechat` sees blurred content with login wall modal overlay
- [ ] Login wall has lock icon, Korean copy, and two CTA buttons (로그인, 초대 코드 입력)
- [ ] "로그인" button navigates to `/login?redirect=/coffeechat` (preserves return URL)
- [ ] After logging in, user is redirected back to the originally requested page
- [ ] Admin routes redirect to `/login` for unauthenticated users (hard redirect, no blur)
- [ ] Admin routes redirect to `/` for authenticated non-admin users
- [ ] API routes return `{ error: "Unauthorized" }` with 401 status for unauthenticated requests
- [ ] Public routes (`/`, `/service-overview`) render normally without any auth overhead
- [ ] Middleware does not block: `_next/*`, `favicon.ico`, static assets, `(auth)/*` routes

### Dependencies
- Step 1 (Supabase middleware helper), Step 2 (vcx_members table for Layer 2 check)

---

## Step 6: GNB Auth State Update

**Goal:** Refactor GNB to use shared navigation config and reflect authentication state with lock icons and user menu.

### Files to Modify
| File | Change |
|------|--------|
| `src/types/index.ts` | Add `requiresAuth: boolean` and `requiresAdmin: boolean` to `NavItem` type |
| `src/components/layout/gnb.tsx` | **CRITICAL REFACTOR:** Remove hardcoded `menuItems` array (lines 6-16). Import navigation items from a shared config file. Add auth state awareness, lock icons, user dropdown. |

### Files to Create
| File | Purpose |
|------|---------|
| `src/constants/navigation.ts` | Shared navigation config with `requiresAuth` flags for each menu item. Single source of truth for GNB and route protection. **NOTE:** Delete existing `src/data/navigation.ts` after migration — it is currently unused (nothing imports it) and will cause confusion if left alongside the new file. |

### NavItem Type Update
```typescript
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
  isActive?: boolean;
  requiresAuth?: boolean;   // NEW: show lock icon when not authenticated
  requiresAdmin?: boolean;  // NEW: only visible to admin users
}
```

### Navigation Config (src/constants/navigation.ts)
```typescript
export const mainNavItems: NavItem[] = [
  { label: "서비스 소개", href: "/", children: [...], requiresAuth: false },
  { label: "Coffee Chat", href: "/coffeechat", requiresAuth: true },
  { label: "CEO Coffee Chat", href: "/ceo-coffee-chat", requiresAuth: true },
  { label: "Community Board", href: "/community", requiresAuth: true },
  { label: "Position Board", href: "/positions", requiresAuth: false },
];
```

### GNB Behavior

**Not logged in:**
- Menu items with `requiresAuth: true` show a lock icon next to the label
- Right side: "로그인" link + "초대 확인하기 ->" button (current layout preserved)
- Clicking a protected menu item still navigates (blur overlay handles restriction)

**Logged in:**
- No lock icons
- Right side: User name + dropdown (프로필, 로그아웃)
- If admin: additional "관리" link in dropdown

### Acceptance Criteria
- [ ] `gnb.tsx` no longer contains a hardcoded `menuItems` array — imports from `src/constants/navigation.ts`
- [ ] `NavItem` type in `src/types/index.ts` includes `requiresAuth` and `requiresAdmin` boolean fields
- [ ] Lock icon appears next to Coffee Chat, CEO Coffee Chat, Community Board when not logged in
- [ ] Lock icon does NOT appear next to "서비스 소개" or "Position Board"
- [ ] Lock icons disappear when logged in as a VCX member
- [ ] Logged-in user sees their name in GNB right section with dropdown
- [ ] Dropdown includes "프로필" and "로그아웃" options
- [ ] Admin user sees "관리" link in dropdown
- [ ] Logout clears session and redirects to `/`
- [ ] GNB auth state works with SSR (no flash of wrong state on page load)

### Dependencies
- Step 1 (Supabase client), Step 5 (middleware provides auth state)

---

## Step 7: Admin Interface (Recommendations + Invites)

**Goal:** Admin interface with two tabs: pending recommendations to review, and invite management.

### Files to Create
| File | Purpose |
|------|---------|
| `src/app/(protected)/admin/layout.tsx` | Admin layout with navigation tabs |
| `src/app/(protected)/admin/recommendations/page.tsx` | Pending recommendations list for admin review |
| `src/app/(protected)/admin/invites/page.tsx` | Invite list with status filters |
| `src/components/admin/recommendation-list.tsx` | Recommendation table (pending/approved/rejected) with approve/reject actions |
| `src/components/admin/invite-list.tsx` | Invite table (pending/accepted/expired/revoked) |
| `src/components/admin/create-invite-form.tsx` | Direct invite form (bypass recommendation for admin) |
| `src/components/admin/status-badge.tsx` | Status badge component matching design system |
| `src/app/api/recommendations/list/route.ts` | GET: List recommendations with filters (admin only) |
| `src/app/api/invites/list/route.ts` | GET: List invites with filters (admin only) |
| `src/app/api/invites/[id]/revoke/route.ts` | POST: Revoke a pending invite (admin only) |

### Admin Tabs
1. **"추천 심사" (Pending Recommendations)** — Default landing tab
   - List of pending recommendations from Core Members
   - Shows: recommender name, recommended email/name, reason, requested tier, created date
   - Actions: Approve (creates invite + sends email) / Reject
   - Filter by status: All / Pending / Approved / Rejected

2. **"초대 관리" (Invite Management)**
   - List of all invites with status filters
   - Shows: email, invitedByName, memberTier, status, createdAt, expiresAt
   - Actions: Revoke pending invites
   - Search by email
   - Create direct invite (admin can bypass recommendation flow)

### Acceptance Criteria
- [ ] Admin can view paginated list of pending recommendations
- [ ] Admin can approve a recommendation, which triggers invite creation + email sending
- [ ] Admin can reject a recommendation with the status visibly updated
- [ ] Admin can view paginated list of all invites filtered by status
- [ ] Admin can create a direct invite (bypassing recommendation)
- [ ] Admin can revoke a pending invite (status changes to `revoked`)
- [ ] Non-admin users accessing `/admin/*` are redirected to `/login` (verified)
- [ ] Both tabs use VCX design system (beige bg, Georgia serif, zero border-radius, gold accents for status badges)
- [ ] Recommendation approval immediately shows the new invite in the Invites tab

### Dependencies
- Steps 1-5 (full auth infrastructure), Step 3 (recommendation + invite APIs)

---

## Success Criteria (End-to-End)

1. **Recommendation Path:** Core Member recommends colleague -> Recommendation appears in Admin "추천 심사" tab -> Admin approves -> Invite email sent -> Recipient clicks link -> Creates account -> Logged in -> Sees protected content
2. **Login Path:** Existing member visits `/login` -> Enters email + password -> Logged in -> GNB shows name, no lock icons -> Can access all protected pages
3. **Protection Path (VCX member):** Non-member visits `/coffeechat` -> Blurred content + login wall -> Logs in -> Redirected back with full access
4. **Protection Path (other Supabase user):** User from another project on the same Supabase instance visits VCX -> Has valid session but no `vcx_members` row -> Sees login wall (two-layer auth working)
5. **Expired Path:** User clicks 25-hour-old invite link -> "초대가 만료되었습니다" message -> Prompted to contact referrer
6. **Admin Path:** Admin visits `/admin/recommendations` -> Reviews pending list -> Approves one -> Switches to Invites tab -> Sees new invite as pending -> Recipient accepts -> Status updates to accepted
7. **Direct Invite Path:** Admin creates invite directly from Invites tab (bypassing recommendation) -> Email sent -> Same acceptance flow

---

## Package Dependencies to Install

| Package | Purpose |
|---------|---------|
| `@supabase/ssr` | Server-side Supabase helpers for Next.js (cookies, middleware). Required alongside `@supabase/supabase-js`. |
| `resend` | Email delivery service SDK |

Note: `@supabase/supabase-js` is already installed as a dependency.

---

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=        # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Public anon key (safe for client)
SUPABASE_SERVICE_ROLE_KEY=       # Service role key (server-only, never expose to client)

# Email
RESEND_API_KEY=                  # Resend API key for sending invite emails

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Base URL for invite links
```

---

## Open Questions

See `.omc/plans/open-questions.md` for tracked questions.

---

## Revision Log

### v2 (2026-03-24) - Architect + Critic Feedback

| # | Feedback | Severity | Change Made |
|---|----------|----------|-------------|
| 1 | Shared Supabase - no table isolation | CRITICAL | Added `vcx_` prefix to ALL table names throughout plan. Added Step 0 Database Audit. Added rollback scripts. Made migrations idempotent (IF NOT EXISTS). |
| 2 | Two-layer auth missing | CRITICAL | Middleware now checks BOTH Supabase session AND `vcx_members`/`vcx_corporate_users` row. Added `vcx_is_member()` helper function. Added Success Criteria #4 for cross-project user scenario. Documented shared `auth.users` risk. |
| 3 | Missing Recommend -> Approve flow | CRITICAL | Added `vcx_recommendations` table. Added recommendation API endpoints (create, approve, reject). Step 3 now covers full two-step flow. Step 7 now has "추천 심사" tab. Updated RLS for recommendations. |
| 4 | Weak invite token security | MAJOR | Changed from `crypto.randomUUID` to `crypto.randomBytes(32)`. Store SHA-256 hash in DB, send raw token in email. Added timing-safe comparison. Added rate limiting (5/IP/min) on verify endpoint. |
| 5 | GNB hardcoded menu items | CRITICAL | Step 6 now explicitly instructs removal of hardcoded `menuItems` from gnb.tsx (lines 6-16). Creates `src/constants/navigation.ts` as single source of truth. Added `requiresAuth` to NavItem type. |
| 6 | Missing `@supabase/ssr` and `.env.example` | MAJOR | Explicitly listed `@supabase/ssr` in Step 1 file list and package.json modification. Added `.env.example` to files to create. Clarified `@supabase/supabase-js` kept as peer dependency. |
| 7 | Providers pattern wrong | MINOR | Step 1 creates `src/app/providers.tsx` as "use client" component. `layout.tsx` remains Server Component, only imports the wrapper. |
| 8 | Missing Deep Navy design token | MINOR | Step 1 now includes adding `--color-deep-navy: #0F172A` to globals.css and corresponding utility classes before Step 4 auth pages use it. |
| 9 | MemberType vs MemberTier naming | MINOR | Step 1 includes renaming `MemberType` to `MemberTier` in `src/types/index.ts` to align with `src/specs/data-models.md`. Documented the discrepancy in Context section. |

### v3 (2026-03-24) - Re-review Improvements (Architect + Critic Approved)

| # | Improvement | Severity | Change Made |
|---|-------------|----------|-------------|
| 10 | Stale `src/data/navigation.ts` after GNB refactor | LOW | Step 6: Added note to delete `src/data/navigation.ts` after migrating to `src/constants/navigation.ts`. |
| 11 | `vcx_recommendations` missing partial unique index | LOW | Step 2: Add `CREATE UNIQUE INDEX IF NOT EXISTS idx_vcx_recommendations_pending_email ON vcx_recommendations(recommended_email) WHERE status = 'pending'` to migration. |
| 12 | DESIGN_TOKENS color divergence in `constants.ts` | LOW | Step 1: Reconcile `DESIGN_TOKENS.accent: '#C9A96E'` in `src/lib/constants.ts` with `--color-gold: #c9a84c` in globals.css during type/token alignment. |
| 13 | Rate limiter on serverless | LOW | Tracked in open-questions.md. Use application-level check in development; evaluate Vercel KV or Upstash Redis for production rate limiting. |
