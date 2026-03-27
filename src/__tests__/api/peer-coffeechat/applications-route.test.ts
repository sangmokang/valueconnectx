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

import { GET } from '@/app/api/peer-coffeechat/[id]/applications/route'

const CHAT_ID = 'chat-abc-123'
const AUTHOR_USER = { id: 'author-user-1', email: 'author@example.com' }
const OTHER_USER = { id: 'other-user-2', email: 'other@example.com' }

function makeGetRequest(id = CHAT_ID) {
  return new NextRequest(`http://localhost/api/peer-coffeechat/${id}/applications`)
}

function makeParams(id = CHAT_ID) {
  return { params: Promise.resolve({ id }) }
}

function mockActiveMember(userId: string) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: userId }, error: null }),
        }),
      }),
    }),
  }
}

describe('GET /api/peer-coffeechat/[id]/applications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'not auth' } })

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when user is not an active VCX member', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHOR_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 접근할 수 있습니다')
  })

  it('returns 403 when user is not the chat author', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: OTHER_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember(OTHER_USER.id)
      if (table === 'peer_coffee_chats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { author_id: AUTHOR_USER.id }, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('작성자만 신청 목록을 확인할 수 있습니다')
  })

  it('returns 200 with applications and applicant profiles when user is the author', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHOR_USER }, error: null })

    const applications = [
      {
        id: 'app-1',
        chat_id: CHAT_ID,
        applicant_id: 'applicant-user-1',
        message: '신청합니다',
        status: 'pending',
        applicant: { id: 'applicant-user-1', name: '이신청자', member_tier: 'core' },
      },
    ]

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember(AUTHOR_USER.id)
      if (table === 'peer_coffee_chats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { author_id: AUTHOR_USER.id }, error: null }),
            }),
          }),
        }
      }
      if (table === 'peer_coffee_applications') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: applications, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].applicant).toBeDefined()
  })
})
