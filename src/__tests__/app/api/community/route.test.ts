import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockAuthGetUser = vi.fn()
  const mockServerClient = {
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  }
  return {
    mockFrom,
    mockAuthGetUser,
    mockServerClient,
    createClient: vi.fn(async () => mockServerClient),
  }
})

vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
  authLimiter: null,
  apiLimiter: null,
  directoryLimiter: null,
  directoryBurstLimiter: null,
  directoryDailyLimiter: null,
}))

import { GET, POST } from '@/app/api/community/route'
import { GET as GET_DETAIL } from '@/app/api/community/[id]/route'

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

function makeGetRequest(url = 'http://localhost/api/community', ip = '127.0.0.1') {
  return new NextRequest(url, {
    method: 'GET',
    headers: { 'x-forwarded-for': ip },
  })
}

function makePostRequest(body: Record<string, unknown>, ip = '127.0.0.1') {
  return new NextRequest('http://localhost/api/community', {
    method: 'POST',
    headers: {
      'x-forwarded-for': ip,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

// Base mock post shared across tests
const basePosts = [
  {
    id: 'post-1',
    author_id: 'user-author-1',
    category: 'career',
    title: '커리어 고민',
    content: '어떻게 성장할 수 있을까요?',
    is_anonymous: false,
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    likes_count: 5,
    comments_count: 2,
  },
]

/**
 * Build a mockFrom implementation that handles GET /api/community's two calls:
 *   call 1 → vcx_corporate_users (isCorporateUser check)
 *   call 2 → community_posts (list query)
 */
function makeGetListMock({
  isCorporateUser = false,
  posts = basePosts,
  postsError = null as null | { message: string },
}: {
  isCorporateUser?: boolean
  posts?: typeof basePosts
  postsError?: null | { message: string }
}) {
  let callCount = 0
  return () => {
    callCount++

    if (callCount === 1) {
      // vcx_corporate_users check
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: isCorporateUser ? { id: 'corp-user-1' } : null,
              error: null,
            }),
          }),
        }),
      }
    }

    // community_posts list query with chained .eq, .order, .range
    // category filter adds .eq('category', ...) after .range(), so range result must also have .eq
    const rangeResult = {
      data: postsError ? null : posts,
      error: postsError,
      count: postsError ? null : posts.length,
    }
    const makeThenable = (result: typeof rangeResult) => ({
      then: (resolve: (v: typeof rangeResult) => void, reject?: (e: unknown) => void) =>
        Promise.resolve(result).then(resolve, reject),
      eq: vi.fn().mockImplementation(() => makeThenable(result)),
    })
    const rangeMock = vi.fn().mockReturnValue(makeThenable(rangeResult))
    const orderMock = vi.fn().mockReturnValue({ range: rangeMock, eq: vi.fn().mockReturnValue({ range: rangeMock }) })
    const eqStatusMock = vi.fn().mockReturnValue({ order: orderMock })
    return {
      select: vi.fn().mockReturnValue({
        eq: eqStatusMock,
      }),
    }
  }
}

/**
 * Build a mockFrom implementation for GET /api/community/[id]'s two calls:
 *   call 1 → vcx_corporate_users
 *   call 2 → community_posts single
 */
function makeGetDetailMock({
  isCorporateUser = false,
  post = null as null | Record<string, unknown>,
  postError = null as null | { message: string },
}) {
  let callCount = 0
  return () => {
    callCount++

    if (callCount === 1) {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: isCorporateUser ? { id: 'corp-user-1' } : null,
              error: null,
            }),
          }),
        }),
      }
    }

    // community_posts single lookup: .select().eq(id).eq(status).single()
    const singleMock = vi.fn().mockResolvedValue({ data: post, error: postError })
    const eqStatusMock = vi.fn().mockReturnValue({ single: singleMock })
    const eqIdMock = vi.fn().mockReturnValue({ eq: eqStatusMock })
    return {
      select: vi.fn().mockReturnValue({ eq: eqIdMock }),
    }
  }
}

// ──────────────────────────────────────────────────────────────────
// GET /api/community — Privacy Model
// ──────────────────────────────────────────────────────────────────

describe('GET /api/community', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not authenticated' },
    })

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 200 with posts list', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mocks.mockFrom.mockImplementation(makeGetListMock({ posts: basePosts }))

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe('post-1')
  })

  it('masks author_id to null for anonymous posts', async () => {
    const anonymousPost = { ...basePosts[0], is_anonymous: true, author_id: 'secret-author' }
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mocks.mockFrom.mockImplementation(makeGetListMock({ posts: [anonymousPost] }))

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data[0].author_id).toBeNull()
  })

  it('masks author_id to null for company_review posts when user is corporate', async () => {
    const companyReviewPost = {
      ...basePosts[0],
      id: 'post-cr',
      category: 'company_review',
      is_anonymous: false,
      author_id: 'member-author-1',
    }
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'corp-user-1' } },
      error: null,
    })
    mocks.mockFrom.mockImplementation(
      makeGetListMock({ isCorporateUser: true, posts: [companyReviewPost] })
    )

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data[0].author_id).toBeNull()
  })

  it('keeps author_id for company_review posts when user is NOT corporate', async () => {
    const companyReviewPost = {
      ...basePosts[0],
      id: 'post-cr',
      category: 'company_review',
      is_anonymous: false,
      author_id: 'member-author-1',
    }
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'regular-member-1' } },
      error: null,
    })
    mocks.mockFrom.mockImplementation(
      makeGetListMock({ isCorporateUser: false, posts: [companyReviewPost] })
    )

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data[0].author_id).toBe('member-author-1')
  })

  it('keeps author_id for non-company_review posts even when user is corporate', async () => {
    const careerPost = {
      ...basePosts[0],
      id: 'post-career',
      category: 'career',
      is_anonymous: false,
      author_id: 'member-author-2',
    }
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'corp-user-1' } },
      error: null,
    })
    mocks.mockFrom.mockImplementation(
      makeGetListMock({ isCorporateUser: true, posts: [careerPost] })
    )

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data[0].author_id).toBe('member-author-2')
  })

  it('respects category filter in query parameter', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mocks.mockFrom.mockImplementation(makeGetListMock({ posts: basePosts }))

    const res = await GET(makeGetRequest('http://localhost/api/community?category=career'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toBeDefined()
  })

  it('returns 500 on DB error when fetching posts', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mocks.mockFrom.mockImplementation(
      makeGetListMock({ postsError: { message: 'connection timeout' } })
    )

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('서버 오류가 발생했습니다')
  })
})

// ──────────────────────────────────────────────────────────────────
// POST /api/community
// ──────────────────────────────────────────────────────────────────

describe('POST /api/community', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validPostBody = {
    category: 'career',
    title: '커리어 조언 구합니다',
    content: '이직을 고려 중인데 어떻게 준비하면 좋을까요?',
    is_anonymous: false,
  }

  it('returns 401 when not authenticated', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not authenticated' },
    })

    const res = await POST(makePostRequest(validPostBody))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when user is not a VCX member', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'non-member-1' } },
      error: null,
    })
    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })

    const res = await POST(makePostRequest(validPostBody))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 글을 작성할 수 있습니다')
  })

  it('returns 400 when title is empty', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'member-1' } },
      error: null,
    })
    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'member-1' }, error: null }),
      }),
    })

    const res = await POST(makePostRequest({ ...validPostBody, title: '' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청입니다')
  })

  it('returns 400 when category is invalid', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'member-1' } },
      error: null,
    })
    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'member-1' }, error: null }),
      }),
    })

    const res = await POST(makePostRequest({ ...validPostBody, category: 'invalid_category' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청입니다')
  })

  it('returns 201 on successful post creation', async () => {
    const newPost = {
      id: 'new-post-1',
      category: 'career',
      title: '커리어 조언 구합니다',
      is_anonymous: false,
      created_at: '2026-01-01T00:00:00Z',
    }
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'member-1' } },
      error: null,
    })

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // vcx_members check
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'member-1' }, error: null }),
          }),
        }
      }
      // community_posts insert
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newPost, error: null }),
          }),
        }),
      }
    })

    const res = await POST(makePostRequest(validPostBody))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.id).toBe('new-post-1')
    expect(body.data.category).toBe('career')
  })
})

// ──────────────────────────────────────────────────────────────────
// GET /api/community/[id] — Privacy Model (단일 게시글)
// ──────────────────────────────────────────────────────────────────

describe('GET /api/community/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const companyReviewPost = {
    id: 'post-cr-1',
    author_id: 'member-author-1',
    category: 'company_review',
    title: '회사 솔직 후기',
    content: '재직 중 경험을 공유합니다.',
    is_anonymous: false,
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    likes_count: 3,
    comments_count: 1,
  }

  it('masks author_id for company_review post when corporate user views', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'corp-user-1' } },
      error: null,
    })
    mocks.mockFrom.mockImplementation(
      makeGetDetailMock({ isCorporateUser: true, post: companyReviewPost })
    )

    const res = await GET_DETAIL(
      new NextRequest('http://localhost/api/community/post-cr-1'),
      { params: Promise.resolve({ id: 'post-cr-1' }) }
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.author_id).toBeNull()
    expect(body.data.category).toBe('company_review')
  })

  it('returns 404 when post does not exist', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mocks.mockFrom.mockImplementation(
      makeGetDetailMock({ post: null, postError: { message: 'not found' } })
    )

    const res = await GET_DETAIL(
      new NextRequest('http://localhost/api/community/nonexistent'),
      { params: Promise.resolve({ id: 'nonexistent' }) }
    )

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('게시글을 찾을 수 없습니다')
  })
})
