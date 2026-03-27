import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockAdminFrom = vi.fn()
  const mockAdminAuth = {
    admin: { getUserById: vi.fn() },
  }
  const mockAdminClient = {
    from: mockAdminFrom,
    auth: mockAdminAuth,
  }

  const mockFrom = vi.fn()
  const mockGetUser = vi.fn()
  const mockServerClient = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }

  return {
    mockAdminFrom,
    mockAdminAuth,
    mockAdminClient,
    mockFrom,
    mockGetUser,
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

import { PUT } from '@/app/api/ceo-coffeechat/[id]/applications/[appId]/route'

const SESSION_ID = 'sess-abc-123'
const APP_ID = 'app-xyz-456'
const HOST_USER = { id: 'host-user-1', email: 'host@example.com' }
const OTHER_USER = { id: 'other-user-2', email: 'other@example.com' }
const APPLICANT_ID = 'applicant-user-3'

function makePutRequest(
  sessionId = SESSION_ID,
  appId = APP_ID,
  body: Record<string, unknown> = { status: 'accepted' }
) {
  return new NextRequest(
    `http://localhost/api/ceo-coffeechat/${sessionId}/applications/${appId}`,
    {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
}

function makeParams(sessionId = SESSION_ID, appId = APP_ID) {
  return { params: Promise.resolve({ id: sessionId, appId }) }
}

const existingSession = {
  id: SESSION_ID,
  host_id: HOST_USER.id,
  title: '테스트 커피챗',
}

const existingApplication = {
  id: APP_ID,
  applicant_id: APPLICANT_ID,
  status: 'accepted',
}

describe('PUT /api/ceo-coffeechat/[id]/applications/[appId]', () => {
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

  it('returns 404 when session does not exist', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }))

    const res = await PUT(makePutRequest(), makeParams())

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('세션을 찾을 수 없습니다')
  })

  it('returns 403 when caller is not the session host', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: OTHER_USER }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: existingSession, error: null }),
        }),
      }),
    }))

    const res = await PUT(makePutRequest(), makeParams())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('호스트만 신청을 처리할 수 있습니다')
  })

  it('returns 400 when request body is invalid JSON', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: existingSession, error: null }),
        }),
      }),
    }))

    const req = new NextRequest(
      `http://localhost/api/ceo-coffeechat/${SESSION_ID}/applications/${APP_ID}`,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: 'not-json{{{',
      }
    )
    const res = await PUT(req, makeParams())

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청 형식입니다')
  })

  it('returns 400 when status value is not accepted or rejected', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: existingSession, error: null }),
        }),
      }),
    }))

    const res = await PUT(makePutRequest(SESSION_ID, APP_ID, { status: 'pending' }), makeParams())

    expect(res.status).toBe(400)
  })

  it('returns 400 when status field is missing', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: existingSession, error: null }),
        }),
      }),
    }))

    const res = await PUT(makePutRequest(SESSION_ID, APP_ID, {}), makeParams())

    expect(res.status).toBe(400)
  })

  it('accepts application and returns updated data with null contact_email for rejected', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    const rejectedApplication = { ...existingApplication, status: 'rejected' }

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // select session for host check
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingSession, error: null }),
            }),
          }),
        }
      }
      // update application
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
    })

    const res = await PUT(makePutRequest(SESSION_ID, APP_ID, { status: 'rejected' }), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('rejected')
    expect(body.data.contact_email).toBeNull()
  })

  it('returns contact_email when application is accepted', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    const acceptedApplication = { ...existingApplication, status: 'accepted' }

    let callCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      callCount++
      if (callCount === 1) {
        // select session for host check
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingSession, error: null }),
            }),
          }),
        }
      }
      if (table === 'vcx_coffee_applications' || callCount === 2) {
        // update application
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
      // admin client from: vcx_members select email
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { email: 'applicant@example.com' }, error: null }),
          }),
        }),
      }
    })

    mocks.mockAdminFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { email: 'applicant@example.com' }, error: null }),
        }),
      }),
    }))

    const res = await PUT(makePutRequest(SESSION_ID, APP_ID, { status: 'accepted' }), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('accepted')
    expect(body.data.contact_email).toBe('applicant@example.com')
  })

  it('sends accepted notification to applicant when accepted', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    const acceptedApplication = { ...existingApplication, status: 'accepted' }

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingSession, error: null }),
            }),
          }),
        }
      }
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
    })

    mocks.mockAdminFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { email: 'applicant@example.com' }, error: null }),
        }),
      }),
    }))

    await PUT(makePutRequest(SESSION_ID, APP_ID, { status: 'accepted' }), makeParams())

    expect(mocks.mockSendNotification).toHaveBeenCalledWith(
      APPLICANT_ID,
      'coffeechat_accepted',
      expect.objectContaining({ title: '커피챗 신청이 수락되었습니다' })
    )
  })

  it('sends rejected notification to applicant when rejected', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    const rejectedApplication = { ...existingApplication, status: 'rejected' }

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingSession, error: null }),
            }),
          }),
        }
      }
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
    })

    await PUT(makePutRequest(SESSION_ID, APP_ID, { status: 'rejected' }), makeParams())

    expect(mocks.mockSendNotification).toHaveBeenCalledWith(
      APPLICANT_ID,
      'coffeechat_rejected',
      expect.objectContaining({ title: '커피챗 신청이 거절되었습니다' })
    )
  })

  it('returns 500 when application update fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingSession, error: null }),
            }),
          }),
        }
      }
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'update failed' },
                }),
              }),
            }),
          }),
        }),
      }
    })

    const res = await PUT(makePutRequest(), makeParams())

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('신청 처리에 실패했습니다')
  })

  it('does not fetch contact_email via admin client when status is rejected', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    const rejectedApplication = { ...existingApplication, status: 'rejected' }

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingSession, error: null }),
            }),
          }),
        }
      }
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
    })

    await PUT(makePutRequest(SESSION_ID, APP_ID, { status: 'rejected' }), makeParams())

    expect(mocks.mockAdminFrom).not.toHaveBeenCalled()
  })
})
