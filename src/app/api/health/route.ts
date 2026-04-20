import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const START_TIME = Date.now()

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7),
    uptime_ms: Date.now() - START_TIME,
  })
}
