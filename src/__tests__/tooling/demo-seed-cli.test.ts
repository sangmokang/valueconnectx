// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

let directory: string
beforeEach(() => {
  vi.clearAllMocks()
  directory = mkdtempSync(join(tmpdir(), 'vcx-seed-errors-'))
  writeFileSync(join(directory, 'network.cjs'), `globalThis.fetch = () => { throw new Error('SIMULATED_DB_FAILURE') }`)
})
afterEach(() => rmSync(directory, { recursive: true, force: true }))

describe('demo cleanup CLI 실패 종료', () => {
  it.each([{ mode: 'seed', args: [] }, { mode: 'cleanup', args: ['--cleanup'] }])('$mode: SDK 오류 객체가 있어도 실패 종료하며 완료를 출력하지 않는다', ({ args }) => {
    const result = spawnSync(process.execPath, [
      '--require', join(directory, 'network.cjs'), '--import', 'tsx',
      resolve('scripts/seed-dummy-data.ts'), ...args,
    ], {
      cwd: resolve('.'), timeout: 15000, encoding: 'utf8',
      env: { PATH: process.env.PATH, NODE_ENV: 'test', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_ROLE_KEY: 'not-a-real-key' },
    })
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(1)
    expect(result.stdout + result.stderr).not.toContain('정리 완료')
    expect(result.stdout + result.stderr).not.toContain('시딩 완료')
    expect(result.stderr).toContain('[DEMO_FAILED]')
  }, 20000)
})
