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
    mockGenerateCoffeechatBrief: vi.fn(),
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

vi.mock('@/lib/ai/brief', () => ({
  generateCoffeechatBrief: mocks.mockGenerateCoffeechatBrief,
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

function mockMemberForAcceptFlow(userId: string) {
  const row = {
    id: userId,
    name: userId === APPLICANT_ID ? '신청자' : '작성자',
    title: 'Product Lead',
    current_company: 'VCX',
    professional_fields: ['Product'],
    member_tier: 'core',
  }
  const chain = {
    eq: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue({ data: row, error: null }),
  }
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn(() => chain),
    }),
  }
}

describe('PUT /api/peer-coffeechat/[id]/applications/[appId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockSendNotification.mockResolvedValue(undefined)
    mocks.mockGenerateCoffeechatBrief.mockResolvedValue({
      hostBrief: '호스트 브리프',
      applicantBrief: '신청자 브리프',
    })
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
    await expect(res.json()).resolves.toEqual(expect.objectContaining({
      error: '신청 상태는 수락 또는 거절만 가능합니다',
    }))
  })

  it('returns 200 and accepts application with contact email', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHOR_USER }, error: null })

    const acceptedApplication = { ...existingApplication, status: 'accepted' }
    const chatStatusUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    const applicationUpdate = vi.fn().mockImplementation(() => {
      const chain = {
        eq: vi.fn(() => chain),
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: acceptedApplication, error: null }),
        }),
      }
      return chain
    })

    let chatSelectCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockMemberForAcceptFlow(AUTHOR_USER.id)
      if (table === 'peer_coffee_chats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() => {
                chatSelectCount += 1
                return Promise.resolve({
                  data: chatSelectCount === 1
                    ? existingChat
                    : {
                        title: existingChat.title,
                        content: '테스트 커피챗 소개',
                        category: 'career',
                        author: {
                          name: '작성자',
                          title: 'CTO',
                          current_company: 'VCX',
                          professional_fields: ['Product'],
                          member_tier: 'core',
                        },
                      },
                  error: null,
                })
              }),
            }),
          }),
          update: chatStatusUpdate,
        }
      }
      if (table === 'peer_coffee_applications') {
        return {
          update: applicationUpdate,
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
    expect(chatStatusUpdate).toHaveBeenCalledWith({ status: 'matched' })

    await vi.waitFor(() => {
      expect(mocks.mockGenerateCoffeechatBrief).toHaveBeenCalled()
      expect(applicationUpdate).toHaveBeenCalledWith(expect.objectContaining({
        host_brief: '호스트 브리프',
        applicant_brief: '신청자 브리프',
        brief_error: null,
      }))
    })
  })

  it('returns 200 even when accepted brief generation fails so fallback can be used later', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHOR_USER }, error: null })
    mocks.mockGenerateCoffeechatBrief.mockRejectedValue(new Error('missing AI key'))

    const acceptedApplication = { ...existingApplication, status: 'accepted' }
    const chatStatusUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    const applicationUpdate = vi.fn().mockImplementation(() => {
      const chain = {
        eq: vi.fn(() => chain),
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: acceptedApplication, error: null }),
        }),
      }
      return chain
    })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    let chatSelectCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockMemberForAcceptFlow(AUTHOR_USER.id)
      if (table === 'peer_coffee_chats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() => {
                chatSelectCount += 1
                return Promise.resolve({
                  data: chatSelectCount === 1
                    ? existingChat
                    : {
                        title: existingChat.title,
                        content: '테스트 커피챗 소개',
                        category: 'career',
                        author: {
                          name: '작성자',
                          title: 'CTO',
                          current_company: 'VCX',
                          professional_fields: ['Product'],
                          member_tier: 'core',
                        },
                      },
                  error: null,
                })
              }),
            }),
          }),
          update: chatStatusUpdate,
        }
      }
      if (table === 'peer_coffee_applications') return { update: applicationUpdate }
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
    expect(chatStatusUpdate).toHaveBeenCalledWith({ status: 'matched' })

    await vi.waitFor(() => {
      expect(mocks.mockGenerateCoffeechatBrief).toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalledWith('Peer brief generation failed:', expect.any(Error))
    })

    errorSpy.mockRestore()
  })

  it('returns 200 even when notification delivery fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHOR_USER }, error: null })
    mocks.mockSendNotification.mockRejectedValue(new Error('notification unavailable'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const acceptedApplication = { ...existingApplication, status: 'accepted' }
    const chatStatusUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    const applicationUpdate = vi.fn().mockImplementation(() => {
      const chain = {
        eq: vi.fn(() => chain),
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: acceptedApplication, error: null }),
        }),
      }
      return chain
    })

    let chatSelectCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockMemberForAcceptFlow(AUTHOR_USER.id)
      if (table === 'peer_coffee_chats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() => {
                chatSelectCount += 1
                return Promise.resolve({
                  data: chatSelectCount === 1
                    ? existingChat
                    : {
                        title: existingChat.title,
                        content: '테스트 커피챗 소개',
                        category: 'career',
                        author: {
                          name: '작성자',
                          title: 'CTO',
                          current_company: 'VCX',
                          professional_fields: ['Product'],
                          member_tier: 'core',
                        },
                      },
                  error: null,
                })
              }),
            }),
          }),
          update: chatStatusUpdate,
        }
      }
      if (table === 'peer_coffee_applications') return { update: applicationUpdate }
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
    expect(errorSpy).toHaveBeenCalledWith('Peer application notification failed:', expect.any(Error))

    await vi.waitFor(() => {
      expect(mocks.mockGenerateCoffeechatBrief).toHaveBeenCalled()
    })

    errorSpy.mockRestore()
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
