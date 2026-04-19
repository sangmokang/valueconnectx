import { getRedis } from '@/lib/redis'
import { createAdminClient } from '@/lib/supabase/admin'

export type CheckStatus = 'ok' | 'degraded' | 'error'

export interface CheckResult {
  status: CheckStatus
  latency_ms: number
  message?: string
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    supabase: CheckResult
    redis: CheckResult
    env_vars: { status: CheckStatus; missing: string[] }
  }
}

async function checkSupabase(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('vcx_members').select('id').limit(1)
    const latency = Date.now() - start
    if (error) return { status: 'error', latency_ms: latency, message: error.message }
    if (latency > 3000) return { status: 'degraded', latency_ms: latency, message: '응답 지연' }
    return { status: 'ok', latency_ms: latency }
  } catch (e) {
    return { status: 'error', latency_ms: Date.now() - start, message: e instanceof Error ? e.message : '연결 실패' }
  }
}

async function checkRedis(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const redis = getRedis()
    if (!redis) return { status: 'error', latency_ms: 0, message: 'Redis 미설정' }
    await redis.ping()
    const latency = Date.now() - start
    if (latency > 500) return { status: 'degraded', latency_ms: latency, message: '응답 지연' }
    return { status: 'ok', latency_ms: latency }
  } catch (e) {
    return { status: 'error', latency_ms: Date.now() - start, message: e instanceof Error ? e.message : '연결 실패' }
  }
}

function checkEnvVars(): { status: CheckStatus; missing: string[] } {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ]
  const missing = required.filter((key) => !process.env[key])
  return {
    status: missing.length > 0 ? 'error' : 'ok',
    missing,
  }
}

export async function runHealthChecks(): Promise<HealthCheckResponse> {
  const [supabase, redis] = await Promise.all([checkSupabase(), checkRedis()])
  const envVars = checkEnvVars()

  const checks = { supabase, redis, env_vars: envVars }

  const hasError = supabase.status === 'error' || redis.status === 'error' || envVars.status === 'error'
  const hasDegraded = supabase.status === 'degraded' || redis.status === 'degraded'

  const status: HealthCheckResponse['status'] = hasError ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy'

  return {
    status,
    timestamp: new Date().toISOString(),
    version: (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7),
    checks,
  }
}
