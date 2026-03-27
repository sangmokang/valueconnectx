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

import { GET, PUT, DELETE } from '@/app/api/community/[id]/route'

function makeGetRequest(id: string) {
  return new NextRequest(`http://localhost/api/community/${id}`)
}

function makePutRequest(id: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/community/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeDeleteRequest(id: string) {
  return new NextRequest(`http://localhost/api/community/${id}`, {
    method: 'DELETE',
  })
}

const authenticatedUser = { id: 'user-id-1', email: 'user@example.com' }
const otherUser = { id: 'other-user-id', email: 'other@example.com' }

const activePost = {
  id: 'post-id-1',
  author_id: authenticatedUser.id,
  category: 'career',
  title: 'Post Title',
  content: 'Post content here',
  is_anonymous: false,
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('GET /api/community/[id]', () => {
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

  it('returns 404 when post does not exist', async () => {
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
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makeGetRequest('nonexistent-id')
    const res = await GET(req, { params: Promise.resolve({ id: 'nonexistent-id' }) })

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('게시글을 찾을 수 없습니다')
  })

  it('returns post data for authenticated user', async () => {
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
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: activePost, error: null }),
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
    expect(body.data.id).toBe('post-id-1')
    expect(body.data.title).toBe('Post Title')
  })

  it('masks author_id for anonymous post', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const anonPost = { ...activePost, is_anonymous: true, author_id: 'some-user' }

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
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: anonPost, error: null }),
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
    expect(body.data.author_id).toBeNull()
  })

  it('masks author_id for company_review post when viewer is corporate user', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const reviewPost = { ...activePost, category: 'company_review', author_id: 'member-user', is_anonymous: false }

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
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: reviewPost, error: null }),
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
    expect(body.data.author_id).toBeNull()
  })
})

describe('PUT /api/community/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const req = makePutRequest('post-id-1', { title: 'New Title' })
    const res = await PUT(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 404 when post does not exist', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }))

    const req = makePutRequest('nonexistent-id', { title: 'New Title' })
    const res = await PUT(req, { params: Promise.resolve({ id: 'nonexistent-id' }) })

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('게시글을 찾을 수 없습니다')
  })

  it('returns 403 when user tries to update another user post without admin role', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: otherUser }, error: null })

    let callCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'community_posts') {
        callCount++
        if (callCount === 1) {
          // First call: fetch post author_id
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { author_id: authenticatedUser.id },
                  error: null,
                }),
              }),
            }),
          }
        }
      }
      if (table === 'vcx_members') {
        // admin check returns null (not admin)
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makePutRequest('post-id-1', { title: 'Hacked Title' })
    const res = await PUT(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('수정 권한이 없습니다')
  })

  it('returns 400 for invalid update fields', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'community_posts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { author_id: authenticatedUser.id },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makePutRequest('post-id-1', { status: 'invalid_status' })
    const res = await PUT(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청입니다')
  })

  it('updates post when called by owner', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const updatedPost = {
      id: 'post-id-1',
      category: 'career',
      title: 'Updated Title',
      is_anonymous: false,
      status: 'active',
      updated_at: '2026-01-02T00:00:00Z',
    }

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: updatedPost, error: null }),
        }),
      }),
    })

    let communityPostCallCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'community_posts') {
        communityPostCallCount++
        if (communityPostCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { author_id: authenticatedUser.id },
                  error: null,
                }),
              }),
            }),
          }
        }
        return { update: mockUpdate }
      }
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makePutRequest('post-id-1', { title: 'Updated Title' })
    const res = await PUT(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.title).toBe('Updated Title')
  })

  it('allows admin to update another user post', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: otherUser }, error: null })

    const updatedPost = {
      id: 'post-id-1',
      category: 'career',
      title: 'Admin Updated',
      is_anonymous: false,
      status: 'active',
      updated_at: '2026-01-02T00:00:00Z',
    }

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: updatedPost, error: null }),
        }),
      }),
    })

    let communityPostCallCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'community_posts') {
        communityPostCallCount++
        if (communityPostCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { author_id: authenticatedUser.id },
                  error: null,
                }),
              }),
            }),
          }
        }
        return { update: mockUpdate }
      }
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { system_role: 'admin' }, error: null }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makePutRequest('post-id-1', { title: 'Admin Updated' })
    const res = await PUT(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.title).toBe('Admin Updated')
  })
})

describe('DELETE /api/community/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const req = makeDeleteRequest('post-id-1')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 404 when post does not exist', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }))

    const req = makeDeleteRequest('nonexistent-id')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent-id' }) })

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('게시글을 찾을 수 없습니다')
  })

  it('returns 403 when user tries to delete another user post without admin role', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: otherUser }, error: null })

    let communityPostCallCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'community_posts') {
        communityPostCallCount++
        if (communityPostCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { author_id: authenticatedUser.id },
                  error: null,
                }),
              }),
            }),
          }
        }
      }
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makeDeleteRequest('post-id-1')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('삭제 권한이 없습니다')
  })

  it('soft-deletes post by setting status to deleted when called by owner', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const mockUpdateEq = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    let communityPostCallCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'community_posts') {
        communityPostCallCount++
        if (communityPostCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { author_id: authenticatedUser.id },
                  error: null,
                }),
              }),
            }),
          }
        }
        return { update: mockUpdate }
      }
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makeDeleteRequest('post-id-1')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'deleted' })
  })

  it('allows admin to delete another user post', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: otherUser }, error: null })

    const mockUpdateEq = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    let communityPostCallCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'community_posts') {
        communityPostCallCount++
        if (communityPostCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { author_id: authenticatedUser.id },
                  error: null,
                }),
              }),
            }),
          }
        }
        return { update: mockUpdate }
      }
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { system_role: 'super_admin' }, error: null }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makeDeleteRequest('post-id-1')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
