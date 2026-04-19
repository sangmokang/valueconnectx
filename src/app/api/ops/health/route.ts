import { NextRequest, NextResponse } from 'next/server'
import { runHealthChecks } from '@/lib/ops/health-checks'
import { evaluateAndAlert } from '@/lib/ops/alert-rules'
import { getEnvironmentSnapshot } from '@/lib/ops/snapshot'
import { getVcxUser, isAdmin } from '@/lib/auth/get-vcx-user'

// Vercel Cron 또는 외부 Cron에서 호출
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  const isCronCall = cronSecret && authHeader === `Bearer ${cronSecret}`

  // Cron 호출이 아니면 admin 인증 필요
  if (!isCronCall) {
    const user = await getVcxUser()
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }
  }

  const health = await runHealthChecks()

  // Cron 호출 시에만 알림 평가 (수동 호출 시에는 결과만 반환)
  if (isCronCall) {
    await evaluateAndAlert(health)
  }

  // snapshot 파라미터가 있으면 스냅샷도 포함
  const includeSnapshot = request.nextUrl.searchParams.get('snapshot') === 'true'

  if (includeSnapshot) {
    // 스냅샷은 admin만 가능 (Cron 호출 시에도 admin 체크)
    if (isCronCall) {
      return NextResponse.json({ health })
    }
    const snapshot = await getEnvironmentSnapshot()
    return NextResponse.json({ health, snapshot })
  }

  return NextResponse.json(health)
}
