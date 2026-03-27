import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockAuthGetUser = vi.fn()
  const mockServerClient = {
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  }
  const mockCheckDirectoryAccess = vi.fn()

  return {
    mockFrom,
    mockAuthGetUser,
    mockServerClient,
    mockCheckDirectoryAccess,
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

vi.mock('@/lib/anti-scraping', () => ({
  checkDirectoryAccess: mocks.mockCheckDirectoryAccess,
}))

import { GET } from '@/app/api/directory/[id]/route'

function makeRequest(id: string, ip = '127.0.0.1') {
  return new NextRequest(`http://localhost/api/directory/${id}`, {
    headers: { 'x-forwarded-for': ip },
  })
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

const baseMemberDetail = {
  id: 'member-id-1',
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
  endorsed_by_name: null,
}

function setupMembershipCheck(userId = 'user-id-1', isMember = true) {
  mocks.mockAuthGetUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  })

  mocks.mockFrom.mockImplementationOnce(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: isMember ? { id: userId } : null,
        error: null,
      }),
    }),
  }))
}

describe('GET /api/directory/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mocks.mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not authenticated' },
    })

    const req = makeRequest('member-id-1')
    const res = await GET(req, makeParams('member-id-1'))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when authenticated user is not a VCX member', async () => {
    setupMembershipCheck('non-member-id', false)

    const req = makeRequest('member-id-1')
    const res = await GET(req, makeParams('member-id-1'))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 접근할 수 있습니다')
  })

  it('returns 429 when daily rate limit is exceeded', async () => {
    setupMembershipCheck()
    mocks.mockCheckDirectoryAccess.mockResolvedValue({
      action: 'restrict',
      message: '일일 프로필 조회 한도를 초과했습니다. 내일 다시 시도해주세요.',
    })

    const req = makeRequest('member-id-1')
    const res = await GET(req, makeParams('member-id-1'))

    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toBe('일일 프로필 조회 한도를 초과했습니다. 내일 다시 시도해주세요.')
  })

  it('returns 429 when burst rate limit blocks access', async () => {
    setupMembershipCheck()
    mocks.mockCheckDirectoryAccess.mockResolvedValue({
      action: 'block',
      message: '비정상적인 접근이 감지되었습니다. 잠시 후 다시 시도해주세요.',
    })

    const req = makeRequest('member-id-1')
    const res = await GET(req, makeParams('member-id-1'))

    expect(res.status).toBe(429)
  })

  it('returns 404 when member id does not exist', async () => {
    setupMembershipCheck()
    mocks.mockCheckDirectoryAccess.mockResolvedValue({ action: 'allow' })

    mocks.mockFrom.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      }),
    }))

    const req = makeRequest('nonexistent-id')
    const res = await GET(req, makeParams('nonexistent-id'))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('멤버를 찾을 수 없습니다')
  })

  it('returns 404 when member exists but is not active', async () => {
    setupMembershipCheck()
    mocks.mockCheckDirectoryAccess.mockResolvedValue({ action: 'allow' })

    // The query includes .eq('is_active', true) so inactive members return null
    mocks.mockFrom.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }))

    const req = makeRequest('inactive-member-id')
    const res = await GET(req, makeParams('inactive-member-id'))

    expect(res.status).toBe(404)
  })

  it('returns 200 with member detail on happy path', async () => {
    setupMembershipCheck()
    mocks.mockCheckDirectoryAccess.mockResolvedValue({ action: 'allow' })

    mocks.mockFrom.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: baseMemberDetail, error: null }),
      }),
    }))

    const req = makeRequest('member-id-1')
    const res = await GET(req, makeParams('member-id-1'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toMatchObject({
      id: 'member-id-1',
      name: 'Alice Kim',
      email: 'alice@example.com',
      member_tier: 'core',
    })
  })

  it('returns all expected fields in member detail response', async () => {
    setupMembershipCheck()
    mocks.mockCheckDirectoryAccess.mockResolvedValue({ action: 'allow' })

    mocks.mockFrom.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: baseMemberDetail, error: null }),
      }),
    }))

    const req = makeRequest('member-id-1')
    const res = await GET(req, makeParams('member-id-1'))

    expect(res.status).toBe(200)
    const body = await res.json()
    const expectedFields = [
      'id', 'name', 'email', 'current_company', 'title',
      'professional_fields', 'years_of_experience', 'bio',
      'linkedin_url', 'member_tier', 'avatar_url', 'join_date',
      'industry', 'location', 'is_open_to_chat', 'profile_visibility',
      'endorsed_by_name',
    ]
    for (const field of expectedFields) {
      expect(body.data).toHaveProperty(field)
    }
  })

  it('does not set scraping warning header when action is allow', async () => {
    setupMembershipCheck()
    mocks.mockCheckDirectoryAccess.mockResolvedValue({ action: 'allow' })

    mocks.mockFrom.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: baseMemberDetail, error: null }),
      }),
    }))

    const req = makeRequest('member-id-1')
    const res = await GET(req, makeParams('member-id-1'))

    expect(res.status).toBe(200)
    expect(res.headers.get('x-vcx-scraping-warning')).toBeNull()
  })

  it('sets x-vcx-scraping-warning header when action is warn', async () => {
    setupMembershipCheck()
    mocks.mockCheckDirectoryAccess.mockResolvedValue({
      action: 'warn',
      message: '프로필 조회 속도가 빠릅니다. 천천히 탐색해주세요.',
    })

    mocks.mockFrom.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: baseMemberDetail, error: null }),
      }),
    }))

    const req = makeRequest('member-id-1')
    const res = await GET(req, makeParams('member-id-1'))

    expect(res.status).toBe(200)
    expect(res.headers.get('x-vcx-scraping-warning')).toBe('true')
  })

  it('returns 500 when database throws an unexpected error', async () => {
    mocks.mockAuthGetUser.mockRejectedValue(new Error('unexpected db failure'))

    const req = makeRequest('member-id-1')
    const res = await GET(req, makeParams('member-id-1'))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('서버 오류가 발생했습니다')
  })
})
