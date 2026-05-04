import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('vcx_members')
    .update({
      current_company: 'ValueConnect X',
      current_role: '관리자',
      bio: 'E2E 테스트 관리자 계정입니다.',
      linkedin_url: 'https://www.linkedin.com/in/e2e-admin',
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('email', 'e2e-admin@vcx-test.com')
    .select()

  if (error) {
    console.log('Update error:', error.message)
    // Try to see what columns exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: member } = await (admin as any)
      .from('vcx_members')
      .select('*')
      .eq('email', 'e2e-admin@vcx-test.com')
      .single()
    console.log('Member columns:', member ? Object.keys(member) : 'not found')
  } else {
    console.log('✅ Onboarding completed:', data)
  }
}

main().catch(console.error)
