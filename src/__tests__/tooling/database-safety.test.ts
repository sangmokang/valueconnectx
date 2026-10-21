// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import { cleanupTestData, seedTestUser } from '../../../e2e/helpers/seed'
import globalSetup from '../../../e2e/global-setup'

const { mockCreateClient, mockSpawn } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockSpawn: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }))
vi.mock('node:child_process', () => ({ spawn: mockSpawn }))

const user = {
  email: 'boundary@example.invalid',
  password: 'not-a-real-password',
  name: '시험 사용자',
  memberTier: 'core' as const,
  systemRole: 'member' as const,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321')
  vi.stubEnv('SUPABASE_URL', '')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'not-a-real-service-key')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'not-a-real-anon-key')
  vi.stubEnv('SKIP_DEMO_SEED', '')
  mockCreateClient.mockImplementation(() => { throw new Error('CLIENT_CONSTRUCTED') })
  mockSpawn.mockImplementation(() => {
    const child = new EventEmitter()
    queueMicrotask(() => child.emit('exit', 0))
    return child
  })
})

afterEach(() => vi.unstubAllEnvs())

describe('관리자 시험 데이터 쓰기 경계', () => {
  it.each([
    '',
    'https://production-project.supabase.co',
    'http://localhost.attacker.invalid:54321',
    'http://localhost:54321/other',
    'http://user:password@localhost:54321',
    'http://localhost:54321?target=production',
    'http://localhost:54321#production',
  ])('미허용 주소에서는 클라이언트를 생성하지 않는다: %s', async (url) => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', url)
    const error = await seedTestUser(user).catch((cause: unknown) => cause)
    expect(mockCreateClient).not.toHaveBeenCalled()
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toMatch(/^\[TEST_DB_TARGET\]/)
    expect((error as Error).message).not.toContain('not-a-real-service-key')
    if (url) expect((error as Error).message).not.toContain(url)
  })

  it('cleanup도 미허용 주소에서는 클라이언트를 생성하지 않는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://production-project.supabase.co')
    await expect(cleanupTestData()).rejects.toThrow(/^\[TEST_DB_TARGET\]/)
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('충돌하는 URL 별칭을 조용히 무시하지 않는다', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://production-project.supabase.co')
    await expect(seedTestUser(user)).rejects.toThrow(/^\[TEST_DB_TARGET\]/)
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('허용 주소와 명시적 키가 있으면 기존 회원 생성 흐름을 유지한다', async () => {
    const createUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null })
    const insert = vi.fn().mockResolvedValue({ error: null })
    mockCreateClient.mockReturnValue({
      auth: { admin: { createUser } },
      from: vi.fn().mockReturnValue({ insert }),
    })
    await expect(seedTestUser(user)).resolves.toBe('user-id')
    expect(createUser).toHaveBeenCalledOnce()
    expect(insert).toHaveBeenCalledOnce()
  })
})

describe('E2E setup 경계', () => {
  it('대상 주소가 미허용이면 seed subprocess를 시작하지 않는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://production-project.supabase.co')
    await expect(globalSetup()).rejects.toThrow(/^\[TEST_DB_TARGET\]/)
    expect(mockSpawn).not.toHaveBeenCalled()
  })

  it('SKIP_DEMO_SEED가 대상 검사까지 생략하지 못한다', async () => {
    vi.stubEnv('SKIP_DEMO_SEED', '1')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://production-project.supabase.co')
    await expect(globalSetup()).rejects.toThrow(/^\[TEST_DB_TARGET\]/)
    expect(mockSpawn).not.toHaveBeenCalled()
  })

  it.each(['SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'])('%s 누락을 성공으로 표시하지 않는다', async (key) => {
    vi.stubEnv(key, '')
    await expect(globalSetup()).rejects.toThrow(/^\[TEST_DB_TARGET\]/)
    expect(mockSpawn).not.toHaveBeenCalled()
  })

  it('허용 대상이면 seed를 한 번 실행한다', async () => {
    await globalSetup()
    expect(mockSpawn).toHaveBeenCalledOnce()
  })

  it('유효한 대상에서 명시적 생략은 seed만 생략한다', async () => {
    vi.stubEnv('SKIP_DEMO_SEED', '1')
    await globalSetup()
    expect(mockSpawn).not.toHaveBeenCalled()
  })
})
