import { createClient } from '@/lib/supabase/server'

export type VcxUser = {
  id: string
  name: string
  email: string
  memberTier: 'core' | 'endorsed'
  systemRole: 'super_admin' | 'admin' | 'member'
  avatarUrl: string | null
} | null

export async function getVcxUser(): Promise<VcxUser> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: member } = await supabase
      .from('vcx_members')
      .select('id, name, email, member_tier, system_role, avatar_url')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (!member) return null

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      memberTier: member.member_tier as 'core' | 'endorsed',
      systemRole: member.system_role as 'super_admin' | 'admin' | 'member',
      avatarUrl: member.avatar_url,
    }
  } catch (error) {
    // Distinguish auth errors from network/connectivity errors
    if (error instanceof Error && (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('ECONNREFUSED')
    )) {
      console.error('Supabase connectivity error:', error.message)
    }
    return null
  }
}

export function isAdmin(user: VcxUser): boolean {
  return user !== null && (user.systemRole === 'admin' || user.systemRole === 'super_admin')
}
