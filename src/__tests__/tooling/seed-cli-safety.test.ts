// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

let fixture: string

beforeEach(() => {
  fixture = mkdtempSync(join(tmpdir(), 'vcx-seed-boundary-'))
  for (const file of [
    'scripts/seed-dummy-data.ts',
    'src/lib/testing/database.ts',
    'config/test-database.json',
    'playwright.config.ts',
    'e2e/global-setup.ts',
  ]) {
    mkdirSync(dirname(join(fixture, file)), { recursive: true })
    copyFileSync(resolve(file), join(fixture, file))
  }
  cpSync(resolve('scripts/demo-seed'), join(fixture, 'scripts/demo-seed'), { recursive: true })
  symlinkSync(resolve('node_modules'), join(fixture, 'node_modules'), 'dir')
  writeFileSync(join(fixture, 'block-network.cjs'), `
    const blocked = () => {
      require('node:fs').appendFileSync(__dirname + '/blocked-network.txt', 'blocked\\n');
      throw new Error('NETWORK_ATTEMPTED');
    };
    globalThis.fetch = blocked;
    require('node:http').request = blocked;
    require('node:https').request = blocked;
    // tsx의 Unix IPC도 차단하되 DB/HTTP 요청 계수와 섞지 않는다.
    require('node:net').Socket.prototype.connect = () => { throw new Error('SOCKET_BLOCKED'); };
  `)
})

afterEach(() => rmSync(fixture, { recursive: true, force: true }))

function runTool(script: string, args: string[], credentials: Record<string, string | undefined>) {
  return spawnSync(process.execPath, [
    '--require', join(fixture, 'block-network.cjs'),
    ...(script.endsWith('.ts') ? ['--import', 'tsx'] : []),
    script,
    ...args,
  ], {
    cwd: fixture,
    // 실제 키·NODE_OPTIONS·사내 프록시 설정을 자식 프로세스에 상속하지 않는다.
    env: { PATH: process.env.PATH, NODE_ENV: 'test', ...credentials },
    encoding: 'utf8',
    timeout: 15000,
  })
}

function runSeed(args: string[], credentials: Record<string, string | undefined>) {
  return runTool('scripts/seed-dummy-data.ts', args, credentials)
}

describe('직접 demo seed/cleanup 명령', () => {
  const modes = [{ mode: 'seed', args: [] }, { mode: 'cleanup', args: ['--cleanup'] }]
  it.each(modes)('외부 DB를 $mode 실행 전에 거부한다', ({ args }) => {
    const result = runSeed(args, {
      NEXT_PUBLIC_SUPABASE_URL: 'https://production-project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'not-a-real-service-key',
    })
    const output = result.stdout + result.stderr
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(1)
    expect(output).toContain('[TEST_DB_TARGET]')
    expect(output).not.toContain('NETWORK_ATTEMPTED')
    expect(output).not.toContain('not-a-real-service-key')
    expect(output).not.toContain('https://production-project.supabase.co')
    expect(existsSync(join(fixture, 'blocked-network.txt'))).toBe(false)
  }, 20000)

  it.each(modes)('일반 환경파일만으로 $mode 쓰기를 허용하지 않는다', ({ args }) => {
    writeFileSync(join(fixture, '.env.local'), [
      'NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321',
      'SUPABASE_SERVICE_ROLE_KEY=not-a-real-service-key',
    ].join('\n'))
    const result = runSeed(args, {})
    const output = result.stdout + result.stderr
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(1)
    expect(output).toContain('[TEST_DB_TARGET]')
    expect(output).not.toContain('NETWORK_ATTEMPTED')
    expect(existsSync(join(fixture, 'blocked-network.txt'))).toBe(false)
  }, 20000)

  it.each(modes)('로컬 설정은 $mode 실행 경계까지 도달한다', ({ args }) => {
    const result = runSeed(args, {
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      SUPABASE_SERVICE_ROLE_KEY: 'not-a-real-service-key',
    })
    expect(result.error).toBeUndefined()
    expect(result.stdout + result.stderr).not.toContain('[TEST_DB_TARGET]')
    // SDK가 fetch 예외를 오류 객체로 바꿔도 전송 전 차단 계수는 남는다.
    expect(readFileSync(join(fixture, 'blocked-network.txt'), 'utf8')).toContain('blocked')
  }, 20000)
})

describe('실제 Playwright config 진입점', () => {
  const credentials = {
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    SUPABASE_SERVICE_ROLE_KEY: 'not-a-real-service-key',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'not-a-real-anon-key',
  }
  it('원격 앱을 config 로드 중 거부한다', () => {
    const result = runTool('node_modules/@playwright/test/cli.js', ['test', '--list'], {
      ...credentials,
      E2E_BASE_URL: 'https://production.example.invalid',
    })
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('[TEST_DB_TARGET]')
    expect(result.stderr).not.toContain('NETWORK_ATTEMPTED')
    expect(result.stdout).not.toContain('Listing tests:')
    expect(existsSync(join(fixture, 'blocked-network.txt'))).toBe(false)
  }, 20000)

  it('로컬 설정에서는 브라우저·DB 없이 시험을 수집할 수 있다', () => {
    mkdirSync(join(fixture, 'e2e'), { recursive: true })
    writeFileSync(join(fixture, 'e2e/smoke.spec.ts'), [
      "import { test } from '@playwright/test'",
      "test('collection only', async () => {})",
    ].join('\n'))
    const result = runTool('node_modules/@playwright/test/cli.js', ['test', '--list'], credentials)
    expect(result.error).toBeUndefined()
    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(result.stdout).toContain('Total: 1 test in 1 file')
    expect(result.stderr).not.toContain('NETWORK_ATTEMPTED')
    expect(existsSync(join(fixture, 'blocked-network.txt'))).toBe(false)
  }, 20000)

  it('부모의 NODE_ENV와 무관하게 시험 앱은 개발 환경으로 시작한다', () => {
    writeFileSync(join(fixture, 'inspect-config.ts'), [
      "import config from './playwright.config'",
      'process.stdout.write(config.webServer.env.NODE_ENV)',
    ].join('\n'))
    const result = runTool('inspect-config.ts', [], { ...credentials, NODE_ENV: 'production' })
    expect(result.error).toBeUndefined()
    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(result.stdout).toBe('development')
    expect(existsSync(join(fixture, 'blocked-network.txt'))).toBe(false)
  }, 20000)
})
