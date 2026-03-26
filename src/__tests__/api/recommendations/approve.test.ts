import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetUser, mockFrom, mockAdminFrom } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  const mockAdminFrom = vi.fn()
  return { mockGetUser, mockFrom, mockAdminFrom }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: mockAdminFrom,
  }),
}))

vi.mock('@/lib/invite', () => ({
  generateInviteToken: vi.fn().mockReturnValue('mock-raw-token'),
  hashToken: vi.fn().mockReturnValue('mock-token-hash'),
  calculateExpiry: vi.fn().mockReturnValue('2026-03-26T00:00:00.000Z'),
}))

vi.mock('@/lib/email', () => ({
  sendInviteEmail: vi.fn().mockResolvedValue({ success: true }),
}))

/**
 * Self-referential chainable builder.
 * Every method returns `this` (so chains like .eq().eq().in() work).
 * .single() resolves to singleResult.
 * .insert() returns a fresh chain ending in the same single.
 * .update() returns a fresh chain ending in the same single (no result needed for approve's update).
 */
function makeBuilder(singleResult: { data: unknown; error?: unknown }) {
  const single = vi.fn().mockResolvedValue(singleResult)
  const b: Record<string, unknown> = {}
  const returnSelf = () => b
  b.eq = vi.fn().mockImplementation(returnSelf)
  b.in = vi.fn().mockImplementation(returnSelf)
  b.select = vi.fn().mockImplementation(returnSelf)
  b.single = single
  b.insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ single }),
  })
  b.update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnThis(),
  })
  return b
}

function makeRequest() {
  return new NextRequest('http://localhost:3000/api/recommendations/rec-123/approve', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
  })
}

const defaultParams = { params: Promise.resolve({ id: 'rec-123' }) }

describe('POST /api/recommendations/[id]/approve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no auth session', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('no session') })

    const { POST } = await import('@/app/api/recommendations/[id]/approve/route')
    const res = await POST(makeRequest(), defaultParams)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when not admin', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })

    // admin check returns null
    const adminCheckBuilder = makeBuilder({ data: null, error: { code: 'PGRST116' } })
    mockFrom.mockReturnValueOnce(adminCheckBuilder)

    const { POST } = await import('@/app/api/recommendations/[id]/approve/route')
    const res = await POST(makeRequest(), defaultParams)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('관리자 권한이 필요합니다')
  })

  it('returns 404 when recommendation not found or not pending', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } }, error: null })

    // admin check passes
    const adminCheckBuilder = makeBuilder({ data: { id: 'admin-1', name: 'Admin', system_role: 'admin' }, error: null })
    mockFrom.mockReturnValueOnce(adminCheckBuilder)

    // recommendation lookup returns null
    const recBuilder = makeBuilder({ data: null, error: { code: 'PGRST116' } })
    mockAdminFrom.mockReturnValueOnce(recBuilder)

    const { POST } = await import('@/app/api/recommendations/[id]/approve/route')
    const res = await POST(makeRequest(), defaultParams)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('대기 중인 추천을 찾을 수 없습니다')
  })

  it('returns 201 and creates vcx_invites row on success', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } }, error: null })

    const adminCheckBuilder = makeBuilder({ data: { id: 'admin-1', name: 'Admin User', system_role: 'admin' }, error: null })
    mockFrom.mockReturnValueOnce(adminCheckBuilder)

    const recommendation = {
      id: 'rec-123',
      recommended_email: 'invited@test.com',
      recommended_name: 'Invited',
      member_tier: 'core',
      status: 'pending',
    }
    const invite = { id: 'invite-1', email: 'invited@test.com' }

    // call 1: rec lookup
    const recBuilder = makeBuilder({ data: recommendation, error: null })
    // call 2: update recommendation (no result needed — just needs to not throw)
    const updateBuilder = makeBuilder({ data: null, error: null })
    // call 3: insert invite
    const inviteBuilder = makeBuilder({ data: invite, error: null })

    mockAdminFrom
      .mockReturnValueOnce(recBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(inviteBuilder)

    const { POST } = await import('@/app/api/recommendations/[id]/approve/route')
    const res = await POST(makeRequest(), defaultParams)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toEqual(invite)
  })

  it('updates recommendation status to approved with reviewer info', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } }, error: null })

    const adminCheckBuilder = makeBuilder({ data: { id: 'admin-1', name: 'Admin User', system_role: 'admin' }, error: null })
    mockFrom.mockReturnValueOnce(adminCheckBuilder)

    const recommendation = {
      id: 'rec-123',
      recommended_email: 'invited@test.com',
      recommended_name: 'Invited',
      member_tier: 'core',
    }

    const recBuilder = makeBuilder({ data: recommendation, error: null })

    // Spy on the update call
    const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnThis() })
    const updateBuilder = { update: mockUpdate }

    const inviteBuilder = makeBuilder({ data: { id: 'invite-1' }, error: null })

    mockAdminFrom
      .mockReturnValueOnce(recBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(inviteBuilder)

    const { POST } = await import('@/app/api/recommendations/[id]/approve/route')
    await POST(makeRequest(), defaultParams)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'approved', reviewed_by: 'admin-1' })
    )
  })

  it('generates token and hashes it for invite', async () => {
    const { generateInviteToken, hashToken } = await import('@/lib/invite')

    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } }, error: null })

    const adminCheckBuilder = makeBuilder({ data: { id: 'admin-1', name: 'Admin', system_role: 'admin' }, error: null })
    mockFrom.mockReturnValueOnce(adminCheckBuilder)

    const recommendation = { id: 'rec-123', recommended_email: 'e@e.com', member_tier: 'endorsed' }
    const recBuilder = makeBuilder({ data: recommendation, error: null })
    const updateBuilder = makeBuilder({ data: null, error: null })
    const inviteBuilder = makeBuilder({ data: { id: 'invite-1' }, error: null })

    mockAdminFrom
      .mockReturnValueOnce(recBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(inviteBuilder)

    const { POST } = await import('@/app/api/recommendations/[id]/approve/route')
    await POST(makeRequest(), defaultParams)

    expect(generateInviteToken).toHaveBeenCalled()
    expect(hashToken).toHaveBeenCalledWith('mock-raw-token')
  })

  it('calls sendInviteEmail with correct params', async () => {
    const { sendInviteEmail } = await import('@/lib/email')

    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } }, error: null })

    const adminCheckBuilder = makeBuilder({ data: { id: 'admin-1', name: 'Admin Name', system_role: 'admin' }, error: null })
    mockFrom.mockReturnValueOnce(adminCheckBuilder)

    const recommendation = { id: 'rec-123', recommended_email: 'target@test.com', member_tier: 'core' }
    const recBuilder = makeBuilder({ data: recommendation, error: null })
    const updateBuilder = makeBuilder({ data: null, error: null })
    const inviteBuilder = makeBuilder({ data: { id: 'invite-1' }, error: null })

    mockAdminFrom
      .mockReturnValueOnce(recBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(inviteBuilder)

    const { POST } = await import('@/app/api/recommendations/[id]/approve/route')
    await POST(makeRequest(), defaultParams)

    expect(sendInviteEmail).toHaveBeenCalledWith({
      to: 'target@test.com',
      inviterName: 'Admin Name',
      token: 'mock-raw-token',
      memberTier: 'core',
    })
  })
})
