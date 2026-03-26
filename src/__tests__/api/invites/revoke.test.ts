import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockServerFrom = vi.fn()
  const mockServerAuth = { getUser: vi.fn() }
  const mockServerClient = { from: mockServerFrom, auth: mockServerAuth }

  const mockAdminFrom = vi.fn()
  const mockAdminClient = { from: mockAdminFrom }

  return {
    mockServerFrom,
    mockServerAuth,
    mockServerClient,
    mockAdminFrom,
    mockAdminClient,
    createClient: vi.fn(async () => mockServerClient),
    createAdminClient: vi.fn(() => mockAdminClient),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))

import { POST } from '@/app/api/invites/[id]/revoke/route'

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/invites/${id}/revoke`, {
    method: 'POST',
  })
}

const mockAdmin = { id: 'admin-id', system_role: 'admin' }

function setupAdminAuth() {
  mocks.mockServerAuth.getUser.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })
  const mockSingle = vi.fn().mockResolvedValue({ data: mockAdmin, error: null })
  mocks.mockServerFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({ single: mockSingle }),
      }),
    }),
  })
}

describe('POST /api/invites/[id]/revoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated and 403 when not admin', async () => {
    // 401
    mocks.mockServerAuth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'not authenticated' } })

    const req = makeRequest('invite-id-1')
    const res = await POST(req, { params: Promise.resolve({ id: 'invite-id-1' }) })

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')

    // 403
    mocks.mockServerAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null })
    const mockNoAdmin = vi.fn().mockResolvedValue({ data: null, error: null })
    mocks.mockServerFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({ single: mockNoAdmin }),
        }),
      }),
    })

    const req2 = makeRequest('invite-id-1')
    const res2 = await POST(req2, { params: Promise.resolve({ id: 'invite-id-1' }) })
    expect(res2.status).toBe(403)
  })

  it('returns 404 for non-pending invite', async () => {
    setupAdminAuth()

    // update finds nothing (not pending or not found)
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
    const mockEq = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) }) })
    mocks.mockAdminFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: mockEq }),
    })

    const req = makeRequest('non-pending-invite-id')
    const res = await POST(req, { params: Promise.resolve({ id: 'non-pending-invite-id' }) })

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('대기 중인 초대를 찾을 수 없습니다')
  })

  it('returns 200 with revoked invite data', async () => {
    setupAdminAuth()

    const revokedInvite = { id: 'invite-id-1', status: 'revoked', email: 'test@example.com' }
    const mockSingle = vi.fn().mockResolvedValue({ data: revokedInvite, error: null })
    const mockEq = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) }) })
    mocks.mockAdminFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: mockEq }),
    })

    const req = makeRequest('invite-id-1')
    const res = await POST(req, { params: Promise.resolve({ id: 'invite-id-1' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual(revokedInvite)
  })

  it('updates invite status to revoked', async () => {
    setupAdminAuth()

    const revokedInvite = { id: 'invite-id-1', status: 'revoked', email: 'test@example.com' }
    const mockSingle = vi.fn().mockResolvedValue({ data: revokedInvite, error: null })
    const mockEq = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) }) })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    mocks.mockAdminFrom.mockReturnValue({ update: mockUpdate })

    const req = makeRequest('invite-id-1')
    await POST(req, { params: Promise.resolve({ id: 'invite-id-1' }) })

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'revoked' })
  })
})
