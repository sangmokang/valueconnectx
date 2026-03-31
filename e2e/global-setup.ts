import { spawn } from 'node:child_process'

/**
 * Playwright 글로벌 셋업
 * - 데모 시드 데이터를 실제 Supabase DB에 채워 넣음
 * - E2E 기본 로그인 계정 환경변수 설정
 */
async function runSeed(): Promise<void> {
  if (process.env.SKIP_DEMO_SEED === '1') return

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
  // 데모용 기본 로그인 계정 지정 (seed 스크립트에서 생성됨)
  process.env.E2E_USER_EMAIL ||= 'jihoon.park@vcx-seed.com'
  process.env.E2E_USER_PASSWORD ||= 'VcxSeed2026!'

  // 시드 데이터 주입
  await runSeed()
}

export default globalSetup

