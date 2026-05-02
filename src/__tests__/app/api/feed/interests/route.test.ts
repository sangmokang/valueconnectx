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

import { GET, POST } from '@/app/api/feed/interests/route'

const USER = { id: 'member-1' }

function makePostRequest(body: object) {
  return new NextRequest('http://localhost/api/feed/interests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/feed/interests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetVcxUser.mockResolvedValue(USER)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetVcxUser.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
  })

  it('returns saved interest chips for the authenticated user', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { chips: ['핀테크 B2B', 'AI / ML'] },
        error: null,
      }),
    }
    mockServerClient.from.mockReturnValue(builder)

    const res = await GET()

    expect(res.status).toBe(200)
    expect(mockServerClient.from).toHaveBeenCalledWith('vcx_feed_interests')
    expect(builder.eq).toHaveBeenCalledWith('user_id', USER.id)
    await expect(res.json()).resolves.toEqual({ chips: ['핀테크 B2B', 'AI / ML'] })
  })

  it('returns an empty chip list when no interests are stored', async () => {
    const interestsBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    const memberBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { professional_fields: [] },
        error: null,
      }),
    }
    mockServerClient.from.mockImplementation((table: string) => {
      if (table === 'vcx_feed_interests') return interestsBuilder
      if (table === 'vcx_members') return memberBuilder
      throw new Error(`Unexpected table: ${table}`)
    })

    const res = await GET()

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ chips: [] })
  })

  it('falls back to profile professional fields when feed interests are empty', async () => {
    const interestsBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    const memberBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { professional_fields: ['B2B SaaS', 'AI / ML'] },
        error: null,
      }),
    }
    mockServerClient.from.mockImplementation((table: string) => {
      if (table === 'vcx_feed_interests') return interestsBuilder
      if (table === 'vcx_members') return memberBuilder
      throw new Error(`Unexpected table: ${table}`)
    })

    const res = await GET()

    expect(res.status).toBe(200)
    expect(memberBuilder.eq).toHaveBeenCalledWith('id', USER.id)
    await expect(res.json()).resolves.toEqual({ chips: ['B2B SaaS', 'AI / ML'] })
  })
})

describe('POST /api/feed/interests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetVcxUser.mockResolvedValue(USER)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetVcxUser.mockResolvedValue(null)

    const res = await POST(makePostRequest({ chips: ['핀테크 B2B'] }))

    expect(res.status).toBe(401)
  })

  it('returns 400 when more than ten chips are submitted', async () => {
    const res = await POST(makePostRequest({
      chips: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
    }))

    expect(res.status).toBe(400)
  })

  it('upserts trimmed unique chips for the authenticated user', async () => {
    const interestsBuilder = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { chips: ['핀테크 B2B', 'AI / ML'] },
        error: null,
      }),
    }
    const memberBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    mockServerClient.from.mockImplementation((table: string) => {
      if (table === 'vcx_feed_interests') return interestsBuilder
      if (table === 'vcx_members') return memberBuilder
      throw new Error(`Unexpected table: ${table}`)
    })

    const res = await POST(makePostRequest({
      chips: [' 핀테크 B2B ', 'AI / ML', '핀테크 B2B'],
    }))

    expect(res.status).toBe(200)
    expect(interestsBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER.id,
        chips: ['핀테크 B2B', 'AI / ML'],
      }),
      { onConflict: 'user_id' }
    )
    expect(memberBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
      professional_fields: ['핀테크 B2B', 'AI / ML'],
    }))
    expect(memberBuilder.eq).toHaveBeenCalledWith('id', USER.id)
    expect(memberBuilder.eq).toHaveBeenCalledWith('is_active', true)
    await expect(res.json()).resolves.toEqual({ chips: ['핀테크 B2B', 'AI / ML'] })
  })
})
