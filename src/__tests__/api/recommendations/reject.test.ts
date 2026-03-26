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

/**
 * Self-referential chainable builder.
 * All methods return `this` so any chain depth works.
 * .single() resolves to singleResult.
 */
function makeBuilder(singleResult: { data: unknown; error?: unknown }) {
  const single = vi.fn().mockResolvedValue(singleResult)
  const b: Record<string, unknown> = {}
  const returnSelf = () => b
  b.eq = vi.fn().mockImplementation(returnSelf)
  b.in = vi.fn().mockImplementation(returnSelf)
  b.select = vi.fn().mockImplementation(returnSelf)
  b.single = single
  b.update = vi.fn().mockImplementation(returnSelf)
  b.insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ single }),
  })
  return b
}

function makeRequest() {
  return new NextRequest('http://localhost:3000/api/recommendations/rec-123/reject', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
  })
}

const defaultParams = { params: Promise.resolve({ id: 'rec-123' }) }

describe('POST /api/recommendations/[id]/reject', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without auth', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('no session') })

    const { POST } = await import('@/app/api/recommendations/[id]/reject/route')
    const res = await POST(makeRequest(), defaultParams)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 for non-admin', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })

    // admin check returns null — not admin
    const adminCheckBuilder = makeBuilder({ data: null, error: { code: 'PGRST116' } })
    mockFrom.mockReturnValueOnce(adminCheckBuilder)

    const { POST } = await import('@/app/api/recommendations/[id]/reject/route')
    const res = await POST(makeRequest(), defaultParams)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('관리자 권한이 필요합니다')
  })

  it('returns 404 when recommendation not found or not pending', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } }, error: null })

    // admin check passes
    const adminCheckBuilder = makeBuilder({ data: { id: 'admin-1', system_role: 'admin' }, error: null })
    mockFrom.mockReturnValueOnce(adminCheckBuilder)

    // The reject route does:
    //   adminClient.from('vcx_recommendations')
    //     .update({...}).eq('id', id).eq('status', 'pending').select().single()
    // All chain methods return self, so single() resolves to our result.
    const rejectBuilder = makeBuilder({ data: null, error: { code: 'PGRST116' } })
    mockAdminFrom.mockReturnValueOnce(rejectBuilder)

    const { POST } = await import('@/app/api/recommendations/[id]/reject/route')
    const res = await POST(makeRequest(), defaultParams)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('대기 중인 추천을 찾을 수 없습니다')
  })

  it('returns 200 with updated recommendation', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } }, error: null })

    const adminCheckBuilder = makeBuilder({ data: { id: 'admin-1', system_role: 'admin' }, error: null })
    mockFrom.mockReturnValueOnce(adminCheckBuilder)

    const updatedRec = {
      id: 'rec-123',
      status: 'rejected',
      reviewed_by: 'admin-1',
      reviewed_at: '2026-03-25T00:00:00.000Z',
    }

    const rejectBuilder = makeBuilder({ data: updatedRec, error: null })
    mockAdminFrom.mockReturnValueOnce(rejectBuilder)

    const { POST } = await import('@/app/api/recommendations/[id]/reject/route')
    const res = await POST(makeRequest(), defaultParams)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual(updatedRec)
  })

  it('sets reviewed_by and reviewed_at on rejection', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'admin-99' } }, error: null })

    const adminCheckBuilder = makeBuilder({ data: { id: 'admin-99', system_role: 'super_admin' }, error: null })
    mockFrom.mockReturnValueOnce(adminCheckBuilder)

    const updatedRec = {
      id: 'rec-123',
      status: 'rejected',
      reviewed_by: 'admin-99',
      reviewed_at: '2026-03-25T00:00:00.000Z',
    }

    // Spy on update to assert its argument
    const mockUpdate = vi.fn()
    const b: Record<string, unknown> = {}
    const single = vi.fn().mockResolvedValue({ data: updatedRec, error: null })
    b.eq = vi.fn().mockReturnValue(b)
    b.in = vi.fn().mockReturnValue(b)
    b.select = vi.fn().mockReturnValue(b)
    b.single = single
    b.update = mockUpdate
    mockUpdate.mockReturnValue(b)
    mockAdminFrom.mockReturnValueOnce(b)

    const { POST } = await import('@/app/api/recommendations/[id]/reject/route')
    await POST(makeRequest(), defaultParams)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'rejected', reviewed_by: 'admin-99' })
    )
    expect(mockUpdate.mock.calls[0][0]).toHaveProperty('reviewed_at')
  })
})
