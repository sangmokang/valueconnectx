import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetUser, mockFrom } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  return { mockGetUser, mockFrom }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

import { GET, PATCH } from '@/app/api/notifications/route'

function makeQueryBuilder(resolvedValue: unknown) {
  const b: Record<string, unknown> = {}
  const returnSelf = () => b
  b.select = vi.fn().mockImplementation(returnSelf)
  b.eq = vi.fn().mockImplementation(returnSelf)
  b.in = vi.fn().mockImplementation(returnSelf)
  b.order = vi.fn().mockImplementation(returnSelf)
  b.limit = vi.fn().mockResolvedValue(resolvedValue)
  b.update = vi.fn().mockImplementation(returnSelf)
  return b
}

describe('GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns notifications and unread count', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const notifications = [
      { id: 'n1', is_read: false, title: '알림1' },
      { id: 'n2', is_read: true, title: '알림2' },
    ]
    const builder = makeQueryBuilder({ data: notifications, error: null })
    mockFrom.mockReturnValue(builder)

    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.unreadCount).toBe(1)
  })

  it('returns 500 on DB error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const builder = makeQueryBuilder({ data: null, error: new Error('db error') })
    mockFrom.mockReturnValue(builder)

    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('PATCH /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makePatchRequest(body: unknown) {
    return new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    })
  }

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const res = await PATCH(makePatchRequest({ markAllRead: true }))
    expect(res.status).toBe(401)
  })

  it('marks all read when markAllRead is true', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    // Route does: .update({is_read:true}).eq('user_id', id).eq('is_read', false)
    // Need chainable eq that on second call resolves
    const innerB: Record<string, unknown> = {}
    innerB.eq = vi.fn().mockResolvedValue({ error: null })
    const outerB: Record<string, unknown> = {}
    outerB.update = vi.fn().mockReturnValue(outerB)
    outerB.eq = vi.fn().mockReturnValue(innerB)
    mockFrom.mockReturnValue(outerB)

    const res = await PATCH(makePatchRequest({ markAllRead: true }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('returns 400 when body is missing required fields', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const res = await PATCH(makePatchRequest({ foo: 'bar' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when body is invalid JSON', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const req = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })
})
