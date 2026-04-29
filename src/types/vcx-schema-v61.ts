/**
 * ⚠️ PHASE 2 RESERVED — DO NOT IMPORT IN PHASE 1 CODE
 *
 * 본 파일은 ADR-0007에 의해 Phase 1 종료 전까지 **사용 금지**이다.
 * 정의된 타입들은 `docs/prd/_archive/phase2-proposal/migrations/` 에 격리된
 * 신규 스키마를 전제로 한다. 해당 마이그레이션이 production 에 반영되기 전에
 * 이 파일을 import 하면 런타임 쿼리 결과와 타입이 불일치한다.
 *
 * Phase 1 SoT: docs/prd-6.0.md
 * Phase 2 재개 조건: ADR-0007 §4 Revival Criteria 참조
 *
 * --- 원래 설계 의도 ---
 * VCX Schema v6.1 — new entity types (migrations 022~033)
 * 병합 경로: 향후 `supabase gen types typescript` 실행 시 src/types/supabase.ts 에 자동 병합.
 * Row / Insert / Update 3-shape 관례는 src/types/supabase.ts 와 동일.
 */

// ============================================================================
// Discriminated helpers
// ============================================================================

export type VcxEventActorType = 'member' | 'corporate' | 'system';
export type VcxEventTargetType =
  | 'position'
  | 'peer_chat'
  | 'ceo_chat'
  | 'post'
  | 'comment'
  | 'member'
  | 'feed_item'
  | 'tag'
  | 'placement'
  | 'report';

export type VcxOnboardingChannel = 'invite' | 'concierge' | 'self_signup_blocked';
export type VcxVerifiedBy = 'linkedin' | 'concierge' | 'peer_referral';

export type VcxMemberReportContext = 'directory' | 'peer_chat' | 'ceo_chat' | 'community' | 'concierge';
export type VcxMemberReportStatus =
  | 'pending'
  | 'reviewing'
  | 'dismissed'
  | 'warned'
  | 'tier_demoted'
  | 'exited';
export type VcxMemberReportSeverity = 'low' | 'normal' | 'high' | 'critical';

export type VcxPlacementReferralType =
  | 'self'
  | 'peer'
  | 'curation'
  | 'ceo_chat'
  | 'concierge'
  | 'external';
export type VcxPlacementStatus = 'pending' | 'invoiced' | 'paid' | 'refunded' | 'cancelled';

export type VcxNewsletterProvider = 'resend' | 'ses' | 'postmark' | 'internal';

export type VcxConciergeDeliveryMethod =
  | 'sealed_envelope'
  | 'signal'
  | 'in_person'
  | 'encrypted_email';

export type VcxTierChangeType = 'promote' | 'demote' | 'manual_set' | 'auto_initial';

export type VcxTagCategory = 'industry' | 'function' | 'stage' | 'skill' | 'topic';
export type VcxTagMappingSource = 'manual' | 'llm' | 'synonym_match' | 'exact';

export type VcxCommunityCategoryV2 =
  | 'career'
  | 'leadership'
  | 'compensation'
  | 'burnout'
  | 'productivity'
  | 'company_review'
  | 'learning'
  | 'free';

export type VcxCategoryPrivacyHint = 'anonymous_default' | 'anonymous_forced' | 'optional';

// vector(1024) — Supabase 반환 값은 number[] 또는 string(serialized)이므로 union.
export type VcxEmbedding = number[] | string | null;

// ============================================================================
// event_catalog (migration 024)
// ============================================================================

export interface EventCatalogRow {
  event_type: string;
  version: number;
  context_schema: Record<string, unknown>;
  pii_fields: string[];
  deprecated_at: string | null;
  owner_team: string;
  created_at: string;
  updated_at: string;
}

export type EventCatalogInsert = Omit<EventCatalogRow, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type EventCatalogUpdate = Partial<EventCatalogInsert>;

// ============================================================================
// activity_events (migration 024)
// ============================================================================

export interface ActivityEventRow {
  id: number;
  actor_id: string | null;
  actor_type: VcxEventActorType;
  event_type: string;
  event_version: number;
  target_id: string | null;
  target_type: VcxEventTargetType | string | null;
  session_id: string | null;
  idempotency_key: string | null;
  client_ts: string | null;
  schema_ref: string | null;
  context: Record<string, unknown>;
  created_at: string;
}

export type ActivityEventInsert = Omit<ActivityEventRow, 'id' | 'created_at'> & {
  id?: number;
  created_at?: string;
};

export type ActivityEventUpdate = never; // append-only

// ============================================================================
// tag_canonical (migration 025)
// ============================================================================

export interface TagCanonicalRow {
  id: string;
  canonical_slug: string;
  display_ko: string;
  display_en: string | null;
  category: VcxTagCategory;
  synonyms: string[];
  usage_count: number;
  embedding: VcxEmbedding;
  embed_model: string | null;
  embed_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TagCanonicalInsert = Omit<
  TagCanonicalRow,
  'id' | 'usage_count' | 'created_at' | 'updated_at'
> & {
  id?: string;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type TagCanonicalUpdate = Partial<TagCanonicalInsert>;

// ============================================================================
// member_tag_mapping (migration 025)
// ============================================================================

export interface MemberTagMappingRow {
  member_id: string;
  canonical_id: string;
  raw_value: string;
  confidence: number;
  source: VcxTagMappingSource;
  source_model: string | null;
  created_at: string;
}

export type MemberTagMappingInsert = Omit<MemberTagMappingRow, 'created_at'> & {
  created_at?: string;
};

export type MemberTagMappingUpdate = Partial<MemberTagMappingInsert>;

// ============================================================================
// vcx_member_connections (migration 025b)
// ============================================================================

export type VcxConnectionType = 'peer_chat_mutual';

export interface VcxMemberConnectionRow {
  user_a_id: string;
  user_b_id: string;
  connection_type: VcxConnectionType;
  established_at: string;
  established_by_application_id: string | null;
}

export type VcxMemberConnectionInsert = Omit<VcxMemberConnectionRow, 'established_at'> & {
  established_at?: string;
};

export type VcxMemberConnectionUpdate = never; // immutable

// ============================================================================
// vcx_placements (migration 025c) — UI 노출 금지 (재무 전용)
// ============================================================================

export interface VcxPlacementRow {
  id: string;
  member_id: string;
  hiring_entity_id: string | null;
  position_id: string | null;
  referral_type: VcxPlacementReferralType;
  referrer_id: string | null;
  placement_date: string; // ISO date

  // 🚨 이하 필드는 프론트 응답에 포함 금지 (PRD §1.3).
  fee_amount_krw: number;
  fee_currency: string;
  fee_invoiced_at: string | null;
  fee_received_at: string | null;

  status: VcxPlacementStatus;
  attribution_path: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type VcxPlacementInsert = Omit<
  VcxPlacementRow,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type VcxPlacementUpdate = Partial<VcxPlacementInsert>;

/** Self-view safe shape — 본인 열람권용, 금액·attribution 제외 */
export type VcxPlacementSelfRow = Pick<
  VcxPlacementRow,
  'id' | 'member_id' | 'position_id' | 'referral_type' | 'placement_date' | 'status'
>;

// ============================================================================
// vcx_member_reports (migration 023)
// ============================================================================

export interface VcxMemberReportRow {
  id: string;
  reportee_id: string;
  reporter_id: string;
  context_type: VcxMemberReportContext;
  context_id: string | null;
  reason: string;
  evidence: string | null;
  status: VcxMemberReportStatus;
  severity: VcxMemberReportSeverity;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
}

export type VcxMemberReportInsert = Omit<
  VcxMemberReportRow,
  'id' | 'status' | 'severity' | 'created_at' | 'reviewed_by' | 'reviewed_at' | 'review_notes'
> & {
  id?: string;
  status?: VcxMemberReportStatus;
  severity?: VcxMemberReportSeverity;
  created_at?: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
};

export type VcxMemberReportUpdate = Partial<
  Pick<VcxMemberReportRow, 'status' | 'severity' | 'reviewed_by' | 'reviewed_at' | 'review_notes'>
>;

// ============================================================================
// vcx_feed_newsletter_metrics (migration 029)
// ============================================================================

export interface VcxFeedNewsletterMetricRow {
  id: string;
  feed_item_id: string;
  member_id: string;
  campaign_tag: string | null;
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  first_click_at: string | null;
  click_count: number;
  bounced_at: string | null;
  bounce_reason: string | null;
  unsubscribed_at: string | null;
  provider: VcxNewsletterProvider;
  provider_msg_id: string | null;
  created_at: string;
  updated_at: string;
}

export type VcxFeedNewsletterMetricInsert = Omit<
  VcxFeedNewsletterMetricRow,
  'id' | 'created_at' | 'updated_at' | 'click_count'
> & {
  id?: string;
  click_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type VcxFeedNewsletterMetricUpdate = Partial<VcxFeedNewsletterMetricInsert>;

// ============================================================================
// community_category_meta (migration 030)
// ============================================================================

export interface CommunityCategoryMetaRow {
  slug: VcxCommunityCategoryV2;
  display_ko: string;
  display_order: number;
  privacy_hint: VcxCategoryPrivacyHint;
  description_ko: string | null;
  is_active: boolean;
}

// ============================================================================
// vcx_concierge_credentials (migration 031)
// ============================================================================

export interface VcxConciergeCredentialRow {
  member_id: string;
  issued_by: string;
  issued_at: string;
  expires_at: string;
  delivered_via: VcxConciergeDeliveryMethod;
  delivered_at: string | null;
  consumed_at: string | null;
  invalidated_at: string | null;
  invalidation_reason: string | null;
  notes: string | null;
}

export type VcxConciergeCredentialInsert = Omit<
  VcxConciergeCredentialRow,
  'issued_at' | 'expires_at' | 'delivered_at' | 'consumed_at' | 'invalidated_at' | 'invalidation_reason'
> & {
  issued_at?: string;
  expires_at?: string;
  delivered_at?: string | null;
  consumed_at?: string | null;
  invalidated_at?: string | null;
  invalidation_reason?: string | null;
};

export type VcxConciergeCredentialUpdate = Partial<
  Pick<
    VcxConciergeCredentialRow,
    'delivered_at' | 'consumed_at' | 'invalidated_at' | 'invalidation_reason' | 'notes'
  >
>;

// ============================================================================
// vcx_tier_change_log (migration 033)
// ============================================================================

export interface VcxTierChangeLogRow {
  id: string;
  member_id: string;
  previous_tier: 'core' | 'endorsed' | null;
  new_tier: 'core' | 'endorsed';
  change_type: VcxTierChangeType;
  reason_code: string | null;
  reason_detail: string | null;
  related_report_ids: string[];
  effective_at: string;
  notified_at: string | null;
  appeal_deadline: string | null;
  decided_by: string | null;
  approved_by: string | null;
  created_at: string;
}

// ============================================================================
// vcx_members 추가 컬럼 (migrations 022 + 025 + 031)
// ============================================================================

/**
 * 기존 supabase.ts 의 vcx_members Row 에 병합되어야 할 rev 4 신규 필드.
 * 재생성 시까지는 이 interface를 spread 하여 사용.
 */
export interface VcxMembersRev4Extension {
  /** migration 022: Level 2 reveal 동의 여부 (default true) */
  full_reveal_on_mutual_accept: boolean;

  /** migration 025: 관심사 집합 벡터 (Phase 2 계산) */
  interest_embedding: VcxEmbedding;
  interest_embed_model: string | null;
  interest_embed_updated_at: string | null;

  /** migration 031: 온보딩 채널 + 본인 검증 + 2FA 메타 */
  onboarding_channel: VcxOnboardingChannel;
  external_verification_doc_url: string | null;
  verified_by: VcxVerifiedBy | null;
  first_login_completed_at: string | null;
  mfa_enrolled_at: string | null;
}

// ============================================================================
// Directory Level 0/1/2 API response shapes (UI 소비용)
// ============================================================================

/** Level 0 — 집계 통계 (k-anonymity 적용, 025d) */
export interface DirectoryLevel0Bucket {
  dimension: 'industry' | 'stage' | 'function' | 'years_band';
  label: string;
  safe_count: string | null; // e.g. "10+", "10명 미만", null
  safe_count_numeric: number | null;
}

/** Level 1 — 마스킹 카드 (name/company/linkedin NULL) */
export interface DirectoryLevel1Card {
  id: string;
  name: string | null;
  current_company: string | null;
  linkedin_url: string | null;
  title: string | null;
  member_tier: 'core' | 'endorsed';
  years_of_experience: number | null;
  professional_fields: string[];
  bio: string | null;
  profile_visibility: 'members_only' | 'corporate_only' | 'all';
  is_level2_unlocked: boolean;
}

/** Level 2 — 풀 프로필 (mutual accept 후) */
export interface DirectoryLevel2Card extends DirectoryLevel1Card {
  name: string;
  current_company: string;
  linkedin_url: string;
  is_level2_unlocked: true;
}
