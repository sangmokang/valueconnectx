import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---- Hoisted mock variables ----
const { mockGetVcxUser, mockAdminFrom } = vi.hoisted(() => {
  const mockAdminQueryBuilder = {
    select: vi.fn(),
    insert: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
  }
  Object.values(mockAdminQueryBuilder).forEach((m) => {
    if (m !== mockAdminQueryBuilder.single) {
      m.mockReturnValue(mockAdminQueryBuilder)
    }
  })
  mockAdminQueryBuilder.single.mockResolvedValue({ data: null, error: null })

  const mockAdminFrom = vi.fn().mockReturnValue(mockAdminQueryBuilder)

  const mockGetVcxUser = vi.fn()

  return { mockGetVcxUser, mockAdminFrom }
})

vi.mock('@/lib/auth/get-vcx-user', () => ({
  getVcxUser: mockGetVcxUser,
  isAdmin: (user: { systemRole?: string } | null) =>
    user !== null && (user.systemRole === 'admin' || user.systemRole === 'super_admin'),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({ from: mockAdminFrom }),
}))

// ---- Import route after mocks ----
import { GET, POST } from '@/app/api/admin/feed/route'

const ADMIN_USER = { id: 'admin-uid-1', systemRole: 'admin' }
const MEMBER_USER = { id: 'member-uid-1', systemRole: 'member' }

function makePostRequest(body: object, url = 'http://localhost/api/admin/feed') {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/admin/feed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetVcxUser.mockResolvedValue(ADMIN_USER)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetVcxUser.mockResolvedValue(null)

    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not admin', async () => {
    mockGetVcxUser.mockResolvedValue(MEMBER_USER)

    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('returns 200 with items for admin user', async () => {
    const feedItems = [
      { id: 'feed-1', company: '토스', role: 'Head of Product' },
      { id: 'feed-2', company: '카카오', role: 'Engineering Manager' },
    ]
    const adminGetBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: feedItems, error: null }),
    }
    mockAdminFrom.mockReturnValue(adminGetBuilder)

    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.items).toHaveLength(2)
    expect(json.items[0].company).toBe('토스')
  })
})

describe('POST /api/admin/feed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetVcxUser.mockResolvedValue(ADMIN_USER)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetVcxUser.mockResolvedValue(null)

    const res = await POST(makePostRequest({ company: '토스', role: '개발자' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not admin', async () => {
    mockGetVcxUser.mockResolvedValue(MEMBER_USER)

    const res = await POST(makePostRequest({ company: '토스', role: '개발자' }))
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid input (missing required role)', async () => {
    const res = await POST(makePostRequest({ company: '토스' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('returns 400 for fields outside the feed item model', async () => {
    const res = await POST(makePostRequest({
      company: '토스',
      role: 'Head of Product',
      title: '마이그레이션 020에 없는 필드',
    }))

    expect(res.status).toBe(400)
  })

  it('returns 201 with created item for valid admin POST', async () => {
    const createdItem = {
      id: 'new-feed-1',
      company: '토스',
      role: 'Head of Product',
      exclusive: false,
      tags: [],
    }
    const insertBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: createdItem, error: null }),
    }
    mockAdminFrom.mockReturnValue(insertBuilder)

    const res = await POST(makePostRequest({
      company: ' 토스 ',
      role: ' Head of Product ',
      exclusive: false,
      tags: [' 핀테크 B2B ', 'Product'],
      company_tag: '',
      level: '',
    }))
    expect(res.status).toBe(201)
    expect(insertBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
      company: '토스',
      role: 'Head of Product',
      tags: ['핀테크 B2B', 'Product'],
      company_tag: null,
      level: null,
      created_by: ADMIN_USER.id,
    }))
    const json = await res.json()
    expect(json.item.company).toBe('토스')
  })
})
