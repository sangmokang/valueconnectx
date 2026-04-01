/**
 * 테스트용 초대 생성 스크립트
 *
 * 실행: npx tsx scripts/create-invite.ts
 * 환경변수: .env.local에서 자동 로드
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// .env.local 수동 파싱
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
} catch { /* .env.local 없으면 환경변수에서 직접 읽기 */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경변수 필요')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const EMAIL = 'sangmokang@valueconnect.kr'
const MEMBER_TIER = 'core' as const

async function main() {
  console.log(`\n📧 초대 생성: ${EMAIL}\n`)

  // 1. 기존 초대 정리 (pending 상태만)
  await admin.from('vcx_invites').delete().eq('email', EMAIL).eq('status', 'pending')

  // 2. 기존 멤버/유저 확인
  const { data: existingMember } = await admin.from('vcx_members').select('id').eq('email', EMAIL).single()
  if (existingMember) {
    console.log('⚠️  이미 가입된 멤버입니다. 기존 데이터를 정리합니다...')
    await admin.from('vcx_members').delete().eq('email', EMAIL)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: authUsers } = await admin.auth.admin.listUsers({ filter: `email.eq.${EMAIL}` } as any)
    const existing = authUsers?.users?.[0]
    if (existing) {
      await admin.auth.admin.deleteUser(existing.id)
      console.log('   auth 유저 삭제 완료')
    }
  }

  // 3. 초대자 찾기 (아무 admin 또는 첫 번째 멤버)
  const { data: inviter } = await admin
    .from('vcx_members')
    .select('id, name')
    .in('system_role', ['admin', 'super_admin'])
    .limit(1)
    .single()

  let inviterId: string
  let inviterName: string

  if (inviter) {
    inviterId = inviter.id
    inviterName = inviter.name
  } else {
    // admin이 없으면 아무 멤버
    const { data: anyMember } = await admin.from('vcx_members').select('id, name').limit(1).single()
    if (anyMember) {
      inviterId = anyMember.id
      inviterName = anyMember.name
    } else {
      console.error('❌ 초대자로 사용할 기존 멤버가 없습니다. seed-dummy-data를 먼저 실행해주세요.')
      process.exit(1)
    }
  }

  // 4. 토큰 생성
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7일

  // 5. 초대 레코드 삽입
  const { error: insertError } = await admin.from('vcx_invites').insert({
    email: EMAIL,
    invited_by: inviterId,
    invited_by_name: inviterName,
    member_tier: MEMBER_TIER,
    status: 'pending',
    token_hash: tokenHash,
    expires_at: expiresAt,
  })

  if (insertError) {
    console.error('❌ 초대 생성 실패:', insertError.message)
    process.exit(1)
  }

  // 6. 결과 출력
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/invite/accept?token=${token}`

  console.log('✅ 초대 생성 완료!\n')
  console.log('─────────────────────────────────────')
  console.log(`  이메일:    ${EMAIL}`)
  console.log(`  비밀번호:  valuevcx1 (수락 시 입력)`)
  console.log(`  등급:      ${MEMBER_TIER}`)
  console.log(`  초대자:    ${inviterName}`)
  console.log(`  만료:      7일`)
  console.log('─────────────────────────────────────')
  console.log(`\n🔗 초대 수락 링크:\n   ${inviteUrl}\n`)
  console.log('위 링크를 브라우저에서 열어 가입을 진행하세요.')
  console.log('비밀번호: valuevcx1\n')
}

main().catch((err) => {
  console.error('❌ 스크립트 오류:', err)
  process.exit(1)
})
