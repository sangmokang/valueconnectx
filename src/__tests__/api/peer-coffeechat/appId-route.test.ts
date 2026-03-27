import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  const mockAdminFrom = vi.fn()
  const mockAdminClient = {
    from: mockAdminFrom,
  }
  const mockServerClient = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }
  return {
    mockGetUser,
    mockFrom,
    mockAdminFrom,
    mockAdminClient,
    mockServerClient,
    createClient: vi.fn(async () => mockServerClient),
    createAdminClient: vi.fn(() => mockAdminClient),
    mockSendNotification: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))

vi.mock('@/lib/notification', () => ({
  sendNotification: mocks.mockSendNotification,
}))

import { PUT } from '@/app/api/peer-coffeechat/[id]/applications/[appId]/route'

const CHAT_ID = 'chat-abc-123'
const APP_ID = 'app-xyz-456'
const AUTHOR_USER = { id: 'author-user-1', email: 'author@example.com' }
const OTHER_USER = { id: 'other-user-2', email: 'other@example.com' }
const APPLICANT_ID = 'applicant-user-3'

function makePutRequest(
  chatId = CHAT_ID,
  appId = APP_ID,
  body: Record<string, unknown> = { status: 'accepted' }
) {
  return new NextRequest(
    `http://localhost/api/peer-coffeechat/${chatId}/applications/${appId}`,
    {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
}

function makeParams(chatId = CHAT_ID, appId = APP_ID) {
  return { params: Promise.resolve({ id: chatId, appId }) }
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

const existingChat = {
  id: CHAT_ID,
  author_id: AUTHOR_USER.id,
  title: '테스트 커피챗',
}

const existingApplication = {
  id: APP_ID,
  chat_id: CHAT_ID,
  applicant_id: APPLICANT_ID,
  status: 'pending',
}

describe('PUT /api/peer-coffeechat/[id]/applications/[appId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockSendNotification.mockResolvedValue(undefined)
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'not auth' } })

    const res = await PUT(makePutRequest(), makeParams())

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

    const res = await PUT(makePutRequest(), makeParams())

    expect(res.status).toBe(403)
  })

  it('returns 403 when user is not the chat author', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: OTHER_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember(OTHER_USER.id)
      if (table === 'peer_coffee_chats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingChat, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await PUT(makePutRequest(), makeParams())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('작성자만 신청을 처리할 수 있습니다')
  })

  it('returns 400 for invalid status value', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHOR_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember(AUTHOR_USER.id)
      if (table === 'peer_coffee_chats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingChat, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await PUT(makePutRequest(CHAT_ID, APP_ID, { status: 'pending' }), makeParams())

    expect(res.status).toBe(400)
  })

  it('returns 200 and accepts application with contact email', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHOR_USER }, error: null })

    const acceptedApplication = { ...existingApplication, status: 'accepted' }

    let callCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember(AUTHOR_USER.id)
      if (table === 'peer_coffee_chats') {
        callCount++
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingChat, error: null }),
            }),
          }),
        }
      }
      if (table === 'peer_coffee_applications') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: acceptedApplication, error: null }),
                }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    mocks.mockAdminFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { email: 'applicant@example.com' }, error: null }),
        }),
      }),
    }))

    const res = await PUT(makePutRequest(CHAT_ID, APP_ID, { status: 'accepted' }), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('accepted')
    expect(body.data.contact_email).toBe('applicant@example.com')
  })

  it('returns 200 and rejects application with null contact email', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHOR_USER }, error: null })

    const rejectedApplication = { ...existingApplication, status: 'rejected' }

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember(AUTHOR_USER.id)
      if (table === 'peer_coffee_chats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingChat, error: null }),
            }),
          }),
        }
      }
      if (table === 'peer_coffee_applications') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: rejectedApplication, error: null }),
                }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await PUT(makePutRequest(CHAT_ID, APP_ID, { status: 'rejected' }), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('rejected')
    expect(body.data.contact_email).toBeNull()
  })

  it('returns 500 when DB update fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHOR_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember(AUTHOR_USER.id)
      if (table === 'peer_coffee_chats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingChat, error: null }),
            }),
          }),
        }
      }
      if (table === 'peer_coffee_applications') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: { message: 'update failed' } }),
                }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await PUT(makePutRequest(), makeParams())

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('신청 처리에 실패했습니다')
  })
})
