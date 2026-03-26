import { rateLimit, directoryLimiter, directoryBurstLimiter, directoryDailyLimiter } from './rate-limit'

export type ScrapingAction = 'allow' | 'warn' | 'block' | 'restrict'

export async function checkDirectoryAccess(userId: string): Promise<{
  action: ScrapingAction
  message?: string
}> {
  // Check daily limit first (most restrictive)
  const daily = await rateLimit(directoryDailyLimiter, `dir-daily:${userId}`)
  if (!daily.success) {
    return { action: 'restrict', message: '일일 프로필 조회 한도를 초과했습니다. 내일 다시 시도해주세요.' }
  }

  // Check burst limit (20/min - hard block)
  const burst = await rateLimit(directoryBurstLimiter, `dir-burst:${userId}`)
  if (!burst.success) {
    return { action: 'block', message: '비정상적인 접근이 감지되었습니다. 잠시 후 다시 시도해주세요.' }
  }

  // Check warning limit (10/min - soft warning)
  const warn = await rateLimit(directoryLimiter, `dir-warn:${userId}`)
  if (!warn.success) {
    return { action: 'warn', message: '프로필 조회 속도가 빠릅니다. 천천히 탐색해주세요.' }
  }

  return { action: 'allow' }
}
