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

import { POST, DELETE } from '@/app/api/positions/[id]/interest/route'

const authenticatedUser = { id: 'user-id-1' }
const positionId = 'pos-id-1'

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/positions/${positionId}/interest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeDeleteRequest() {
  return new NextRequest(`http://localhost/api/positions/${positionId}/interest`, {
    method: 'DELETE',
  })
}

// Build a fluent Supabase query chain terminating with the given resolved value
function makeQueryChain(resolved: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'in', 'single', 'insert', 'update', 'delete', 'upsert']
  methods.forEach((m) => {
    chain[m] = vi.fn(() => chain)
  })
  chain.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(resolved).then(resolve)
  return chain
}

describe('POST /api/positions/[id]/interest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const res = await POST(makePostRequest({ interest_type: 'interested' }), {
      params: Promise.resolve({ id: positionId }),
    })

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when authenticated user is not a VCX member', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return makeQueryChain({ data: null, error: null })
      }
      return makeQueryChain({ data: null, error: null })
    })

    const res = await POST(makePostRequest({ interest_type: 'interested' }), {
      params: Promise.resolve({ id: positionId }),
    })

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 접근할 수 있습니다')
  })

  it('returns 400 for invalid interest_type value', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return makeQueryChain({ data: { id: authenticatedUser.id }, error: null })
      }
      return makeQueryChain({ data: null, error: null })
    })

    const res = await POST(makePostRequest({ interest_type: 'invalid_type' }), {
      params: Promise.resolve({ id: positionId }),
    })

    expect(res.status).toBe(400)
  })

  it('returns 201 and creates new interest for valid member with valid interest_type', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const createdInterest = {
      position_id: positionId,
      user_id: authenticatedUser.id,
      interest_type: 'interested',
    }

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return makeQueryChain({ data: { id: authenticatedUser.id }, error: null })
      }
      if (table === 'position_interests') {
        return makeQueryChain({ data: createdInterest, error: null })
      }
      return makeQueryChain({ data: null, error: null })
    })

    const res = await POST(makePostRequest({ interest_type: 'interested' }), {
      params: Promise.resolve({ id: positionId }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(body.data.interest_type).toBe('interested')
  })

  it('returns 201 and upserts interest when changing type for same position', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const updatedInterest = {
      position_id: positionId,
      user_id: authenticatedUser.id,
      interest_type: 'bookmark',
    }

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return makeQueryChain({ data: { id: authenticatedUser.id }, error: null })
      }
      if (table === 'position_interests') {
        return makeQueryChain({ data: updatedInterest, error: null })
      }
      return makeQueryChain({ data: null, error: null })
    })

    const res = await POST(makePostRequest({ interest_type: 'bookmark' }), {
      params: Promise.resolve({ id: positionId }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.interest_type).toBe('bookmark')
  })

  it('returns 500 when database upsert fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return makeQueryChain({ data: { id: authenticatedUser.id }, error: null })
      }
      if (table === 'position_interests') {
        return makeQueryChain({ data: null, error: new Error('db error') })
      }
      return makeQueryChain({ data: null, error: null })
    })

    const res = await POST(makePostRequest({ interest_type: 'interested' }), {
      params: Promise.resolve({ id: positionId }),
    })

    expect(res.status).toBe(500)
  })
})

describe('DELETE /api/positions/[id]/interest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const res = await DELETE(makeDeleteRequest(), {
      params: Promise.resolve({ id: positionId }),
    })

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when authenticated user is not a VCX member', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation(() => makeQueryChain({ data: null, error: null }))

    const res = await DELETE(makeDeleteRequest(), {
      params: Promise.resolve({ id: positionId }),
    })

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 접근할 수 있습니다')
  })

  it('returns 200 and removes interest successfully', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return makeQueryChain({ data: { id: authenticatedUser.id }, error: null })
      }
      if (table === 'position_interests') {
        return makeQueryChain({ data: null, error: null })
      }
      return makeQueryChain({ data: null, error: null })
    })

    const res = await DELETE(makeDeleteRequest(), {
      params: Promise.resolve({ id: positionId }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('returns 500 when database delete fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return makeQueryChain({ data: { id: authenticatedUser.id }, error: null })
      }
      if (table === 'position_interests') {
        return makeQueryChain({ data: null, error: new Error('db error') })
      }
      return makeQueryChain({ data: null, error: null })
    })

    const res = await DELETE(makeDeleteRequest(), {
      params: Promise.resolve({ id: positionId }),
    })

    expect(res.status).toBe(500)
  })
})
