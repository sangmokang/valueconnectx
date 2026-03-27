import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  const mockServerClient = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }

  const mockAdminFrom = vi.fn()
  const mockAdminClient = {
    from: mockAdminFrom,
  }

  return {
    mockGetUser,
    mockFrom,
    mockServerClient,
    createClient: vi.fn(async () => mockServerClient),
    mockAdminFrom,
    mockAdminClient,
    createAdminClient: vi.fn(() => mockAdminClient),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
  authLimiter: null,
  apiLimiter: null,
  directoryLimiter: null,
  directoryBurstLimiter: null,
  directoryDailyLimiter: null,
}))

import { GET, PATCH } from '@/app/api/community/reports/route'

const adminUser = { id: 'admin-user-id' }
const regularUser = { id: 'regular-user-id' }

function makeGetRequest(queryString = '') {
  const url = `http://localhost/api/community/reports${queryString ? '?' + queryString : ''}`
  return new NextRequest(url)
}

function makePatchRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/community/reports', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Build a fluent Supabase query chain for admin client (supports count)
function makeAdminQueryChain(resolved: { data: unknown; error: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'in', 'order', 'range', 'single', 'update']
  methods.forEach((m) => {
    chain[m] = vi.fn(() => chain)
  })
  chain.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(resolved).then(resolve)
  return chain
}

describe('GET /api/community/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('관리자 권한이 필요합니다')
  })

  it('returns 403 when authenticated user is not admin', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: regularUser }, error: null })

    // vcx_members lookup returns null (not admin)
    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    }))

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('관리자 권한이 필요합니다')
  })

  it('returns 200 with paginated reports for admin user', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: adminUser }, error: null })

    // Admin check passes
    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { system_role: 'admin' }, error: null }),
          }),
        }),
      }),
    }))

    const fakeReports = [
      {
        id: 'report-1',
        reporter_id: 'user-1',
        post_id: 'post-1',
        comment_id: null,
        reason: '스팸',
        status: 'pending',
        created_at: '2026-01-01T00:00:00Z',
      },
    ]

    mocks.mockAdminFrom.mockImplementation(() =>
      makeAdminQueryChain({ data: fakeReports, error: null, count: 1 })
    )

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe('report-1')
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.limit).toBe(20)
  })

  it('returns 500 when database query fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: adminUser }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { system_role: 'admin' }, error: null }),
          }),
        }),
      }),
    }))

    mocks.mockAdminFrom.mockImplementation(() =>
      makeAdminQueryChain({ data: null, error: new Error('db error'), count: null })
    )

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(500)
  })
})

describe('PATCH /api/community/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const res = await PATCH(
      makePatchRequest({ report_id: '550e8400-e29b-41d4-a716-446655440000', action: 'dismiss' })
    )

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('관리자 권한이 필요합니다')
  })

  it('returns 403 when authenticated user is not admin', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: regularUser }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    }))

    const res = await PATCH(
      makePatchRequest({ report_id: '550e8400-e29b-41d4-a716-446655440000', action: 'dismiss' })
    )

    expect(res.status).toBe(403)
  })

  it('returns 200 and sets report status to reviewed when action is dismiss', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: adminUser }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { system_role: 'admin' }, error: null }),
          }),
        }),
      }),
    }))

    const reportId = '550e8400-e29b-41d4-a716-446655440000'

    let adminFromCallCount = 0
    mocks.mockAdminFrom.mockImplementation((table: string) => {
      adminFromCallCount++
      if (table === 'community_reports' && adminFromCallCount === 1) {
        // First call: fetch report
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: reportId, post_id: null, comment_id: null, status: 'pending' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'community_reports') {
        // Second call: update report status
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: reportId, status: 'reviewed' },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await PATCH(makePatchRequest({ report_id: reportId, action: 'dismiss' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('reviewed')
  })

  it('returns 200 and hides post when action is hide_post', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: adminUser }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { system_role: 'super_admin' }, error: null }),
          }),
        }),
      }),
    }))

    const reportId = '550e8400-e29b-41d4-a716-446655440000'
    const postId = 'post-id-1'

    let adminFromCallCount = 0
    mocks.mockAdminFrom.mockImplementation((table: string) => {
      adminFromCallCount++
      if (table === 'community_reports' && adminFromCallCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: reportId, post_id: postId, comment_id: null, status: 'pending' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'community_posts') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }
      }
      if (table === 'community_reports') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: reportId, status: 'action_taken' },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await PATCH(makePatchRequest({ report_id: reportId, action: 'hide_post' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('action_taken')
  })
})
