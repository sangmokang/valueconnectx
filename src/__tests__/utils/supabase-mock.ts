import { vi } from 'vitest'

// Creates a chainable mock for Supabase query builder
// Supports: .from().select().eq().single(), .from().insert(), .from().update().eq(), etc.
export function createMockSupabaseClient() {
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  const mockSelect = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()
  const mockEq = vi.fn()
  const mockNeq = vi.fn()
  const mockIlike = vi.fn()
  const mockOrder = vi.fn()
  const mockRange = vi.fn()
  const mockLimit = vi.fn()

  // Build chainable pattern
  const queryBuilder = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    neq: mockNeq,
    ilike: mockIlike,
    order: mockOrder,
    range: mockRange,
    limit: mockLimit,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  }

  // Every method returns the builder for chaining
  Object.values(queryBuilder).forEach(mock => {
    if (mock !== mockSingle && mock !== mockMaybeSingle) {
      mock.mockReturnValue(queryBuilder)
    }
  })

  const mockFrom = vi.fn().mockReturnValue(queryBuilder)

  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    admin: {
      createUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
      getUserByEmail: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      updateUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      deleteUser: vi.fn().mockResolvedValue({ error: null }),
    },
  }

  const client = {
    from: mockFrom,
    auth: mockAuth,
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }

  return {
    client,
    mocks: {
      from: mockFrom,
      ...queryBuilder,
      auth: mockAuth,
    },
  }
}

// Type helper
export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>
