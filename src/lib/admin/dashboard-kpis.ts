import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export type CoffeechatKpi = {
  total: number
  acceptedRate: number | null
  completed: number
}

export type CommunityKpi = {
  weeklyPosts: number
  weeklyReactions: number
}

export type AiBriefKpi = {
  ratio: number | null
  generated: number
  total: number
}

export type FeedbackKpi = {
  available: boolean
  averageRating: number | null
  count: number
}

export type DashboardKpis = {
  totalMembers: number
  weeklyNewMembers: number
  coffeechat: CoffeechatKpi
  community: CommunityKpi
  aiBrief: AiBriefKpi
  feedback: FeedbackKpi
}

function isoWeekAgo(now: Date = new Date()): string {
  const d = new Date(now)
  d.setDate(d.getDate() - 7)
  return d.toISOString()
}

type Client = SupabaseClient<Database> | SupabaseClient

export async function loadDashboardKpis(supabase: Client, now: Date = new Date()): Promise<DashboardKpis> {
  const weekAgo = isoWeekAgo(now)

  const [
    totalMembers,
    weeklyNewMembers,
    ceoTotal,
    ceoAccepted,
    peerTotal,
    peerAccepted,
    ceoCompleted,
    weeklyPosts,
    weeklyReactions,
    peerBriefTotal,
    peerBriefGenerated,
  ] = await Promise.all([
    countRows(supabase, 'vcx_members'),
    countRows(supabase, 'vcx_members', q => q.gte('created_at', weekAgo)),
    countRows(supabase, 'vcx_coffee_applications'),
    countRows(supabase, 'vcx_coffee_applications', q => q.eq('status', 'accepted')),
    countRows(supabase, 'peer_coffee_applications'),
    countRows(supabase, 'peer_coffee_applications', q => q.eq('status', 'accepted')),
    countRows(supabase, 'vcx_ceo_coffee_sessions', q => q.eq('status', 'completed')),
    countRows(supabase, 'community_posts', q => q.gte('created_at', weekAgo)),
    countRows(supabase, 'vcx_community_reactions', q => q.gte('created_at', weekAgo)),
    countRows(supabase, 'peer_coffee_applications'),
    countRows(supabase, 'peer_coffee_applications', q => q.not('host_brief', 'is', null)),
  ])

  const totalCoffeechats = ceoTotal + peerTotal
  const acceptedCoffeechats = ceoAccepted + peerAccepted
  const acceptedRate = totalCoffeechats > 0 ? acceptedCoffeechats / totalCoffeechats : null
  const aiBriefRatio = peerBriefTotal > 0 ? peerBriefGenerated / peerBriefTotal : null

  const feedback = await loadFeedbackKpi(supabase)

  return {
    totalMembers,
    weeklyNewMembers,
    coffeechat: {
      total: totalCoffeechats,
      acceptedRate,
      completed: ceoCompleted,
    },
    community: {
      weeklyPosts,
      weeklyReactions,
    },
    aiBrief: {
      ratio: aiBriefRatio,
      generated: peerBriefGenerated,
      total: peerBriefTotal,
    },
    feedback,
  }
}

async function countRows(
  supabase: Client,
  table: string,
  modify?: (q: ReturnType<Client['from']> extends infer T ? T : never) => unknown,
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = (supabase as any).from(table).select('*', { count: 'exact', head: true })
  if (modify) query = modify(query)
  const { count, error } = await query
  if (error) {
    // 테이블 부재나 권한 부족 시 0으로 폴백 (대시보드 안정성 우선)
    return 0
  }
  return count ?? 0
}

async function loadFeedbackKpi(supabase: Client): Promise<FeedbackKpi> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('peer_coffeechat_feedback')
    .select('overall_rating')

  if (error || !Array.isArray(data) || data.length === 0) {
    return { available: false, averageRating: null, count: 0 }
  }

  const ratings = data
    .map((r: { overall_rating: number | null }) => r.overall_rating)
    .filter((v: number | null): v is number => typeof v === 'number')

  if (ratings.length === 0) {
    return { available: true, averageRating: null, count: 0 }
  }

  const avg = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
  return { available: true, averageRating: avg, count: ratings.length }
}
