import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockAdminClient = {
    from: mockFrom,
  }
  return {
    mockFrom,
    mockAdminClient,
    mockRateLimit: vi.fn(),
    mockHashToken: vi.fn(),
    createAdminClient: vi.fn(() => mockAdminClient),
  }
})

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mocks.mockRateLimit,
  authLimiter: null,
  apiLimiter: null,
  directoryLimiter: null,
  directoryBurstLimiter: null,
  directoryDailyLimiter: null,
}))

vi.mock('@/lib/invite', () => ({
  hashToken: mocks.mockHashToken,
}))

import { GET } from '@/app/api/invites/verify/[token]/route'

function makeRequest(token: string, ip = '127.0.0.1') {
  return new NextRequest(`http://localhost/api/invites/verify/${token}`, {
    headers: { 'x-forwarded-for': ip },
  })
}

describe('GET /api/invites/verify/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockHashToken.mockReturnValue('hashed-token')
  })

  it('returns 429 when rate limited', async () => {
    mocks.mockRateLimit.mockReturnValue({ success: false, remaining: 0 })

    const req = makeRequest('test-token')
    const res = await GET(req, { params: Promise.resolve({ token: 'test-token' }) })

    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns { valid: false } for unknown token hash', async () => {
    mocks.mockRateLimit.mockReturnValue({ success: true, remaining: 4 })

    const mockSelect = { eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }) }
    mocks.mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(mockSelect) })

    const req = makeRequest('unknown-token')
    const res = await GET(req, { params: Promise.resolve({ token: 'unknown-token' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.valid).toBe(false)
    expect(body.reason).toBe('유효하지 않은 초대 링크입니다')
  })

  it('returns { valid: false, reason: "이미 사용된..." } for non-pending invite', async () => {
    mocks.mockRateLimit.mockReturnValue({ success: true, remaining: 4 })

    const invite = {
      email: 'test@example.com',
      invited_by_name: 'Alice',
      member_tier: 'core',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      status: 'accepted',
    }
    const mockSelect = { eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: invite, error: null }) }
    mocks.mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(mockSelect) })

    const req = makeRequest('used-token')
    const res = await GET(req, { params: Promise.resolve({ token: 'used-token' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.valid).toBe(false)
    expect(body.reason).toBe('이미 사용된 초대 링크입니다')
  })

  it('returns { valid: false, reason: "초대가 만료..." } for expired invite', async () => {
    mocks.mockRateLimit.mockReturnValue({ success: true, remaining: 4 })

    const invite = {
      email: 'test@example.com',
      invited_by_name: 'Alice',
      member_tier: 'core',
      expires_at: new Date(Date.now() - 1000).toISOString(),
      status: 'pending',
    }
    const mockSelect = { eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: invite, error: null }) }
    mocks.mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(mockSelect) })

    const req = makeRequest('expired-token')
    const res = await GET(req, { params: Promise.resolve({ token: 'expired-token' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.valid).toBe(false)
    expect(body.reason).toBe('초대가 만료되었습니다. 추천인에게 다시 요청해주세요.')
  })

  it('returns { valid: true, email, invitedByName, memberTier } for valid invite', async () => {
    mocks.mockRateLimit.mockReturnValue({ success: true, remaining: 4 })

    const invite = {
      email: 'test@example.com',
      invited_by_name: 'Alice',
      member_tier: 'core',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      status: 'pending',
    }
    const mockSelect = { eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: invite, error: null }) }
    mocks.mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(mockSelect) })

    const req = makeRequest('valid-token')
    const res = await GET(req, { params: Promise.resolve({ token: 'valid-token' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.valid).toBe(true)
    expect(body.email).toBe('test@example.com')
    expect(body.invitedByName).toBe('Alice')
    expect(body.memberTier).toBe('core')
  })
})
