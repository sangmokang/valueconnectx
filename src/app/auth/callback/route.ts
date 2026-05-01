import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sanitizeRedirect } from '@/lib/auth/routes'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

function getUserName(user: User) {
  const metadata = user.user_metadata ?? {}
  const name = typeof metadata.name === 'string' ? metadata.name.trim() : ''
  const fullName = typeof metadata.full_name === 'string' ? metadata.full_name.trim() : ''
  return name || fullName || user.email?.split('@')[0] || 'VCX Member'
}

async function completeInviteSignup(supabase: SupabaseClient<Database>) {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.email) return '/signup?error=magic-link'

  const { data: existingMember } = await supabase
    .from('vcx_members')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existingMember) return null

  const adminClient = createAdminClient()
  const email = user.email.trim().toLowerCase()
  const now = new Date().toISOString()

  const { data: invite, error: inviteError } = await adminClient
    .from('vcx_invites')
    .select('id, email, member_tier, invited_by, invited_by_name, recommendation_id, expires_at')
    .ilike('email', email)
    .eq('status', 'pending')
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (inviteError || !invite) return '/signup?error=invite-required'

  let endorsedBy: string | null = null
  let endorsedByName: string | null = null

  if (invite.recommendation_id) {
    const { data: recommendation } = await adminClient
      .from('vcx_recommendations')
      .select('recommender_id')
      .eq('id', invite.recommendation_id)
      .single()

    if (recommendation) {
      const { data: recommender } = await adminClient
        .from('vcx_members')
        .select('id, name')
        .eq('id', recommendation.recommender_id)
        .single()

      if (recommender) {
        endorsedBy = recommender.id
        endorsedByName = recommender.name
      }
    }
  }

  const { error: memberError } = await adminClient.from('vcx_members').insert({
    id: user.id,
    name: getUserName(user),
    email,
    member_tier: invite.member_tier,
    system_role: 'member',
    endorsed_by: invite.member_tier === 'endorsed' ? endorsedBy : null,
    endorsed_by_name: invite.member_tier === 'endorsed' ? endorsedByName : null,
  })

  if (memberError) {
    console.error('Magic link signup member insert failed:', memberError.message)
    return '/signup?error=profile'
  }

  await adminClient
    .from('vcx_invites')
    .update({ status: 'accepted', accepted_at: now })
    .eq('id', invite.id)

  return null
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = sanitizeRedirect(requestUrl.searchParams.get('next'))
  const type = requestUrl.searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      if (type === 'signup') {
        const signupErrorRedirect = await completeInviteSignup(supabase)
        if (signupErrorRedirect) {
          return NextResponse.redirect(new URL(signupErrorRedirect, requestUrl.origin))
        }
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  const loginUrl = new URL('/login', requestUrl.origin)
  loginUrl.searchParams.set('error', 'magic-link')
  return NextResponse.redirect(loginUrl)
}
