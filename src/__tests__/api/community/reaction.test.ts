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

vi.mock('@/lib/notification', () => ({
  sendNotification: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
  authLimiter: null,
  apiLimiter: null,
  directoryLimiter: null,
  directoryBurstLimiter: null,
  directoryDailyLimiter: null,
}))

import { GET, POST } from '@/app/api/community/[id]/reaction/route'

function makeGetRequest(postId: string) {
  return new NextRequest(`http://localhost/api/community/${postId}/reaction`)
}

function makePostRequest(postId: string, body: Record<string, unknown> = {}) {
  return new NextRequest(`http://localhost/api/community/${postId}/reaction`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const authenticatedUser = { id: 'user-id-1', email: 'user@example.com' }

describe('GET /api/community/[id]/reaction', () => {
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

  it('returns reaction counts and current user reactions', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const fakeReactions = [
      { reaction_type: 'like', user_id: authenticatedUser.id },
      { reaction_type: 'like', user_id: 'other-user' },
      { reaction_type: 'fire', user_id: 'other-user-2' },
    ]

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: fakeReactions, error: null }),
      }),
    }))

    const req = makeGetRequest('post-id-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.counts.like).toBe(2)
    expect(body.counts.fire).toBe(1)
    expect(body.userReactions).toContain('like')
    expect(body.userReactions).not.toContain('fire')
  })

  it('returns empty counts and userReactions when no reactions exist', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }))

    const req = makeGetRequest('post-id-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.counts).toEqual({})
    expect(body.userReactions).toEqual([])
  })

  it('returns 500 when database query fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: new Error('db error') }),
      }),
    }))

    const req = makeGetRequest('post-id-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(500)
  })
})

describe('POST /api/community/[id]/reaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const req = makePostRequest('post-id-1', { reaction_type: 'like' })
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

    const req = makePostRequest('post-id-1', { reaction_type: 'like' })
    const res = await POST(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 반응할 수 있습니다')
  })

  it('adds reaction and returns 201 when reaction does not exist yet', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })

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
      if (table === 'vcx_community_reactions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }),
          insert: mockInsert,
        }
      }
      if (table === 'community_posts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { author_id: 'other-user' }, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makePostRequest('post-id-1', { reaction_type: 'like' })
    const res = await POST(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.action).toBe('added')
    expect(body.reaction_type).toBe('like')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ post_id: 'post-id-1', user_id: authenticatedUser.id, reaction_type: 'like' })
    )
  })

  it('removes reaction and returns 200 when reaction already exists (toggle off)', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const mockDeleteEq = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq })

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
      if (table === 'vcx_community_reactions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: 'reaction-id' }, error: null }),
                }),
              }),
            }),
          }),
          delete: mockDelete,
        }
      }
      return {}
    })

    const req = makePostRequest('post-id-1', { reaction_type: 'like' })
    const res = await POST(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.action).toBe('removed')
    expect(body.reaction_type).toBe('like')
  })

  it('uses default reaction_type of "like" when not specified', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })

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
      if (table === 'vcx_community_reactions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }),
          insert: mockInsert,
        }
      }
      if (table === 'community_posts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { author_id: 'other-user' }, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    // No reaction_type in body — schema defaults to 'like'
    const req = makePostRequest('post-id-1', {})
    const res = await POST(req, { params: Promise.resolve({ id: 'post-id-1' }) })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.reaction_type).toBe('like')
  })
})
