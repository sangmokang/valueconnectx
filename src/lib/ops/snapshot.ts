import { createAdminClient } from '@/lib/supabase/admin'

type FeedbackQueryBuilder = {
  select: (columns: string, options?: { count?: 'exact'; head?: boolean }) => FeedbackQueryBuilder
  order: (column: string, options: { ascending: boolean }) => FeedbackQueryBuilder
  limit: (count: number) => Promise<{
    count: number | null
    data: FeedbackQueryRow[] | null
    error: unknown
  }>
} & Promise<{
  count: number | null
  data: FeedbackQueryRow[] | null
  error: unknown
}>

type FeedbackClient = {
  from: (table: string) => FeedbackQueryBuilder
}

type FeedbackQueryRow = {
  id: string
  session_id?: string
  chat_id?: string
  reviewer_role: string
  overall_rating: number
  feedback_tags: string[] | null
  comment: string | null
  created_at: string
}

export interface EnvironmentSnapshot {
  timestamp: string
  deployment: {
    env: string
    commitSha: string
    region: string
  }
  database: {
    tables: Record<string, number>
  }
  feedback: {
    total: number
    recent: Array<{
      id: string
      session_id: string
      source?: 'ceo' | 'peer'
      reviewer_role: string
      overall_rating: number
      feedback_tags: string[] | null
      comment: string | null
      created_at: string
    }>
  }
  security: {
    envVarsPresent: Record<string, boolean>
  }
}

export async function getEnvironmentSnapshot(): Promise<EnvironmentSnapshot> {
  const supabase = createAdminClient()

  const tables = [
    'vcx_members',
    'vcx_corporate_users',
    'vcx_invites',
    'vcx_recommendations',
    'vcx_positions',
    'vcx_community_posts',
    'vcx_ceo_coffeechat_sessions',
    'vcx_peer_coffeechat_stories',
    'vcx_coffeechat_feedback',
    'peer_coffeechat_feedback',
    'vcx_notifications',
  ]

  const counts: Record<string, number> = {}
  await Promise.all(
    tables.map(async (table) => {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
      counts[table] = error ? -1 : (count ?? 0)
    })
  )

  const feedbackClient = supabase as unknown as FeedbackClient
  const [
    { count: ceoFeedbackCount },
    { data: recentCeoFeedback, error: ceoFeedbackError },
    { count: peerFeedbackCount },
    { data: recentPeerFeedback, error: peerFeedbackError },
  ] = await Promise.all([
    feedbackClient.from('vcx_coffeechat_feedback').select('id', { count: 'exact', head: true }),
    feedbackClient
      .from('vcx_coffeechat_feedback')
      .select('id, session_id, reviewer_role, overall_rating, feedback_tags, comment, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    feedbackClient.from('peer_coffeechat_feedback').select('id', { count: 'exact', head: true }),
    feedbackClient
      .from('peer_coffeechat_feedback')
      .select('id, chat_id, reviewer_role, overall_rating, feedback_tags, comment, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const recentFeedback = [
    ...(ceoFeedbackError ? [] : (recentCeoFeedback ?? []).map((item) => ({
      id: item.id,
      session_id: item.session_id ?? '',
      source: 'ceo' as const,
      reviewer_role: item.reviewer_role,
      overall_rating: item.overall_rating,
      feedback_tags: item.feedback_tags,
      comment: item.comment,
      created_at: item.created_at,
    }))),
    ...(peerFeedbackError ? [] : (recentPeerFeedback ?? []).map((item) => ({
      id: item.id,
      session_id: item.chat_id ?? '',
      source: 'peer' as const,
      reviewer_role: item.reviewer_role,
      overall_rating: item.overall_rating,
      feedback_tags: item.feedback_tags,
      comment: item.comment,
      created_at: item.created_at,
    }))),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  const feedbackTotal =
    counts.vcx_coffeechat_feedback === -1 && counts.peer_coffeechat_feedback === -1
      ? -1
      : (ceoFeedbackCount ?? (counts.vcx_coffeechat_feedback === -1 ? 0 : counts.vcx_coffeechat_feedback) ?? 0)
        + (peerFeedbackCount ?? (counts.peer_coffeechat_feedback === -1 ? 0 : counts.peer_coffeechat_feedback) ?? 0)

  const envKeys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'DISCORD_OPS_WEBHOOK_URL',
  ]

  const envVarsPresent: Record<string, boolean> = {}
  for (const key of envKeys) {
    envVarsPresent[key] = !!process.env[key]
  }

  return {
    timestamp: new Date().toISOString(),
    deployment: {
      env: process.env.VERCEL_ENV || 'development',
      commitSha: (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7),
      region: process.env.VERCEL_REGION || 'local',
    },
    database: { tables: counts },
    feedback: {
      total: feedbackTotal,
      recent: recentFeedback,
    },
    security: { envVarsPresent },
  }
}
