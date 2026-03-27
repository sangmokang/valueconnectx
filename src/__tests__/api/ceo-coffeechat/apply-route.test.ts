import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockGetUser = vi.fn()
  const mockServerClient = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }
  return {
    mockFrom,
    mockGetUser,
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

import { POST } from '@/app/api/ceo-coffeechat/[id]/apply/route'

const SESSION_ID = 'sess-abc-123'
const MEMBER_USER = { id: 'member-user-1', email: 'member@example.com' }
const HOST_USER_ID = 'host-user-99'

function makePostRequest(id = SESSION_ID, body: Record<string, unknown> = {}) {
  return new NextRequest(`http://localhost/api/ceo-coffeechat/${id}/apply`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeParams(id = SESSION_ID) {
  return { params: Promise.resolve({ id }) }
}

const openSession = {
  id: SESSION_ID,
  status: 'open',
  host_id: HOST_USER_ID,
  title: '테스트 커피챗 세션',
}

describe('POST /api/ceo-coffeechat/[id]/apply', () => {
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
    expect(body.error).toBe('VCX 멤버만 신청할 수 있습니다')
  })

  it('returns 404 when session does not exist', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: MEMBER_USER }, error: null })

    let callCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: MEMBER_USER.id, is_active: true }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'vcx_ceo_coffee_sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await POST(makePostRequest(), makeParams())

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('세션을 찾을 수 없습니다')
  })

  it('returns 400 when session status is not open', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: MEMBER_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: MEMBER_USER.id, is_active: true }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'vcx_ceo_coffee_sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...openSession, status: 'closed' },
                error: null,
              }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await POST(makePostRequest(), makeParams())

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('신청이 마감된 세션입니다')
  })

  it('returns 400 when user tries to apply to their own session', async () => {
    const hostAsUser = { id: HOST_USER_ID, email: 'host@example.com' }
    mocks.mockGetUser.mockResolvedValue({ data: { user: hostAsUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: HOST_USER_ID, is_active: true }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'vcx_ceo_coffee_sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: openSession, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await POST(makePostRequest(), makeParams())

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('본인이 주최한 세션에는 신청할 수 없습니다')
  })

  it('returns 409 when user has already applied to the session', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: MEMBER_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: MEMBER_USER.id, is_active: true }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'vcx_ceo_coffee_sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: openSession, error: null }),
            }),
          }),
        }
      }
      if (table === 'vcx_coffee_applications') {
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

    const res = await POST(makePostRequest(), makeParams())

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('이미 신청한 세션입니다')
  })

  it('creates application and returns 201 on success', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: MEMBER_USER }, error: null })

    const newApplication = {
      id: 'app-new-1',
      session_id: SESSION_ID,
      applicant_id: MEMBER_USER.id,
      message: '참여하고 싶습니다',
      status: 'pending',
    }

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: MEMBER_USER.id, is_active: true }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'vcx_ceo_coffee_sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: openSession, error: null }),
            }),
          }),
        }
      }
      if (table === 'vcx_coffee_applications') {
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

    const res = await POST(makePostRequest(SESSION_ID, { message: '참여하고 싶습니다' }), makeParams())

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.id).toBe('app-new-1')
    expect(body.data.applicant_id).toBe(MEMBER_USER.id)
  })

  it('creates application without message when message is omitted', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: MEMBER_USER }, error: null })

    const newApplication = {
      id: 'app-new-2',
      session_id: SESSION_ID,
      applicant_id: MEMBER_USER.id,
      message: null,
    }

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: MEMBER_USER.id, is_active: true }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'vcx_ceo_coffee_sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: openSession, error: null }),
            }),
          }),
        }
      }
      if (table === 'vcx_coffee_applications') {
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

    const res = await POST(makePostRequest(SESSION_ID, {}), makeParams())

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.message).toBeNull()
  })

  it('fires host notification after successful application', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: MEMBER_USER }, error: null })

    const newApplication = {
      id: 'app-new-3',
      session_id: SESSION_ID,
      applicant_id: MEMBER_USER.id,
      message: null,
    }

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: MEMBER_USER.id, is_active: true }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'vcx_ceo_coffee_sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: openSession, error: null }),
            }),
          }),
        }
      }
      if (table === 'vcx_coffee_applications') {
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

    await POST(makePostRequest(), makeParams())

    expect(mocks.mockSendNotification).toHaveBeenCalledWith(
      HOST_USER_ID,
      'coffeechat_applied',
      expect.objectContaining({ title: '새로운 커피챗 신청이 도착했습니다' })
    )
  })

  it('returns 500 when application insert fails for non-duplicate reason', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: MEMBER_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: MEMBER_USER.id, is_active: true }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'vcx_ceo_coffee_sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: openSession, error: null }),
            }),
          }),
        }
      }
      if (table === 'vcx_coffee_applications') {
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

    const res = await POST(makePostRequest(), makeParams())

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('신청에 실패했습니다')
  })

  it('returns 400 when message exceeds 1000 characters', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: MEMBER_USER }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: MEMBER_USER.id, is_active: true }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'vcx_ceo_coffee_sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: openSession, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const longMessage = 'a'.repeat(1001)
    const res = await POST(makePostRequest(SESSION_ID, { message: longMessage }), makeParams())

    expect(res.status).toBe(400)
  })
})
