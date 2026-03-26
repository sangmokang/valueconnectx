import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetUser, mockFrom, mockSingle, mockEq, mockIn, mockRpc } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockIn = vi.fn().mockReturnValue({ single: mockSingle })
  const mockEq = vi.fn()
  mockEq.mockReturnValue({ eq: mockEq, in: mockIn, single: mockSingle })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
  const mockGetUser = vi.fn()
  const mockRpc = vi.fn()
  return { mockGetUser, mockFrom, mockSingle, mockEq, mockIn, mockRpc }
})

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  })),
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
    expect(body).toEqual({ error: 'Unauthorized' })
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
    // rpc returns a member
    mockRpc.mockResolvedValue({ data: { member: { id: 'user-123' }, corporate: null } })
    const req = makeRequest('/coffeechat')
    const res = await middleware(req)
    expect(res.headers.get('x-vcx-authenticated')).toBe('true')
  })
})
