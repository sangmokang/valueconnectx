import { Ratelimit } from '@upstash/ratelimit'
import { getRedis } from '@/lib/redis'

const redis = getRedis()

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
    if (process.env.NODE_ENV === 'production') {
      console.error('SECURITY: Rate limiter unavailable in production')
      return { success: false, remaining: 0 }
    }
    return { success: true, remaining: 999 }
  }
  const result = await limiter.limit(identifier)
  return { success: result.success, remaining: result.remaining }
}
