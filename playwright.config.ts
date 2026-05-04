import { defineConfig, devices } from '@playwright/test'

// 데모 로그인 기본 계정 (시드 스크립트가 생성)
process.env.E2E_USER_EMAIL ||= 'jihoon.park@vcx-seed.com'
process.env.E2E_USER_PASSWORD ||= 'VcxSeed2026!'

const e2ePort = process.env.E2E_PORT || '3100'
const e2eBaseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${e2ePort}`
const e2eWorkers = Number(process.env.E2E_WORKERS || 1)

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : e2eWorkers,
  reporter: 'html',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: e2eBaseURL,
    trace: 'on-first-retry',
    timeout: 30000,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${e2ePort}`,
    url: e2eBaseURL,
    reuseExistingServer: process.env.E2E_REUSE_SERVER === '1',
    timeout: 120000,
  },
})
