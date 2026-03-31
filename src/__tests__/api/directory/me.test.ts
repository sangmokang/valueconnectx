import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockAuthGetUser = vi.fn()
  const mockServerClient = {
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  }

  return {
    mockFrom,
    mockAuthGetUser,
    mockServerClient,
    createClient: vi.fn(async () => mockServerClient),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
  authLimiter: null,
  apiLimiter: null,
  directoryLimiter: null,
  directoryBurstLimiter: null,
  directoryDailyLimiter: null,
}))

import { GET, PUT } from '@/app/api/directory/me/route'

function makeGetRequest(ip = '127.0.0.1') {
  return new NextRequest('http://localhost/api/directory/me', {
    method: 'GET',
    headers: { 'x-forwarded-for': ip },
  })
}

function makePutRequest(body: Record<string, unknown>, ip = '127.0.0.1') {
  return new NextRequest('http://localhost/api/directory/me', {
    method: 'PUT',
    headers: {
      'x-forwarded-for': ip,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

const baseProfile = {
  id: 'user-id-1',
  name: 'Alice Kim',
  email: 'alice@example.com',
  current_company: 'TechCorp',
  title: 'CTO',
  professional_fields: ['engineering'],
  years_of_experience: 10,
  bio: 'Experienced engineer',
  linkedin_url: 'https://linkedin.com/in/alice',
  member_tier: 'core',
  avatar_url: null,
  join_date: '2024-01-01',
  industry: 'technology',
  location: 'Seoul',
  is_open_to_chat: true,
  profile_visibility: 'members_only',
}

// ──────────────────────────────────────────────────────────────────
// GET /api/directory/me
// ──────────────────────────────────────────────────────────────────

describe('GET /api/directory/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not authenticated' },
    })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 401 when auth returns no user and no error', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('returns 404 when member profile does not exist', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      }),
    })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('프로필을 찾을 수 없습니다')
  })

  it('returns 404 when member is inactive', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    // The query includes .eq('is_active', true) — inactive returns null
    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(404)
  })

  it('returns 200 with full profile data on happy path', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: baseProfile, error: null }),
      }),
    })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toMatchObject({
      id: 'user-id-1',
      name: 'Alice Kim',
      email: 'alice@example.com',
    })
  })

  it('returns profile with all expected fields', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: baseProfile, error: null }),
      }),
    })

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    const expectedFields = [
      'id', 'name', 'email', 'current_company', 'title',
      'professional_fields', 'years_of_experience', 'bio',
      'linkedin_url', 'member_tier', 'avatar_url', 'join_date',
      'industry', 'location', 'is_open_to_chat', 'profile_visibility',
    ]
    for (const field of expectedFields) {
      expect(body.data).toHaveProperty(field)
    }
  })

  it('returns 500 when database throws an unexpected error', async () => {
    mocks.mockAuthGetUser.mockRejectedValue(new Error('unexpected error'))

    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('서버 오류가 발생했습니다')
  })
})

// ──────────────────────────────────────────────────────────────────
// PUT /api/directory/me
// ──────────────────────────────────────────────────────────────────

describe('PUT /api/directory/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not authenticated' },
    })

    const req = makePutRequest({ name: 'Bob' })
    const res = await PUT(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when authenticated user is not a VCX member', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'non-member-id' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })

    const req = makePutRequest({ name: 'Bob' })
    const res = await PUT(req)

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 프로필을 수정할 수 있습니다')
  })

  it('returns 400 when request body fails schema validation', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
      }),
    })

    // years_of_experience must be 0–60; 100 fails validation
    const req = makePutRequest({ years_of_experience: 100 })
    const res = await PUT(req)

    expect(res.status).toBe(400)
  })

  it('returns 400 when linkedin_url is not a valid URL', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
      }),
    })

    const req = makePutRequest({ linkedin_url: 'not-a-url' })
    const res = await PUT(req)

    expect(res.status).toBe(400)
  })

  it('returns 400 when bio exceeds 1000 characters', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
      }),
    })

    const req = makePutRequest({ bio: 'a'.repeat(1001) })
    const res = await PUT(req)

    expect(res.status).toBe(400)
  })

  it('returns 400 when professional_fields has more than 10 items', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
      }),
    })

    const req = makePutRequest({
      professional_fields: Array.from({ length: 11 }, (_, i) => `field-${i}`),
    })
    const res = await PUT(req)

    expect(res.status).toBe(400)
  })

  it('returns 400 when profile_visibility has an invalid value', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
      }),
    })

    const req = makePutRequest({ profile_visibility: 'public' }) // not in enum
    const res = await PUT(req)

    expect(res.status).toBe(400)
  })

  it('returns 200 with updated profile data on happy path', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    const updatedProfile = { ...baseProfile, name: 'Alice Updated', title: 'VP Engineering' }

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // membership check
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
          }),
        }
      }
      // update call
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedProfile, error: null }),
            }),
          }),
        }),
      }
    })

    const req = makePutRequest({ name: 'Alice Updated', title: 'VP Engineering' })
    const res = await PUT(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.name).toBe('Alice Updated')
    expect(body.data.title).toBe('VP Engineering')
  })

  it('rejects linkedin_url as null (not nullable, only optional)', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
      }),
    })

    const req = makePutRequest({ linkedin_url: null })
    const res = await PUT(req)

    expect(res.status).toBe(400)
  })

  it('accepts nullable fields like industry as null', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    const updatedProfile = { ...baseProfile, industry: null }

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
          }),
        }
      }
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedProfile, error: null }),
            }),
          }),
        }),
      }
    })

    const req = makePutRequest({ industry: null })
    const res = await PUT(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.industry).toBeNull()
  })

  it('accepts all valid profile_visibility enum values', async () => {
    const validValues = ['members_only', 'corporate_only', 'all'] as const

    for (const visibility of validValues) {
      vi.clearAllMocks()

      mocks.mockAuthGetUser.mockResolvedValue({
        data: { user: { id: 'user-id-1' } },
        error: null,
      })

      let callCount = 0
      mocks.mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
            }),
          }
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...baseProfile, profile_visibility: visibility },
                  error: null,
                }),
              }),
            }),
          }),
        }
      })

      const req = makePutRequest({ profile_visibility: visibility })
      const res = await PUT(req)

      expect(res.status).toBe(200)
    }
  })

  it('returns 500 when database update fails', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-id-1' } },
      error: null,
    })

    let callCount = 0
    mocks.mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'user-id-1' }, error: null }),
          }),
        }
      }
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'db write failure' },
              }),
            }),
          }),
        }),
      }
    })

    const req = makePutRequest({ name: 'Alice' })
    const res = await PUT(req)

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('서버 오류가 발생했습니다')
  })

  it('returns 500 when an unexpected exception is thrown', async () => {
    mocks.mockAuthGetUser.mockRejectedValue(new Error('network timeout'))

    const req = makePutRequest({ name: 'Alice' })
    const res = await PUT(req)

    expect(res.status).toBe(500)
  })
})
