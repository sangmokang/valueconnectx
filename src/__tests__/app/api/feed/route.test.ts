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

import { GET } from '@/app/api/feed/route'

const USER = { id: 'member-1' }

function makeRequest(url = 'http://localhost/api/feed') {
  return new NextRequest(url, { method: 'GET' })
}

function makeFeedBuilder(items: object[], count = items.length) {
  return {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: items, error: null, count }),
  }
}

function makeResponsesBuilder(responses: object[]) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: responses, error: null }),
  }
}

describe('GET /api/feed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetVcxUser.mockResolvedValue(USER)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetVcxUser.mockResolvedValue(null)

    const res = await GET(makeRequest())

    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid pagination', async () => {
    const res = await GET(makeRequest('http://localhost/api/feed?limit=1000'))

    expect(res.status).toBe(400)
  })

  it('filters by comma-separated interest tags and merges user responses', async () => {
    const items = [
      {
        id: 'feed-1',
        company: '토스',
        role: 'Head of Product',
        tags: ['핀테크 B2B', 'Product'],
      },
      {
        id: 'feed-2',
        company: 'Northstar AI',
        role: 'Engineering Manager',
        tags: ['AI / ML'],
      },
    ]
    const feedBuilder = makeFeedBuilder(items)
    const responsesBuilder = makeResponsesBuilder([
      { feed_item_id: 'feed-2', response: 'yes' },
    ])

    mockServerClient.from.mockImplementation((table: string) => {
      if (table === 'vcx_feed_items') return feedBuilder
      if (table === 'vcx_feed_responses') return responsesBuilder
      throw new Error(`Unexpected table: ${table}`)
    })

    const res = await GET(makeRequest('http://localhost/api/feed?limit=10&tags=%ED%95%80%ED%85%8C%ED%81%AC%20B2B,AI%20%2F%20ML'))

    expect(res.status).toBe(200)
    expect(feedBuilder.overlaps).toHaveBeenCalledWith('tags', ['핀테크 B2B', 'AI / ML'])
    expect(feedBuilder.range).toHaveBeenCalledWith(0, 9)
    expect(responsesBuilder.eq).toHaveBeenCalledWith('user_id', USER.id)
    expect(responsesBuilder.in).toHaveBeenCalledWith('feed_item_id', ['feed-1', 'feed-2'])

    const json = await res.json()
    expect(json.data).toEqual([
      { ...items[0], user_response: null },
      { ...items[1], user_response: 'yes' },
    ])
    expect(json.total).toBe(2)
  })

  it('does not query responses when no feed items match', async () => {
    const feedBuilder = makeFeedBuilder([], 0)
    mockServerClient.from.mockReturnValue(feedBuilder)

    const res = await GET(makeRequest('http://localhost/api/feed?tags=%EC%97%86%EB%8A%94%ED%83%9C%EA%B7%B8'))

    expect(res.status).toBe(200)
    expect(mockServerClient.from).toHaveBeenCalledTimes(1)
    const json = await res.json()
    expect(json.data).toEqual([])
  })
})
