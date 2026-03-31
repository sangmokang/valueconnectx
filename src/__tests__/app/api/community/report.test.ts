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

import { POST } from '@/app/api/community/[id]/report/route'

function makePostRequest(body: Record<string, unknown>, ip = '127.0.0.1') {
  return new NextRequest('http://localhost/api/community/post-123/report', {
    method: 'POST',
    headers: {
      'x-forwarded-for': ip,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

// ──────────────────────────────────────────────────────────────────
// POST /api/community/[id]/report
// ──────────────────────────────────────────────────────────────────

describe('POST /api/community/[id]/report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not authenticated' },
    })

    const req = makePostRequest({ reason: '스팸입니다' })
    const res = await POST(req, { params: Promise.resolve({ id: 'post-123' }) })

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when user is not a VCX member', async () => {
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

    const req = makePostRequest({ reason: '스팸입니다' })
    const res = await POST(req, { params: Promise.resolve({ id: 'post-123' }) })

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 신고할 수 있습니다')
  })

  it('returns 400 when reason is empty', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'member-id' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'member-id' }, error: null }),
      }),
    })

    const req = makePostRequest({ reason: '' })
    const res = await POST(req, { params: Promise.resolve({ id: 'post-123' }) })

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청입니다')
  })

  it('returns 400 when reason exceeds 500 chars', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'member-id' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'member-id' }, error: null }),
      }),
    })

    const req = makePostRequest({ reason: 'a'.repeat(501) })
    const res = await POST(req, { params: Promise.resolve({ id: 'post-123' }) })

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청입니다')
  })

  it('returns 201 on successful post report with post_id set to route param and comment_id null', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'member-id' } },
      error: null,
    })

    const reportedData = {
      id: 'report-uuid-1',
      created_at: '2026-04-01T00:00:00Z',
    }

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // membership check
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'member-id' }, error: null }),
          }),
        }
      }
      // insert call
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: reportedData, error: null }),
          }),
        }),
      }
    })

    const req = makePostRequest({ reason: '부적절한 게시글입니다' })
    const res = await POST(req, { params: Promise.resolve({ id: 'post-123' }) })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toMatchObject({ id: 'report-uuid-1' })

    // Verify insert was called with post_id = route param and comment_id = null
    const insertCall = mocks.mockFrom.mock.results[1]?.value
    expect(insertCall.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        reporter_id: 'member-id',
        post_id: 'post-123',
        comment_id: null,
        reason: '부적절한 게시글입니다',
      })
    )
  })

  it('returns 201 on successful comment report with post_id null and comment_id from body', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'member-id' } },
      error: null,
    })

    const reportedData = {
      id: 'report-uuid-2',
      created_at: '2026-04-01T00:00:00Z',
    }

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'member-id' }, error: null }),
          }),
        }
      }
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: reportedData, error: null }),
          }),
        }),
      }
    })

    const commentId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    const req = makePostRequest({ reason: '욕설이 포함된 댓글입니다', comment_id: commentId })
    const res = await POST(req, { params: Promise.resolve({ id: 'post-123' }) })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toMatchObject({ id: 'report-uuid-2' })

    // Verify insert was called with post_id = null and comment_id = the body value
    const insertCall = mocks.mockFrom.mock.results[1]?.value
    expect(insertCall.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        reporter_id: 'member-id',
        post_id: null,
        comment_id: commentId,
        reason: '욕설이 포함된 댓글입니다',
      })
    )
  })

  it('returns 500 when DB insert fails', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'member-id' } },
      error: null,
    })

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'member-id' }, error: null }),
          }),
        }
      }
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'db write failure' },
            }),
          }),
        }),
      }
    })

    const req = makePostRequest({ reason: '스팸입니다' })
    const res = await POST(req, { params: Promise.resolve({ id: 'post-123' }) })

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('서버 오류가 발생했습니다')
  })

  it('returns 400 when comment_id is not a valid UUID', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'member-id' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'member-id' }, error: null }),
      }),
    })

    const req = makePostRequest({ reason: '부적절한 댓글입니다', comment_id: 'not-a-uuid' })
    const res = await POST(req, { params: Promise.resolve({ id: 'post-123' }) })

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청입니다')
  })
})
