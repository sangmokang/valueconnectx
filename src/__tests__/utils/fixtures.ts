/**
 * Fixture Factory — typed test data factories backed by src/types/supabase.ts
 *
 * Each factory returns a fully valid object that satisfies the DB Row type.
 * Pass `overrides` to customise individual fields per test.
 */

import type { Database } from '@/types/supabase'
import type { VcxUser } from '@/lib/auth/get-vcx-user'

// ─── DB Row aliases ───────────────────────────────────────────────────────────
type VcxMemberRow = Database['public']['Tables']['vcx_members']['Row']
type VcxInviteRow = Database['public']['Tables']['vcx_invites']['Row']
type VcxCorporateUserRow = Database['public']['Tables']['vcx_corporate_users']['Row']
type VcxRecommendationRow = Database['public']['Tables']['vcx_recommendations']['Row']
type PositionRow = Database['public']['Tables']['positions']['Row']

// ─── Member fixtures ──────────────────────────────────────────────────────────

export function createMemberFixture(overrides?: Partial<VcxMemberRow>): VcxMemberRow {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: '테스트 멤버',
    email: `member-${crypto.randomUUID().slice(0, 8)}@example.com`,
    current_company: '테스트 회사',
    title: '소프트웨어 엔지니어',
    professional_fields: ['Engineering'],
    years_of_experience: 5,
    bio: null,
    linkedin_url: null,
    member_tier: 'core',
    system_role: 'member',
    join_date: now,
    endorsed_by: null,
    endorsed_by_name: null,
    avatar_url: null,
    industry: 'Technology',
    location: '서울',
    is_open_to_chat: true,
    profile_visibility: 'members_only',
    is_active: true,
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

export function createCoreMemberFixture(overrides?: Partial<VcxMemberRow>): VcxMemberRow {
  return createMemberFixture({ member_tier: 'core', ...overrides })
}

export function createEndorsedMemberFixture(overrides?: Partial<VcxMemberRow>): VcxMemberRow {
  return createMemberFixture({ member_tier: 'endorsed', ...overrides })
}

// ─── Corporate User fixtures ──────────────────────────────────────────────────

export function createCorporateUserFixture(
  overrides?: Partial<VcxCorporateUserRow>
): VcxCorporateUserRow {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: '테스트 기업 사용자',
    email: `corp-${crypto.randomUUID().slice(0, 8)}@example.com`,
    company: '테스트 기업',
    role: 'c_level',
    title: 'CTO',
    is_verified: false,
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

export function createCeoFixture(overrides?: Partial<VcxCorporateUserRow>): VcxCorporateUserRow {
  return createCorporateUserFixture({ role: 'ceo', title: 'CEO', ...overrides })
}

// ─── Auth / Session fixtures ──────────────────────────────────────────────────

/** Returns a VcxUser (the app-level auth object, not a raw DB row). */
export function createVcxUserFixture(overrides?: Partial<NonNullable<VcxUser>>): NonNullable<VcxUser> {
  return {
    id: crypto.randomUUID(),
    name: '테스트 사용자',
    email: `user-${crypto.randomUUID().slice(0, 8)}@example.com`,
    memberTier: 'core',
    systemRole: 'member',
    avatarUrl: null,
    ...overrides,
  }
}

export function createAdminUserFixture(
  overrides?: Partial<NonNullable<VcxUser>>
): NonNullable<VcxUser> {
  return createVcxUserFixture({ systemRole: 'admin', ...overrides })
}

export function createSuperAdminUserFixture(
  overrides?: Partial<NonNullable<VcxUser>>
): NonNullable<VcxUser> {
  return createVcxUserFixture({ systemRole: 'super_admin', ...overrides })
}

// ─── Invite fixtures ──────────────────────────────────────────────────────────

export function createInviteFixture(overrides?: Partial<VcxInviteRow>): VcxInviteRow {
  const now = new Date().toISOString()
  const future = new Date(Date.now() + 86_400_000).toISOString() // +24h
  return {
    id: crypto.randomUUID(),
    email: `invite-${crypto.randomUUID().slice(0, 8)}@example.com`,
    invited_by: crypto.randomUUID(),
    invited_by_name: '초대자',
    member_tier: 'core',
    status: 'pending',
    token_hash: 'mock-token-hash',
    expires_at: future,
    accepted_at: null,
    recommendation_id: null,
    created_at: now,
    ...overrides,
  }
}

export function createExpiredInviteFixture(overrides?: Partial<VcxInviteRow>): VcxInviteRow {
  const past = new Date(Date.now() - 1_000).toISOString()
  return createInviteFixture({ expires_at: past, ...overrides })
}

export function createAcceptedInviteFixture(overrides?: Partial<VcxInviteRow>): VcxInviteRow {
  const now = new Date().toISOString()
  return createInviteFixture({ status: 'accepted', accepted_at: now, ...overrides })
}

// ─── Recommendation fixtures ──────────────────────────────────────────────────

export function createRecommendationFixture(
  overrides?: Partial<VcxRecommendationRow>
): VcxRecommendationRow {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    recommender_id: crypto.randomUUID(),
    recommended_email: `rec-${crypto.randomUUID().slice(0, 8)}@example.com`,
    recommended_name: '추천 대상자',
    reason: '뛰어난 전문성을 보유하고 있습니다',
    member_tier: 'core',
    status: 'pending',
    reviewed_by: null,
    reviewed_at: null,
    created_at: now,
    ...overrides,
  }
}

// ─── Position fixtures ────────────────────────────────────────────────────────

export function createPositionFixture(overrides?: Partial<PositionRow>): PositionRow {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: '시니어 소프트웨어 엔지니어',
    company_name: '테스트 기업',
    team_size: '10-50',
    role_description: '핵심 서비스 개발을 담당합니다',
    salary_range: '7000-9000만원',
    status: 'active',
    created_by: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}
