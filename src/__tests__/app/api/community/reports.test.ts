import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockAuthGetUser = vi.fn()
  const mockServerClient = {
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  }
  const mockAdminFrom = vi.fn()
  const mockAdminClient = { from: mockAdminFrom }
  return {
    mockFrom,
    mockAuthGetUser,
    mockServerClient,
    mockAdminFrom,
    mockAdminClient,
    createClient: vi.fn(async () => mockServerClient),
    createAdminClient: vi.fn(() => mockAdminClient),
  }
})

vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
  authLimiter: null,
  apiLimiter: null,
  directoryLimiter: null,
  directoryBurstLimiter: null,
  directoryDailyLimiter: null,
}))

import { GET, PATCH } from '@/app/api/community/reports/route'

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/community/reports')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString(), { method: 'GET' })
}

function makePatchRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/community/reports', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** Sets up mockFrom (server client) to pass the admin check. */
function setupAdminAuth(userId = 'admin-user-id') {
  mocks.mockAuthGetUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  })
  // server client: vcx_members admin role check
  mocks.mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { system_role: 'admin' },
        error: null,
      }),
    }),
  })
}

/** Sets up mockFrom (server client) to fail the admin role check. */
function setupNonAdminAuth(userId = 'regular-user-id') {
  mocks.mockAuthGetUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  })
  mocks.mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    }),
  })
}

const sampleReports = [
  {
    id: 'report-uuid-1',
    reporter_id: 'user-a',
    post_id: 'post-uuid-1',
    comment_id: null,
    reason: 'spam',
    status: 'pending',
    created_at: '2026-01-01T00:00:00Z',
    community_posts: { id: 'post-uuid-1', title: 'Test Post', status: 'published' },
    community_comments: null,
  },
  {
    id: 'report-uuid-2',
    reporter_id: 'user-b',
    post_id: null,
    comment_id: 'comment-uuid-1',
    reason: 'inappropriate',
    status: 'pending',
    created_at: '2026-01-02T00:00:00Z',
    community_posts: null,
    community_comments: { id: 'comment-uuid-1', content: 'Bad comment', status: 'published' },
  },
]

// ──────────────────────────────────────────────────────────────────
// GET /api/community/reports
// ──────────────────────────────────────────────────────────────────

describe('GET /api/community/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 when user is not authenticated', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not authenticated' },
    })

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('관리자 권한이 필요합니다')
  })

  it('returns 403 when authenticated user is not admin', async () => {
    setupNonAdminAuth()

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('관리자 권한이 필요합니다')
  })

  it('returns 200 with report list on success', async () => {
    setupAdminAuth()
    mocks.mockAdminFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: undefined,
        // Returning a resolved promise directly
        mockResolvedValue: undefined,
      }),
    })

    // Build the full chain: select → order → range → resolves
    const rangeResult = Promise.resolve({ data: sampleReports, error: null, count: 2 })
    const rangeMock = vi.fn().mockReturnValue(rangeResult)
    const orderMock = vi.fn().mockReturnValue({ range: rangeMock, eq: vi.fn().mockReturnValue({ range: rangeMock }) })
    const selectMock = vi.fn().mockReturnValue({ order: orderMock })
    mocks.mockAdminFrom.mockReturnValue({ select: selectMock })

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0].id).toBe('report-uuid-1')
  })

  it('returns 200 with pagination info (page, limit, total)', async () => {
    setupAdminAuth()

    const rangeResult = Promise.resolve({ data: sampleReports, error: null, count: 42 })
    const rangeMock = vi.fn().mockReturnValue(rangeResult)
    const orderMock = vi.fn().mockReturnValue({ range: rangeMock })
    const selectMock = vi.fn().mockReturnValue({ order: orderMock })
    mocks.mockAdminFrom.mockReturnValue({ select: selectMock })

    const res = await GET(makeGetRequest({ page: '2', limit: '10' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.total).toBe(42)
    expect(body.page).toBe(2)
    expect(body.limit).toBe(10)
  })

  it('returns 200 with empty array when no reports exist', async () => {
    setupAdminAuth()

    const rangeResult = Promise.resolve({ data: [], error: null, count: 0 })
    const rangeMock = vi.fn().mockReturnValue(rangeResult)
    const orderMock = vi.fn().mockReturnValue({ range: rangeMock })
    const selectMock = vi.fn().mockReturnValue({ order: orderMock })
    mocks.mockAdminFrom.mockReturnValue({ select: selectMock })

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
    expect(body.total).toBe(0)
  })

  it('returns 200 and applies status filter when provided', async () => {
    setupAdminAuth()

    const filteredReports = [sampleReports[0]]
    // The route builds: select → order → range → (optional) eq → await
    // range() returns an object with .eq() that is also thenable (awaitable).
    const resolvedPayload = { data: filteredReports, error: null, count: 1 }
    const thenableWithEq = {
      eq: vi.fn().mockReturnValue(Promise.resolve(resolvedPayload)),
      then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
        Promise.resolve(resolvedPayload).then(resolve, reject),
    }
    const rangeMock = vi.fn().mockReturnValue(thenableWithEq)
    const orderMock = vi.fn().mockReturnValue({ range: rangeMock })
    const selectMock = vi.fn().mockReturnValue({ order: orderMock })
    mocks.mockAdminFrom.mockReturnValue({ select: selectMock })

    const res = await GET(makeGetRequest({ status: 'pending' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
  })

  it('returns 500 when database query fails', async () => {
    setupAdminAuth()

    const rangeResult = Promise.resolve({ data: null, error: { message: 'db error' }, count: null })
    const rangeMock = vi.fn().mockReturnValue(rangeResult)
    const orderMock = vi.fn().mockReturnValue({ range: rangeMock })
    const selectMock = vi.fn().mockReturnValue({ order: orderMock })
    mocks.mockAdminFrom.mockReturnValue({ select: selectMock })

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('서버 오류가 발생했습니다')
  })
})

// ──────────────────────────────────────────────────────────────────
// PATCH /api/community/reports
// ──────────────────────────────────────────────────────────────────

describe('PATCH /api/community/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 when user is not admin', async () => {
    setupNonAdminAuth()

    const res = await PATCH(makePatchRequest({ report_id: 'some-uuid', action: 'dismiss' }))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('관리자 권한이 필요합니다')
  })

  it('returns 400 when report_id is missing', async () => {
    setupAdminAuth()

    const res = await PATCH(makePatchRequest({ action: 'dismiss' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청입니다')
  })

  it('returns 400 when action is invalid', async () => {
    setupAdminAuth()

    const res = await PATCH(
      makePatchRequest({ report_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', action: 'ban_user' })
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청입니다')
  })

  it('returns 404 when report is not found', async () => {
    setupAdminAuth()

    // adminFrom: fetch report → not found
    mocks.mockAdminFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      }),
    })

    const res = await PATCH(
      makePatchRequest({ report_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', action: 'dismiss' })
    )

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('신고를 찾을 수 없습니다')
  })

  it('returns 200 and updates post status to hidden on hide_post action', async () => {
    setupAdminAuth()

    const reportData = {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      post_id: 'post-uuid-1',
      comment_id: null,
      status: 'pending',
    }

    let adminCallCount = 0
    mocks.mockAdminFrom.mockImplementation((table: string) => {
      adminCallCount++

      if (adminCallCount === 1) {
        // fetch report
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: reportData, error: null }),
          }),
        }
      }

      if (table === 'community_posts') {
        // update post status to 'hidden'
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }

      // update report status to 'action_taken'
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: reportData.id, status: 'action_taken' },
                error: null,
              }),
            }),
          }),
        }),
      }
    })

    const res = await PATCH(
      makePatchRequest({ report_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', action: 'hide_post' })
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('action_taken')
  })

  it('returns 200 and sets report status to reviewed on dismiss action', async () => {
    setupAdminAuth()

    const reportData = {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      post_id: 'post-uuid-1',
      comment_id: null,
      status: 'pending',
    }

    let adminCallCount = 0
    mocks.mockAdminFrom.mockImplementation(() => {
      adminCallCount++

      if (adminCallCount === 1) {
        // fetch report
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: reportData, error: null }),
          }),
        }
      }

      // dismiss: no post/comment update — only report status → 'reviewed'
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: reportData.id, status: 'reviewed' },
                error: null,
              }),
            }),
          }),
        }),
      }
    })

    const res = await PATCH(
      makePatchRequest({ report_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', action: 'dismiss' })
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('reviewed')
  })
})
