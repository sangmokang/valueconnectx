import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/auth/callback/route'

const { mockExchangeCodeForSession, mockGetUser, mockServerFrom, mockAdminFrom } = vi.hoisted(() => ({
  mockExchangeCodeForSession: vi.fn(),
  mockGetUser: vi.fn(),
  mockServerFrom: vi.fn(),
  mockAdminFrom: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      getUser: mockGetUser,
    },
    from: mockServerFrom,
  })),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}))

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exchanges code and redirects to sanitized next path', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })
    const request = new NextRequest('http://localhost/auth/callback?code=abc&next=/community')

    const response = await GET(request)

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('abc')
    expect(response.headers.get('location')).toBe('http://localhost/community')
  })

  it('creates member from pending invite for signup magic link', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1',
          email: 'Invitee@Example.com',
          user_metadata: { name: '홍길동' },
        },
      },
      error: null,
    })

    mockServerFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })

    const inviteQuery = {
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'invite-1',
          email: 'invitee@example.com',
          member_tier: 'core',
          invited_by: 'admin-1',
          invited_by_name: '관리자',
          recommendation_id: null,
          expires_at: '2099-01-01T00:00:00.000Z',
        },
        error: null,
      }),
    }
    const memberInsert = vi.fn().mockResolvedValue({ error: null })
    const inviteUpdateEq = vi.fn().mockResolvedValue({ error: null })
    let inviteCalls = 0

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'vcx_invites') {
        inviteCalls += 1
        return inviteCalls === 1
          ? inviteQuery
          : { update: vi.fn().mockReturnValue({ eq: inviteUpdateEq }) }
      }
      if (table === 'vcx_members') return { insert: memberInsert }
      return {}
    })

    const request = new NextRequest('http://localhost/auth/callback?code=abc&next=/onboarding&type=signup')

    const response = await GET(request)

    expect(memberInsert).toHaveBeenCalledWith(expect.objectContaining({
      id: 'user-1',
      name: '홍길동',
      email: 'invitee@example.com',
      member_tier: 'core',
    }))
    expect(inviteUpdateEq).toHaveBeenCalledWith('id', 'invite-1')
    expect(response.headers.get('location')).toBe('http://localhost/onboarding')
  })

  it('redirects to login when callback code is missing', async () => {
    const request = new NextRequest('http://localhost/auth/callback?next=https://evil.test')

    const response = await GET(request)

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toBe('http://localhost/login?error=magic-link')
  })
})
