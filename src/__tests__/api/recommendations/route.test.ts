import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetUser, mockFrom } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  return { mockGetUser, mockFrom }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

/**
 * Build a query builder where every method returns `this` except `.single()`
 * which resolves to `result`. The builder also supports `.insert()` chains.
 */
function makeBuilder(singleResult: { data: unknown; error?: unknown }) {
  const single = vi.fn().mockResolvedValue(singleResult)

  // We need a self-referential object — use a plain object then assign methods
  const b: Record<string, unknown> = {}

  const returnSelf = () => b
  b.eq = vi.fn().mockImplementation(returnSelf)
  b.in = vi.fn().mockImplementation(returnSelf)
  b.select = vi.fn().mockImplementation(returnSelf)
  b.single = single

  // insert returns a chain that eventually reaches the same single
  b.insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ single }),
  })

  // update for completeness (not used in route.ts create)
  b.update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single }),
    }),
  })

  return b
}

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/recommendations', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

describe('POST /api/recommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no auth session', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('no session') })

    const { POST } = await import('@/app/api/recommendations/route')
    const res = await POST(makeRequest({ recommended_email: 'a@b.com', recommended_name: 'A', member_tier: 'core' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when user is not core member', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })

    // member check returns endorsed (not core)
    const memberBuilder = makeBuilder({ data: { id: 'user-1', member_tier: 'endorsed', is_active: true }, error: null })
    mockFrom.mockReturnValueOnce(memberBuilder)

    const { POST } = await import('@/app/api/recommendations/route')
    const res = await POST(makeRequest({ recommended_email: 'a@b.com', recommended_name: 'A', member_tier: 'core' }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Core Member만 추천할 수 있습니다')
  })

  it('returns 403 when member is inactive', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })

    const memberBuilder = makeBuilder({ data: { id: 'user-1', member_tier: 'core', is_active: false }, error: null })
    mockFrom.mockReturnValueOnce(memberBuilder)

    const { POST } = await import('@/app/api/recommendations/route')
    const res = await POST(makeRequest({ recommended_email: 'a@b.com', recommended_name: 'A', member_tier: 'core' }))
    expect(res.status).toBe(403)
  })

  it('returns 400 when recommended_email is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })

    const memberBuilder = makeBuilder({ data: { id: 'user-1', member_tier: 'core', is_active: true }, error: null })
    mockFrom.mockReturnValueOnce(memberBuilder)

    const { POST } = await import('@/app/api/recommendations/route')
    const res = await POST(makeRequest({ recommended_name: 'A', member_tier: 'core' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('필수 항목을 입력해주세요')
  })

  it('returns 400 when member_tier is invalid', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })

    const memberBuilder = makeBuilder({ data: { id: 'user-1', member_tier: 'core', is_active: true }, error: null })
    mockFrom.mockReturnValueOnce(memberBuilder)

    const { POST } = await import('@/app/api/recommendations/route')
    const res = await POST(makeRequest({ recommended_email: 'a@b.com', recommended_name: 'A', member_tier: 'bad-tier' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 멤버 등급입니다')
  })

  it('returns 409 when email already exists in vcx_members', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })

    // call 1: permission check — core active member
    const memberBuilder = makeBuilder({ data: { id: 'user-1', member_tier: 'core', is_active: true }, error: null })
    // call 2: existing member check — found
    const existingBuilder = makeBuilder({ data: { id: 'other-1' }, error: null })

    mockFrom.mockReturnValueOnce(memberBuilder).mockReturnValueOnce(existingBuilder)

    const { POST } = await import('@/app/api/recommendations/route')
    const res = await POST(makeRequest({ recommended_email: 'a@b.com', recommended_name: 'A', member_tier: 'core' }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('이미 멤버인 이메일입니다')
  })

  it('returns 409 when pending recommendation exists for email', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })

    // call 1: permission check
    const memberBuilder = makeBuilder({ data: { id: 'user-1', member_tier: 'core', is_active: true }, error: null })
    // call 2: existing member check — not found
    const noMemberBuilder = makeBuilder({ data: null, error: { code: 'PGRST116' } })
    // call 3: existing recommendation check — found
    const existingRecBuilder = makeBuilder({ data: { id: 'rec-1' }, error: null })

    mockFrom
      .mockReturnValueOnce(memberBuilder)
      .mockReturnValueOnce(noMemberBuilder)
      .mockReturnValueOnce(existingRecBuilder)

    const { POST } = await import('@/app/api/recommendations/route')
    const res = await POST(makeRequest({ recommended_email: 'a@b.com', recommended_name: 'A', member_tier: 'core' }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('이미 대기 중인 추천이 있습니다')
  })

  it('returns 201 with recommendation data on success', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })

    const recommendation = {
      id: 'rec-new',
      recommender_id: 'user-1',
      recommended_email: 'a@b.com',
      recommended_name: 'A',
      member_tier: 'core',
      status: 'pending',
    }

    // call 1: permission check
    const memberBuilder = makeBuilder({ data: { id: 'user-1', member_tier: 'core', is_active: true }, error: null })
    // call 2: existing member check — not found
    const noMemberBuilder = makeBuilder({ data: null, error: { code: 'PGRST116' } })
    // call 3: existing recommendation check — not found
    const noRecBuilder = makeBuilder({ data: null, error: { code: 'PGRST116' } })
    // call 4: insert
    const insertBuilder = makeBuilder({ data: recommendation, error: null })

    mockFrom
      .mockReturnValueOnce(memberBuilder)
      .mockReturnValueOnce(noMemberBuilder)
      .mockReturnValueOnce(noRecBuilder)
      .mockReturnValueOnce(insertBuilder)

    const { POST } = await import('@/app/api/recommendations/route')
    const res = await POST(makeRequest({ recommended_email: 'a@b.com', recommended_name: 'A', member_tier: 'core' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toEqual(recommendation)
  })
})
