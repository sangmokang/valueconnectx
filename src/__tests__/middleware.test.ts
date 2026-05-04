import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetUser,
  mockFrom,
  mockSingle,
  mockRpc,
  mockRateLimit,
  mockApiLimiter,
  mockAuthLimiter,
  mockDirectoryLimiter,
  mockDirectoryBurstLimiter,
  mockDirectoryDailyLimiter,
} = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockIn = vi.fn().mockReturnValue({ single: mockSingle })
  const mockEq = vi.fn()
  mockEq.mockReturnValue({ eq: mockEq, in: mockIn, single: mockSingle })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
  const mockGetUser = vi.fn()
  const mockRpc = vi.fn()
  const mockRateLimit = vi.fn()
  const mockApiLimiter = { name: 'api' }
  const mockAuthLimiter = { name: 'auth' }
  const mockDirectoryLimiter = { name: 'directory' }
  const mockDirectoryBurstLimiter = { name: 'directory-burst' }
  const mockDirectoryDailyLimiter = { name: 'directory-daily' }
  return {
    mockGetUser,
    mockFrom,
    mockSingle,
    mockEq,
    mockIn,
    mockRpc,
    mockRateLimit,
    mockApiLimiter,
    mockAuthLimiter,
    mockDirectoryLimiter,
    mockDirectoryBurstLimiter,
    mockDirectoryDailyLimiter,
  }
})

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  })),
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mockRateLimit,
  apiLimiter: mockApiLimiter,
  authLimiter: mockAuthLimiter,
  directoryLimiter: mockDirectoryLimiter,
  directoryBurstLimiter: mockDirectoryBurstLimiter,
  directoryDailyLimiter: mockDirectoryDailyLimiter,
}))

import { middleware } from '@/middleware'

function makeRequest(path: string) {
  return new NextRequest(`http://localhost:3000${path}`)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: null } })
  mockSingle.mockResolvedValue({ data: null })
  mockRpc.mockResolvedValue({ data: null })
  mockRateLimit.mockResolvedValue({ success: true, remaining: 999 })
})

describe('middleware', () => {
  it('1. bypasses _next routes', async () => {
    const req = makeRequest('/_next/static/chunk.js')
    const res = await middleware(req)
    expect(res.status).toBe(200)
    // createServerClient should not be called for _next routes
    const { createServerClient } = await import('@supabase/ssr')
    expect(createServerClient).not.toHaveBeenCalled()
  })

  it('2. bypasses routes with file extensions', async () => {
    const req = makeRequest('/favicon.ico')
    const res = await middleware(req)
    expect(res.status).toBe(200)
    const { createServerClient } = await import('@supabase/ssr')
    expect(createServerClient).not.toHaveBeenCalled()
  })

  it('3. allows auth routes through without auth check', async () => {
    const req = makeRequest('/login')
    const res = await middleware(req)
    expect(res.status).toBe(200)
    const { createServerClient } = await import('@supabase/ssr')
    expect(createServerClient).not.toHaveBeenCalled()
  })

  it('4. allows public routes through without auth check', async () => {
    const req = makeRequest('/')
    const res = await middleware(req)
    expect(res.status).toBe(200)
    const { createServerClient } = await import('@supabase/ssr')
    expect(createServerClient).not.toHaveBeenCalled()
  })

  it('5. returns 401 JSON for unauthenticated API requests', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = makeRequest('/api/recommendations')
    const res = await middleware(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
    expect(mockRateLimit).toHaveBeenCalledWith(mockApiLimiter, 'api:unknown')
  })

  it('5-1. applies auth limiter to public invite APIs without requiring session', async () => {
    const req = makeRequest('/api/invites/accept')
    const res = await middleware(req)

    expect(res.status).toBe(200)
    expect(mockRateLimit).toHaveBeenCalledWith(mockApiLimiter, 'api:unknown')
    expect(mockRateLimit).toHaveBeenCalledWith(mockAuthLimiter, 'auth:unknown')
    const { createServerClient } = await import('@supabase/ssr')
    expect(createServerClient).not.toHaveBeenCalled()
  })

  it('5-2. returns 429 when invite/auth API limiter blocks', async () => {
    mockRateLimit
      .mockResolvedValueOnce({ success: true, remaining: 59 })
      .mockResolvedValueOnce({ success: false, remaining: 0 })

    const req = makeRequest('/api/invites/accept')
    const res = await middleware(req)

    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toBe('너무 많은 요청입니다. 잠시 후 다시 시도해주세요.')
  })

  it('6. redirects to /login for unauthenticated admin access', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = makeRequest('/admin')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('7. redirects to / for non-admin users on admin routes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    // rpc returns no member (not an admin)
    mockRpc.mockResolvedValue({ data: null })
    const req = makeRequest('/admin')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('http://localhost:3000/')
  })

  it('8. sets x-vcx-authenticated header for protected routes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    // rpc returns a member with complete profile (onboarding redirect skipped)
    mockRpc.mockResolvedValue({ data: { member: { id: 'user-123', name: '테스트', current_company: '테스트회사', title: 'Engineer', linkedin_url: 'https://linkedin.com/in/test' }, corporate: null } })
    const req = makeRequest('/coffeechat')
    const res = await middleware(req)
    expect(res.headers.get('x-vcx-authenticated')).toBe('true')
  })

  it('9. applies directory profile scraping limits separately from base API limit', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockRpc.mockResolvedValue({
      data: {
        member: {
          id: 'user-123',
          name: '테스트',
          current_company: '테스트회사',
          title: 'Engineer',
          linkedin_url: 'https://linkedin.com/in/test',
        },
        corporate: null,
      },
    })
    mockRateLimit.mockImplementation(async (limiter) => {
      if (limiter === mockDirectoryLimiter) {
        return { success: false, remaining: 0 }
      }
      return { success: true, remaining: 10 }
    })

    const req = new NextRequest('http://localhost:3000/api/directory/member-1', {
      headers: { 'x-forwarded-for': '203.0.113.7' },
    })
    const res = await middleware(req)

    expect(res.status).toBe(200)
    expect(mockRateLimit).toHaveBeenCalledWith(mockApiLimiter, 'api:203.0.113.7')
    expect(mockRateLimit).toHaveBeenCalledWith(mockDirectoryDailyLimiter, 'dir:203.0.113.7')
    expect(mockRateLimit).toHaveBeenCalledWith(mockDirectoryBurstLimiter, 'dir:203.0.113.7')
    expect(mockRateLimit).toHaveBeenCalledWith(mockDirectoryLimiter, 'dir:203.0.113.7')
    expect(res.headers.get('x-vcx-scraping-warning')).toBe('slow-down')
  })
})
