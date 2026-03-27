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
    mockSendNotification: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/notification', () => ({
  sendNotification: mocks.mockSendNotification,
}))

import { POST } from '@/app/api/peer-coffeechat/[id]/apply/route'

const CHAT_ID = 'chat-abc-123'
const MEMBER_USER = { id: 'member-user-1', email: 'member@example.com' }
const AUTHOR_USER_ID = 'author-user-99'

function makePostRequest(id = CHAT_ID, body: Record<string, unknown> = {}) {
  return new NextRequest(`http://localhost/api/peer-coffeechat/${id}/apply`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeParams(id = CHAT_ID) {
  return { params: Promise.resolve({ id }) }
}

const openChat = {
  id: CHAT_ID,
  author_id: AUTHOR_USER_ID,
  status: 'open',
  title: '테스트 커피챗',
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

describe('POST /api/peer-coffeechat/[id]/apply', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockSendNotification.mockResolvedValue(undefined)
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'not auth' } })

    const res = await POST(makePostRequest(), makeParams())

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when user is not an active VCX member', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: MEMBER_USER }, error: null })

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

    const res = await POST(makePostRequest(), makeParams())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 접근할 수 있습니다')
  })

  it('returns 400 when message is missing', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: MEMBER_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember(MEMBER_USER.id)
      if (table === 'peer_coffee_chats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: openChat, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await POST(makePostRequest(CHAT_ID, {}), makeParams())

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(res.status).toBe(400) // Zod returns type error for missing field
  })

  it('returns 403 when applying to own chat (self-application)', async () => {
    const authorAsUser = { id: AUTHOR_USER_ID, email: 'author@example.com' }
    mocks.mockGetUser.mockResolvedValue({ data: { user: authorAsUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember(AUTHOR_USER_ID)
      if (table === 'peer_coffee_chats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: openChat, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await POST(makePostRequest(CHAT_ID, { message: '신청합니다' }), makeParams())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('본인 글에는 신청할 수 없습니다')
  })

  it('returns 403 when chat status is not open', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: MEMBER_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember(MEMBER_USER.id)
      if (table === 'peer_coffee_chats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { ...openChat, status: 'matched' }, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await POST(makePostRequest(CHAT_ID, { message: '신청합니다' }), makeParams())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('신청이 마감된 글입니다')
  })

  it('returns 409 when user has already applied (duplicate application)', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: MEMBER_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember(MEMBER_USER.id)
      if (table === 'peer_coffee_chats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: openChat, error: null }),
            }),
          }),
        }
      }
      if (table === 'peer_coffee_applications') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '23505', message: 'duplicate key' },
              }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await POST(makePostRequest(CHAT_ID, { message: '신청합니다' }), makeParams())

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('이미 신청하셨습니다')
  })

  it('returns 201 and creates application successfully', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: MEMBER_USER }, error: null })

    const newApplication = {
      id: 'app-new-1',
      chat_id: CHAT_ID,
      applicant_id: MEMBER_USER.id,
      message: '신청합니다',
      status: 'pending',
    }

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember(MEMBER_USER.id)
      if (table === 'peer_coffee_chats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: openChat, error: null }),
            }),
          }),
        }
      }
      if (table === 'peer_coffee_applications') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: newApplication, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await POST(makePostRequest(CHAT_ID, { message: '신청합니다' }), makeParams())

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.applicant_id).toBe(MEMBER_USER.id)
    expect(body.data.id).toBe('app-new-1')
  })

  it('returns 500 when DB insert fails for non-duplicate reason', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: MEMBER_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember(MEMBER_USER.id)
      if (table === 'peer_coffee_chats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: openChat, error: null }),
            }),
          }),
        }
      }
      if (table === 'peer_coffee_applications') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '42000', message: 'generic db error' },
              }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await POST(makePostRequest(CHAT_ID, { message: '신청합니다' }), makeParams())

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('신청에 실패했습니다')
  })
})
