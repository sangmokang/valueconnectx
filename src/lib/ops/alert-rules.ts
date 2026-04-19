import { getRedis } from '@/lib/redis'
import type { HealthCheckResponse } from './health-checks'
import { sendDiscordAlert, sendRecoveryAlert } from './discord'

const ALERT_COOLDOWN_SECONDS = 1800 // 30분
const DEGRADED_THRESHOLD = 3 // 연속 3회

const REDIS_KEYS = {
  lastStatus: 'ops:health:last_status',
  degradedCount: 'ops:health:degraded_count',
  lastAlertTime: 'ops:health:last_alert_time',
}

export async function evaluateAndAlert(health: HealthCheckResponse): Promise<void> {
  const redis = getRedis()

  // Redis 없으면 무조건 알림 (중복 방지 불가)
  if (!redis) {
    if (health.status !== 'healthy') {
      await sendDiscordAlert(health)
    }
    return
  }

  const [lastStatus, degradedCountStr, lastAlertTimeStr] = await Promise.all([
    redis.get<string>(REDIS_KEYS.lastStatus),
    redis.get<string>(REDIS_KEYS.degradedCount),
    redis.get<string>(REDIS_KEYS.lastAlertTime),
  ])

  const degradedCount = parseInt(degradedCountStr || '0', 10)
  const lastAlertTime = parseInt(lastAlertTimeStr || '0', 10)
  const now = Date.now()
  const cooldownActive = now - lastAlertTime < ALERT_COOLDOWN_SECONDS * 1000

  if (health.status === 'unhealthy') {
    // 즉시 알림 (쿨다운 적용)
    if (!cooldownActive) {
      await sendDiscordAlert(health)
      await redis.set(REDIS_KEYS.lastAlertTime, now.toString())
    }
    await redis.set(REDIS_KEYS.degradedCount, '0')
  } else if (health.status === 'degraded') {
    const newCount = degradedCount + 1
    await redis.set(REDIS_KEYS.degradedCount, newCount.toString())
    await redis.set(REDIS_KEYS.lastStatus, health.status)
    // 연속 3회 시 알림
    if (newCount >= DEGRADED_THRESHOLD && !cooldownActive) {
      await sendDiscordAlert(health)
      await redis.set(REDIS_KEYS.lastAlertTime, now.toString())
      await redis.set(REDIS_KEYS.degradedCount, '0')
    }
    return
  } else {
    // healthy — 이전 상태가 비정상이었으면 복구 알림
    if (lastStatus && lastStatus !== 'healthy') {
      await sendRecoveryAlert()
    }
    await redis.set(REDIS_KEYS.degradedCount, '0')
  }

  await redis.set(REDIS_KEYS.lastStatus, health.status)
}
