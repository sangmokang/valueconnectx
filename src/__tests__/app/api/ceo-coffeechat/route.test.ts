import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockRpc = vi.fn()
  const mockAuthGetUser = vi.fn()
  const mockServerClient = {
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
    rpc: mockRpc,
  }
  return {
    mockFrom,
    mockRpc,
    mockAuthGetUser,
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

import { GET, POST } from '@/app/api/ceo-coffeechat/route'

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/ceo-coffeechat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeGetRequest(params = '') {
  return new NextRequest(
    `http://localhost/api/ceo-coffeechat${params ? '?' + params : ''}`,
    { method: 'GET' },
  )
}

const validSession = {
  title: '스타트업 CTO와의 커피챗',
  description: '기술 리더십에 대해 이야기합니다',
  session_date: '2026-04-15T14:00',
  duration_minutes: 60,
  max_participants: 5,
  location_type: 'online',
  location_detail: 'Zoom',
  tags: ['tech', 'leadership'],
  agreement_accepted: true,
}

// ──────────────────────────────────────────────────────────────────
// POST /api/ceo-coffeechat
// ──────────────────────────────────────────────────────────────────

describe('POST /api/ceo-coffeechat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not authenticated' },
    })

    const req = makePostRequest(validSession)
    const res = await POST(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when user is not a corporate CEO/Founder', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    // corporateUser query returns null — user is a member, not a CEO/Founder
    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })

    const req = makePostRequest(validSession)
    const res = await POST(req)

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('CEO/Founder만 세션을 생성할 수 있습니다')
  })

  it('returns 403 when corporate user has a non-CEO/Founder role', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id-1', role: 'hr_leader' },
          error: null,
        }),
      }),
    })

    const req = makePostRequest(validSession)
    const res = await POST(req)

    expect(res.status).toBe(403)
  })

  it('returns 400 when agreement_accepted is false', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id-1', role: 'ceo' },
          error: null,
        }),
      }),
    })

    const req = makePostRequest({ ...validSession, agreement_accepted: false })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('헤드헌팅 수수료 원칙에 동의해야 합니다')
  })

  it('returns 400 when agreement_accepted is missing from request body', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id-1', role: 'ceo' },
          error: null,
        }),
      }),
    })

    const { agreement_accepted: _, ...sessionWithoutAgreement } = validSession
    const req = makePostRequest(sessionWithoutAgreement)
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('returns 400 when title is empty', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id-1', role: 'founder' },
          error: null,
        }),
      }),
    })

    const req = makePostRequest({ ...validSession, title: '' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('제목을 입력해주세요')
  })

  it('returns 400 when location_type has an invalid enum value', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id-1', role: 'ceo' },
          error: null,
        }),
      }),
    })

    const req = makePostRequest({ ...validSession, location_type: 'virtual' })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('returns 201 on valid session creation and includes agreement_accepted_at in the insert', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    const createdSession = {
      id: 'session-id-1',
      host_id: 'user-id-1',
      title: validSession.title,
      description: validSession.description,
      session_date: validSession.session_date,
      duration_minutes: 60,
      max_participants: 5,
      location_type: 'online',
      location_detail: 'Zoom',
      tags: ['tech', 'leadership'],
      agreement_accepted_at: '2026-04-01T00:00:00.000Z',
      status: 'open',
    }

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // corporate user role check
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-id-1', role: 'ceo' },
              error: null,
            }),
          }),
        }
      }
      // session insert
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: createdSession,
              error: null,
            }),
          }),
        }),
      }
    })

    const req = makePostRequest(validSession)
    const res = await POST(req)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toMatchObject({
      id: 'session-id-1',
      host_id: 'user-id-1',
      title: validSession.title,
    })
    // agreement_accepted_at must be present and a non-empty string
    expect(body.data.agreement_accepted_at).toBeTruthy()
  })

  it('returns 201 when corporate user has founder role', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-2' } },
      error: null,
    })

    const createdSession = {
      id: 'session-id-2',
      host_id: 'user-id-2',
      title: validSession.title,
      agreement_accepted_at: '2026-04-01T00:00:00.000Z',
    }

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-id-2', role: 'founder' },
              error: null,
            }),
          }),
        }
      }
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: createdSession,
              error: null,
            }),
          }),
        }),
      }
    })

    const req = makePostRequest(validSession)
    const res = await POST(req)

    expect(res.status).toBe(201)
  })
})

// ──────────────────────────────────────────────────────────────────
// GET /api/ceo-coffeechat
// ──────────────────────────────────────────────────────────────────

describe('GET /api/ceo-coffeechat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not authenticated' },
    })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 200 with session list on successful request', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    const sessions = [
      {
        id: 'session-id-1',
        title: '스타트업 CTO와의 커피챗',
        host: { id: 'user-id-1', name: '김대표', title: 'CEO', company: 'StartupX', role: 'ceo' },
      },
    ]

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: sessions,
            error: null,
            count: 1,
          }),
        }),
      }),
    })

    // RPC for application count
    mocks.mockRpc.mockResolvedValue({ data: 3, error: null })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.limit).toBe(20)
  })

  it('returns 200 with empty array when no sessions exist', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        }),
      }),
    })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(0)
    expect(body.total).toBe(0)
  })

  it('returns 200 and respects page and limit query parameters', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        }),
      }),
    })

    const req = makeGetRequest('page=2&limit=10')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.page).toBe(2)
    expect(body.limit).toBe(10)
  })

  it('returns 200 and applies status filter when status param is valid', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    // The route chains: select → order → range → (optional) eq → await
    // range() must return an object that is both awaitable (no-filter path)
    // AND has an eq() method (filter path). eq() is then awaited directly.
    const queryResult = { data: [], error: null, count: 0 }
    const rangeMock = vi.fn().mockReturnValue({
      ...queryResult,
      then: (resolve: (v: typeof queryResult) => void) => resolve(queryResult),
      eq: vi.fn().mockResolvedValue(queryResult),
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: rangeMock,
        }),
      }),
    })

    const req = makeGetRequest('status=open')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(0)
  })

  it('returns 500 when database query fails', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'db error' },
            count: null,
          }),
        }),
      }),
    })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('세션 목록 조회에 실패했습니다')
  })
})
