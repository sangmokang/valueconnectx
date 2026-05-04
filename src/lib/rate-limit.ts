import { Ratelimit } from '@upstash/ratelimit'
import { getRedis } from '@/lib/redis'

const redis = getRedis()
let warnedMissingLimiter = false

function isDeployedProductionRuntime(): boolean {
  if (process.env.NODE_ENV !== 'production') return false
  return Boolean(
    process.env.VERCEL ||
      process.env.VERCEL_ENV ||
      process.env.AWS_REGION ||
      process.env.FLY_APP_NAME ||
      process.env.RENDER
  )
}

export const apiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '60 s'),
      prefix: 'ratelimit:api',
    })
  : null

export const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      prefix: 'ratelimit:auth',
    })
  : null

export const directoryLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      prefix: 'ratelimit:directory',
    })
  : null

export const directoryBurstLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '60 s'),
      prefix: 'ratelimit:directory-burst',
    })
  : null

export const directoryDailyLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, '86400 s'),
      prefix: 'ratelimit:directory-daily',
    })
  : null

export async function rateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  if (!limiter) {
    if (isDeployedProductionRuntime()) {
      console.error('SECURITY: Rate limiter unavailable in production')
      return { success: false, remaining: 0 }
    }
    if (process.env.NODE_ENV === 'production' && !warnedMissingLimiter) {
      console.warn('Rate limiter unavailable in local production runtime; allowing request')
      warnedMissingLimiter = true
    }
    return { success: true, remaining: 999 }
  }
  try {
    const result = await limiter.limit(identifier)
    return { success: result.success, remaining: result.remaining }
  } catch (error) {
    console.error('Rate limiter request failed; allowing request', error)
    return { success: true, remaining: 0 }
  }
}
