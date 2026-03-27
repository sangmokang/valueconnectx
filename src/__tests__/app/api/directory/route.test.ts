import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetUser, mockFrom } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  return { mockGetUser, mockFrom }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

vi.mock('@/lib/anti-scraping', () => ({
  checkDirectoryAccess: vi.fn().mockResolvedValue({ action: 'allow', message: null }),
}))

import { GET } from '@/app/api/directory/route'

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/directory')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

function makeMemberBuilder(memberResult: unknown, listResult: unknown) {
  // first call: member check
  const memberB: Record<string, unknown> = {}
  const memberReturnSelf = () => memberB
  memberB.select = vi.fn().mockImplementation(memberReturnSelf)
  memberB.eq = vi.fn().mockImplementation(memberReturnSelf)
  memberB.single = vi.fn().mockResolvedValue(memberResult)

  // second call: directory list — chain: .select().eq().range().neq().order().order()
  // order() is called twice; second call must resolve
  const listB: Record<string, unknown> = {}
  const listReturnSelf = () => listB
  listB.select = vi.fn().mockImplementation(listReturnSelf)
  listB.eq = vi.fn().mockImplementation(listReturnSelf)
  listB.neq = vi.fn().mockImplementation(listReturnSelf)
  listB.range = vi.fn().mockImplementation(listReturnSelf)
  listB.textSearch = vi.fn().mockImplementation(listReturnSelf)
  listB.order = vi.fn()
    .mockImplementationOnce(listReturnSelf)
    .mockResolvedValue(listResult)

  mockFrom.mockImplementationOnce(() => memberB).mockImplementationOnce(() => listB)
}

describe('GET /api/directory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not a member', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const b: Record<string, unknown> = {}
    const returnSelf = () => b
    b.select = vi.fn().mockImplementation(returnSelf)
    b.eq = vi.fn().mockImplementation(returnSelf)
    b.single = vi.fn().mockResolvedValue({ data: null, error: null })
    mockFrom.mockReturnValue(b)

    const res = await GET(makeRequest())
    expect(res.status).toBe(403)
  })

  it('returns member list on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const members = [
      { id: 'u1', name: '홍길동', member_tier: 'core' },
      { id: 'u2', name: '김철수', member_tier: 'endorsed' },
    ]
    makeMemberBuilder(
      { data: { id: 'user-1' }, error: null },
      { data: members, error: null, count: 2 }
    )

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.total).toBe(2)
  })

  it('returns 500 on DB error during list', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    makeMemberBuilder(
      { data: { id: 'user-1' }, error: null },
      { data: null, error: new Error('db error'), count: null }
    )

    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
  })
})
