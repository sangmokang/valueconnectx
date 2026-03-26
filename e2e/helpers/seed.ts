import { createClient } from '@supabase/supabase-js'

// Create admin client for E2E seeding (uses env vars directly)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!url || !key) {
    throw new Error('Missing Supabase credentials for E2E tests. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function seedTestUser(user: {
  email: string
  password: string
  name: string
  memberTier: 'core' | 'endorsed'
  systemRole: 'super_admin' | 'admin' | 'member'
}) {
  const admin = getAdminClient()

  // Create auth user
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
  })

  if (authError) {
    // User might already exist from a previous failed test run
    if (authError.message?.includes('already been registered')) {
      // Find and return existing user
      const { data: { users } } = await admin.auth.admin.listUsers()
      const existing = users?.find(u => u.email === user.email)
      if (existing) {
        return existing.id
      }
    }
    throw new Error(`Failed to create auth user: ${authError.message}`)
  }

  const userId = authUser.user.id

  // Create vcx_members row
  const { error: memberError } = await admin.from('vcx_members').insert({
    id: userId,
    name: user.name,
    email: user.email,
    member_tier: user.memberTier,
    system_role: user.systemRole,
    is_active: true,
  })

  if (memberError) {
    // Clean up auth user if member creation fails
    if (!memberError.message?.includes('duplicate')) {
      await admin.auth.admin.deleteUser(userId)
      throw new Error(`Failed to create member: ${memberError.message}`)
    }
  }

  return userId
}

export async function seedTestAdmin() {
  const { TEST_ADMIN } = await import('./constants')
  return seedTestUser(TEST_ADMIN)
}

export async function seedTestMember() {
  const { TEST_MEMBER } = await import('./constants')
  return seedTestUser(TEST_MEMBER)
}

export async function cleanupTestData() {
  const admin = getAdminClient()
  const { TEST_ADMIN, TEST_MEMBER, TEST_INVITE_EMAIL, TEST_ENDORSED_MEMBER } = await import('./constants')

  const testEmails = [
    TEST_ADMIN.email,
    TEST_MEMBER.email,
    TEST_INVITE_EMAIL,
    TEST_ENDORSED_MEMBER.email,
  ]

  // Delete vcx data first (foreign key constraints)
  for (const email of testEmails) {
    await admin.from('vcx_invites').delete().eq('email', email)
    await admin.from('vcx_recommendations').delete().eq('recommended_email', email)
    await admin.from('vcx_members').delete().eq('email', email)
  }

  // Delete auth users
  const { data: { users } } = await admin.auth.admin.listUsers()
  for (const user of users || []) {
    if (testEmails.includes(user.email || '')) {
      await admin.auth.admin.deleteUser(user.id)
    }
  }
}
