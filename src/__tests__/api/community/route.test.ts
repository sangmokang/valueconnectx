import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  const mockServerClient = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }
  return {
    mockGetUser,
    mockFrom,
    mockServerClient,
    createClient: vi.fn(async () => mockServerClient),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
  authLimiter: null,
  apiLimiter: null,
  directoryLimiter: null,
  directoryBurstLimiter: null,
  directoryDailyLimiter: null,
}))

import { GET, POST } from '@/app/api/community/route'

function makeGetRequest(params: Record<string, string> = {}, ip = '127.0.0.1') {
  const url = new URL('http://localhost/api/community')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString(), {
    headers: { 'x-forwarded-for': ip },
  })
}

function makePostRequest(body: Record<string, unknown>, ip = '127.0.0.1') {
  return new NextRequest('http://localhost/api/community', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const authenticatedUser = { id: 'user-id-1', email: 'user@example.com' }

describe('GET /api/community', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 400 for invalid category query param', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }))

    const req = makeGetRequest({ category: 'invalid_category' })
    const res = await GET(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 파라미터입니다')
  })

  it('returns paginated posts for authenticated user', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const fakePosts = [
      {
        id: 'post-1',
        author_id: 'user-id-1',
        category: 'career',
        title: 'Test Post',
        content: 'Content here',
        is_anonymous: false,
        status: 'active',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ]

    let fromCallCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      fromCallCount++
      if (table === 'vcx_corporate_users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      }
      if (table === 'community_posts') {
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: fakePosts, error: null, count: 1 }),
        }
        return chain
      }
      return {}
    })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe('post-1')
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.limit).toBe(20)
  })

  it('masks author_id for anonymous posts', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const anonPost = {
      id: 'post-anon',
      author_id: 'some-other-user',
      category: 'career',
      title: 'Anon Post',
      content: 'Secret content',
      is_anonymous: true,
      status: 'active',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_corporate_users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      }
      if (table === 'community_posts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: [anonPost], error: null, count: 1 }),
        }
      }
      return {}
    })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data[0].author_id).toBeNull()
  })

  it('masks author_id for company_review posts when viewer is corporate user', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const reviewPost = {
      id: 'post-review',
      author_id: 'member-user',
      category: 'company_review',
      title: 'Company Review',
      content: 'Review content',
      is_anonymous: false,
      status: 'active',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_corporate_users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: authenticatedUser.id }, error: null }),
            }),
          }),
        }
      }
      if (table === 'community_posts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: [reviewPost], error: null, count: 1 }),
        }
      }
      return {}
    })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data[0].author_id).toBeNull()
  })

  it('filters posts by category when category param is provided', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const mockEq = vi.fn()
    const chainable = {
      select: vi.fn().mockReturnThis(),
      eq: mockEq,
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: [], error: null, count: 0 })),
    }
    mockEq.mockReturnValue(chainable)

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_corporate_users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      }
      if (table === 'community_posts') return chainable
      return {}
    })

    const req = makeGetRequest({ category: 'career' })
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(mockEq).toHaveBeenCalledWith('category', 'career')
  })

  it('returns 500 when database query fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_corporate_users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      }
      if (table === 'community_posts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: null, error: new Error('db error'), count: null }),
        }
      }
      return {}
    })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(500)
  })
})

describe('POST /api/community', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const req = makePostRequest({ category: 'career', title: 'Title', content: 'Body content' })
    const res = await POST(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when user is not an active VCX member', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    }))

    const req = makePostRequest({ category: 'career', title: 'Title', content: 'Body content' })
    const res = await POST(req)

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 글을 작성할 수 있습니다')
  })

  it('returns 400 for missing required fields', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: authenticatedUser.id }, error: null }),
          }),
        }),
      }),
    }))

    // Missing title and content
    const req = makePostRequest({ category: 'career' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청입니다')
  })

  it('returns 400 for invalid category value', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: authenticatedUser.id }, error: null }),
          }),
        }),
      }),
    }))

    const req = makePostRequest({ category: 'invalid_cat', title: 'Title', content: 'Body' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청입니다')
  })

  it('creates post and returns 201 with post data', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const newPost = {
      id: 'new-post-id',
      category: 'career',
      title: 'My Title',
      is_anonymous: false,
      created_at: '2026-01-01T00:00:00Z',
    }

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: newPost, error: null }),
      }),
    })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: authenticatedUser.id }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'community_posts') {
        return { insert: mockInsert }
      }
      return {}
    })

    const req = makePostRequest({ category: 'career', title: 'My Title', content: 'Post body here' })
    const res = await POST(req)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.id).toBe('new-post-id')
    expect(body.data.category).toBe('career')
  })

  it('inserts post with author_id from authenticated user', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'p1', category: 'leadership', title: 'T', is_anonymous: false, created_at: '' },
          error: null,
        }),
      }),
    })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: authenticatedUser.id }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'community_posts') {
        return { insert: mockInsert }
      }
      return {}
    })

    const req = makePostRequest({ category: 'leadership', title: 'T', content: 'C' })
    await POST(req)

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ author_id: authenticatedUser.id })
    )
  })

  it('returns 500 when insert fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: authenticatedUser.id }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'community_posts') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: new Error('insert failed') }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makePostRequest({ category: 'career', title: 'Title', content: 'Content' })
    const res = await POST(req)

    expect(res.status).toBe(500)
  })
})
