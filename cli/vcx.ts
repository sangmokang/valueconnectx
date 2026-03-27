#!/usr/bin/env node
/**
 * VCX CLI — ValueConnect X 커맨드라인 인터페이스
 * Usage: npx tsx cli/vcx.ts <command> [options]
 *        npm run vcx <command> [options]
 */

import { getSupabase, printTable, trunc, c, colors } from './utils.js'

// Load .env.local
import { readFileSync, existsSync } from 'node:fs'

function loadEnv() {
  const envPath = new URL('../.env.local', import.meta.url).pathname
  if (!existsSync(envPath)) return
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 0) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnv()

// ── Commands ────────────────────────────────────────────────────────────────

async function cmdJobs() {
  const supabase = getSupabase()
  console.log(c('cyan', '\n  VCX 활성 포지션 목록\n'))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('positions')
    .select('id, title, company, segment, platforms, position_url, is_new_this_week, snapshot_date')
    .order('snapshot_date', { ascending: false })
    .limit(20)

  if (error) {
    console.error(c('red', `오류: ${error.message}`))
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.log(c('dim', '  포지션이 없습니다.'))
    return
  }

  const rows = data.map((p: {
    title: string
    company: string
    segment: string | null
    platforms: string[] | null
    position_url: string | null
    is_new_this_week: boolean
  }, i: number) => [
    String(i + 1),
    trunc(p.title, 30),
    trunc(p.company, 20),
    trunc(p.segment, 15),
    trunc((p.platforms ?? []).join(', '), 12),
    p.is_new_this_week ? c('green', 'NEW') : '',
  ])

  printTable(['#', '포지션', '회사', '분야', '플랫폼', '신규'], rows)
  console.log(c('dim', `\n  총 ${data.length}개 포지션\n`))
}

async function cmdCoffee() {
  const supabase = getSupabase()
  console.log(c('cyan', '\n  VCX 활성 커피챗 목록\n'))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = supabase as any

  const [ceoResult, peerResult] = await Promise.all([
    supa
      .from('vcx_ceo_coffee_sessions')
      .select('id, title, tags, status, host:vcx_corporate_users(name, company)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(10),
    supa
      .from('peer_coffee_chats')
      .select('id, title, category, status, author:vcx_members(name, current_company)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const ceoData = ceoResult.error ? [] : (ceoResult.data ?? [])
  const peerData = peerResult.error ? [] : (peerResult.data ?? [])

  if (ceoResult.error) {
    console.log(c('dim', `  CEO 커피챗 조회 불가: ${ceoResult.error.message}`))
  }
  if (peerResult.error) {
    console.log(c('dim', `  Peer 커피챗 조회 불가: ${peerResult.error.message}`))
  }

  const ceoRows = ceoData.map((s: {
    title: string
    tags: string[]
    host: { name: string; company: string } | null
  }, i: number) => [
    String(i + 1),
    c('yellow', 'CEO'),
    trunc(s.title, 30),
    trunc(s.host?.name ?? '-', 15),
    trunc(s.host?.company ?? '-', 15),
    trunc((s.tags ?? []).join(', '), 20),
  ])

  const peerRows = peerData.map((p: {
    title: string
    category: string
    author: { name: string; current_company: string | null } | null
  }, i: number) => [
    String(ceoRows.length + i + 1),
    c('green', 'Peer'),
    trunc(p.title, 30),
    trunc(p.author?.name ?? '-', 15),
    trunc(p.author?.current_company ?? '-', 15),
    trunc(p.category, 20),
  ])

  const rows = [...ceoRows, ...peerRows]

  if (rows.length === 0) {
    console.log(c('dim', '  활성 커피챗이 없습니다. (테이블이 아직 생성되지 않았을 수 있습니다)'))
    return
  }

  printTable(['#', '타입', '제목', '호스트', '회사', '분야/태그'], rows)
  console.log(c('dim', `\n  CEO ${ceoRows.length}개 / Peer ${peerRows.length}개\n`))
}

async function cmdConnect(args: string[]) {
  const supabase = getSupabase()

  // Parse flags: --field <value> --open
  let fieldFilter: string | null = null
  let openOnly = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--field' && args[i + 1]) {
      fieldFilter = args[++i]
    } else if (args[i] === '--open') {
      openOnly = true
    }
  }

  console.log(c('cyan', '\n  VCX 멤버 검색\n'))

  const { data, error } = await supabase
    .from('vcx_members')
    .select('id, name, current_company, title, professional_fields, member_tier, is_active')
    .eq('is_active', true)
    .order('join_date', { ascending: false })
    .limit(20)

  if (error) {
    console.error(c('red', `오류: ${error.message}`))
    process.exit(1)
  }

  let members = data ?? []

  // Client-side field filter (array contains)
  if (fieldFilter) {
    const lower = fieldFilter.toLowerCase()
    members = members.filter((m: { professional_fields: string[] }) =>
      (m.professional_fields ?? []).some((f: string) => f.toLowerCase().includes(lower))
    )
  }

  if (openOnly) {
    console.log(c('dim', '  (--open 필터는 현재 DB 스키마에서 지원되지 않습니다)'))
  }

  if (members.length === 0) {
    console.log(c('dim', '  검색 결과가 없습니다.'))
    return
  }

  const rows = members.map((m: {
    name: string
    current_company: string | null
    title: string | null
    professional_fields: string[]
    member_tier: string
  }, i: number) => [
    String(i + 1),
    trunc(m.name, 15),
    trunc(m.current_company, 20),
    trunc(m.title, 20),
    trunc((m.professional_fields ?? []).join(', '), 25),
    m.member_tier === 'core' ? c('yellow', 'Core') : c('cyan', 'Endorsed'),
  ])

  printTable(['#', '이름', '회사', '직함', '전문 분야', '등급'], rows)
  console.log(c('dim', `\n  총 ${members.length}명\n`))
}

async function cmdMe() {
  const supabase = getSupabase()
  console.log(c('cyan', '\n  내 프로필\n'))

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error(c('red', '인증되지 않은 사용자입니다.'))
    console.error(c('dim', '  SUPABASE_AUTH_TOKEN 환경변수를 설정하거나 로그인 후 다시 시도하세요.'))
    process.exit(1)
  }

  const { data: member, error } = await supabase
    .from('vcx_members')
    .select('name, email, current_company, title, professional_fields, member_tier, join_date')
    .eq('id', user.id)
    .single()

  if (error || !member) {
    console.error(c('red', '프로필을 찾을 수 없습니다.'))
    process.exit(1)
  }

  const lines = [
    ['이름', member.name],
    ['이메일', member.email ?? user.email ?? '-'],
    ['회사', member.current_company ?? '-'],
    ['직함', member.title ?? '-'],
    ['분야', (member.professional_fields ?? []).join(', ') || '-'],
    ['등급', member.member_tier === 'core' ? c('yellow', 'Core') : c('cyan', 'Endorsed')],
    ['가입일', member.join_date ?? '-'],
  ]

  const labelWidth = Math.max(...lines.map(([l]) => l.length))
  lines.forEach(([label, val]) => {
    console.log(`  ${c('bold', label.padEnd(labelWidth))}  ${val}`)
  })
  console.log()

  // Recommended positions (simple: latest positions)
  console.log(c('cyan', '\n  추천 포지션 (최신 3개)\n'))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: positions } = await (supabase as any)
    .from('positions')
    .select('title, company, segment, position_url')
    .order('snapshot_date', { ascending: false })
    .limit(3)

  if (!positions || positions.length === 0) {
    console.log(c('dim', '  현재 추천 포지션이 없습니다.'))
  } else {
    positions.forEach((p: { title: string; company: string; segment: string | null; position_url: string | null }, i: number) => {
      console.log(`  ${c('bold', String(i + 1))}. ${p.title} @ ${p.company}${p.segment ? ` (${p.segment})` : ''}`)
      if (p.position_url) console.log(`     ${c('dim', p.position_url)}`)
    })
  }
  console.log()
}

function printHelp() {
  console.log(`
${colors.bold}${colors.cyan}VCX CLI${colors.reset} — ValueConnect X 커맨드라인 인터페이스

${colors.bold}사용법:${colors.reset}
  npm run vcx <command> [options]
  npx tsx cli/vcx.ts <command> [options]

${colors.bold}커맨드:${colors.reset}
  ${c('green', 'jobs')}              활성 포지션 목록 조회
  ${c('green', 'coffee')}            활성 커피챗 목록 조회 (CEO + Peer)
  ${c('green', 'connect')}           멤버 검색
    ${c('dim', '--field <분야>')}    전문 분야로 필터링 (예: --field Engineering)
    ${c('dim', '--open')}            커피챗 가능한 멤버만
  ${c('green', 'me')}                내 프로필 + 추천 포지션

${colors.bold}예시:${colors.reset}
  npm run vcx jobs
  npm run vcx coffee
  npm run vcx connect --field Engineering --open
  npm run vcx me

${colors.bold}환경변수:${colors.reset}
  NEXT_PUBLIC_SUPABASE_URL      Supabase 프로젝트 URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY Supabase anon 키
  (.env.local 파일에서 자동 로드)
`)
}

// ── Main ─────────────────────────────────────────────────────────────────────

const [, , command, ...rest] = process.argv

switch (command) {
  case 'jobs':
    cmdJobs().catch((e) => { console.error(c('red', String(e))); process.exit(1) })
    break
  case 'coffee':
    cmdCoffee().catch((e) => { console.error(c('red', String(e))); process.exit(1) })
    break
  case 'connect':
    cmdConnect(rest).catch((e) => { console.error(c('red', String(e))); process.exit(1) })
    break
  case 'me':
    cmdMe().catch((e) => { console.error(c('red', String(e))); process.exit(1) })
    break
  case '--help':
  case '-h':
  case 'help':
  case undefined:
    printHelp()
    break
  default:
    console.error(c('red', `알 수 없는 커맨드: ${command}`))
    printHelp()
    process.exit(1)
}
