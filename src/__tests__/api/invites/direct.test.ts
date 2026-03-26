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
    mockGenerateInviteToken: vi.fn(),
    mockHashToken: vi.fn(),
    mockCalculateExpiry: vi.fn(),
    mockSendInviteEmail: vi.fn(),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))

vi.mock('@/lib/invite', () => ({
  generateInviteToken: mocks.mockGenerateInviteToken,
  hashToken: mocks.mockHashToken,
  calculateExpiry: mocks.mockCalculateExpiry,
}))

vi.mock('@/lib/email', () => ({
  sendInviteEmail: mocks.mockSendInviteEmail,
}))

import { POST } from '@/app/api/invites/direct/route'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/invites/direct', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const mockAdmin = { id: 'admin-id', name: 'Admin User', system_role: 'admin' }

describe('POST /api/invites/direct', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockGenerateInviteToken.mockReturnValue('raw-token-abc')
    mocks.mockHashToken.mockReturnValue('hashed-token-abc')
    mocks.mockCalculateExpiry.mockReturnValue('2099-01-01T00:00:00.000Z')
    mocks.mockSendInviteEmail.mockResolvedValue(undefined)
  })

  it('returns 401 when not authenticated and 403 when not admin', async () => {
    // 401 case: no user
    mocks.mockServerAuth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'not authenticated' } })

    const req = makeRequest({ email: 'new@example.com', member_tier: 'standard' })
    const res = await POST(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')

    // 403 case: authenticated but not admin
    mocks.mockServerAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null })
    const mockAdminSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockAdminEq = vi.fn().mockReturnThis()
    mockAdminEq.mockReturnValue({ in: vi.fn().mockReturnValue({ single: mockAdminSingle }), single: mockAdminSingle })
    mocks.mockServerFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: mockAdminEq }),
    })

    const req2 = makeRequest({ email: 'new@example.com', member_tier: 'standard' })
    const res2 = await POST(req2)
    expect(res2.status).toBe(403)
  })

  it('returns 409 for existing member with that email', async () => {
    mocks.mockServerAuth.getUser.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })

    const mockAdminSingle = vi.fn().mockResolvedValue({ data: mockAdmin, error: null })
    mocks.mockServerFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({ single: mockAdminSingle }),
        }),
      }),
    })

    // existing member found
    const mockExistingSingle = vi.fn().mockResolvedValue({ data: { id: 'existing-member' }, error: null })
    mocks.mockAdminFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ single: mockExistingSingle }),
      }),
    })

    const req = makeRequest({ email: 'existing@example.com', member_tier: 'standard' })
    const res = await POST(req)

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('이미 멤버인 이메일입니다')
  })

  it('returns 409 for existing pending invite', async () => {
    mocks.mockServerAuth.getUser.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })

    const mockAdminSingle = vi.fn().mockResolvedValue({ data: mockAdmin, error: null })
    mocks.mockServerFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({ single: mockAdminSingle }),
        }),
      }),
    })

    let callCount = 0
    mocks.mockAdminFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // first call: vcx_members - no existing member
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }),
          }),
        }
      }
      // second call: vcx_invites - existing pending invite
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'invite-id' }, error: null }) }),
          }),
        }),
      }
    })

    const req = makeRequest({ email: 'pending@example.com', member_tier: 'standard' })
    const res = await POST(req)

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('이미 대기 중인 초대가 있습니다')
  })

  it('returns 201, creates invite, and calls sendInviteEmail', async () => {
    mocks.mockServerAuth.getUser.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })

    const mockAdminSingle = vi.fn().mockResolvedValue({ data: mockAdmin, error: null })
    mocks.mockServerFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({ single: mockAdminSingle }),
        }),
      }),
    })

    const newInvite = { id: 'new-invite-id', email: 'new@example.com', member_tier: 'core' }
    let callCount = 0
    mocks.mockAdminFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // vcx_members check - no existing
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }),
          }),
        }
      }
      if (callCount === 2) {
        // vcx_invites pending check - no existing
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }),
          }),
        }
      }
      // insert
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newInvite, error: null }),
          }),
        }),
      }
    })

    const req = makeRequest({ email: 'new@example.com', member_tier: 'core' })
    const res = await POST(req)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toEqual(newInvite)
    expect(mocks.mockSendInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'new@example.com',
        token: 'raw-token-abc',
      })
    )
  })

  it('returns 400 for missing required fields', async () => {
    mocks.mockServerAuth.getUser.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })

    const mockAdminSingle = vi.fn().mockResolvedValue({ data: mockAdmin, error: null })
    mocks.mockServerFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({ single: mockAdminSingle }),
        }),
      }),
    })

    const req = makeRequest({ email: 'new@example.com' }) // missing member_tier
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('필수 항목을 입력해주세요')
  })
})
