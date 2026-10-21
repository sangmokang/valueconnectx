import policy from '../../../config/test-database.json'
import { createClient } from '@supabase/supabase-js'

function fail(reason: string): never {
  throw new Error(`[TEST_DB_TARGET] ${reason}`)
}

function exactOrigin(value: string): string {
  let origin: string
  try {
    origin = new URL(value).origin
  } catch {
    return fail('올바른 시험 주소를 명시해야 합니다.')
  }
  // 파서가 경로·공백·역슬래시를 지운 뒤 통과시키지 않도록 원문도 비교한다.
  if (value !== origin && value !== `${origin}/`) {
    fail('시험 주소는 경로·자격증명·추가 매개변수 없는 origin이어야 합니다.')
  }
  return origin
}

export function getTestDatabaseCredentials(env: NodeJS.ProcessEnv = process.env) {
  if (policy.schemaVersion !== 1 || policy.allowedOrigins.length === 0) {
    fail('시험 DB 허용 목록이 올바르지 않습니다.')
  }
  const rawUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
  if (!rawUrl) fail('시험 DB 주소를 명시해야 합니다.')
  const url = exactOrigin(rawUrl)
  if (!policy.allowedOrigins.includes(url)) fail('허용 목록에 없는 시험 DB 주소입니다.')
  if (env.SUPABASE_URL && exactOrigin(env.SUPABASE_URL) !== url) {
    fail('시험 DB 주소 환경변수가 서로 다릅니다.')
  }
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey?.trim()) fail('시험 DB 관리자 키를 명시해야 합니다.')
  return { url, serviceRoleKey }
}

export function getE2EEnvironment(env: NodeJS.ProcessEnv = process.env) {
  getTestDatabaseCredentials(env)
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    fail('E2E 앱의 시험 DB 주소와 공개 키를 명시해야 합니다.')
  }
  const port = env.E2E_PORT || '3100'
  if (!/^\d+$/.test(port) || Number(port) < 1024 || Number(port) > 65535) {
    fail('E2E 포트는 1024~65535의 정수여야 합니다.')
  }
  const baseURL = exactOrigin(env.E2E_BASE_URL || `http://127.0.0.1:${port}`)
  const appOrigins = [`http://127.0.0.1:${port}`, `http://localhost:${port}`]
  if (!appOrigins.includes(baseURL)) fail('E2E 앱은 지정 포트의 로컬 주소여야 합니다.')
  if (env.E2E_REUSE_SERVER === '1') fail('E2E는 기존 서버를 재사용할 수 없습니다.')
  return { port, baseURL }
}

export function createTestAdminClient() {
  const { url, serviceRoleKey } = getTestDatabaseCredentials()
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
