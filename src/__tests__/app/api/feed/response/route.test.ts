import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetVcxUser, mockServerClient } = vi.hoisted(() => {
  const mockGetVcxUser = vi.fn()
  const mockServerClient = {
    from: vi.fn(),
  }

  return { mockGetVcxUser, mockServerClient }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockServerClient),
}))

vi.mock('@/lib/auth/get-vcx-user', () => ({
  getVcxUser: mockGetVcxUser,
}))

import { DELETE, POST } from '@/app/api/feed/[id]/response/route'

const USER = { id: 'member-1' }

function makePostRequest(body: object) {
  return new NextRequest('http://localhost/api/feed/feed-1/response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function params(id = 'feed-1') {
  return { params: Promise.resolve({ id }) }
}

describe('POST /api/feed/[id]/response', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetVcxUser.mockResolvedValue(USER)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetVcxUser.mockResolvedValue(null)

    const res = await POST(makePostRequest({ response: 'yes' }), params())

    expect(res.status).toBe(401)
  })

  it('returns 400 for an invalid response value', async () => {
    const res = await POST(makePostRequest({ response: 'maybe' }), params())

    expect(res.status).toBe(400)
  })

  it('upserts the authenticated user response for a feed item', async () => {
    const saved = {
      id: 'response-1',
      user_id: USER.id,
      feed_item_id: 'feed-1',
      response: 'yes',
    }
    const builder = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: saved, error: null }),
    }
    mockServerClient.from.mockReturnValue(builder)

    const res = await POST(makePostRequest({ response: 'yes' }), params())

    expect(res.status).toBe(200)
    expect(mockServerClient.from).toHaveBeenCalledWith('vcx_feed_responses')
    expect(builder.upsert).toHaveBeenCalledWith(
      { user_id: USER.id, feed_item_id: 'feed-1', response: 'yes' },
      { onConflict: 'user_id,feed_item_id' }
    )
    await expect(res.json()).resolves.toEqual({ data: saved })
  })
})

describe('DELETE /api/feed/[id]/response', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetVcxUser.mockResolvedValue(USER)
  })

  it('deletes only the authenticated user response for a feed item', async () => {
    const builder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    mockServerClient.from.mockReturnValue(builder)

    const res = await DELETE(
      new NextRequest('http://localhost/api/feed/feed-1/response'),
      params()
    )

    expect(res.status).toBe(200)
    expect(mockServerClient.from).toHaveBeenCalledWith('vcx_feed_responses')
    expect(builder.eq).toHaveBeenCalledWith('user_id', USER.id)
    expect(builder.eq).toHaveBeenCalledWith('feed_item_id', 'feed-1')
    await expect(res.json()).resolves.toEqual({ success: true })
  })
})
