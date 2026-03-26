import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockRpc = vi.fn()
  const mockAdminAuth = {
    admin: {
      listUsers: vi.fn(),
      createUser: vi.fn(),
      updateUserById: vi.fn(),
    },
    signInWithPassword: vi.fn(),
  }
  const mockAdminClient = {
    from: mockFrom,
    rpc: mockRpc,
    auth: mockAdminAuth,
  }
  return {
    mockFrom,
    mockRpc,
    mockAdminAuth,
    mockAdminClient,
    mockRateLimit: vi.fn(),
    mockHashToken: vi.fn(),
    createAdminClient: vi.fn(() => mockAdminClient),
  }
})

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mocks.mockRateLimit,
  authLimiter: null,
  apiLimiter: null,
  directoryLimiter: null,
  directoryBurstLimiter: null,
  directoryDailyLimiter: null,
}))

vi.mock('@/lib/invite', () => ({
  hashToken: mocks.mockHashToken,
}))

import { POST } from '@/app/api/invites/accept/route'

function makeRequest(body: Record<string, unknown>, ip = '127.0.0.1') {
  return new NextRequest('http://localhost/api/invites/accept', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const futureDate = new Date(Date.now() + 86400000).toISOString()
const pastDate = new Date(Date.now() - 1000).toISOString()

const baseInvite = {
  id: 'invite-id-1',
  email: 'invitee@example.com',
  invited_by_name: 'Alice',
  member_tier: 'core' as const,
  expires_at: futureDate,
  status: 'pending',
  recommendation_id: null,
}

describe('POST /api/invites/accept', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockHashToken.mockReturnValue('hashed-token')
  })

  it('returns 429 when rate limited', async () => {
    mocks.mockRateLimit.mockReturnValue({ success: false, remaining: 0 })

    const req = makeRequest({ token: 'tok', password: 'password1', name: 'Bob' })
    const res = await POST(req)

    expect(res.status).toBe(429)
  })

  it('returns 400 when missing token, password, or name', async () => {
    mocks.mockRateLimit.mockReturnValue({ success: true, remaining: 4 })

    const req = makeRequest({ token: 'tok', password: 'password1' }) // missing name
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('모든 필드를 입력해주세요')
  })

  it('returns 400 when password is less than 8 characters', async () => {
    mocks.mockRateLimit.mockReturnValue({ success: true, remaining: 4 })

    const req = makeRequest({ token: 'tok', password: 'short', name: 'Bob' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('비밀번호는 8자 이상이어야 합니다')
  })

  it('returns 400 for invalid token hash (not found)', async () => {
    mocks.mockRateLimit.mockReturnValue({ success: true, remaining: 4 })

    // RPC returns empty rows = already consumed or doesn't exist
    mocks.mockRpc.mockResolvedValue({ data: [], error: null })

    const req = makeRequest({ token: 'bad-token', password: 'password1', name: 'Bob' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 초대 링크입니다')
  })

  it('returns 400 for expired invite and updates status to expired', async () => {
    mocks.mockRateLimit.mockReturnValue({ success: true, remaining: 4 })

    const expiredInvite = { ...baseInvite, expires_at: pastDate }

    // RPC atomically consumed the invite, but it's expired
    mocks.mockRpc.mockResolvedValue({ data: [expiredInvite], error: null })

    const mockUpdateEq = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_invites') {
        return { update: mockUpdate }
      }
      return {}
    })

    const req = makeRequest({ token: 'expired-token', password: 'password1', name: 'Bob' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('초대가 만료되었습니다')
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'expired' })
  })

  it('creates new auth user when email not in auth.users', async () => {
    mocks.mockRateLimit.mockReturnValue({ success: true, remaining: 4 })

    mocks.mockRpc.mockResolvedValue({ data: [baseInvite], error: null })

    const mockMemberInsert = vi.fn().mockResolvedValue({ data: null, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return { insert: mockMemberInsert }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }
    })

    mocks.mockAdminAuth.admin.listUsers.mockResolvedValue({ data: { users: [] } })
    mocks.mockAdminAuth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'new-user-id' } },
      error: null,
    })
    mocks.mockAdminAuth.signInWithPassword.mockResolvedValue({
      data: { session: 'mock-session' },
      error: null,
    })

    const req = makeRequest({ token: 'valid-token', password: 'password1', name: 'Bob' })
    const res = await POST(req)

    expect(mocks.mockAdminAuth.admin.createUser).toHaveBeenCalledWith({
      email: baseInvite.email,
      password: 'password1',
      email_confirm: true,
    })
  })

  it('updates password for existing auth user (S4.5.3)', async () => {
    mocks.mockRateLimit.mockReturnValue({ success: true, remaining: 4 })

    mocks.mockRpc.mockResolvedValue({ data: [baseInvite], error: null })

    const existingUser = { id: 'existing-user-id', email: baseInvite.email }
    mocks.mockAdminAuth.admin.listUsers.mockResolvedValue({ data: { users: [existingUser] } })
    mocks.mockAdminAuth.admin.updateUserById.mockResolvedValue({ data: {}, error: null })

    const mockMemberInsert = vi.fn().mockResolvedValue({ data: null, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return { insert: mockMemberInsert }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }
    })

    mocks.mockAdminAuth.signInWithPassword.mockResolvedValue({
      data: { session: 'mock-session' },
      error: null,
    })

    const req = makeRequest({ token: 'valid-token', password: 'newpassword1', name: 'Bob' })
    await POST(req)

    expect(mocks.mockAdminAuth.admin.updateUserById).toHaveBeenCalledWith(
      'existing-user-id',
      { password: 'newpassword1' }
    )
    expect(mocks.mockAdminAuth.admin.createUser).not.toHaveBeenCalled()
  })

  it('creates vcx_members row with correct fields', async () => {
    mocks.mockRateLimit.mockReturnValue({ success: true, remaining: 4 })

    mocks.mockRpc.mockResolvedValue({ data: [baseInvite], error: null })

    const mockMemberInsert = vi.fn().mockResolvedValue({ data: null, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return { insert: mockMemberInsert }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }
    })

    mocks.mockAdminAuth.admin.listUsers.mockResolvedValue({ data: { users: [] } })
    mocks.mockAdminAuth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'new-user-id' } },
      error: null,
    })
    mocks.mockAdminAuth.signInWithPassword.mockResolvedValue({
      data: { session: 'mock-session' },
      error: null,
    })

    const req = makeRequest({ token: 'valid-token', password: 'password1', name: 'Bob' })
    await POST(req)

    expect(mockMemberInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'new-user-id',
        name: 'Bob',
        email: baseInvite.email,
        member_tier: baseInvite.member_tier,
        system_role: 'member',
      })
    )
  })

  it('includes linkedin_url in vcx_members insert when provided', async () => {
    mocks.mockRateLimit.mockReturnValue({ success: true, remaining: 4 })
    mocks.mockRpc.mockResolvedValue({ data: [baseInvite], error: null })

    const mockMemberInsert = vi.fn().mockResolvedValue({ data: null, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return { insert: mockMemberInsert }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }
    })

    mocks.mockAdminAuth.admin.listUsers.mockResolvedValue({ data: { users: [] } })
    mocks.mockAdminAuth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'new-user-id' } },
      error: null,
    })
    mocks.mockAdminAuth.signInWithPassword.mockResolvedValue({
      data: { session: 'mock-session' },
      error: null,
    })

    const req = makeRequest({ token: 'valid-token', password: 'password1', name: 'Bob', linkedin_url: 'https://linkedin.com/in/bob' })
    await POST(req)

    expect(mockMemberInsert).toHaveBeenCalledWith(
      expect.objectContaining({ linkedin_url: 'https://linkedin.com/in/bob' })
    )
  })

  it('sets linkedin_url to null in vcx_members insert when not provided', async () => {
    mocks.mockRateLimit.mockReturnValue({ success: true, remaining: 4 })
    mocks.mockRpc.mockResolvedValue({ data: [baseInvite], error: null })

    const mockMemberInsert = vi.fn().mockResolvedValue({ data: null, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return { insert: mockMemberInsert }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }
    })

    mocks.mockAdminAuth.admin.listUsers.mockResolvedValue({ data: { users: [] } })
    mocks.mockAdminAuth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'new-user-id' } },
      error: null,
    })
    mocks.mockAdminAuth.signInWithPassword.mockResolvedValue({
      data: { session: 'mock-session' },
      error: null,
    })

    const req = makeRequest({ token: 'valid-token', password: 'password1', name: 'Bob' })
    await POST(req)

    expect(mockMemberInsert).toHaveBeenCalledWith(
      expect.objectContaining({ linkedin_url: null })
    )
  })

  it('returns success with redirectTo on valid accept', async () => {
    mocks.mockRateLimit.mockReturnValue({ success: true, remaining: 4 })

    mocks.mockRpc.mockResolvedValue({ data: [baseInvite], error: null })

    const mockMemberInsert = vi.fn().mockResolvedValue({ data: null, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return { insert: mockMemberInsert }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }
    })

    mocks.mockAdminAuth.admin.listUsers.mockResolvedValue({ data: { users: [] } })
    mocks.mockAdminAuth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'new-user-id' } },
      error: null,
    })
    mocks.mockAdminAuth.signInWithPassword.mockResolvedValue({
      data: { session: 'mock-session' },
      error: null,
    })

    const req = makeRequest({ token: 'valid-token', password: 'password1', name: 'Bob' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.redirectTo).toBeDefined()
  })
})
