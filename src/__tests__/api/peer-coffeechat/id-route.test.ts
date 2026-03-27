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

import { GET, PUT, DELETE } from '@/app/api/peer-coffeechat/[id]/route'

const CHAT_ID = 'chat-abc-123'
const AUTHOR_USER = { id: 'author-user-1', email: 'author@example.com' }
const OTHER_USER = { id: 'other-user-2', email: 'other@example.com' }

function makeGetRequest(id = CHAT_ID) {
  return new NextRequest(`http://localhost/api/peer-coffeechat/${id}`)
}

function makePutRequest(id = CHAT_ID, body: Record<string, unknown> = {}) {
  return new NextRequest(`http://localhost/api/peer-coffeechat/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeDeleteRequest(id = CHAT_ID) {
  return new NextRequest(`http://localhost/api/peer-coffeechat/${id}`, {
    method: 'DELETE',
  })
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

const existingChat = {
  id: CHAT_ID,
  author_id: AUTHOR_USER.id,
  title: '테스트 커피챗',
  content: '테스트 내용입니다',
  category: 'general',
  status: 'open',
  author: { id: AUTHOR_USER.id, name: '김작성자', member_tier: 'core' },
}

describe('GET /api/peer-coffeechat/[id]', () => {
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

  it('returns 404 when chat is not found', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHOR_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember(AUTHOR_USER.id)
      if (table === 'peer_coffee_chats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('글을 찾을 수 없습니다')
  })

  it('returns 200 with chat data and author profile', async () => {
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

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe(CHAT_ID)
    expect(body.data.author).toBeDefined()
  })
})

describe('PUT /api/peer-coffeechat/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'not auth' } })

    const res = await PUT(makePutRequest(), makeParams())

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when user is not the author', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: OTHER_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
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

    const res = await PUT(makePutRequest(CHAT_ID, { title: '수정된 제목' }), makeParams())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('수정 권한이 없습니다')
  })

  it('returns 400 for invalid status value', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHOR_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
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

    const res = await PUT(makePutRequest(CHAT_ID, { status: 'invalid_status' }), makeParams())

    expect(res.status).toBe(400)
  })

  it('returns 200 and updates chat fields', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHOR_USER }, error: null })

    const updatedChat = { ...existingChat, title: '수정된 제목', status: 'closed' }

    let callCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'peer_coffee_chats') {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { author_id: AUTHOR_USER.id }, error: null }),
              }),
            }),
          }
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedChat, error: null }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await PUT(makePutRequest(CHAT_ID, { title: '수정된 제목', status: 'closed' }), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.title).toBe('수정된 제목')
  })
})

describe('DELETE /api/peer-coffeechat/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'not auth' } })

    const res = await DELETE(makeDeleteRequest(), makeParams())

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when user is not the author', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: OTHER_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
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

    const res = await DELETE(makeDeleteRequest(), makeParams())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('삭제 권한이 없습니다')
  })

  it('returns 200 when chat is successfully deleted', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHOR_USER }, error: null })

    let callCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'peer_coffee_chats') {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { author_id: AUTHOR_USER.id }, error: null }),
              }),
            }),
          }
        }
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      return {}
    })

    const res = await DELETE(makeDeleteRequest(), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('returns 500 when DB delete fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHOR_USER }, error: null })

    let callCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'peer_coffee_chats') {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { author_id: AUTHOR_USER.id }, error: null }),
              }),
            }),
          }
        }
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: { message: 'delete failed' } }),
          }),
        }
      }
      return {}
    })

    const res = await DELETE(makeDeleteRequest(), makeParams())

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('글 삭제에 실패했습니다')
  })
})
