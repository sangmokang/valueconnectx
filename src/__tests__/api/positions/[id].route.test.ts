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

import { GET, PUT, DELETE } from '@/app/api/positions/[id]/route'

const POSITION_ID = 'pos-abc-123'

function makeParams(id = POSITION_ID) {
  return { params: Promise.resolve({ id }) }
}

function makeGetRequest() {
  return new NextRequest(`http://localhost/api/positions/${POSITION_ID}`)
}

function makePutRequest(body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/positions/${POSITION_ID}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeDeleteRequest() {
  return new NextRequest(`http://localhost/api/positions/${POSITION_ID}`, {
    method: 'DELETE',
  })
}

const activeUser = { id: 'user-1' }
const activeMember = { id: 'user-1' }
const adminMember = { system_role: 'admin' }

const samplePosition = {
  id: POSITION_ID,
  company_name: 'Acme Corp',
  title: 'Senior Engineer',
  team_size: '10-50',
  role_description: 'Build great things',
  salary_range: '5000-8000',
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
}

// Helper: build a fluent Supabase query chain that resolves with given value
function makeQueryChain(resolved: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'in', 'ilike', 'or', 'order', 'range', 'single', 'insert', 'update', 'delete']
  methods.forEach((m) => {
    chain[m] = vi.fn(() => chain)
  })
  chain.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(resolved).then(resolve)
  return chain
}

// ─── GET /api/positions/[id] ────────────────────────────────────────────────

describe('GET /api/positions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const res = await GET(makeGetRequest(), makeParams())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when authenticated user is not a VCX member', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })
    // member check returns null
    mocks.mockFrom.mockImplementation(() => makeQueryChain({ data: null, error: null }))

    const res = await GET(makeGetRequest(), makeParams())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 접근할 수 있습니다')
  })

  it('returns 404 when position does not exist', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    let vcxMembersCalled = false
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members' && !vcxMembersCalled) {
        vcxMembersCalled = true
        return makeQueryChain({ data: activeMember, error: null })
      }
      if (table === 'positions') return makeQueryChain({ data: null, error: new Error('not found') })
      return makeQueryChain({ data: null, error: null })
    })

    const res = await GET(makeGetRequest(), makeParams())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('포지션을 찾을 수 없습니다')
  })

  it('returns position detail with interest counts and my_interest for authenticated member', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    let positionInterestCall = 0
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return makeQueryChain({ data: activeMember, error: null })
      if (table === 'positions') return makeQueryChain({ data: samplePosition, error: null })
      if (table === 'position_interests') {
        positionInterestCall++
        if (positionInterestCall === 1) {
          // user's own interest
          return makeQueryChain({ data: { interest_type: 'bookmark' }, error: null })
        }
        // aggregate counts
        return makeQueryChain({
          data: [{ interest_type: 'interested' }, { interest_type: 'bookmark' }],
          error: null,
        })
      }
      return makeQueryChain({ data: null, error: null })
    })

    const res = await GET(makeGetRequest(), makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe(POSITION_ID)
    expect(body.data.my_interest).toBe('bookmark')
    expect(body.data.interest_counts).toBeDefined()
    expect(body.data.interest_counts.interested).toBe(1)
    expect(body.data.interest_counts.bookmark).toBe(1)
    expect(body.data.interest_counts.not_interested).toBe(0)
  })

  it('returns my_interest as null when user has no recorded interest', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return makeQueryChain({ data: activeMember, error: null })
      if (table === 'positions') return makeQueryChain({ data: samplePosition, error: null })
      if (table === 'position_interests') return makeQueryChain({ data: null, error: null })
      return makeQueryChain({ data: null, error: null })
    })

    const res = await GET(makeGetRequest(), makeParams())
    const body = await res.json()
    expect(body.data.my_interest).toBeNull()
  })
})

// ─── PUT /api/positions/[id] ─────────────────────────────────────────────────

describe('PUT /api/positions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const res = await PUT(makePutRequest({ title: 'New Title' }), makeParams())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when authenticated user is not admin', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })
    // isAdmin returns null (not admin)
    mocks.mockFrom.mockImplementation(() => makeQueryChain({ data: null, error: null }))

    const res = await PUT(makePutRequest({ title: 'New Title' }), makeParams())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('관리자만 포지션을 수정할 수 있습니다')
  })

  it('queries vcx_members with system_role in [super_admin, admin] for isAdmin check', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    mocks.mockFrom.mockImplementation(() => makeQueryChain({ data: null, error: null }))

    await PUT(makePutRequest({ title: 'New Title' }), makeParams())

    expect(mocks.mockFrom).toHaveBeenCalledWith('vcx_members')
  })

  it('returns 400 for invalid status enum in update body', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })
    mocks.mockFrom.mockImplementation(() => makeQueryChain({ data: adminMember, error: null }))

    const res = await PUT(makePutRequest({ status: 'invalid_status' }), makeParams())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('유효하지 않은 요청입니다')
  })

  it('returns 400 for empty string in company_name', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })
    mocks.mockFrom.mockImplementation(() => makeQueryChain({ data: adminMember, error: null }))

    const res = await PUT(makePutRequest({ company_name: '' }), makeParams())
    expect(res.status).toBe(400)
  })

  it('returns 404 when position to update does not exist', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return makeQueryChain({ data: adminMember, error: null })
      if (table === 'positions') return makeQueryChain({ data: null, error: new Error('not found') })
      return makeQueryChain({ data: null, error: null })
    })

    const res = await PUT(makePutRequest({ title: 'New Title' }), makeParams())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('포지션을 찾을 수 없습니다')
  })

  it('returns 200 with updated position data for admin user', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    const updatedPosition = { ...samplePosition, title: 'Updated Title' }

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return makeQueryChain({ data: adminMember, error: null })
      if (table === 'positions') return makeQueryChain({ data: updatedPosition, error: null })
      return makeQueryChain({ data: null, error: null })
    })

    const res = await PUT(makePutRequest({ title: 'Updated Title' }), makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.title).toBe('Updated Title')
  })

  it('allows partial update with only status field', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    const closedPosition = { ...samplePosition, status: 'closed' }

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return makeQueryChain({ data: adminMember, error: null })
      if (table === 'positions') return makeQueryChain({ data: closedPosition, error: null })
      return makeQueryChain({ data: null, error: null })
    })

    const res = await PUT(makePutRequest({ status: 'closed' }), makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('closed')
  })
})

// ─── DELETE /api/positions/[id] ───────────────────────────────────────────────

describe('DELETE /api/positions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const res = await DELETE(makeDeleteRequest(), makeParams())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when authenticated user is not admin', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })
    mocks.mockFrom.mockImplementation(() => makeQueryChain({ data: null, error: null }))

    const res = await DELETE(makeDeleteRequest(), makeParams())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('관리자만 포지션을 삭제할 수 있습니다')
  })

  it('returns 404 when delete fails (position not found)', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return makeQueryChain({ data: adminMember, error: null })
      if (table === 'positions') return makeQueryChain({ data: null, error: new Error('not found') })
      return makeQueryChain({ data: null, error: null })
    })

    const res = await DELETE(makeDeleteRequest(), makeParams())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('포지션을 찾을 수 없습니다')
  })

  it('returns 200 with success true when admin deletes a position', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return makeQueryChain({ data: adminMember, error: null })
      if (table === 'positions') return makeQueryChain({ data: null, error: null })
      return makeQueryChain({ data: null, error: null })
    })

    const res = await DELETE(makeDeleteRequest(), makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('super_admin can also delete a position', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: activeUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') return makeQueryChain({ data: { system_role: 'super_admin' }, error: null })
      if (table === 'positions') return makeQueryChain({ data: null, error: null })
      return makeQueryChain({ data: null, error: null })
    })

    const res = await DELETE(makeDeleteRequest(), makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
