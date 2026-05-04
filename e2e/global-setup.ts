import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

function loadDotEnvLocal() {
  if (!existsSync('.env.local')) return new Set<string>()

  const keys = new Set<string>()
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    const key = trimmed.slice(0, index)
    const value = trimmed.slice(index + 1)
    process.env[key] = value
    keys.add(key)
  }
  return keys
}

/**
 * Playwright 글로벌 셋업
 * - 데모 시드 데이터를 실제 Supabase DB에 채워 넣음
 * - E2E 기본 로그인 계정 환경변수 설정
 */
async function runSeed(): Promise<void> {
  if (process.env.SKIP_DEMO_SEED === '1') return
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY가 없어 데모 시드를 건너뜁니다. 인증 golden path는 skip됩니다.')
    return
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
      'tsx',
      'scripts/seed-dummy-data.ts',
    ], {
      stdio: 'inherit',
      env: process.env,
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`seed-dummy-data.ts exited with code ${code}`))
    })
    child.on('error', reject)
  })
}

async function globalSetup() {
  const dotEnvKeys = loadDotEnvLocal()
  if (dotEnvKeys.has('NEXT_PUBLIC_SUPABASE_URL') && !dotEnvKeys.has('SUPABASE_SERVICE_ROLE_KEY')) {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  }

  // 데모용 기본 로그인 계정 지정 (seed 스크립트에서 생성됨)
  process.env.E2E_USER_EMAIL ||= 'jihoon.park@vcx-seed.com'
  process.env.E2E_USER_PASSWORD ||= 'VcxSeed2026!'

  // 시드 데이터 주입
  await runSeed()
}

export default globalSetup
