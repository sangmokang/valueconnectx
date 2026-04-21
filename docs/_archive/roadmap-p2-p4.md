# ValueConnect X - P2/P3/P4 Development Roadmap

**Created:** 2026-03-25
**Status:** Draft - Awaiting Approval
**Estimated Complexity:** HIGH (full product build across 3 phases)
**Prerequisite:** P1 (Invite-Only Auth) must be complete

---

## Context

ValueConnect X는 검증된 핵심 인재와 CEO/Founder를 연결하는 Private Talent Network이다. P0(랜딩, GNB, 디자인시스템)과 P1(초대 전용 인증)이 완료/진행중이며, 이 문서는 P1 이후의 전체 개발 로드맵을 다룬다.

**현재 코드베이스 상태:**
- 4개 DB 테이블: `vcx_members`, `vcx_invites`, `vcx_recommendations`, `vcx_corporate_users`
- RLS 정책 + helper functions (`vcx_is_member`, `vcx_is_admin`, `vcx_is_core_member`)
- Middleware: 5-tier route protection (public/semi-public/protected/admin/auth)
- Routes defined: `/coffeechat`, `/ceo-coffeechat`, `/community`, `/directory`, `/positions`
- Types: `Member`, `CoffeeChatPost`, `Position`, `CommunityPost` already defined in `src/types/index.ts`
- Design system: zero border-radius, Georgia serif, beige/dark/gold palette, `vcx-*` utility classes

**비즈니스 마일스톤 연동:**
- Phase 1 (Month 1-2): Core Member 30명, 기본 플랫폼 -> P2 완료 필요
- Phase 2 (Month 3-5): Endorsed Member 확산, 기업 유치, 월 1건 채용 -> P3 완료 필요
- Phase 3 (Month 6-10): AI 매칭, 월 3건, BEP -> P4 시작
- Phase 4 (Month 12-24): Premium, 월 5건 -> P4 완료

---

## P2: 핵심 플랫폼 기능 (Member Directory + CEO Coffee Chat)

**Timeline:** P1 완료 후 즉시 (Month 1-2 목표)
**병렬 전략:** Directory와 Coffee Chat은 독립적 — 동시 병렬 개발 가능

### P2-A: Member Directory (멤버 디렉토리)

#### Step 1: Database & API Layer

**DB Migration** (`supabase/migrations/003_vcx_member_directory.sql`)

```sql
-- vcx_members에 디렉토리용 컬럼 추가 (기존 스키마 확장)
ALTER TABLE vcx_members ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE vcx_members ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE vcx_members ADD COLUMN IF NOT EXISTS is_open_to_chat boolean DEFAULT false;
ALTER TABLE vcx_members ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'members_only'
  CHECK (profile_visibility IN ('members_only', 'corporate_only', 'all'));

-- 검색 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_vcx_members_directory
  ON vcx_members(is_active, member_tier, industry, professional_fields);

-- Full-text search (이름, 회사, bio)
CREATE INDEX IF NOT EXISTS idx_vcx_members_search
  ON vcx_members USING gin(to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(current_company,'') || ' ' || coalesce(bio,'')));
```

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/directory` | GET | 멤버 목록 (pagination, filters) |
| `/api/directory/[id]` | GET | 멤버 상세 프로필 |
| `/api/directory/me` | GET/PUT | 내 프로필 조회/수정 |

**New Files:**
- `src/app/api/directory/route.ts` — GET with query params: `?page=1&limit=20&tier=core&industry=tech&q=search`
- `src/app/api/directory/[id]/route.ts` — GET single member profile
- `src/app/api/directory/me/route.ts` — GET/PUT own profile

**Acceptance Criteria:**
- [ ] GET `/api/directory` returns paginated member list (20 per page default)
- [ ] Filters work: `tier`, `industry`, `professional_fields`, `q` (text search)
- [ ] Only authenticated VCX members can access (middleware already handles)
- [ ] `vcx_members` RLS ensures only active members see each other
- [ ] PUT `/api/directory/me` only updates own profile, returns 403 for others

**Complexity:** M

#### Step 2: Member Directory UI

**New Files:**
- `src/app/(protected)/directory/page.tsx` — Directory listing page (Server Component)
- `src/app/(protected)/directory/[id]/page.tsx` — Member detail profile page
- `src/app/(protected)/directory/me/page.tsx` — My profile edit page
- `src/components/directory/member-card.tsx` — Card component for list view
- `src/components/directory/member-filters.tsx` — Filter sidebar/bar (Client Component)
- `src/components/directory/member-profile.tsx` — Full profile display
- `src/components/directory/profile-edit-form.tsx` — Profile edit form

**UI 설계:**
- Directory 목록: Grid layout (2-3 columns), member-card with name/company/title/tier badge/specialties
- Filters: industry dropdown, tier toggle (Core/Endorsed/All), text search input
- Profile detail: Full bio, specialties tags, LinkedIn link, "Open to Chat" indicator
- My Profile: Edit form with all editable fields

**Design Rules (from existing system):**
- Zero border-radius on all cards and inputs
- Georgia serif for headings, system-ui for body
- Gold (#c9a84c) for accent elements and tier badges
- Beige (#f0ebe2) background
- `vcx-label` style for metadata labels

**Acceptance Criteria:**
- [ ] `/directory` shows paginated grid of member cards
- [ ] Search box filters members in real-time (debounced 300ms)
- [ ] Industry/tier filters update results
- [ ] Click on card navigates to `/directory/[id]`
- [ ] `/directory/me` shows editable profile form
- [ ] Login wall (blur overlay) shows for unauthenticated users (P1 pattern)
- [ ] Mobile: single column layout, collapsible filter panel
- [ ] All components follow VCX design system (no border-radius, serif headings)

**Complexity:** L

---

### P2-B: CEO Coffee Chat Board (CEO 커피챗 보드)

#### Step 1: Database Schema

**DB Migration** (`supabase/migrations/004_vcx_ceo_coffeechat.sql`)

```sql
-- CEO Coffee Chat Sessions
CREATE TABLE IF NOT EXISTS vcx_ceo_coffee_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES vcx_corporate_users(id),
  title text NOT NULL,
  description text NOT NULL,
  session_date timestamptz NOT NULL,
  duration_minutes int DEFAULT 30,
  max_participants int DEFAULT 1,
  location_type text NOT NULL CHECK (location_type IN ('online', 'offline', 'hybrid')),
  location_detail text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed', 'cancelled')),
  target_tier text CHECK (target_tier IN ('core', 'endorsed', 'all')),
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Secret Applications (비밀 신청)
CREATE TABLE IF NOT EXISTS vcx_coffee_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES vcx_ceo_coffee_sessions(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES vcx_members(id),
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, applicant_id)
);

-- RLS
ALTER TABLE vcx_ceo_coffee_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_coffee_applications ENABLE ROW LEVEL SECURITY;

-- Sessions: all members can view, only corporate users (CEO/Founder) can create
CREATE POLICY "vcx_coffee_sessions_select" ON vcx_ceo_coffee_sessions
  FOR SELECT USING (vcx_is_member(auth.uid()));

CREATE POLICY "vcx_coffee_sessions_insert" ON vcx_ceo_coffee_sessions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM vcx_corporate_users WHERE id = auth.uid() AND role IN ('ceo', 'founder'))
  );

CREATE POLICY "vcx_coffee_sessions_update" ON vcx_ceo_coffee_sessions
  FOR UPDATE USING (host_id = auth.uid());

-- Applications: applicant sees own, host sees all for their sessions
CREATE POLICY "vcx_coffee_applications_select" ON vcx_coffee_applications
  FOR SELECT USING (
    applicant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM vcx_ceo_coffee_sessions
      WHERE id = session_id AND host_id = auth.uid()
    )
  );

CREATE POLICY "vcx_coffee_applications_insert" ON vcx_coffee_applications
  FOR INSERT WITH CHECK (
    applicant_id = auth.uid()
    AND vcx_is_member(auth.uid())
  );

CREATE POLICY "vcx_coffee_applications_update" ON vcx_coffee_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM vcx_ceo_coffee_sessions
      WHERE id = session_id AND host_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vcx_coffee_sessions_status ON vcx_ceo_coffee_sessions(status, session_date);
CREATE INDEX IF NOT EXISTS idx_vcx_coffee_applications_session ON vcx_coffee_applications(session_id, status);

-- Updated_at trigger
CREATE TRIGGER vcx_coffee_sessions_updated_at
  BEFORE UPDATE ON vcx_ceo_coffee_sessions
  FOR EACH ROW EXECUTE FUNCTION vcx_update_updated_at();
```

**Acceptance Criteria:**
- [ ] Tables created with `vcx_` prefix
- [ ] RLS: Members can view sessions, only CEO/Founder can create
- [ ] RLS: Applicants see own applications, hosts see all for their sessions
- [ ] Application uniqueness enforced per (session, applicant)

**Complexity:** M

#### Step 2: API Routes

**New Files:**
| Route | Method | Description |
|-------|--------|-------------|
| `src/app/api/ceo-coffeechat/route.ts` | GET/POST | List sessions / Create session (CEO only) |
| `src/app/api/ceo-coffeechat/[id]/route.ts` | GET/PUT | Session detail / Update session |
| `src/app/api/ceo-coffeechat/[id]/apply/route.ts` | POST | Apply to session (member) |
| `src/app/api/ceo-coffeechat/[id]/applications/route.ts` | GET | List applications (host only) |
| `src/app/api/ceo-coffeechat/[id]/applications/[appId]/route.ts` | PUT | Accept/Reject application (host) |

**Key Business Logic:**
- Session creation: only `vcx_corporate_users` with role `ceo` or `founder`
- Application: only `vcx_members`, one per session, secret (other applicants cannot see)
- `secretCommentCount` in list view = count of applications per session
- Host can accept/reject; accepted triggers notification (future: email)

**Acceptance Criteria:**
- [ ] POST `/api/ceo-coffeechat` creates session, returns 403 for non-CEO/Founder
- [ ] GET `/api/ceo-coffeechat` returns paginated sessions sorted by session_date
- [ ] POST `/api/ceo-coffeechat/[id]/apply` creates application, 409 if duplicate
- [ ] GET `/api/ceo-coffeechat/[id]/applications` returns applications only for host
- [ ] PUT on application updates status (accept/reject)

**Complexity:** M

#### Step 3: CEO Coffee Chat UI

**New Files:**
- `src/app/(protected)/ceo-coffeechat/page.tsx` — Session list page
- `src/app/(protected)/ceo-coffeechat/[id]/page.tsx` — Session detail + apply
- `src/app/(protected)/ceo-coffeechat/create/page.tsx` — Create session form (CEO only)
- `src/components/coffeechat/session-card.tsx` — Session card for list
- `src/components/coffeechat/session-detail.tsx` — Full session view
- `src/components/coffeechat/apply-modal.tsx` — Application modal (secret message)
- `src/components/coffeechat/session-form.tsx` — Create/edit session form
- `src/components/coffeechat/application-list.tsx` — Host view: applicant list

**UI 설계:**
- Session list: cards showing CEO name/company, title, date, tags, `secret_count` badge
- Session detail: full description, CEO profile summary, "비밀 신청하기" button
- Apply modal: textarea for message, "이 신청은 다른 멤버에게 공개되지 않습니다" notice
- Host dashboard: applications list with accept/reject actions

**Acceptance Criteria:**
- [ ] `/ceo-coffeechat` shows session cards sorted by upcoming date
- [ ] Session cards show host company/name, title, date, tag pills, application count
- [ ] "비밀 신청하기" button opens modal with message textarea
- [ ] Applied sessions show "신청 완료" state
- [ ] CEO users see "세션 만들기" button, others do not
- [ ] Host can view applicant profiles and accept/reject
- [ ] Login wall for unauthenticated users
- [ ] Mobile responsive (stacked cards, full-width modal)

**Complexity:** L

---

### P2 병렬 실행 전략

```
Week 1:
  [Agent A] P2-A Step 1: Directory DB migration + API routes
  [Agent B] P2-B Step 1: Coffee Chat DB migration
  [Agent C] P2-B Step 2: Coffee Chat API routes

Week 2:
  [Agent A] P2-A Step 2: Directory UI (list + filters)
  [Agent B] P2-B Step 3: Coffee Chat UI (list + detail)
  [Agent C] P2-A Step 2: Directory UI (profile detail + edit)

Week 3:
  [Agent A] P2-B Step 3: Coffee Chat UI (apply modal + host dashboard)
  [Agent B] Integration testing + polish
  [Agent C] TypeScript types update + Supabase type generation
```

**P1 의존성:**
- DB migrations: P1의 `001_vcx_auth_schema.sql`, `002_vcx_rls_policies.sql` 완료 필수
- API routes: `src/lib/supabase/server.ts`, `src/lib/auth/get-vcx-user.ts` 존재 필수
- UI: `src/components/auth/login-wall.tsx` 패턴 재사용
- Middleware: `/directory`, `/ceo-coffeechat` 이미 protected routes에 등록됨

---

### P2 Types Update (`src/types/index.ts` 추가분)

```typescript
// CEO Coffee Chat Session
export interface CeoCoffeeSession {
  id: string;
  hostId: string;
  host: CorporateUser;
  title: string;
  description: string;
  sessionDate: string;
  durationMinutes: number;
  maxParticipants: number;
  locationType: 'online' | 'offline' | 'hybrid';
  locationDetail?: string;
  status: 'open' | 'closed' | 'completed' | 'cancelled';
  targetTier?: MemberTier | 'all';
  tags: string[];
  applicationCount: number;
  createdAt: string;
}

// Coffee Chat Application (secret)
export interface CoffeeApplication {
  id: string;
  sessionId: string;
  applicantId: string;
  applicant?: Member;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  reviewedAt?: string;
  createdAt: string;
}

// Directory filters
export interface DirectoryFilters {
  tier?: MemberTier;
  industry?: string;
  q?: string;
  page?: number;
  limit?: number;
}
```

### P2 Supabase Types Update (`src/types/supabase.ts` 추가분)

New tables to add to `Database['public']['Tables']`:
- `vcx_ceo_coffee_sessions` (Row/Insert/Update)
- `vcx_coffee_applications` (Row/Insert/Update)

---

## P3: 채용 플랫폼 + 커뮤니티 (Month 3-5)

**비즈니스 목표:** Endorsed Member 확산, 기업 유치 본격화, 월 1건 채용 성사

### P3-A: Position Board (채용 포지션 보드)

#### DB Schema (`supabase/migrations/005_vcx_positions.sql`)

```sql
CREATE TABLE IF NOT EXISTS vcx_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by uuid NOT NULL REFERENCES vcx_corporate_users(id),
  company text NOT NULL,
  title text NOT NULL,
  department text,
  level text CHECK (level IN ('staff', 'senior', 'lead', 'principal', 'director', 'vp', 'c_level')),
  description text NOT NULL,
  requirements text,
  salary_range_min int,
  salary_range_max int,
  salary_currency text DEFAULT 'KRW',
  location text,
  work_type text CHECK (work_type IN ('onsite', 'remote', 'hybrid')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  visibility text DEFAULT 'all' CHECK (visibility IN ('all', 'members_only')),
  view_count int DEFAULT 0,
  apply_count int DEFAULT 0,
  tags text[] DEFAULT '{}',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vcx_position_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES vcx_positions(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES vcx_members(id),
  interest_type text NOT NULL CHECK (interest_type IN ('bookmark', 'apply')),
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'contacted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(position_id, member_id, interest_type)
);

ALTER TABLE vcx_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_position_interests ENABLE ROW LEVEL SECURITY;
```

**API Routes:**
- `/api/positions` — GET (list, semi-public), POST (corporate only)
- `/api/positions/[id]` — GET/PUT/DELETE
- `/api/positions/[id]/interest` — POST (bookmark/apply)
- `/api/positions/[id]/applicants` — GET (poster only)

**UI Pages:**
- `/positions` — Position list (semi-public: visible to all, detail requires auth)
- `/positions/[id]` — Position detail + apply
- `/positions/create` — Create position form (corporate only)
- `/positions/manage` — My posted positions dashboard (corporate)

**Key Features:**
- Semi-public: position list visible without login (teaser), full detail requires auth
- Salary range display (optional, poster can hide)
- Bookmark + Apply (separate actions)
- Corporate dashboard: view applicants, mark as contacted

**Acceptance Criteria:**
- [ ] Position list loads without auth (semi-public via middleware)
- [ ] Position detail requires auth (login wall)
- [ ] Corporate users can create/edit/close positions
- [ ] Members can bookmark and apply with optional message
- [ ] Corporate dashboard shows applicant profiles
- [ ] Filters: level, department, work_type, location

**Complexity:** L

---

### P3-B: Community Board (커뮤니티 보드)

#### DB Schema (`supabase/migrations/006_vcx_community.sql`)

```sql
CREATE TABLE IF NOT EXISTS vcx_community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES vcx_members(id),
  category text NOT NULL CHECK (category IN (
    'career_advice', 'leadership', 'salary_negotiation',
    'burnout', 'productivity_news', 'company_review'
  )),
  title text NOT NULL,
  body text NOT NULL,
  is_anonymous boolean DEFAULT false,
  like_count int DEFAULT 0,
  comment_count int DEFAULT 0,
  view_count int DEFAULT 0,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vcx_community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES vcx_community_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES vcx_members(id),
  parent_id uuid REFERENCES vcx_community_comments(id),
  body text NOT NULL,
  is_anonymous boolean DEFAULT false,
  like_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vcx_community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vcx_members(id),
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

ALTER TABLE vcx_community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_community_likes ENABLE ROW LEVEL SECURITY;
```

**Category Mapping (Korean UI -> DB enum):**
| Korean UI | DB Value |
|-----------|----------|
| 커리어 고민 | career_advice |
| 조직 고민/리더쉽 | leadership |
| 연봉 협상 | salary_negotiation |
| 번아웃 | burnout |
| 생산성/News | productivity_news |
| 이 회사 어때요? | company_review |

**API Routes:**
- `/api/community` — GET (list) / POST (create)
- `/api/community/[id]` — GET/PUT/DELETE
- `/api/community/[id]/comments` — GET/POST
- `/api/community/[id]/like` — POST (toggle)

**UI Pages:**
- `/community` — Post list with category tabs
- `/community/[id]` — Post detail + comments
- `/community/write` — Write new post

**Key Features:**
- Anonymous posting option (author hidden, but stored for admin)
- Category-based filtering with tab UI
- Nested comments (1-level deep)
- Like toggle (optimistic UI)
- View count tracking

**Acceptance Criteria:**
- [ ] Category tabs filter posts correctly
- [ ] Anonymous posts show "익명" instead of author name
- [ ] Nested comments render properly (1-level)
- [ ] Like toggle works with optimistic update
- [ ] Only author can edit/delete own posts
- [ ] Admin can pin/unpin posts

**Complexity:** L

---

### P3-C: 기초 매칭 & 분석 기반

#### Notification System (알림 시스템 기반)

```sql
CREATE TABLE IF NOT EXISTS vcx_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN (
    'coffee_accepted', 'coffee_rejected', 'position_match',
    'community_reply', 'community_like', 'system'
  )),
  title text NOT NULL,
  body text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

#### Basic Analytics Tables

```sql
CREATE TABLE IF NOT EXISTS vcx_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  page_path text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vcx_analytics_events_type
  ON vcx_analytics_events(event_type, created_at);
```

**API Routes:**
- `/api/notifications` — GET (my notifications), PUT (mark read)
- `/api/analytics/track` — POST (event tracking)

**Acceptance Criteria:**
- [ ] Notifications created on coffee chat accept/reject
- [ ] Notification bell in GNB shows unread count
- [ ] Analytics events tracked for key actions (page view, position view, apply)

**Complexity:** M

---

### P3 병렬 실행 전략

```
P3 Sprint 1 (Week 1-2):
  [Agent A] P3-A: Position Board DB + API
  [Agent B] P3-B: Community Board DB + API
  [Agent C] P3-C: Notification + Analytics DB + API

P3 Sprint 2 (Week 3-4):
  [Agent A] P3-A: Position Board UI
  [Agent B] P3-B: Community Board UI
  [Agent C] P3-C: Notification UI (GNB bell + dropdown)

P3 Sprint 3 (Week 5):
  [All] Integration testing, cross-feature polish, mobile QA
```

---

## P4: AI 매칭 + Premium (Month 6-24)

**비즈니스 목표:** AI 매칭으로 월 3-5건 채용 성사, BEP 달성, Premium 수익화

### P4-A: AI Matching System (Month 6-10)

#### Architecture

```
Member Profile + Position Requirements
        |
        v
  Embedding Generation (OpenAI text-embedding-3-small)
        |
        v
  Vector Storage (Supabase pgvector)
        |
        v
  Similarity Search + LLM Reasoning (Claude/GPT)
        |
        v
  Ranked Match Results with Explanation
```

#### DB Schema

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS vcx_member_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES vcx_members(id) ON DELETE CASCADE,
  embedding vector(1536),
  source_text text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(member_id)
);

CREATE TABLE IF NOT EXISTS vcx_position_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES vcx_positions(id) ON DELETE CASCADE,
  embedding vector(1536),
  source_text text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(position_id)
);

CREATE TABLE IF NOT EXISTS vcx_match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES vcx_positions(id),
  member_id uuid NOT NULL REFERENCES vcx_members(id),
  similarity_score float NOT NULL,
  llm_reasoning text,
  llm_fit_score int CHECK (llm_fit_score BETWEEN 1 AND 10),
  status text DEFAULT 'suggested' CHECK (status IN ('suggested', 'viewed', 'contacted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(position_id, member_id)
);
```

**API Routes:**
- `/api/matching/generate` — POST: trigger embedding generation for a member/position
- `/api/matching/positions/[id]/matches` — GET: top N member matches for a position
- `/api/matching/members/me/matches` — GET: positions that match my profile
- `/api/matching/explain` — POST: LLM-generated match explanation

**Key Implementation Notes:**
- Embedding generation: batch job on profile update, triggered via webhook or cron
- Match computation: cosine similarity via pgvector, then top-K sent to LLM for reasoning
- Rate limit LLM calls (use `src/lib/rate-limit.ts` pattern)
- Cache match results in `vcx_match_results` table (recompute on profile/position change)

**Acceptance Criteria:**
- [ ] Member profiles auto-generate embeddings on create/update
- [ ] Position match returns top 10 candidates ranked by fit score
- [ ] Each match includes LLM-generated explanation in Korean
- [ ] Corporate user can view match results for their positions
- [ ] Members see "추천 포지션" on their dashboard

**Complexity:** XL

---

### P4-B: Market Intelligence Dashboard (Month 8-12)

**Data Sources:**
- Internal: position postings, applications, match rates, member growth
- Aggregated: salary ranges by role/industry, hiring velocity, demand trends

#### DB Schema

```sql
CREATE TABLE IF NOT EXISTS vcx_market_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  data_type text NOT NULL CHECK (data_type IN (
    'salary_by_role', 'demand_by_industry', 'hiring_velocity', 'member_growth'
  )),
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vcx_market_snapshots_date_type
  ON vcx_market_snapshots(snapshot_date, data_type);
```

**UI Pages:**
- `/intelligence` — Dashboard with charts (recharts or similar)
- Widgets: salary trends, hot positions, industry demand, network growth

**Acceptance Criteria:**
- [ ] Dashboard shows 4+ chart widgets with real data
- [ ] Data refreshed weekly via cron/scheduled function
- [ ] Access: corporate users + core members only
- [ ] Charts responsive on mobile

**Complexity:** L

---

### P4-C: Premium Subscription (Month 12-24)

**Tier Structure:**
| Tier | Price | Features |
|------|-------|----------|
| Free (Member) | 0 | Directory, Community, Coffee Chat |
| Pro (Corporate) | 월 50만원 | Position Board + 5 AI matches/month |
| Enterprise | 월 200만원 | Unlimited AI matches + Market Intelligence + Priority support |

#### Implementation Approach
- Payment: Toss Payments or Stripe (Korea-friendly)
- Subscription management table: `vcx_subscriptions`
- Feature gating middleware: check subscription tier before premium features
- Billing cycle: monthly, auto-renewal

**DB Schema:**

```sql
CREATE TABLE IF NOT EXISTS vcx_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  plan text NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  payment_provider text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vcx_usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature text NOT NULL,
  used_at timestamptz DEFAULT now(),
  period_start timestamptz NOT NULL
);
```

**Acceptance Criteria:**
- [ ] Subscription CRUD with payment provider webhook integration
- [ ] Feature gating: AI matches limited by plan tier
- [ ] Usage tracking: count AI matches per billing period
- [ ] Upgrade/downgrade flow in UI
- [ ] Billing history page

**Complexity:** XL

---

## Cross-cutting Concerns

### Mobile Responsiveness Strategy

**Approach:** Mobile-first Tailwind breakpoints applied consistently.

| Breakpoint | Layout Change |
|------------|---------------|
| < 640px (sm) | Single column, stacked cards, bottom sheet modals |
| 640-1024px (md) | 2-column grids, side panels |
| > 1024px (lg) | Full 3-column layouts, sidebar filters |

**Implementation:**
- All new components use Tailwind responsive classes (`sm:`, `md:`, `lg:`)
- Modals become bottom sheets on mobile (`fixed bottom-0` on sm)
- Filter panels become collapsible accordion on mobile
- GNB already has hamburger menu pattern (from P0)

### Performance Optimization

| Concern | Strategy |
|---------|----------|
| API Response Time | Supabase connection pooling, indexed queries |
| Page Load | Next.js Server Components by default, Client Components only for interactivity |
| Images | `next/image` with Supabase Storage CDN |
| Search | Debounced client-side + server-side pagination |
| Caching | `revalidate` on Server Components, SWR for Client Components |
| Bundle Size | Dynamic imports for heavy components (charts, modals) |

### SEO Strategy

| Page | Strategy |
|------|----------|
| Landing `/` | Full SSR, structured data, meta tags |
| `/positions` | Semi-public SSR, position structured data (JobPosting schema) |
| Protected pages | `noindex` via `robots` meta tag |
| Dynamic OG | `generateMetadata()` for position and session detail pages |

### Testing Strategy (Solo Developer)

**Pragmatic approach -- focus on high-value tests:**

| Layer | Tool | What to Test |
|-------|------|-------------|
| API Routes | Vitest + supertest | Auth checks, CRUD operations, edge cases |
| RLS Policies | Supabase test helpers | Permission boundaries (member vs admin vs corporate) |
| UI Components | Storybook (optional) | Visual regression for design system components |
| E2E | Playwright (critical paths only) | Login -> Apply to Coffee Chat -> View Directory |

**Minimum test coverage targets:**
- All API routes: auth guard tests (unauthorized returns 401/403)
- All RLS policies: cross-user access tests
- Critical UI flows: 2-3 E2E tests for happy paths

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| P1 Auth 완료 지연 | P2 전체 블로킹 | Medium | P2 UI를 mock data로 선행 개발 가능 |
| Supabase shared instance 충돌 | Data integrity | Low | `vcx_` prefix + RLS 정책으로 격리 완료 |
| 1인 개발 병목 | 일정 지연 | High | Claude 병렬 에이전트로 3배 처리량 확보 |
| AI Matching 비용 | 수익성 | Medium | Usage tracking + tier-based rate limiting |
| Member 확보 속도 < 예상 | Product-market fit | Medium | P2 기능 품질에 집중, 바이럴 요소 강화 |
| Coffee Chat 신청량 부족 | 핵심 기능 무용화 | Medium | CEO 온보딩 지원, 첫 세션 운영팀 직접 진행 |

---

## Dependency Graph (전체)

```
P0 (Complete)
  └─> P1: Invite-Only Auth (In Progress)
        ├─> P2-A: Member Directory ──────────────────────┐
        ├─> P2-B: CEO Coffee Chat ──────────────────────┤
        │                                                 │
        │   [P2-A, P2-B are independent, run in parallel] │
        │                                                 v
        ├─> P3-A: Position Board ────────> P4-A: AI Matching
        ├─> P3-B: Community Board                    │
        ├─> P3-C: Notifications + Analytics ─────────┤
        │                                             v
        └─────────────────────────────────> P4-B: Market Intelligence
                                            P4-C: Premium Subscription
                                              (depends on P4-A, P4-B)
```

**Critical Path:** P1 -> P2-A + P2-B (parallel) -> P3-A -> P4-A -> P4-C

---

## Summary: Estimated Timeline

| Phase | Features | Est. Duration | Cumulative |
|-------|----------|---------------|------------|
| P2 | Directory + CEO Coffee Chat | 2-3 weeks | Month 1-2 |
| P3 | Positions + Community + Notifications | 3-4 weeks | Month 3-5 |
| P4-A | AI Matching | 4-6 weeks | Month 6-10 |
| P4-B | Market Intelligence | 2-3 weeks | Month 8-12 |
| P4-C | Premium Subscription | 3-4 weeks | Month 12-24 |

**Total new files estimate:** ~80-100 files across all phases
**Total new DB tables:** 10 tables (+ 2 extensions)
**Total new API routes:** ~25 route files
