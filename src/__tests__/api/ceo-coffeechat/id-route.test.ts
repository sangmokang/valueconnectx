import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockRpc = vi.fn()
  const mockFrom = vi.fn()
  const mockGetUser = vi.fn()
  const mockServerClient = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  }
  return {
    mockRpc,
    mockFrom,
    mockGetUser,
    mockServerClient,
    createClient: vi.fn(async () => mockServerClient),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

import { GET, PUT } from '@/app/api/ceo-coffeechat/[id]/route'

const SESSION_ID = 'sess-abc-123'
const HOST_USER = { id: 'host-user-1', email: 'host@example.com' }
const OTHER_USER = { id: 'other-user-2', email: 'other@example.com' }

function makeGetRequest(id = SESSION_ID) {
  return new NextRequest(`http://localhost/api/ceo-coffeechat/${id}`)
}

function makePutRequest(id = SESSION_ID, body: Record<string, unknown> = {}) {
  return new NextRequest(`http://localhost/api/ceo-coffeechat/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeParams(id = SESSION_ID) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/ceo-coffeechat/[id]', () => {
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

  it('returns 404 when session does not exist', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
        }),
      }),
    }))

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('세션을 찾을 수 없습니다')
  })

  it('returns session detail with application_count on success', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    const session = {
      id: SESSION_ID,
      title: '테스트 세션',
      host_id: HOST_USER.id,
      host: { id: HOST_USER.id, name: 'Host Name', title: 'CEO', company: 'Acme', role: 'ceo' },
    }

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: session, error: null }),
        }),
      }),
    }))

    mocks.mockRpc.mockResolvedValue({ data: 4, error: null })

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe(SESSION_ID)
    expect(body.data.application_count).toBe(4)
  })

  it('returns application_count of 0 when RPC returns null', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    const session = { id: SESSION_ID, title: '세션', host_id: HOST_USER.id }

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: session, error: null }),
        }),
      }),
    }))

    mocks.mockRpc.mockResolvedValue({ data: null, error: null })

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.application_count).toBe(0)
  })
})

describe('PUT /api/ceo-coffeechat/[id]', () => {
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

  it('returns 403 when caller is not the host', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: OTHER_USER }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { host_id: HOST_USER.id }, error: null }),
        }),
      }),
    }))

    const res = await PUT(makePutRequest(SESSION_ID, { title: '수정된 제목' }), makeParams())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('수정 권한이 없습니다')
  })

  it('returns 400 when request body is invalid JSON', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { host_id: HOST_USER.id }, error: null }),
        }),
      }),
    }))

    const req = new NextRequest(`http://localhost/api/ceo-coffeechat/${SESSION_ID}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: 'not-json{{{',
    })
    const res = await PUT(req, makeParams())

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청 형식입니다')
  })

  it('returns 400 when status value is invalid', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { host_id: HOST_USER.id }, error: null }),
        }),
      }),
    }))

    const res = await PUT(makePutRequest(SESSION_ID, { status: 'invalid_status' }), makeParams())

    expect(res.status).toBe(400)
  })

  it('returns updated session on successful update by host', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    const updatedSession = { id: SESSION_ID, host_id: HOST_USER.id, title: '수정된 제목', status: 'open' }

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // First call: select host_id for authorization
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { host_id: HOST_USER.id }, error: null }),
            }),
          }),
        }
      }
      // Second call: update
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedSession, error: null }),
            }),
          }),
        }),
      }
    })

    const res = await PUT(makePutRequest(SESSION_ID, { title: '수정된 제목' }), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.title).toBe('수정된 제목')
  })

  it('allows host to update session status to closed', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    const updatedSession = { id: SESSION_ID, host_id: HOST_USER.id, status: 'closed' }

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { host_id: HOST_USER.id }, error: null }),
            }),
          }),
        }
      }
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedSession, error: null }),
            }),
          }),
        }),
      }
    })

    const res = await PUT(makePutRequest(SESSION_ID, { status: 'closed' }), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('closed')
  })

  it('returns 500 when DB update fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { host_id: HOST_USER.id }, error: null }),
            }),
          }),
        }
      }
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'update failed' } }),
            }),
          }),
        }),
      }
    })

    const res = await PUT(makePutRequest(SESSION_ID, { title: '수정' }), makeParams())

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('세션 수정에 실패했습니다')
  })
})
