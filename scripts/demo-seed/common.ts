import type { createTestAdminClient } from '../../src/lib/testing/database'

// 생성기는 기존 시험 전용 client를 받습니다. 생성 DB 타입에 없는 레거시 테이블은 W05 대조 대상입니다.
export type DemoClient = ReturnType<typeof createTestAdminClient>

export function checkResult<T extends { error?: unknown }>(result: T, operation = 'DB 작업'): T {
  if (result.error) throw new Error(`[DEMO_DB] ${operation} 실패`)
  return result
}

export function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function preflightSchemaCheck(admin: DemoClient) {
  const tables = ['vcx_members', 'vcx_corporate_users', 'vcx_recommendations',
    'vcx_ceo_coffee_sessions', 'vcx_coffee_applications', 'peer_coffee_chats',
    'peer_coffee_applications', 'community_posts', 'community_comments',
    'vcx_community_reactions', 'positions', 'position_interests', 'vcx_notifications', 'vcx_hiring_records']
  for (const table of tables) {
    checkResult(await admin.from(table).select('*', { head: true, count: 'exact' }).limit(1), table)
  }
}

export async function createAuthUser(admin: DemoClient, email: string, password: string): Promise<string> {
  const result = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (!result.error) {
    if (!result.data.user) throw new Error('[DEMO_DB] Auth 사용자 ID 누락')
    return result.data.user.id
  }
  if (!result.error.message?.includes('already been registered')) {
    throw new Error('[DEMO_DB] Auth 사용자 생성 실패')
  }
  // 목록 조회가 실패하면 다른 테이블로 추측해서 진행하지 않습니다.
  for (let page = 1; ; page++) {
    const existing = checkResult(await admin.auth.admin.listUsers({ page, perPage: 100 }), 'Auth 목록 조회')
    const user = existing.data.users.find(user => user.email === email)
    if (user) return user.id
    if (existing.data.users.length < 100) break
  }
  throw new Error('[DEMO_DB] 기존 Auth 사용자 확인 실패')
}
