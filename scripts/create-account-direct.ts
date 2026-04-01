/**
 * 테스트용 계정 직접 생성 (rate limit 우회)
 * 실행: npx tsx scripts/create-account-direct.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(__dirname, '../.env.local')
try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex)
    const value = trimmed.slice(eqIndex + 1)
    if (!process.env[key]) process.env[key] = value
  }
} catch {}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const EMAIL = 'sangmokang@valueconnect.kr'
const PASSWORD = 'valuevcx1'
const NAME = '강상모'
const LINKEDIN = 'https://linkedin.com/in/sangmokang'

async function main() {
  console.log(`\n🔧 계정 직접 생성: ${EMAIL}\n`)

  // 기존 데이터 정리
  const { data: existingMember } = await admin.from('vcx_members').select('id').eq('email', EMAIL).single()
  if (existingMember) {
    await admin.from('vcx_members').delete().eq('email', EMAIL)
    console.log('  기존 멤버 삭제')
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: authUsers } = await admin.auth.admin.listUsers({ filter: `email.eq.${EMAIL}` } as any)
  const existing = authUsers?.users?.[0]
  if (existing) {
    await admin.auth.admin.deleteUser(existing.id)
    console.log('  기존 auth 유저 삭제')
  }

  // 1. Auth 유저 생성
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  })
  if (createError) { console.error('❌ Auth 유저 생성 실패:', createError.message); process.exit(1) }
  console.log(`  ✅ Auth 유저 생성: ${newUser.user.id}`)

  // 2. 멤버 레코드 생성 (프로필 미완성 → 온보딩으로 리다이렉트됨)
  const { error: memberError } = await admin.from('vcx_members').insert({
    id: newUser.user.id,
    name: NAME,
    email: EMAIL,
    member_tier: 'core',
    system_role: 'member',
    linkedin_url: LINKEDIN,
    // current_company, title 은 비워둠 → 온보딩 강제
  })
  if (memberError) { console.error('❌ 멤버 생성 실패:', memberError.message); process.exit(1) }
  console.log('  ✅ 멤버 레코드 생성 (프로필 미완성 → 온보딩)')

  // 초대 상태 업데이트
  await admin.from('vcx_invites').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('email', EMAIL).eq('status', 'pending')

  console.log('\n─────────────────────────────────────')
  console.log(`  이메일:    ${EMAIL}`)
  console.log(`  비밀번호:  ${PASSWORD}`)
  console.log(`  LinkedIn:  ${LINKEDIN}`)
  console.log('─────────────────────────────────────')
  console.log('\n🔗 로그인: http://localhost:3000/login')
  console.log('   → 로그인 후 온보딩(프로필 완성) 페이지로 이동합니다.\n')
}

main().catch(err => { console.error('❌', err); process.exit(1) })
