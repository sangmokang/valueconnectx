import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockAuth = { getUser: vi.fn() }
  const mockClient = { from: mockFrom, auth: mockAuth }

  return {
    mockFrom,
    mockAuth,
    mockClient,
    createClient: vi.fn(async () => mockClient),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

import { GET } from '@/app/api/invites/list/route'

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/invites/list')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

const mockAdmin = { id: 'admin-id', system_role: 'admin' }

const sampleInvites = [
  { id: '1', email: 'a@example.com', status: 'pending' },
  { id: '2', email: 'b@example.com', status: 'accepted' },
]

describe('GET /api/invites/list', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated and 403 when not admin', async () => {
    // 401
    mocks.mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'not authenticated' } })

    const req = makeRequest()
    const res = await GET(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')

    // 403
    mocks.mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null })

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // admin check returns null
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }),
          }),
        }
      }
      return {}
    })

    const req2 = makeRequest()
    const res2 = await GET(req2)
    expect(res2.status).toBe(403)
  })

  it('returns paginated results with total count', async () => {
    mocks.mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // admin check
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: mockAdmin, error: null }) }),
            }),
          }),
        }
      }
      // vcx_invites list query
      const chain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: sampleInvites, error: null, count: 2 }),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
      }
      return chain
    })

    const req = makeRequest({ page: '1', limit: '20' })
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual(sampleInvites)
    expect(body.total).toBe(2)
    expect(body.page).toBe(1)
    expect(body.limit).toBe(20)
  })

  it('filters by status when status param is provided', async () => {
    mocks.mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })

    let callCount = 0
    const mockEq = vi.fn()
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: mockAdmin, error: null }) }),
            }),
          }),
        }
      }
      // The source code does: query = supabase.from(...).select(...).order(...).range(...)
      // Then: query = query.eq('status', status) — so range must return the chain, not resolve
      const result = { data: [sampleInvites[0]], error: null, count: 1 }
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.order = vi.fn().mockReturnValue(chain)
      chain.range = vi.fn().mockReturnValue(chain)
      chain.ilike = vi.fn().mockReturnValue(chain)
      mockEq.mockReturnValue(chain)
      chain.eq = mockEq
      // Make the chain thenable so `await query` resolves
      chain.then = (resolve: (v: unknown) => void) => resolve(result)
      return chain
    })

    const req = makeRequest({ status: 'pending' })
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(mockEq).toHaveBeenCalledWith('status', 'pending')
  })

  it('supports search parameter with ilike filter', async () => {
    mocks.mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })

    let callCount = 0
    const mockIlike = vi.fn()
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: mockAdmin, error: null }) }),
            }),
          }),
        }
      }
      const result = { data: sampleInvites, error: null, count: 2 }
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.order = vi.fn().mockReturnValue(chain)
      chain.range = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      mockIlike.mockReturnValue(chain)
      chain.ilike = mockIlike
      chain.then = (resolve: (v: unknown) => void) => resolve(result)
      return chain
    })

    const req = makeRequest({ search: 'example' })
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(mockIlike).toHaveBeenCalledWith('email', '%example%')
  })
})
