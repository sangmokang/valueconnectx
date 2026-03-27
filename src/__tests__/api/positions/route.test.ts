import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockGetUser = vi.fn()
  const mockClient = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }
  return {
    mockFrom,
    mockGetUser,
    mockClient,
    createClient: vi.fn(async () => mockClient),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

import { GET, POST } from '@/app/api/positions/route'

function makeGetRequest(queryString = '') {
  return new NextRequest(`http://localhost/api/positions${queryString ? '?' + queryString : ''}`)
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/positions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const activeUser = { id: 'user-1' }
const activeMember = { id: 'user-1' }

const samplePosition = {
  id: 'pos-1',
  company_name: 'Acme Corp',
  title: 'Senior Engineer',
  team_size: '10-50',
  role_description: 'Build great things',
  salary_range: '5000-8000',
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
}

// Helper: build a fluent Supabase query chain that resolves with given value
function makeQueryChain(resolved: { data: unknown; error: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'in', 'ilike', 'or', 'order', 'range', 'single', 'insert', 'update', 'delete']
  methods.forEach((m) => {
    chain[m] = vi.fn(() => chain)
  })
  // The terminal await resolves with the provided value
  chain.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(resolved).then(resolve)
  return chain
}

describe('GET /api/positions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const res = await GET(makeGetRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when authenticated user is not a VCX member', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    // vcx_members lookup returns null (not a member)
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        const chain = makeQueryChain({ data: null, error: null })
        return chain
      }
      return makeQueryChain({ data: [], error: null, count: 0 })
    })

    const res = await GET(makeGetRequest())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 접근할 수 있습니다')
  })

  it('returns list of active positions with total count for authenticated member', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    let memberCallCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        memberCallCount++
        return makeQueryChain({ data: activeMember, error: null })
      }
      if (table === 'positions') {
        return makeQueryChain({ data: [samplePosition], error: null, count: 1 })
      }
      if (table === 'position_interests') {
        return makeQueryChain({ data: [], error: null })
      }
      return makeQueryChain({ data: null, error: null })
    })

    const res = await GET(makeGetRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe('pos-1')
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.limit).toBe(20)
  })

  it('enriches positions with my_interest null when user has no interest', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return makeQueryChain({ data: activeMember, error: null })
      if (table === 'positions') return makeQueryChain({ data: [samplePosition], error: null, count: 1 })
      if (table === 'position_interests') return makeQueryChain({ data: [], error: null })
      return makeQueryChain({ data: null, error: null })
    })

    const res = await GET(makeGetRequest())
    const body = await res.json()
    expect(body.data[0].my_interest).toBeNull()
  })

  it('enriches positions with my_interest value when user has recorded interest', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return makeQueryChain({ data: activeMember, error: null })
      if (table === 'positions') return makeQueryChain({ data: [samplePosition], error: null, count: 1 })
      if (table === 'position_interests') {
        return makeQueryChain({ data: [{ position_id: 'pos-1', interest_type: 'interested' }], error: null })
      }
      return makeQueryChain({ data: null, error: null })
    })

    const res = await GET(makeGetRequest())
    const body = await res.json()
    expect(body.data[0].my_interest).toBe('interested')
  })

  it('returns 400 for invalid query param (limit out of range)', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })
    mocks.mockFrom.mockImplementation(() => makeQueryChain({ data: activeMember, error: null }))

    const res = await GET(makeGetRequest('limit=999'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 파라미터입니다')
  })

  it('returns 500 when database query fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    let callCount = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        callCount++
        if (callCount === 1) return makeQueryChain({ data: activeMember, error: null })
      }
      if (table === 'positions') return makeQueryChain({ data: null, error: new Error('db failure'), count: null })
      return makeQueryChain({ data: null, error: null })
    })

    const res = await GET(makeGetRequest())
    expect(res.status).toBe(500)
  })
})

describe('POST /api/positions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const res = await POST(makePostRequest({ company_name: 'Corp', title: 'Dev', role_description: 'Code' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when authenticated user is not admin', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    // isAdmin query returns null (not admin)
    mocks.mockFrom.mockImplementation(() => makeQueryChain({ data: null, error: null }))

    const res = await POST(makePostRequest({ company_name: 'Corp', title: 'Dev', role_description: 'Code' }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('관리자만 포지션을 등록할 수 있습니다')
  })

  it('queries vcx_members with system_role in [super_admin, admin] for isAdmin check', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    const adminChain = makeQueryChain({ data: null, error: null })
    mocks.mockFrom.mockImplementation(() => adminChain)

    await POST(makePostRequest({ company_name: 'Corp', title: 'Dev', role_description: 'Code' }))

    expect(mocks.mockFrom).toHaveBeenCalledWith('vcx_members')
  })

  it('returns 400 for missing required fields (company_name)', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    // isAdmin returns true
    mocks.mockFrom.mockImplementation(() => makeQueryChain({ data: { system_role: 'admin' }, error: null }))

    const res = await POST(makePostRequest({ title: 'Dev', role_description: 'Code' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청입니다')
  })

  it('returns 400 for missing required fields (title)', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })
    mocks.mockFrom.mockImplementation(() => makeQueryChain({ data: { system_role: 'admin' }, error: null }))

    const res = await POST(makePostRequest({ company_name: 'Corp', role_description: 'Code' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청입니다')
  })

  it('returns 400 for missing required fields (role_description)', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })
    mocks.mockFrom.mockImplementation(() => makeQueryChain({ data: { system_role: 'admin' }, error: null }))

    const res = await POST(makePostRequest({ company_name: 'Corp', title: 'Dev' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청입니다')
  })

  it('returns 400 for invalid status enum value', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })
    mocks.mockFrom.mockImplementation(() => makeQueryChain({ data: { system_role: 'admin' }, error: null }))

    const res = await POST(makePostRequest({
      company_name: 'Corp',
      title: 'Dev',
      role_description: 'Code',
      status: 'invalid_status',
    }))
    expect(res.status).toBe(400)
  })

  it('creates position and returns 201 with data for admin user', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    const createdPosition = { ...samplePosition, created_by: activeUser.id }

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return makeQueryChain({ data: { system_role: 'admin' }, error: null })
      if (table === 'positions') return makeQueryChain({ data: createdPosition, error: null })
      return makeQueryChain({ data: null, error: null })
    })

    const res = await POST(makePostRequest({
      company_name: 'Acme Corp',
      title: 'Senior Engineer',
      role_description: 'Build great things',
    }))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(body.data.company_name).toBe('Acme Corp')
  })

  it('includes created_by as user id when inserting position', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    const insertMock = vi.fn().mockReturnValue(makeQueryChain({ data: samplePosition, error: null }))

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return makeQueryChain({ data: { system_role: 'super_admin' }, error: null })
      if (table === 'positions') return { insert: insertMock }
      return makeQueryChain({ data: null, error: null })
    })

    await POST(makePostRequest({
      company_name: 'Acme Corp',
      title: 'Senior Engineer',
      role_description: 'Build great things',
    }))

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ created_by: activeUser.id })
    )
  })

  it('defaults status to active when not provided', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    const insertMock = vi.fn().mockReturnValue(makeQueryChain({ data: samplePosition, error: null }))

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return makeQueryChain({ data: { system_role: 'admin' }, error: null })
      if (table === 'positions') return { insert: insertMock }
      return makeQueryChain({ data: null, error: null })
    })

    await POST(makePostRequest({
      company_name: 'Acme Corp',
      title: 'Senior Engineer',
      role_description: 'Build great things',
    }))

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' })
    )
  })

  it('returns 500 when database insert fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return makeQueryChain({ data: { system_role: 'admin' }, error: null })
      if (table === 'positions') return makeQueryChain({ data: null, error: new Error('insert failed') })
      return makeQueryChain({ data: null, error: null })
    })

    const res = await POST(makePostRequest({
      company_name: 'Acme Corp',
      title: 'Senior Engineer',
      role_description: 'Build great things',
    }))

    expect(res.status).toBe(500)
  })
})
