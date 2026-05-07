import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockLimit = vi.fn()
const originalNodeEnv = process.env.NODE_ENV
const originalVercelEnv = process.env.VERCEL_ENV

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    limit = mockLimit
    static slidingWindow = vi.fn()
  },
}))

vi.mock('@upstash/redis/cloudflare', () => ({
  Redis: class {},
}))

import { rateLimit } from '../../lib/rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    ;(process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv
    process.env.VERCEL_ENV = originalVercelEnv
  })

  afterEach(() => {
    vi.restoreAllMocks()
    ;(process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv
    process.env.VERCEL_ENV = originalVercelEnv
  })

  it('returns success:true and remaining when limiter is null', async () => {
    const result = await rateLimit(null, 'test-key')
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(999)
  })

  it('allows local production runtime when limiter is null', async () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    delete process.env.VERCEL_ENV

    const result = await rateLimit(null, 'test-key')

    expect(result.success).toBe(true)
    expect(result.remaining).toBe(999)
  })

  it('blocks deployed production runtime when limiter is null', async () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    process.env.VERCEL_ENV = 'production'

    const result = await rateLimit(null, 'test-key')

    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('returns success:true when limiter allows request', async () => {
    mockLimit.mockResolvedValue({ success: true, remaining: 4 })
    const fakeLimiter = { limit: mockLimit } as never
    const result = await rateLimit(fakeLimiter, 'test-key')
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('returns success:false when limiter blocks request', async () => {
    mockLimit.mockResolvedValue({ success: false, remaining: 0 })
    const fakeLimiter = { limit: mockLimit } as never
    const result = await rateLimit(fakeLimiter, 'test-key')
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('passes identifier to limiter.limit', async () => {
    mockLimit.mockResolvedValue({ success: true, remaining: 9 })
    const fakeLimiter = { limit: mockLimit } as never
    await rateLimit(fakeLimiter, 'my-identifier')
    expect(mockLimit).toHaveBeenCalledWith('my-identifier')
  })

  it('fails open when the limiter backend throws', async () => {
    mockLimit.mockRejectedValue(new Error('redis unavailable'))
    const fakeLimiter = { limit: mockLimit } as never
    const result = await rateLimit(fakeLimiter, 'test-key')

    expect(result.success).toBe(true)
    expect(result.remaining).toBe(0)
  })
})
