import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockServerClient, mockAdminFrom } = vi.hoisted(() => {
  const mockServerClient = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  }
  const mockAdminFrom = vi.fn()

  return { mockServerClient, mockAdminFrom }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockServerClient),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({ from: mockAdminFrom }),
}))

import { PATCH, DELETE } from '@/app/api/admin/feed/[id]/route'

const ADMIN_USER = { id: 'admin-uid-1' }
const ADMIN_MEMBER = { system_role: 'admin' }

function makePatchRequest(body: object) {
  return new NextRequest('http://localhost/api/admin/feed/feed-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function params(id = 'feed-1') {
  return { params: Promise.resolve({ id }) }
}

function makeAdminFromBuilder() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: ADMIN_MEMBER, error: null }),
  }
}

function makeNonAdminFromBuilder() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
  }
}

describe('PATCH /api/admin/feed/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServerClient.auth.getUser.mockResolvedValue({ data: { user: ADMIN_USER }, error: null })
    mockServerClient.from.mockReturnValue(makeAdminFromBuilder())
  })

  it('returns 401 when not authenticated', async () => {
    mockServerClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await PATCH(makePatchRequest({ company: '토스' }), params())

    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not admin', async () => {
    mockServerClient.from.mockReturnValue(makeNonAdminFromBuilder())

    const res = await PATCH(makePatchRequest({ company: '토스' }), params())

    expect(res.status).toBe(403)
  })

  it('returns 400 for fields outside the feed item model', async () => {
    const res = await PATCH(makePatchRequest({ title: '마이그레이션 020에 없는 필드' }), params())

    expect(res.status).toBe(400)
  })

  it('updates only migration 020 feed item columns', async () => {
    const updatedItem = {
      id: 'feed-1',
      company: '토스',
      company_tag: '핀테크',
      role: 'Head of Product',
      level: null,
      team_size: '10-30명',
      salary_band: null,
      location: '서울',
      tags: ['Product'],
      summary: null,
      exclusive: true,
      published_at: '2026-05-01T00:00:00.000Z',
    }
    const updateBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updatedItem, error: null }),
    }
    mockAdminFrom.mockReturnValue(updateBuilder)

    const res = await PATCH(makePatchRequest({
      company: ' 토스 ',
      company_tag: ' 핀테크 ',
      role: ' Head of Product ',
      level: '',
      team_size: ' 10-30명 ',
      salary_band: '',
      location: ' 서울 ',
      tags: [' Product '],
      summary: '',
      exclusive: true,
      published_at: '2026-05-01T00:00:00.000Z',
    }), params())

    expect(res.status).toBe(200)
    expect(updateBuilder.update).toHaveBeenCalledWith({
      company: '토스',
      company_tag: '핀테크',
      role: 'Head of Product',
      level: null,
      team_size: '10-30명',
      salary_band: null,
      location: '서울',
      tags: ['Product'],
      summary: null,
      exclusive: true,
      published_at: '2026-05-01T00:00:00.000Z',
    })
    expect(updateBuilder.eq).toHaveBeenCalledWith('id', 'feed-1')
    await expect(res.json()).resolves.toEqual({ item: updatedItem })
  })
})

describe('DELETE /api/admin/feed/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServerClient.auth.getUser.mockResolvedValue({ data: { user: ADMIN_USER }, error: null })
    mockServerClient.from.mockReturnValue(makeAdminFromBuilder())
  })

  it('deletes a feed item for admin users', async () => {
    const deleteBuilder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockAdminFrom.mockReturnValue(deleteBuilder)

    const res = await DELETE(new NextRequest('http://localhost/api/admin/feed/feed-1'), params())

    expect(res.status).toBe(204)
    expect(deleteBuilder.eq).toHaveBeenCalledWith('id', 'feed-1')
  })
})
