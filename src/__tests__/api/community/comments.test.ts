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

import { GET, POST } from '@/app/api/community/[id]/comments/route'

function makeGetRequest(postId: string) {
  return new NextRequest(`http://localhost/api/community/${postId}/comments`)
}

function makePostRequest(postId: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/community/${postId}/comments`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const authenticatedUser = { id: 'user-id-1', email: 'user@example.com' }

describe('GET /api/community/[id]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const req = makeGetRequest('post-id-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 404 when parent post does not exist or is not active', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'community_posts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makeGetRequest('nonexistent-post')
    const res = await GET(req, { params: Promise.resolve({ id: 'nonexistent-post' }) })

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('게시글을 찾을 수 없습니다')
  })

  it('returns list of comments for active post', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const fakeComments = [
      {
        id: 'comment-1',
        post_id: 'post-id-1',
        author_id: 'user-id-1',
        content: 'Great post!',
        is_anonymous: false,
        status: 'active',
        created_at: '2026-01-01T01:00:00Z',
      },
    ]

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'community_posts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'post-id-1' }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'community_comments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: fakeComments, error: null }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makeGetRequest('post-id-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe('comment-1')
    expect(body.data[0].author_id).toBe('user-id-1')
  })

  it('masks author_id for anonymous comments', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const anonComments = [
      {
        id: 'comment-anon',
        post_id: 'post-id-1',
        author_id: 'some-user',
        content: 'Anonymous comment',
        is_anonymous: true,
        status: 'active',
        created_at: '2026-01-01T01:00:00Z',
      },
    ]

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'community_posts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'post-id-1' }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'community_comments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: anonComments, error: null }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makeGetRequest('post-id-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data[0].author_id).toBeNull()
  })

  it('returns empty array when post has no comments', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'community_posts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'post-id-1' }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'community_comments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makeGetRequest('post-id-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(0)
  })

  it('returns 500 when comments query fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'community_posts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'post-id-1' }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'community_comments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: null, error: new Error('db error') }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makeGetRequest('post-id-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(500)
  })
})

describe('POST /api/community/[id]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const req = makePostRequest('post-id-1', { content: 'My comment' })
    const res = await POST(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when user is not an active VCX member', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makePostRequest('post-id-1', { content: 'My comment' })
    const res = await POST(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 댓글을 작성할 수 있습니다')
  })

  it('returns 404 when parent post is not active', async () => {
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
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makePostRequest('deleted-post-id', { content: 'My comment' })
    const res = await POST(req, { params: Promise.resolve({ id: 'deleted-post-id' }) })

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('게시글을 찾을 수 없습니다')
  })

  it('returns 400 when content is missing', async () => {
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
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'post-id-1' }, error: null }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    // Empty content
    const req = makePostRequest('post-id-1', {})
    const res = await POST(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청입니다')
  })

  it('creates comment and returns 201 with comment data', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const newComment = {
      id: 'comment-new',
      post_id: 'post-id-1',
      is_anonymous: false,
      created_at: '2026-01-01T02:00:00Z',
    }

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: newComment, error: null }),
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
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'post-id-1' }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'community_comments') {
        return { insert: mockInsert }
      }
      return {}
    })

    const req = makePostRequest('post-id-1', { content: 'Great post!' })
    const res = await POST(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.id).toBe('comment-new')
    expect(body.data.post_id).toBe('post-id-1')
  })

  it('inserts comment with author_id from authenticated user', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'c1', post_id: 'post-id-1', is_anonymous: false, created_at: '' },
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
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'post-id-1' }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'community_comments') {
        return { insert: mockInsert }
      }
      return {}
    })

    const req = makePostRequest('post-id-1', { content: 'My comment', is_anonymous: false })
    await POST(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ author_id: authenticatedUser.id, post_id: 'post-id-1' })
    )
  })
})
