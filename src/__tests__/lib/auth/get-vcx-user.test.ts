import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted so mocks are available when vi.mock factory runs
const { mockGetUser, mockSingle, mockEq, mockSelect, mockFrom } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockSingle = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockFrom = vi.fn()

  mockFrom.mockReturnValue({ select: mockSelect })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle })

  return { mockGetUser, mockSingle, mockEq, mockSelect, mockFrom }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

import { getVcxUser, isAdmin } from '@/lib/auth/get-vcx-user'

describe('getVcxUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle })
  })

  it('returns null when auth.getUser() returns no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await getVcxUser()
    expect(result).toBeNull()
  })

  it('returns null when user exists but no vcx_members row', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSingle.mockResolvedValue({ data: null })
    const result = await getVcxUser()
    expect(result).toBeNull()
  })

  it('returns null when member is inactive (eq filter returns null)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSingle.mockResolvedValue({ data: null })
    const result = await getVcxUser()
    expect(result).toBeNull()
  })

  it('returns correct VcxUser shape when user and member both exist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSingle.mockResolvedValue({
      data: {
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        member_tier: 'core',
        system_role: 'admin',
        avatar_url: 'https://example.com/avatar.png',
      },
    })
    const result = await getVcxUser()
    expect(result).toEqual({
      id: 'user-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      memberTier: 'core',
      systemRole: 'admin',
      avatarUrl: 'https://example.com/avatar.png',
    })
  })

  it('returns null on any thrown error (catch block)', async () => {
    mockGetUser.mockRejectedValue(new Error('network error'))
    const result = await getVcxUser()
    expect(result).toBeNull()
  })
})

describe('isAdmin', () => {
  it('returns true for super_admin', () => {
    expect(
      isAdmin({ id: '1', name: 'Admin', email: 'a@b.com', memberTier: 'core', systemRole: 'super_admin', avatarUrl: null })
    ).toBe(true)
  })

  it('returns true for admin', () => {
    expect(
      isAdmin({ id: '1', name: 'Admin', email: 'a@b.com', memberTier: 'core', systemRole: 'admin', avatarUrl: null })
    ).toBe(true)
  })

  it('returns false for member', () => {
    expect(
      isAdmin({ id: '1', name: 'Member', email: 'a@b.com', memberTier: 'endorsed', systemRole: 'member', avatarUrl: null })
    ).toBe(false)
  })

  it('returns false for null', () => {
    expect(isAdmin(null)).toBe(false)
  })
})
