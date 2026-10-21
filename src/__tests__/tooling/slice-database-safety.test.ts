// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type RegisteredCase = {
  title: string
  run: (fixtures: Record<string, unknown>) => Promise<unknown>
}

const { registeredCases, mockTest, mockCreateClient, mockReadFile, mockFetch } = vi.hoisted(() => {
  const registeredCases: RegisteredCase[] = []
  const register = vi.fn((title: string, run: RegisteredCase['run']) => {
    registeredCases.push({ title, run })
  })
  const mockTest = Object.assign(register, {
    describe: (_title: string, registerCases: () => void) => registerCases(),
    skip: (condition: boolean) => {
      if (condition) throw new Error('MOCK_PLAYWRIGHT_SKIP')
    },
  })
  return {
    registeredCases,
    mockTest,
    mockCreateClient: vi.fn(),
    mockReadFile: vi.fn(),
    mockFetch: vi.fn(),
  }
})

vi.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }))
vi.mock('node:fs', () => ({ readFileSync: mockReadFile }))
vi.mock('@playwright/test', () => ({
  test: mockTest,
  expect: () => { throw new Error('MOCK_BROWSER_NOT_RUN') },
}))

const specifications = [
  ['s1-invite-onboarding', () => import('../../../e2e/slice/s1-invite-onboarding.spec')],
  ['s3-directory', () => import('../../../e2e/slice/s3-directory.spec')],
  ['s4-coffeechat', () => import('../../../e2e/slice/s4-coffeechat.spec')],
  ['s4-coffeechat-brief', () => import('../../../e2e/slice/s4-coffeechat-brief.spec')],
  ['s5-feedback', () => import('../../../e2e/slice/s5-feedback.spec')],
  ['p2-s1-cold-start', () => import('../../../e2e/slice/p2-s1-cold-start.spec')],
  ['p2-s2-ai-brief-v2', () => import('../../../e2e/slice/p2-s2-ai-brief-v2.spec')],
  ['p2-s3-community', () => import('../../../e2e/slice/p2-s3-community.spec')],
] as const

// 브라우저 동작을 흉내 내어 통과시키지 않고, 실제 I/O 전에 해당 콜백을 중단한다.
function blockedBrowser(): unknown {
  const blocked: () => undefined = new Proxy(() => undefined, {
    get: () => blocked,
    apply: () => { throw new Error('MOCK_BROWSER_NOT_RUN') },
  })
  return blocked
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  registeredCases.length = 0
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://production-project.supabase.co')
  vi.stubEnv('SUPABASE_URL', '')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'not-a-real-service-key')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'not-a-real-anon-key')
  vi.stubEnv('ANTHROPIC_API_KEY', '')
  vi.stubEnv('E2E_USER_EMAIL', 'boundary@example.invalid')
  vi.stubEnv('E2E_USER_PASSWORD', 'not-a-real-password')
  mockCreateClient.mockImplementation(() => { throw new Error('UNSAFE_CLIENT_CONSTRUCTED') })
  mockReadFile.mockImplementation(() => { throw new Error('ENV_FILE_READ_FORBIDDEN') })
  mockFetch.mockImplementation(() => { throw new Error('NETWORK_FORBIDDEN') })
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('slice spec의 실제 DB 접근 진입점', () => {
  it.each(specifications)('%s는 미허용 DB에서 클라이언트 생성 전에 거부한다', async (_name, load) => {
    await load()
    expect(registeredCases.length).toBeGreaterThan(0)
    const fixtures = {
      page: blockedBrowser(),
      request: blockedBrowser(),
      browser: blockedBrowser(),
    }
    let guardedCase: string | undefined

    // 첫 콜백이 비인증 화면 시험일 수 있으므로 DB 경계에 도달하는 콜백까지 탐색한다.
    for (const registered of registeredCases) {
      try {
        await registered.run(fixtures)
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('[TEST_DB_TARGET]')) {
          guardedCase = registered.title
        }
      }
    }

    expect(mockCreateClient).not.toHaveBeenCalled()
    expect(mockReadFile).not.toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
    expect(guardedCase, '실제 등록 콜백에서 DB 대상 거부를 관찰해야 합니다.').toBeTruthy()
  })
})
