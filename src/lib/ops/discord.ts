import type { HealthCheckResponse } from './health-checks'

const STATUS_COLORS = {
  healthy: 0x22c55e,   // green
  degraded: 0xeab308,  // yellow
  unhealthy: 0xef4444,  // red
} as const

const STATUS_EMOJI = {
  healthy: '🟢',
  degraded: '🟡',
  unhealthy: '🔴',
} as const

const STATUS_LABELS = {
  healthy: '정상',
  degraded: '성능 저하',
  unhealthy: '장애',
} as const

export async function sendDiscordAlert(health: HealthCheckResponse): Promise<void> {
  const webhookUrl = process.env.DISCORD_OPS_WEBHOOK_URL
  if (!webhookUrl) {
    console.log('[OPS] Discord Webhook URL 미설정 — 알림 건너뜀')
    return
  }

  const emoji = STATUS_EMOJI[health.status]
  const label = STATUS_LABELS[health.status]
  const color = STATUS_COLORS[health.status]

  const fields = [
    {
      name: 'Supabase',
      value: `${health.checks.supabase.status === 'ok' ? '✅' : '❌'} ${health.checks.supabase.status} (${health.checks.supabase.latency_ms}ms)${health.checks.supabase.message ? `\n${health.checks.supabase.message}` : ''}`,
      inline: true,
    },
    {
      name: 'Redis',
      value: `${health.checks.redis.status === 'ok' ? '✅' : '❌'} ${health.checks.redis.status} (${health.checks.redis.latency_ms}ms)${health.checks.redis.message ? `\n${health.checks.redis.message}` : ''}`,
      inline: true,
    },
  ]

  if (health.checks.env_vars.missing.length > 0) {
    fields.push({
      name: '환경변수 누락',
      value: health.checks.env_vars.missing.join(', '),
      inline: false,
    })
  }

  const embed = {
    title: `${emoji} [VCX ${label}] 서비스 상태 알림`,
    color,
    fields,
    footer: { text: `버전: ${health.version} | ${health.timestamp}` },
    timestamp: health.timestamp,
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
    if (!res.ok) {
      console.error(`[OPS] Discord 알림 실패: ${res.status} ${res.statusText}`)
    }
  } catch (e) {
    console.error('[OPS] Discord 알림 전송 오류:', e instanceof Error ? e.message : e)
  }
}

export async function sendRecoveryAlert(): Promise<void> {
  const webhookUrl = process.env.DISCORD_OPS_WEBHOOK_URL
  if (!webhookUrl) return

  const embed = {
    title: '🟢 [VCX 복구] 전체 서비스 정상',
    color: STATUS_COLORS.healthy,
    description: '이전 장애가 해소되어 모든 서비스가 정상 운영 중입니다.',
    timestamp: new Date().toISOString(),
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
  } catch (e) {
    console.error('[OPS] Discord 복구 알림 오류:', e instanceof Error ? e.message : e)
  }
}
