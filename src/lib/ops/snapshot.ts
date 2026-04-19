import { createAdminClient } from '@/lib/supabase/admin'

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
    'vcx_notifications',
  ]

  const counts: Record<string, number> = {}
  await Promise.all(
    tables.map(async (table) => {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
      counts[table] = error ? -1 : (count ?? 0)
    })
  )

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
    security: { envVarsPresent },
  }
}
