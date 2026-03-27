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

import { GET, POST } from '@/app/api/peer-coffeechat/route'

const AUTHED_USER = { id: 'member-user-1', email: 'member@example.com' }

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/peer-coffeechat')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/peer-coffeechat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function mockActiveMember() {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: AUTHED_USER.id }, error: null }),
        }),
      }),
    }),
  }
}

describe('GET /api/peer-coffeechat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'not auth' } })

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when user is not an active VCX member', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null })

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

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 접근할 수 있습니다')
  })

  it('returns 200 with paginated chats and author profile on success', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null })

    const chats = [
      {
        id: 'chat-1',
        title: '커리어 조언 구합니다',
        content: '5년차 개발자입니다',
        author: { id: AUTHED_USER.id, name: '김멤버', member_tier: 'core' },
      },
    ]

    const mockRange = vi.fn().mockResolvedValue({ data: chats, error: null, count: 1 })
    const mockOrder = vi.fn().mockReturnValue({ range: mockRange })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember()
      if (table === 'peer_coffee_chats') return { select: mockSelect }
      return {}
    })

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.limit).toBe(20)
  })

  it('filters by category when category param is provided', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null })

    const mockEq = vi.fn()
    const chainable = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      eq: mockEq,
      then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: [], error: null, count: 0 })),
    }
    mockEq.mockReturnValue(chainable)

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember()
      if (table === 'peer_coffee_chats') return chainable
      return {}
    })

    const res = await GET(makeGetRequest({ category: 'career' }))

    expect(res.status).toBe(200)
    expect(mockEq).toHaveBeenCalledWith('category', 'career')
  })

  it('filters by status when status param is provided', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null })

    const mockEq = vi.fn()
    const chainable = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      eq: mockEq,
      then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: [], error: null, count: 0 })),
    }
    mockEq.mockReturnValue(chainable)

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember()
      if (table === 'peer_coffee_chats') return chainable
      return {}
    })

    const res = await GET(makeGetRequest({ status: 'open' }))

    expect(res.status).toBe(200)
    expect(mockEq).toHaveBeenCalledWith('status', 'open')
  })

  it('returns 500 when DB query fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null })

    const mockRange = vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' }, count: null })
    const mockOrder = vi.fn().mockReturnValue({ range: mockRange })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember()
      if (table === 'peer_coffee_chats') return { select: mockSelect }
      return {}
    })

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('목록 조회에 실패했습니다')
  })
})

describe('POST /api/peer-coffeechat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'not auth' } })

    const res = await POST(makePostRequest({ title: '제목', content: '내용' }))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when user is not an active VCX member', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null })

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

    const res = await POST(makePostRequest({ title: '제목', content: '내용' }))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 접근할 수 있습니다')
  })

  it('returns 400 when title is missing', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null })
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember()
      return {}
    })

    const res = await POST(makePostRequest({ content: '내용만 있습니다' }))

    expect(res.status).toBe(400)
  })

  it('returns 400 when content is missing', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null })
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember()
      return {}
    })

    const res = await POST(makePostRequest({ title: '제목만 있습니다' }))

    expect(res.status).toBe(400)
  })

  it('returns 201 and creates chat with correct author_id', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null })

    const createdChat = {
      id: 'chat-new-1',
      author_id: AUTHED_USER.id,
      title: '커리어 조언 구합니다',
      content: '5년차 개발자입니다',
      category: 'career',
      status: 'open',
    }

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember()
      if (table === 'peer_coffee_chats') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: createdChat, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await POST(makePostRequest({ title: '커리어 조언 구합니다', content: '5년차 개발자입니다', category: 'career' }))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.author_id).toBe(AUTHED_USER.id)
    expect(body.data.id).toBe('chat-new-1')
  })

  it('returns 201 with default category general when category is omitted', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null })

    const createdChat = {
      id: 'chat-new-2',
      author_id: AUTHED_USER.id,
      title: '제목',
      content: '내용',
      category: 'general',
      status: 'open',
    }

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember()
      if (table === 'peer_coffee_chats') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: createdChat, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await POST(makePostRequest({ title: '제목', content: '내용' }))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.category).toBe('general')
    expect(body.data.status).toBe('open')
  })

  it('returns 500 when DB insert fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return mockActiveMember()
      if (table === 'peer_coffee_chats') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await POST(makePostRequest({ title: '제목', content: '내용' }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('글 작성에 실패했습니다')
  })
})
