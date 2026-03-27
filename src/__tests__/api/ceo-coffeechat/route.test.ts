import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockRpc = vi.fn()
  const mockFrom = vi.fn()
  const mockGetUser = vi.fn()
  const mockServerClient = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  }
  return {
    mockRpc,
    mockFrom,
    mockGetUser,
    mockServerClient,
    createClient: vi.fn(async () => mockServerClient),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

import { GET, POST } from '@/app/api/ceo-coffeechat/route'

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/ceo-coffeechat')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/ceo-coffeechat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const authedUser = { id: 'user-corp-1', email: 'ceo@example.com' }

const validSessionBody = {
  title: 'CTO와의 대화',
  description: '스타트업 기술 전략에 대해 이야기합니다',
  session_date: '2026-04-15T10:00:00Z',
  duration_minutes: 60,
  max_participants: 5,
  location_type: 'online',
  tags: ['tech', 'startup'],
  agreement_accepted: true,
}

describe('GET /api/ceo-coffeechat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'not auth' } })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns session list with total count on success', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null })

    const sessions = [
      { id: 'sess-1', title: '첫 번째 세션', session_date: '2026-04-15T10:00:00Z' },
      { id: 'sess-2', title: '두 번째 세션', session_date: '2026-04-16T10:00:00Z' },
    ]

    const mockRange = vi.fn().mockResolvedValue({ data: sessions, error: null, count: 2 })
    const mockOrder = vi.fn().mockReturnValue({ range: mockRange })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_ceo_coffee_sessions') {
        return { select: mockSelect }
      }
      return {}
    })

    mocks.mockRpc.mockResolvedValue({ data: 3, error: null })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.total).toBe(2)
    expect(body.page).toBe(1)
    expect(body.limit).toBe(20)
  })

  it('filters by status when valid status query param is provided', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null })

    const mockEq = vi.fn()
    const chainable = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      eq: mockEq,
      then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: [], error: null, count: 0 })),
    }
    mockEq.mockReturnValue(chainable)

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_ceo_coffee_sessions') return chainable
      return {}
    })

    mocks.mockRpc.mockResolvedValue({ data: 0, error: null })

    const req = makeGetRequest({ status: 'open' })
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(mockEq).toHaveBeenCalledWith('status', 'open')
  })

  it('includes application_count per session from RPC', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null })

    const sessions = [{ id: 'sess-1', title: '세션 A', session_date: '2026-04-15T10:00:00Z' }]

    const mockRange = vi.fn().mockResolvedValue({ data: sessions, error: null, count: 1 })
    const mockOrder = vi.fn().mockReturnValue({ range: mockRange })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_ceo_coffee_sessions') {
        return { select: mockSelect }
      }
      return {}
    })

    mocks.mockRpc.mockResolvedValue({ data: 7, error: null })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data[0].application_count).toBe(7)
  })

  it('returns 500 when DB query fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null })

    const mockRange = vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' }, count: null })
    const mockOrder = vi.fn().mockReturnValue({ range: mockRange })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

    mocks.mockFrom.mockImplementation(() => ({ select: mockSelect }))

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('세션 목록 조회에 실패했습니다')
  })

  it('uses page and limit query params for pagination', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null })

    const mockRange = vi.fn().mockResolvedValue({ data: [], error: null, count: 100 })
    const mockOrder = vi.fn().mockReturnValue({ range: mockRange })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

    mocks.mockFrom.mockImplementation(() => ({ select: mockSelect }))
    mocks.mockRpc.mockResolvedValue({ data: 0, error: null })

    const req = makeGetRequest({ page: '3', limit: '10' })
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.page).toBe(3)
    expect(body.limit).toBe(10)
    // offset = (3-1)*10 = 20, range(20, 29)
    expect(mockRange).toHaveBeenCalledWith(20, 29)
  })
})

describe('POST /api/ceo-coffeechat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'not auth' } })

    const req = makePostRequest(validSessionBody)
    const res = await POST(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when user is not a corporate user', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null })

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
      return {}
    })

    const req = makePostRequest(validSessionBody)
    const res = await POST(req)

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('CEO/Founder만 세션을 생성할 수 있습니다')
  })

  it('returns 403 when corporate user role is not ceo or founder', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_corporate_users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: authedUser.id, role: 'hr' }, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makePostRequest(validSessionBody)
    const res = await POST(req)

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('CEO/Founder만 세션을 생성할 수 있습니다')
  })

  it('returns 400 when required title field is missing', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_corporate_users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: authedUser.id, role: 'ceo' }, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const { title: _omit, ...bodyWithoutTitle } = validSessionBody
    const req = makePostRequest(bodyWithoutTitle)
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('returns 400 when agreement_accepted is false', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_corporate_users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: authedUser.id, role: 'ceo' }, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makePostRequest({ ...validSessionBody, agreement_accepted: false })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('헤드헌팅 수수료 원칙에 동의해야 합니다')
  })

  it('returns 400 when location_type is invalid', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_corporate_users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: authedUser.id, role: 'founder' }, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makePostRequest({ ...validSessionBody, location_type: 'virtual' })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('creates session and returns 201 with session data for ceo role', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null })

    const createdSession = { id: 'sess-new-1', host_id: authedUser.id, ...validSessionBody }

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_corporate_users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: authedUser.id, role: 'ceo' }, error: null }),
            }),
          }),
        }
      }
      if (table === 'vcx_ceo_coffee_sessions') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: createdSession, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makePostRequest(validSessionBody)
    const res = await POST(req)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.id).toBe('sess-new-1')
    expect(body.data.host_id).toBe(authedUser.id)
  })

  it('creates session and returns 201 for founder role', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null })

    const createdSession = { id: 'sess-new-2', host_id: authedUser.id, ...validSessionBody }

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_corporate_users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: authedUser.id, role: 'founder' }, error: null }),
            }),
          }),
        }
      }
      if (table === 'vcx_ceo_coffee_sessions') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: createdSession, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makePostRequest(validSessionBody)
    const res = await POST(req)

    expect(res.status).toBe(201)
  })

  it('returns 500 when DB insert fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_corporate_users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: authedUser.id, role: 'ceo' }, error: null }),
            }),
          }),
        }
      }
      if (table === 'vcx_ceo_coffee_sessions') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
            }),
          }),
        }
      }
      return {}
    })

    const req = makePostRequest(validSessionBody)
    const res = await POST(req)

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('세션 생성에 실패했습니다')
  })

  it('returns 400 when request body is not valid JSON', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_corporate_users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: authedUser.id, role: 'ceo' }, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const req = new NextRequest('http://localhost/api/ceo-coffeechat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json{{{',
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청 형식입니다')
  })
})
