import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockAuthGetUser = vi.fn()
  const mockServerClient = {
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  }
  const mockCheckDirectoryAccess = vi.fn()

  return {
    mockFrom,
    mockAuthGetUser,
    mockServerClient,
    mockCheckDirectoryAccess,
    createClient: vi.fn(async () => mockServerClient),
    mockRateLimit: vi.fn(),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mocks.mockRateLimit,
  authLimiter: null,
  apiLimiter: null,
  directoryLimiter: null,
  directoryBurstLimiter: null,
  directoryDailyLimiter: null,
}))

vi.mock('@/lib/anti-scraping', () => ({
  checkDirectoryAccess: mocks.mockCheckDirectoryAccess,
}))

import { GET } from '@/app/api/directory/route'

function makeRequest(params: Record<string, string> = {}, ip = '127.0.0.1') {
  const url = new URL('http://localhost/api/directory')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new NextRequest(url.toString(), {
    headers: { 'x-forwarded-for': ip },
  })
}

const baseMember = {
  id: 'member-id-1',
  name: 'Alice Kim',
  current_company: 'TechCorp',
  title: 'CTO',
  member_tier: 'core',
  professional_fields: ['engineering'],
  industry: 'technology',
  location: 'Seoul',
  is_open_to_chat: true,
  avatar_url: null,
  join_date: '2024-01-01',
  linkedin_url: 'https://linkedin.com/in/alice',
}

function makeChainableQuery(result: { data: unknown; error: unknown; count: number | null }) {
  // Build a thenable object whose every method returns itself so any
  // chain depth (eq, range, order, textSearch, …) resolves to `result`.
  const thenable: Record<string, unknown> = {}
  const handler: ProxyHandler<typeof thenable> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (onFulfilled: (v: unknown) => unknown, onRejected: (v: unknown) => unknown) =>
          Promise.resolve(result).then(onFulfilled, onRejected)
      }
      if (prop === 'catch') {
        return (onRejected: (v: unknown) => unknown) =>
          Promise.resolve(result).catch(onRejected)
      }
      // Every chained method returns the same proxy
      return () => proxy
    },
  }
  const proxy = new Proxy(thenable, handler)
  return proxy
}

function setupHappyPath(members = [baseMember], count = 1) {
  mocks.mockAuthGetUser.mockResolvedValue({
    data: { user: { id: 'user-id-1' } },
    error: null,
  })

  let callCount = 0
  mocks.mockFrom.mockImplementation(() => {
    callCount++
    if (callCount === 1) {
      // First call: membership check (.select().eq().eq().single())
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
        }),
      }
    }
    // Second call: directory listing — the route does a long fluent chain
    // ending in an awaited query. Return a chainable thenable.
    return {
      select: vi.fn().mockReturnValue(
        makeChainableQuery({ data: members, error: null, count })
      ),
    }
  })

  mocks.mockCheckDirectoryAccess.mockResolvedValue({ action: 'allow' })
}

describe('GET /api/directory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not authenticated' },
    })

    const req = makeRequest()
    const res = await GET(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 401 when auth returns no user without error', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const req = makeRequest()
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('returns 403 when authenticated user is not a VCX member', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'non-member-id' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })

    const req = makeRequest()
    const res = await GET(req)

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버 또는 기업 회원만 접근할 수 있습니다')
  })

  it('returns 429 when daily rate limit is exceeded (restrict action)', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })
    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
      }),
    })
    mocks.mockCheckDirectoryAccess.mockResolvedValue({
      action: 'restrict',
      message: '일일 프로필 조회 한도를 초과했습니다. 내일 다시 시도해주세요.',
    })

    const req = makeRequest()
    const res = await GET(req)

    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toBe('일일 프로필 조회 한도를 초과했습니다. 내일 다시 시도해주세요.')
  })

  it('returns 429 when burst rate limit is exceeded (block action)', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })
    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
      }),
    })
    mocks.mockCheckDirectoryAccess.mockResolvedValue({
      action: 'block',
      message: '비정상적인 접근이 감지되었습니다. 잠시 후 다시 시도해주세요.',
    })

    const req = makeRequest()
    const res = await GET(req)

    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toBe('비정상적인 접근이 감지되었습니다. 잠시 후 다시 시도해주세요.')
  })

  it('returns 400 for invalid page parameter (non-integer)', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })
    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
      }),
    })
    mocks.mockCheckDirectoryAccess.mockResolvedValue({ action: 'allow' })

    const req = makeRequest({ page: 'not-a-number' })
    const res = await GET(req)

    expect(res.status).toBe(400)
  })

  it('returns 400 for limit parameter exceeding maximum of 100', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })
    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
      }),
    })
    mocks.mockCheckDirectoryAccess.mockResolvedValue({ action: 'allow' })

    const req = makeRequest({ limit: '101' })
    const res = await GET(req)

    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid tier filter value', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })
    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
      }),
    })
    mocks.mockCheckDirectoryAccess.mockResolvedValue({ action: 'allow' })

    const req = makeRequest({ tier: 'invalid-tier' })
    const res = await GET(req)

    expect(res.status).toBe(400)
  })

  it('returns 200 with data, total, page, and limit on happy path', async () => {
    setupHappyPath([baseMember], 1)

    const req = makeRequest()
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('total')
    expect(body).toHaveProperty('page')
    expect(body).toHaveProperty('limit')
  })

  it('returns default pagination values of page=1 and limit=20 when not specified', async () => {
    setupHappyPath([baseMember], 1)

    const req = makeRequest()
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.page).toBe(1)
    expect(body.limit).toBe(20)
  })

  it('returns the page and limit values from query params', async () => {
    setupHappyPath([baseMember], 1)

    const req = makeRequest({ page: '2', limit: '10' })
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.page).toBe(2)
    expect(body.limit).toBe(10)
  })

  it('strips linkedin_url from response data', async () => {
    setupHappyPath([baseMember], 1)

    const req = makeRequest()
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    for (const member of body.data) {
      expect(member).not.toHaveProperty('linkedin_url')
    }
  })

  it('returns 200 with empty data array when no members match', async () => {
    setupHappyPath([], 0)

    const req = makeRequest()
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
    expect(body.total).toBe(0)
  })

  it('returns 500 when database query fails', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })
    mocks.mockCheckDirectoryAccess.mockResolvedValue({ action: 'allow' })

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnValue(
          makeChainableQuery({ data: null, error: { message: 'db error' }, count: null })
        ),
      }
    })

    const req = makeRequest()
    const res = await GET(req)

    expect(res.status).toBe(500)
  })
})
