import { describe, it, expect, vi, beforeEach } from 'vitest'

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

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
  authLimiter: null,
  apiLimiter: null,
  directoryLimiter: null,
  directoryBurstLimiter: null,
  directoryDailyLimiter: null,
}))

import { GET } from '@/app/api/positions/matches/route'
import { NextRequest } from 'next/server'

const authenticatedUser = { id: 'user-id-1' }

const activeMember = {
  id: authenticatedUser.id,
  professional_fields: ['engineering', 'product'],
  years_of_experience: 8,
  industry: '테크',
  bio: 'Backend engineer with product experience',
  location: '서울',
}

const samplePosition = {
  id: 'pos-1',
  title: 'Senior Backend Engineer',
  company_name: 'TechCorp',
  role_description: 'Backend engineer building scalable systems',
  required_fields: ['engineering'],
  min_experience: 5,
  industry: '테크',
  location: '서울',
  team_size: '10-50',
  salary_range: '5000-8000',
  status: 'active',
}

function makeGetRequest() {
  return new NextRequest('http://localhost/api/positions/matches')
}

// Build a fluent Supabase query chain terminating with the given resolved value
function makeQueryChain(resolved: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'in', 'single', 'order']
  methods.forEach((m) => {
    chain[m] = vi.fn(() => chain)
  })
  chain.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(resolved).then(resolve)
  return chain
}

describe('GET /api/positions/matches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const res = await GET()

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when authenticated user is not a VCX member', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation(() => makeQueryChain({ data: null, error: null }))

    const res = await GET()

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 접근할 수 있습니다')
  })

  it('returns 200 with matched positions and scores for valid member', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return makeQueryChain({ data: activeMember, error: null })
      }
      if (table === 'positions') {
        return makeQueryChain({ data: [samplePosition], error: null })
      }
      return makeQueryChain({ data: null, error: null })
    })

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].position.id).toBe('pos-1')
    expect(typeof body.data[0].matchScore).toBe('number')
    expect(body.data[0].matchScore).toBeGreaterThan(0)
    expect(Array.isArray(body.data[0].matchReasons)).toBe(true)
  })

  it('returns 200 with empty array when no positions exist', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return makeQueryChain({ data: activeMember, error: null })
      }
      if (table === 'positions') {
        return makeQueryChain({ data: [], error: null })
      }
      return makeQueryChain({ data: null, error: null })
    })

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(0)
  })

  it('returns at most 10 matched positions', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const manyPositions = Array.from({ length: 15 }, (_, i) => ({
      ...samplePosition,
      id: `pos-${i + 1}`,
      title: `Position ${i + 1}`,
    }))

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return makeQueryChain({ data: activeMember, error: null })
      }
      if (table === 'positions') {
        return makeQueryChain({ data: manyPositions, error: null })
      }
      return makeQueryChain({ data: null, error: null })
    })

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.length).toBeLessThanOrEqual(10)
  })

  it('returns 500 when positions database query fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return makeQueryChain({ data: activeMember, error: null })
      }
      if (table === 'positions') {
        return makeQueryChain({ data: null, error: new Error('db error') })
      }
      return makeQueryChain({ data: null, error: null })
    })

    const res = await GET()

    expect(res.status).toBe(500)
  })
})
