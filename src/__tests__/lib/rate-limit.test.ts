import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLimit = vi.fn()

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
  })

  it('returns success:true and remaining when limiter is null', async () => {
    const result = await rateLimit(null, 'test-key')
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(999)
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
})
