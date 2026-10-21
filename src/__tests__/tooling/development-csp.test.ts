// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import policy from '../../../config/test-database.json'
import nextConfig from '../../../next.config.mjs'

vi.mock('@sentry/nextjs', () => ({ withSentryConfig: (config: unknown) => config }))

afterEach(() => vi.unstubAllEnvs())

async function connections() {
  expect(nextConfig.headers).toBeTypeOf('function')
  const routes = await nextConfig.headers!()
  const csp = routes[0].headers.find((header) => header.key === 'Content-Security-Policy')!.value
  return csp.split('; ').find((directive) => directive.startsWith('connect-src '))!.split(' ')
}

describe('로컬 DB와 웹 보안 정책의 연결', () => {
  it('개발 앱은 JSON에 지정한 시험 DB와 websocket 주소를 허용한다', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const sources = await connections()
    for (const origin of policy.allowedOrigins) {
      expect(sources).toContain(origin)
      expect(sources).toContain(origin.replace('http:', 'ws:'))
    }
    expect(sources).not.toContain('*')
  })

  it.each(['production', 'test'])('%s에서는 로컬 허용을 추가하지 않는다', async (environment) => {
    vi.stubEnv('NODE_ENV', environment)
    const sources = await connections()
    expect(sources).toContain('https://*.supabase.co')
    expect(sources.some((source) => source.startsWith('http:') || source.startsWith('ws:'))).toBe(false)
  })
})
