/**
 * ValueConnect X — 실제 운영 수준 더미 데이터 시드 스크립트
 *
 * 실행: npx tsx scripts/seed-dummy-data.ts
 * 정리: npx tsx scripts/seed-dummy-data.ts --cleanup
 *
 * 환경변수: .env.local에서 자동 로드
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// .env.local 수동 파싱 (dotenv 미설치 대비)
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
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env.local')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── 더미 데이터 정의 ─────────────────────────────────────────

const SEED_PASSWORD = 'VcxSeed2026!'
const SEED_EMAIL_DOMAIN = 'vcx-seed.com'

// 멤버 프로필 (한국 IT 업계 실제와 유사한 이름/회사/직함)
const MEMBERS_DATA = [
  // super_admin
  {
    name: '강상모', email: `admin@${SEED_EMAIL_DOMAIN}`, tier: 'core', role: 'super_admin',
    company: 'ValueConnect', title: 'CTO & Co-founder',
    fields: ['Engineering', 'Product'], years: 15, industry: 'IT/소프트웨어', location: '서울 강남',
    bio: 'ValueConnect X를 만들고 있습니다. 핵심 인재와 기업 리더를 연결하는 것이 미션입니다. 전 카카오, 네이버 출신.',
    visibility: 'all', openToChat: true,
  },
  // admin
  {
    name: '김서연', email: `seoyeon@${SEED_EMAIL_DOMAIN}`, tier: 'core', role: 'admin',
    company: 'ValueConnect', title: 'Head of Operations',
    fields: ['Operations', 'HR'], years: 12, industry: 'IT/소프트웨어', location: '서울 강남',
    bio: '커뮤니티 운영과 인재 검증을 책임지고 있습니다. 전 리멤버, 원티드 커뮤니티 매니저 출신.',
    visibility: 'all', openToChat: true,
  },
  // core members
  {
    name: '박지훈', email: `jihoon.park@${SEED_EMAIL_DOMAIN}`, tier: 'core', role: 'member',
    company: '토스', title: 'VP of Engineering',
    fields: ['Engineering', 'Product'], years: 14, industry: 'IT/소프트웨어', location: '서울 강남',
    bio: '토스에서 결제 플랫폼 엔지니어링을 리드하고 있습니다. 대규모 트래픽 처리와 마이크로서비스 아키텍처 전문. 전 네이버페이, 삼성전자 출신.',
    visibility: 'all', openToChat: true,
  },
  {
    name: '이현아', email: `hyuna.lee@${SEED_EMAIL_DOMAIN}`, tier: 'core', role: 'member',
    company: '쿠팡', title: 'Director of Data Science',
    fields: ['Data', 'Engineering'], years: 11, industry: 'IT/소프트웨어', location: '서울 송파',
    bio: '쿠팡 추천 알고리즘과 검색 랭킹을 총괄하고 있습니다. Stanford CS PhD, 전 Google Research 출신.',
    visibility: 'all', openToChat: true,
  },
  {
    name: '정민수', email: `minsu.jung@${SEED_EMAIL_DOMAIN}`, tier: 'core', role: 'member',
    company: '크래프톤', title: 'Head of Product',
    fields: ['Product', 'Design'], years: 13, industry: 'IT/소프트웨어', location: '서울 강남',
    bio: '배틀그라운드 글로벌 프로덕트를 리드했습니다. B2C 프로덕트 매니지먼트 10년+. 전 라인, NHN 출신.',
    visibility: 'members_only', openToChat: true,
  },
  {
    name: '한소희', email: `sohee.han@${SEED_EMAIL_DOMAIN}`, tier: 'core', role: 'member',
    company: '당근', title: 'Head of Design',
    fields: ['Design', 'Product'], years: 10, industry: 'IT/소프트웨어', location: '서울 서초',
    bio: '당근마켓의 디자인 시스템과 UX를 총괄합니다. 사용자 중심 설계와 디자인 리더십에 관심이 많습니다. 전 카카오, 삼성전자 출신.',
    visibility: 'all', openToChat: false,
  },
  {
    name: '최우진', email: `woojin.choi@${SEED_EMAIL_DOMAIN}`, tier: 'core', role: 'member',
    company: '두나무', title: 'CTO',
    fields: ['Engineering', 'Data'], years: 16, industry: '금융/핀테크', location: '서울 강남',
    bio: '업비트의 거래 엔진과 인프라를 설계했습니다. 블록체인, 분산 시스템, 고성능 금융 시스템 전문. 전 삼성 SDS, Goldman Sachs 출신.',
    visibility: 'all', openToChat: true,
  },
  {
    name: '윤채원', email: `chaewon.yoon@${SEED_EMAIL_DOMAIN}`, tier: 'core', role: 'member',
    company: '뱅크샐러드', title: 'CPO',
    fields: ['Product', 'Data'], years: 12, industry: '금융/핀테크', location: '서울 강남',
    bio: '데이터 기반 금융 상품 추천 프로덕트를 만듭니다. 핀테크 업계에서 PO/PM 커리어 10년+. 전 카카오뱅크, 토스 출신.',
    visibility: 'corporate_only', openToChat: true,
  },
  // endorsed members
  {
    name: '김태영', email: `taeyoung.kim@${SEED_EMAIL_DOMAIN}`, tier: 'endorsed', role: 'member',
    company: '네이버', title: 'Senior Software Engineer',
    fields: ['Engineering'], years: 7, industry: 'IT/소프트웨어', location: '성남 분당',
    bio: '네이버 검색 백엔드를 담당하고 있습니다. 대규모 분산 시스템과 검색 엔진에 관심이 많습니다.',
    visibility: 'all', openToChat: true,
  },
  {
    name: '이수빈', email: `subin.lee@${SEED_EMAIL_DOMAIN}`, tier: 'endorsed', role: 'member',
    company: '카카오', title: 'Product Manager',
    fields: ['Product', 'Marketing'], years: 6, industry: 'IT/소프트웨어', location: '성남 판교',
    bio: '카카오톡 비즈니스 기능 PM을 맡고 있습니다. 사용자 리텐션과 그로스 해킹에 관심이 많습니다.',
    visibility: 'all', openToChat: true,
  },
  {
    name: '박준혁', email: `junhyuk.park@${SEED_EMAIL_DOMAIN}`, tier: 'endorsed', role: 'member',
    company: '리디', title: 'Frontend Lead',
    fields: ['Engineering', 'Design'], years: 8, industry: '미디어/콘텐츠', location: '서울 강남',
    bio: '리디의 웹/앱 프론트엔드를 리드합니다. React, Next.js, 디자인 시스템 구축 전문. 오픈소스 기여 활발.',
    visibility: 'all', openToChat: true,
  },
  {
    name: '신예린', email: `yerin.shin@${SEED_EMAIL_DOMAIN}`, tier: 'endorsed', role: 'member',
    company: '마이리얼트립', title: 'Data Analyst',
    fields: ['Data', 'Marketing'], years: 5, industry: '스타트업', location: '서울 마포',
    bio: '여행 플랫폼의 데이터 분석과 마케팅 최적화를 담당합니다. SQL, Python, Tableau 활용 능력.',
    visibility: 'members_only', openToChat: false,
  },
  {
    name: '오동현', email: `donghyun.oh@${SEED_EMAIL_DOMAIN}`, tier: 'endorsed', role: 'member',
    company: '번개장터', title: 'Backend Engineer',
    fields: ['Engineering'], years: 4, industry: 'IT/소프트웨어', location: '서울 성수',
    bio: '중고거래 플랫폼의 결제/정산 시스템을 개발하고 있습니다. Kotlin, Spring Boot, AWS 스택.',
    visibility: 'all', openToChat: true,
  },
  {
    name: '장하은', email: `haeun.jang@${SEED_EMAIL_DOMAIN}`, tier: 'endorsed', role: 'member',
    company: '센드버드', title: 'DevRel Engineer',
    fields: ['Engineering', 'Marketing'], years: 6, industry: 'IT/소프트웨어', location: '서울 강남',
    bio: '개발자 경험(DX)과 기술 커뮤니티 성장에 집중합니다. API 설계, 기술 문서, 개발자 교육 전문.',
    visibility: 'all', openToChat: true,
  },
  {
    name: '류성준', email: `sungjun.ryu@${SEED_EMAIL_DOMAIN}`, tier: 'endorsed', role: 'member',
    company: '힐링페이퍼', title: 'iOS Developer',
    fields: ['Engineering', 'Design'], years: 5, industry: '의료/헬스케어', location: '서울 역삼',
    bio: '강남언니 iOS 앱을 개발합니다. Swift, SwiftUI, 접근성에 관심이 많습니다.',
    visibility: 'all', openToChat: true,
  },
]

// 기업 사용자
const CORPORATE_USERS_DATA = [
  {
    name: '이재용', email: `jaeyong.lee@${SEED_EMAIL_DOMAIN}`,
    company: '퓨처밸리 벤처스', corpRole: 'ceo', title: 'CEO & Managing Partner',
  },
  {
    name: '김수진', email: `sujin.kim@${SEED_EMAIL_DOMAIN}`,
    company: '스타트업얼라이언스', corpRole: 'founder', title: 'Founder & CEO',
  },
  {
    name: '박현우', email: `hyunwoo.park@${SEED_EMAIL_DOMAIN}`,
    company: '카카오엔터프라이즈', corpRole: 'c_level', title: 'CHRO (Chief HR Officer)',
  },
  {
    name: '정은지', email: `eunji.jung@${SEED_EMAIL_DOMAIN}`,
    company: '야놀자', corpRole: 'ceo', title: 'CEO',
  },
  {
    name: '홍길동', email: `gildong.hong@${SEED_EMAIL_DOMAIN}`,
    company: '무신사', corpRole: 'hr_leader', title: 'Head of People & Culture',
  },
  {
    name: '서민재', email: `minjae.seo@${SEED_EMAIL_DOMAIN}`,
    company: '비바리퍼블리카', corpRole: 'founder', title: 'Co-founder & CPO',
  },
]

// ─── 유틸리티 ──────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function preflightSchemaCheck() {
  const requiredTables = [
    'vcx_members',
    'vcx_corporate_users',
    'vcx_ceo_coffee_sessions',
    'vcx_coffee_applications',
    'peer_coffee_chats',
    'peer_coffee_applications',
    'community_posts',
    'community_comments',
    'vcx_community_reactions',
    'positions',
    'position_interests',
    'vcx_notifications',
  ] as const

  const missing: string[] = []
  for (const t of requiredTables) {
    const { error } = await admin.from(t as any).select('*', { head: true, count: 'exact' }).limit(1)
    if (error) missing.push(t)
  }

  if (missing.length > 0) {
    console.error('\n❌ Supabase 스키마가 최신 상태가 아닙니다.')
    console.error('다음 테이블이 존재하지 않습니다:', missing.join(', '))
    console.error('\n해결: Supabase 프로젝트 SQL Editor에서 아래 파일 전체를 실행해 마이그레이션을 적용하세요:')
    console.error(' - scripts/apply-migrations.sql')
    console.error('\n또는 supabase CLI를 사용 중이라면, 마이그레이션을 원격 DB에 반영하세요.')
    console.error('자세한 안내: docs/demo-site-setup.md')
    process.exit(1)
  }
}

async function createAuthUser(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    if (error.message?.includes('already been registered')) {
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existing = users?.find((u) => u.email === email)
      if (existing) return existing.id
    }
    throw new Error(`Auth user creation failed for ${email}: ${error.message}`)
  }
  return data.user.id
}

// ─── 메인 시드 함수 ────────────────────────────────────────────

async function seed() {
  console.log('🌱 ValueConnect X 더미 데이터 시딩 시작...\n')

  // 스키마 사전 점검
  await preflightSchemaCheck()

  // ── 1. Auth Users + vcx_members ──
  console.log('👤 멤버 계정 생성 중...')
  const memberIds: string[] = []
  const memberMap: Record<string, typeof MEMBERS_DATA[0] & { id: string }> = {}

  for (const m of MEMBERS_DATA) {
    const id = await createAuthUser(admin, m.email, SEED_PASSWORD)
    memberIds.push(id)
    memberMap[m.email] = { ...m, id }

    const { error } = await admin.from('vcx_members').upsert({
      id,
      name: m.name,
      email: m.email,
      current_company: m.company,
      title: m.title,
      professional_fields: m.fields,
      years_of_experience: m.years,
      bio: m.bio,
      member_tier: m.tier,
      system_role: m.role,
      industry: m.industry,
      location: m.location,
      is_open_to_chat: m.openToChat,
      profile_visibility: m.visibility,
      is_active: true,
      linkedin_url: `https://linkedin.com/in/${m.email.split('@')[0]}`,
      join_date: daysAgo(Math.floor(Math.random() * 180) + 30),
    }, { onConflict: 'id' })

    if (error) console.warn(`  ⚠️ ${m.name}: ${error.message}`)
    else console.log(`  ✅ ${m.name} (${m.tier}/${m.role}) — ${m.company}`)
  }

  // endorsed_by 설정 (endorsed 멤버 → core 멤버가 추천)
  const coreMembers = Object.values(memberMap).filter((m) => m.tier === 'core')
  const endorsedMembers = Object.values(memberMap).filter((m) => m.tier === 'endorsed')

  for (const em of endorsedMembers) {
    const endorser = pick(coreMembers)
    await admin.from('vcx_members').update({
      endorsed_by: endorser.id,
      endorsed_by_name: endorser.name,
    }).eq('id', em.id)
  }
  console.log(`  🔗 ${endorsedMembers.length}명 endorsed 멤버에 추천인 연결 완료\n`)

  // ── 2. Auth Users + vcx_corporate_users ──
  console.log('🏢 기업 사용자 생성 중...')
  const corpIds: string[] = []
  const corpMap: Record<string, typeof CORPORATE_USERS_DATA[0] & { id: string }> = {}

  for (const c of CORPORATE_USERS_DATA) {
    const id = await createAuthUser(admin, c.email, SEED_PASSWORD)
    corpIds.push(id)
    corpMap[c.email] = { ...c, id }

    const { error } = await admin.from('vcx_corporate_users').upsert({
      id,
      name: c.name,
      email: c.email,
      company: c.company,
      role: c.corpRole,
      title: c.title,
      is_verified: true,
    }, { onConflict: 'id' })

    if (error) console.warn(`  ⚠️ ${c.name}: ${error.message}`)
    else console.log(`  ✅ ${c.name} (${c.corpRole}) — ${c.company}`)
  }
  console.log()

  // ── 3. Recommendations ──
  console.log('📝 추천서 생성 중...')
  const recommendationIds: string[] = []
  const pendingRecommendations = [
    { recommender: coreMembers[0], name: '조민기', email: `mingi.jo@${SEED_EMAIL_DOMAIN}`, reason: '전 동료로, 백엔드 아키텍처에 탁월한 역량을 보유하고 있습니다. 대규모 서비스 경험이 풍부합니다.', tier: 'endorsed' },
    { recommender: coreMembers[1], name: '임수아', email: `sua.lim@${SEED_EMAIL_DOMAIN}`, reason: '마케팅 전략 수립과 브랜딩에 뛰어난 인재입니다. 스타트업 그로스 경험이 인상적입니다.', tier: 'endorsed' },
    { recommender: coreMembers[2], name: '강도윤', email: `doyoon.kang@${SEED_EMAIL_DOMAIN}`, reason: '함께 프로젝트를 진행한 PM으로, 이해관계자 관리와 실행력이 뛰어납니다.', tier: 'core' },
  ]

  for (const rec of pendingRecommendations) {
    const recId = randomUUID()
    recommendationIds.push(recId)
    const { error } = await admin.from('vcx_recommendations').insert({
      id: recId,
      recommender_id: rec.recommender.id,
      recommended_email: rec.email,
      recommended_name: rec.name,
      reason: rec.reason,
      member_tier: rec.tier,
      status: 'pending',
      created_at: daysAgo(Math.floor(Math.random() * 7) + 1),
    })
    if (error) console.warn(`  ⚠️ ${rec.name}: ${error.message}`)
    else console.log(`  ✅ ${rec.recommender.name} → ${rec.name} (pending)`)
  }

  // 승인된 추천 (endorsed 멤버들에 대한 과거 추천)
  for (let i = 0; i < Math.min(3, endorsedMembers.length); i++) {
    const em = endorsedMembers[i]
    const endorser = coreMembers[i % coreMembers.length]
    const recId = randomUUID()
    const adminMember = Object.values(memberMap).find(m => m.role === 'admin' || m.role === 'super_admin')!
    await admin.from('vcx_recommendations').insert({
      id: recId,
      recommender_id: endorser.id,
      recommended_email: em.email,
      recommended_name: em.name,
      reason: `${em.name}님은 ${em.company}에서 ${em.title}로 활약 중이며, ${em.fields.join(', ')} 분야에서 역량이 검증되었습니다.`,
      member_tier: 'endorsed',
      status: 'approved',
      reviewed_by: adminMember.id,
      reviewed_at: daysAgo(60 + i * 10),
      created_at: daysAgo(65 + i * 10),
    })
  }
  console.log(`  🔗 승인된 과거 추천 3건 생성\n`)

  // ── 4. CEO Coffee Sessions ──
  console.log('☕ CEO 커피챗 세션 생성 중...')
  const ceoFounders = Object.values(corpMap).filter((c) => c.corpRole === 'ceo' || c.corpRole === 'founder')
  const sessionIds: string[] = []

  const sessions = [
    {
      host: ceoFounders[0], title: '시리즈 A 이후 엔지니어링 조직 빌딩',
      desc: '시리즈 A 투자를 받은 후 엔지니어링 조직을 어떻게 구축하는지 경험을 나누고 싶습니다. VP of Engineering 채용, 기술 로드맵 수립, 개발 문화 정립에 대해 이야기해요.',
      date: daysFromNow(7), locType: 'online', locDetail: 'Google Meet', status: 'open', tier: 'all',
      tags: ['조직빌딩', '시리즈A', '엔지니어링리더십'],
    },
    {
      host: ceoFounders[1], title: '스타트업 생태계 2026 트렌드',
      desc: '2026년 국내 스타트업 생태계의 주요 트렌드와 투자 환경에 대해 솔직하게 이야기합니다. AI, 핀테크, 헬스케어 분야에 관심 있는 분 환영.',
      date: daysFromNow(14), locType: 'offline', locDetail: '서울 강남구 테헤란로 152, 1층 카페', status: 'open', tier: 'core',
      tags: ['스타트업트렌드', '투자', 'AI'],
    },
    {
      host: ceoFounders[2], title: '여행 산업의 디지털 혁신',
      desc: '코로나 이후 여행 산업이 어떻게 디지털 전환을 이루었는지, 앞으로의 방향성에 대해 나눕니다. 프로덕트/데이터 분야 전문가와 깊이 있는 대화를 원합니다.',
      date: daysFromNow(3), locType: 'hybrid', locDetail: '야놀자 본사 (온/오프라인 동시)', status: 'open', tier: 'all',
      tags: ['여행산업', '디지털전환', '프로덕트'],
    },
    {
      host: ceoFounders[0], title: '투자자가 보는 좋은 CTO의 조건',
      desc: 'VC 입장에서 스타트업의 기술 리더를 어떤 기준으로 평가하는지 공유합니다. CTO가 되고 싶은 시니어 엔지니어에게 유용한 인사이트가 될 것입니다.',
      date: daysAgo(10), locType: 'online', locDetail: 'Zoom', status: 'completed', tier: 'all',
      tags: ['CTO', '투자', '리더십'],
    },
    {
      host: ceoFounders[3], title: '비바리퍼블리카의 프로덕트 철학',
      desc: '토스를 만들며 배운 프로덕트 철학과 의사결정 프레임워크를 공유합니다. 사용자 중심 사고와 데이터 기반 의사결정에 대해 깊이 이야기해요.',
      date: daysAgo(5), locType: 'offline', locDetail: '토스 라운지 (서울 강남)', status: 'closed', tier: 'core',
      tags: ['프로덕트', '토스', '의사결정'],
    },
  ]

  for (const s of sessions) {
    const sid = randomUUID()
    sessionIds.push(sid)
    const { error } = await admin.from('vcx_ceo_coffee_sessions').insert({
      id: sid,
      host_id: s.host.id,
      title: s.title,
      description: s.desc,
      session_date: s.date,
      duration_minutes: pick([60, 90, 120]),
      max_participants: pick([3, 5, 8]),
      location_type: s.locType,
      location_detail: s.locDetail,
      status: s.status,
      target_tier: s.tier,
      tags: s.tags,
      agreement_accepted_at: daysAgo(30),
      created_at: daysAgo(Math.floor(Math.random() * 20) + 5),
    })
    if (error) console.warn(`  ⚠️ ${s.title}: ${error.message}`)
    else console.log(`  ✅ ${s.title} (${s.status})`)
  }
  console.log()

  // ── 5. Coffee Applications ──
  console.log('📮 커피챗 신청 생성 중...')
  const applicationMessages = [
    '안녕하세요! 현재 시리즈 A 스타트업에서 엔지니어링 매니저로 일하고 있는데, 조직 성장 과정에서의 경험을 듣고 싶습니다.',
    '프로덕트 매니저로서 사업 관점의 인사이트를 배우고 싶어 신청합니다. 특히 제품 전략 수립 과정이 궁금합니다.',
    '데이터 사이언티스트로 커리어를 쌓고 있는데, 리더십 역할로의 전환에 대한 조언을 구하고 싶습니다.',
    '현재 팀 리더로서 채용과 온보딩 프로세스를 개선하고 있는데, 선배님의 경험담을 듣고 싶습니다.',
    '디자인 리더로서 프로덕트 조직과의 협업 방식에 대해 고민이 많습니다. 실질적인 노하우를 배우고 싶습니다.',
  ]

  // open/completed 세션에 신청
  for (let si = 0; si < sessionIds.length; si++) {
    const numApplicants = Math.min(pick([2, 3, 4]), memberIds.length)
    const applicants = [...memberIds].sort(() => Math.random() - 0.5).slice(0, numApplicants)

    for (const applicantId of applicants) {
      // corporate user가 아닌 member만
      if (corpIds.includes(applicantId)) continue

      const statuses = si === 3 ? ['accepted', 'accepted', 'rejected'] : ['pending', 'pending', 'accepted']
      const { error } = await admin.from('vcx_coffee_applications').insert({
        id: randomUUID(),
        session_id: sessionIds[si],
        applicant_id: applicantId,
        message: pick(applicationMessages),
        status: pick(statuses),
        created_at: daysAgo(Math.floor(Math.random() * 10) + 1),
      })
      if (error && !error.message.includes('duplicate')) {
        console.warn(`  ⚠️ 신청 오류: ${error.message}`)
      }
    }
  }
  console.log(`  ✅ CEO 커피챗 신청 생성 완료\n`)

  // ── 6. Peer Coffee Chats ──
  console.log('🤝 피어 커피챗 생성 중...')
  const peerChats = [
    { author: memberMap[`jihoon.park@${SEED_EMAIL_DOMAIN}`], title: '시니어 엔지니어 → EM 전환 경험 공유', content: '엔지니어링 매니저로 전환한 지 2년이 됐습니다. IC에서 매니저로의 전환 과정에서 겪은 시행착오와 깨달음을 나누고 싶어요. 비슷한 고민을 하고 계신 분, 이미 전환하신 분 모두 환영합니다. 서로의 경험을 나누며 성장해요.', category: 'career', status: 'open' },
    { author: memberMap[`hyuna.lee@${SEED_EMAIL_DOMAIN}`], title: '데이터 사이언티스트 커리어 로드맵 토론', content: 'DS 커리어 10년차입니다. ML Engineer, Data Engineer, Analytics Engineer 등 다양한 분기점에서의 선택에 대해 이야기하고 싶습니다. 주니어/미드레벨 DS 분들의 커리어 고민도 함께 나눠요.', category: 'career', status: 'open' },
    { author: memberMap[`junhyuk.park@${SEED_EMAIL_DOMAIN}`], title: '프론트엔드 리드 모집 — 사이드 프로젝트', content: '오픈소스 디자인 시스템 프로젝트를 시작하려 합니다. React/Next.js 기반이고, 접근성과 DX에 집중할 예정입니다. 함께 만들어갈 프론트엔드 엔지니어를 찾고 있어요. 주 2-3시간 정도 투자 가능한 분 환영!', category: 'general', status: 'open' },
    { author: memberMap[`subin.lee@${SEED_EMAIL_DOMAIN}`], title: 'PM끼리 제품 전략 스터디', content: '주 1회 온라인으로 제품 전략 케이스 스터디를 진행하려 합니다. Superhuman, Linear, Notion 등의 프로덕트 전략을 분석하고 토론해요. PM 경력 3년+ 분들 환영합니다.', category: 'mentoring', status: 'matched' },
    { author: memberMap[`woojin.choi@${SEED_EMAIL_DOMAIN}`], title: '핀테크 CTO 모임', content: '금융/핀테크 업계 CTO/VPoE 분들과 정기적으로 만나 기술 트렌드, 규제 대응, 보안 이슈 등을 논의하고 싶습니다. 월 1회 오프라인 모임을 계획하고 있어요.', category: 'hiring', status: 'open' },
    { author: memberMap[`taeyoung.kim@${SEED_EMAIL_DOMAIN}`], title: '주니어 백엔드 개발자 멘토링', content: '백엔드 개발 3년차 미만 주니어분들을 위한 멘토링 세션을 열려 합니다. 코드 리뷰, 시스템 설계, 커리어 조언 등을 제공할 수 있어요. 주 1회 30분 온라인.', category: 'mentoring', status: 'open' },
  ]

  const peerChatIds: string[] = []
  for (const pc of peerChats) {
    const pcId = randomUUID()
    peerChatIds.push(pcId)
    const { error } = await admin.from('peer_coffee_chats').insert({
      id: pcId,
      author_id: pc.author.id,
      title: pc.title,
      content: pc.content,
      category: pc.category,
      status: pc.status,
      created_at: daysAgo(Math.floor(Math.random() * 15) + 1),
    })
    if (error) console.warn(`  ⚠️ ${pc.title}: ${error.message}`)
    else console.log(`  ✅ ${pc.title} (${pc.status})`)
  }

  // 피어 커피챗 신청
  const peerAppMessages = [
    '안녕하세요! 비슷한 고민을 하고 있어서 신청합니다. 함께 이야기 나눠요.',
    '관심 있는 주제입니다. 저도 경험을 공유하고 배움을 얻고 싶습니다.',
    '좋은 기회인 것 같아 신청합니다. 실무에서 느낀 점들을 나누고 싶어요.',
    '정확히 제가 찾던 모임입니다! 참여하고 싶습니다.',
  ]

  for (let i = 0; i < peerChatIds.length; i++) {
    const numApps = pick([1, 2, 3])
    const potentialApplicants = memberIds.filter(id => id !== peerChats[i].author.id && !corpIds.includes(id))
    const applicants = potentialApplicants.sort(() => Math.random() - 0.5).slice(0, numApps)

    for (const appId of applicants) {
      const status = peerChats[i].status === 'matched' ? 'accepted' : pick(['pending', 'pending', 'accepted'])
      await admin.from('peer_coffee_applications').insert({
        id: randomUUID(),
        chat_id: peerChatIds[i],
        applicant_id: appId,
        message: pick(peerAppMessages),
        status,
        created_at: daysAgo(Math.floor(Math.random() * 10)),
      })
    }
  }
  console.log(`  ✅ 피어 커피챗 신청 생성 완료\n`)

  // ── 7. Community Posts ──
  console.log('💬 커뮤니티 게시글 생성 중...')
  const communityPosts = [
    { category: 'career', title: '10년차 개발자, 매니지먼트 vs 아키텍트 고민', content: '개발 10년차입니다. 최근 EM 오퍼와 Staff Engineer 오퍼를 동시에 받았는데, 어떤 길이 더 나을지 고민됩니다.\n\nEM은 팀 빌딩과 피플 매니지먼트를 해야 하고, Staff Engineer는 기술 방향을 리드하는 역할입니다.\n\n비슷한 갈림길에 서보신 분들의 경험담을 듣고 싶습니다. 특히 매니지먼트로 갔다가 다시 IC로 돌아오신 분 계신가요?', anonymous: false },
    { category: 'salary', title: '시리즈 B 스타트업 VP of Engineering 연봉 수준', content: '시리즈 B 스타트업에서 VP of Engineering 오퍼를 받았습니다. 현금 1.8억 + 스톡옵션 제안인데, 시장 수준에 맞는지 감이 안 잡힙니다.\n\n비슷한 포지션에 계신 분들의 의견을 구합니다. (당연히 회사마다 다르겠지만 레인지라도 알면 좋겠습니다)', anonymous: true },
    { category: 'leadership', title: '새로 합류한 팀에서 신뢰를 쌓는 법', content: '최근 새 회사에 디렉터로 합류했습니다. 기존 팀원들이 이전 리더를 좋아했던 상황에서 어떻게 신뢰를 쌓아야 할지 고민입니다.\n\n첫 90일 계획을 세우고 있는데, 비슷한 경험이 있으신 분들의 조언을 구합니다.\n\n현재 시도 중인 것:\n- 1:1 미팅으로 각자의 목표와 고민 파악\n- 빠른 성과보다는 경청과 이해에 집중\n- 기존 프로세스 유지하면서 점진적 개선', anonymous: false },
    { category: 'burnout', title: '번아웃 극복 경험 공유', content: '6개월간의 크런치 모드 후 심각한 번아웃을 겪었습니다. 아침에 일어나기 싫고, 코드를 보면 한숨이 나오는 상태까지 왔어요.\n\n결국 2주간 리프레시 휴가를 쓰고, 업무 방식을 완전히 바꿨습니다.\n\n제가 효과를 본 방법들:\n1. 칼퇴근 실천 (야근 제로 선언)\n2. 주말 코딩 금지\n3. 운동 루틴 확립 (주 3회 러닝)\n4. 사이드 프로젝트 중단\n\n번아웃 경험과 극복 방법을 공유해주세요.', anonymous: false },
    { category: 'productivity', title: 'AI 코딩 도구 실사용 후기 — Cursor vs Claude Code', content: '3개월간 Cursor와 Claude Code를 병행 사용한 후기입니다.\n\nCursor:\n- 에디터 내 자동완성이 자연스러움\n- Tab 완성의 정확도가 높음\n- 복잡한 리팩토링은 아직 부족\n\nClaude Code:\n- CLI 기반이라 워크플로우 유연\n- 멀티파일 변경에 강함\n- 아키텍처 수준 작업에 탁월\n\n결론: 일상적 코딩은 Cursor, 큰 작업은 Claude Code 조합이 최강이라고 느낍니다.\n\n다른 분들의 경험도 궁금합니다!', anonymous: false },
    { category: 'company_review', title: '네이버 vs 카카오 2026년 개발 문화 비교', content: '두 회사 모두 경험한 입장에서 2026년 기준 개발 문화를 비교해봅니다.\n\n네이버:\n- 조직별 자율성 높음\n- 기술 스택 선택 자유\n- 사내 오픈소스 문화 정착\n\n카카오:\n- 최근 조직 개편으로 효율성 강조\n- 카카오 클라우드 전환 중\n- 개발자 커리어 레벨 체계 정비\n\n두 회사 모두 좋은 점과 아쉬운 점이 있습니다. 선택은 본인의 가치관과 맞는 곳으로!', anonymous: true },
    { category: 'career', title: '외국계 vs 국내 테크 기업 — 시니어 레벨에서의 차이', content: '외국계 3년, 국내 대기업 5년, 스타트업 4년을 거쳤습니다.\n\n시니어 레벨에서 느끼는 핵심 차이:\n\n외국계:\n- 개인 성과 중심, IC 트랙이 확실함\n- 글로벌 프로젝트 참여 기회\n- 연봉 상한이 높음\n\n국내 대기업:\n- 팀 성과 중심, 리더십 트랙 자연스러움\n- 한국 시장 깊이 이해 가능\n- 안정성과 복지\n\n스타트업:\n- 임팩트 크지만 리스크도 큼\n- 성장 속도 빠름\n- 스톡옵션 변수\n\n지금 커리어 선택을 고민 중인 분들에게 도움이 되면 좋겠습니다.', anonymous: false },
    { category: 'leadership', title: '원격근무 팀의 성과 관리 노하우', content: '완전 원격 팀을 3년째 리드하고 있습니다. 시행착오를 거쳐 정착한 방법들을 공유합니다.\n\n1. OKR 기반 목표 설정 (분기별)\n2. 주간 스탠드업은 비동기 (Slack 스레드)\n3. 월 1회 오프라인 워크샵\n4. 1:1은 주 1회 30분 고정\n5. 성과 리뷰는 동료 평가 포함\n\n가장 중요한 건 "결과로 평가하되, 과정에서 소통하라"입니다.\n\n원격근무 팀 리더분들의 노하우도 공유해주세요!', anonymous: false },
    { category: 'salary', title: 'PM 직군 연봉 테이블 공유 (2026)', content: '주변 PM/PO 분들과 정보를 취합해봤습니다. (서울 기준)\n\n주니어 (1-3년): 4500-6500만원\n미드레벨 (3-6년): 6500-9000만원\n시니어 (6-10년): 9000-1.3억\nHead of Product (10년+): 1.3-2억\n\n스타트업은 스톡옵션 포함 시 상한이 더 높을 수 있고, 대기업은 상여금 포함 기준입니다.\n\n다른 분들의 체감과 어떻게 다른지 궁금합니다.', anonymous: true },
    { category: 'productivity', title: '개발팀 온보딩 프로세스 자동화 사례', content: '새 멤버가 합류할 때마다 반복되는 온보딩 작업을 자동화한 경험을 공유합니다.\n\n자동화한 항목:\n- Slack 채널 초대 (봇)\n- GitHub 팀/리포 접근 권한 (Terraform)\n- 개발 환경 셋업 스크립트 (Docker + Make)\n- 온보딩 체크리스트 (Notion 템플릿 자동 복제)\n- 멘토 자동 매칭 (라운드 로빈)\n\n결과: 온보딩 시간 3일 → 4시간으로 단축\n\n비슷한 경험이나 더 좋은 방법이 있으면 공유 부탁드립니다!', anonymous: false },
  ]

  const postIds: string[] = []
  const allMemberIds = memberIds.filter(id => !corpIds.includes(id))

  for (const post of communityPosts) {
    const postId = randomUUID()
    postIds.push(postId)
    const authorId = pick(allMemberIds)
    const { error } = await admin.from('community_posts').insert({
      id: postId,
      author_id: authorId,
      category: post.category,
      title: post.title,
      content: post.content,
      is_anonymous: post.anonymous,
      status: 'active',
      created_at: daysAgo(Math.floor(Math.random() * 25) + 1),
    })
    if (error) console.warn(`  ⚠️ ${post.title}: ${error.message}`)
    else console.log(`  ✅ [${post.category}] ${post.title}`)
  }
  console.log()

  // ── 8. Community Comments ──
  console.log('💭 커뮤니티 댓글 생성 중...')
  const commentTexts = [
    '정말 공감됩니다. 저도 비슷한 경험이 있어서 공유하자면, 결국 자신이 더 열정을 느끼는 방향으로 가는 게 맞는 것 같습니다.',
    '좋은 글 감사합니다. 저는 조금 다른 관점인데, 팀과 회사의 상황도 중요한 변수라고 생각해요.',
    '이 부분 정말 중요한 포인트네요. 저도 최근 같은 고민을 하고 있었는데 도움이 됩니다.',
    '경험에서 우러나온 조언이라 더 와닿습니다. 감사합니다!',
    '혹시 이 부분에 대해 좀 더 구체적으로 설명해주실 수 있을까요? 실제 사례가 궁금합니다.',
    '완전 동의합니다. 특히 마지막 부분이 핵심이라고 생각해요.',
    '저도 비슷한 시도를 했는데, 한 가지 추가하자면 팀원들의 피드백을 주기적으로 수집하는 것도 효과적이었습니다.',
    '좋은 인사이트 공유 감사합니다. 북마크해둡니다.',
    '이런 솔직한 공유가 이 커뮤니티의 가치라고 생각합니다. 저도 제 경험을 나중에 정리해서 올려볼게요.',
    '반대 의견일 수 있지만, 저는 오히려 반대 접근이 효과적이었어요. 상황에 따라 다를 수 있겠지만요.',
  ]

  for (const postId of postIds) {
    const numComments = pick([1, 2, 3, 4, 5])
    for (let c = 0; c < numComments; c++) {
      const authorId = pick(allMemberIds)
      await admin.from('community_comments').insert({
        id: randomUUID(),
        post_id: postId,
        author_id: authorId,
        content: pick(commentTexts),
        is_anonymous: Math.random() < 0.3,
        status: 'active',
        created_at: daysAgo(Math.floor(Math.random() * 20)),
      })
    }
  }

  // 댓글 수 업데이트 (트리거가 있지만 직접 insert라 수동 업데이트)
  for (const postId of postIds) {
    const { count } = await admin.from('community_comments').select('*', { count: 'exact', head: true }).eq('post_id', postId).eq('status', 'active')
    await admin.from('community_posts').update({ comments_count: count || 0 }).eq('id', postId)
  }
  console.log(`  ✅ 게시글 ${postIds.length}개에 댓글 생성 완료\n`)

  // ── 9. Community Reactions (likes) ──
  console.log('❤️ 좋아요 생성 중...')
  for (const postId of postIds) {
    const numLikes = pick([2, 4, 6, 8, 10, 12])
    const likers = [...allMemberIds].sort(() => Math.random() - 0.5).slice(0, Math.min(numLikes, allMemberIds.length))
    for (const userId of likers) {
      await admin.from('vcx_community_reactions').insert({
        id: randomUUID(),
        post_id: postId,
        user_id: userId,
        reaction_type: 'like',
        created_at: daysAgo(Math.floor(Math.random() * 20)),
      })
    }
    // likes_count 업데이트
    const { count } = await admin.from('vcx_community_reactions').select('*', { count: 'exact', head: true }).eq('post_id', postId)
    await admin.from('community_posts').update({ likes_count: count || 0 }).eq('id', postId)
  }
  console.log(`  ✅ 좋아요 생성 완료\n`)

  // ── 10. Positions ──
  console.log('💼 포지션 생성 중...')
  const adminMember = Object.values(memberMap).find(m => m.role === 'super_admin' || m.role === 'admin')!

  const positionsData = [
    {
      company: '토스', title: 'Staff Backend Engineer', teamSize: '300명+, 시리즈 F',
      desc: '토스 결제 플랫폼의 핵심 백엔드 시스템을 설계하고 구현할 Staff Engineer를 찾습니다.\n\n주요 업무:\n- 대규모 트랜잭션 처리 시스템 설계\n- 마이크로서비스 아키텍처 최적화\n- 기술 방향성 리드 및 주니어 멘토링\n\n자격 요건:\n- 백엔드 경력 8년+\n- 대규모 분산 시스템 경험\n- Kotlin/Java, Spring 생태계 전문',
      salary: '1.2-1.8억', status: 'active',
      requirements: ['백엔드 경력 8년+', '대규모 분산 시스템 경험', 'Kotlin/Java 전문'],
      benefits: ['스톡옵션', '자유로운 원격근무', '교육비 연 500만원', '건강검진'],
      requiredFields: ['Engineering'], minExp: 8, location: '서울 강남',
    },
    {
      company: '카카오엔터프라이즈', title: 'AI/ML Product Manager', teamSize: '150명, 대기업 자회사',
      desc: '카카오엔터프라이즈의 AI 제품(카카오 i, 카나나)의 프로덕트 매니저를 모집합니다.\n\n주요 업무:\n- AI/ML 기반 B2B SaaS 제품 전략 수립\n- 고객 인터뷰 및 요구사항 분석\n- 엔지니어링/디자인 팀과 협업하여 로드맵 실행\n\nAI 도메인 지식과 B2B SaaS PM 경험을 갖춘 분을 찾습니다.',
      salary: '8000-1.2억', status: 'active',
      requirements: ['PM 경력 5년+', 'AI/ML 도메인 이해', 'B2B SaaS 경험'],
      benefits: ['카카오 복지', '자녀 학자금', '사내 카페', '유연근무'],
      requiredFields: ['Product', 'Data'], minExp: 5, location: '성남 판교',
    },
    {
      company: '당근', title: 'Senior Frontend Engineer', teamSize: '200명+, 시리즈 D',
      desc: '당근마켓 웹 프론트엔드를 함께 만들어갈 시니어 엔지니어를 찾습니다.\n\n주요 업무:\n- React/Next.js 기반 웹 서비스 개발\n- 디자인 시스템 구축 및 운영\n- 웹 성능 최적화 및 접근성 개선\n- 주니어 엔지니어 코드 리뷰 및 멘토링',
      salary: '8000-1.1억', status: 'active',
      requirements: ['프론트엔드 경력 5년+', 'React/Next.js 전문', '디자인 시스템 경험'],
      benefits: ['당근페이 포인트', '원격근무 주 2일', '교육비 지원', '건강검진'],
      requiredFields: ['Engineering', 'Design'], minExp: 5, location: '서울 서초',
    },
    {
      company: '뱅크샐러드', title: 'Data Engineer', teamSize: '80명, 시리즈 C',
      desc: '뱅크샐러드의 데이터 인프라를 구축하고 운영할 데이터 엔지니어를 모집합니다.\n\n주요 업무:\n- 데이터 파이프라인 설계 및 구축 (Spark, Airflow)\n- 실시간 데이터 처리 시스템 운영\n- 데이터 품질 관리 및 거버넌스\n\n금융 데이터를 안전하고 효율적으로 다룰 수 있는 분을 찾습니다.',
      salary: '7000-1억', status: 'active',
      requirements: ['데이터 엔지니어링 경력 3년+', 'Spark/Airflow 경험', 'SQL 고급'],
      benefits: ['스톡옵션', '원격근무', '자기개발비', '점심 지원'],
      requiredFields: ['Data', 'Engineering'], minExp: 3, location: '서울 강남',
    },
    {
      company: '무신사', title: 'Head of Marketing', teamSize: '500명+',
      desc: '무신사의 마케팅 전략을 총괄할 마케팅 헤드를 모집합니다.\n\n주요 업무:\n- 브랜드 마케팅 전략 수립 및 실행\n- 퍼포먼스 마케팅 예산 관리 (연 100억+)\n- 마케팅 팀 빌딩 및 리더십\n\nMZ 세대 타겟 마케팅 경험과 이커머스 업계 경험이 있는 분을 우대합니다.',
      salary: '1.3-1.8억', status: 'active',
      requirements: ['마케팅 경력 10년+', '이커머스 마케팅 경험', '팀 리딩 5년+'],
      benefits: ['무신사 직원 할인', '자율출퇴근', '연 2회 해외 워크샵'],
      requiredFields: ['Marketing', 'Sales'], minExp: 10, location: '서울 성수',
    },
    {
      company: '야놀자', title: 'DevOps Engineer', teamSize: '400명+',
      desc: '야놀자 클라우드 인프라를 담당할 DevOps 엔지니어를 찾습니다.\n\n주요 업무:\n- Kubernetes 클러스터 운영 및 최적화\n- CI/CD 파이프라인 구축\n- 모니터링 및 장애 대응 체계 구축\n- IaC (Terraform) 기반 인프라 관리',
      salary: '7000-1억', status: 'closed',
      requirements: ['DevOps/SRE 경력 3년+', 'Kubernetes 운영 경험', 'AWS 또는 GCP'],
      benefits: ['야놀자 숙박 할인', '원격근무', '교육비 지원'],
      requiredFields: ['Engineering'], minExp: 3, location: '서울 강남',
    },
    {
      company: '크래프톤', title: 'Game Economy Designer', teamSize: '3000명+, 글로벌',
      desc: '글로벌 게임의 경제 시스템을 설계할 게임 이코노미 디자이너를 모집합니다.\n\n주요 업무:\n- 인게임 경제 시스템 설계 및 밸런싱\n- 수익화 모델 분석 및 최적화\n- 데이터 기반 라이브 서비스 운영',
      salary: '8000-1.3억', status: 'active',
      requirements: ['게임 업계 경력 5년+', '게임 이코노미 설계 경험', '데이터 분석 능력'],
      benefits: ['글로벌 출장', '게임 수당', '사내 헬스장', '주 4.5일'],
      requiredFields: ['Product', 'Data'], minExp: 5, location: '서울 강남',
    },
  ]

  const positionIds: string[] = []
  for (const pos of positionsData) {
    const posId = randomUUID()
    positionIds.push(posId)
    const { error } = await admin.from('positions').insert({
      id: posId,
      company_name: pos.company,
      title: pos.title,
      team_size: pos.teamSize,
      role_description: pos.desc,
      salary_range: pos.salary,
      status: pos.status,
      created_by: adminMember.id,
      requirements: pos.requirements,
      benefits: pos.benefits,
      required_fields: pos.requiredFields,
      min_experience: pos.minExp,
      location: pos.location,
      created_at: daysAgo(Math.floor(Math.random() * 30) + 5),
    })
    if (error) console.warn(`  ⚠️ ${pos.title}: ${error.message}`)
    else console.log(`  ✅ ${pos.company} — ${pos.title} (${pos.status})`)
  }
  console.log()

  // ── 11. Position Interests ──
  console.log('⭐ 포지션 관심 표현 생성 중...')
  const interestTypes = ['interested', 'bookmark', 'not_interested'] as const
  for (const posId of positionIds) {
    const numInterests = pick([2, 3, 4, 5])
    const interestedMembers = [...allMemberIds].sort(() => Math.random() - 0.5).slice(0, numInterests)
    for (const userId of interestedMembers) {
      await admin.from('position_interests').insert({
        id: randomUUID(),
        position_id: posId,
        user_id: userId,
        interest_type: pick([...interestTypes.slice(0, 2), ...interestTypes.slice(0, 2)]), // interested/bookmark 가중치
        created_at: daysAgo(Math.floor(Math.random() * 20)),
      })
    }
  }
  console.log(`  ✅ 포지션 관심 표현 생성 완료\n`)

  // ── 12. Notifications ──
  console.log('🔔 알림 생성 중...')
  const notifications = [
    { userId: ceoFounders[0].id, type: 'coffeechat_applied', title: '새로운 커피챗 신청', body: '박지훈님이 "시리즈 A 이후 엔지니어링 조직 빌딩" 세션에 신청했습니다.', link: `/ceo-coffeechat/${sessionIds[0]}`, read: false },
    { userId: ceoFounders[0].id, type: 'coffeechat_applied', title: '새로운 커피챗 신청', body: '이현아님이 "시리즈 A 이후 엔지니어링 조직 빌딩" 세션에 신청했습니다.', link: `/ceo-coffeechat/${sessionIds[0]}`, read: true },
    { userId: ceoFounders[1].id, type: 'coffeechat_applied', title: '새로운 커피챗 신청', body: '정민수님이 "스타트업 생태계 2026 트렌드" 세션에 신청했습니다.', link: `/ceo-coffeechat/${sessionIds[1]}`, read: false },
    { userId: memberMap[`jihoon.park@${SEED_EMAIL_DOMAIN}`].id, type: 'peer_chat_applied', title: '피어 커피챗 신청', body: '누군가 "시니어 엔지니어 → EM 전환 경험 공유"에 참여를 신청했습니다.', link: `/coffeechat/${peerChatIds[0]}`, read: false },
    { userId: memberMap[`hyuna.lee@${SEED_EMAIL_DOMAIN}`].id, type: 'peer_chat_applied', title: '피어 커피챗 신청', body: '누군가 "데이터 사이언티스트 커리어 로드맵 토론"에 참여를 신청했습니다.', link: `/coffeechat/${peerChatIds[1]}`, read: true },
    { userId: pick(allMemberIds), type: 'community_comment', title: '새 댓글', body: '내 게시글에 새로운 댓글이 달렸습니다.', link: `/community/${postIds[0]}`, read: false },
    { userId: pick(allMemberIds), type: 'community_comment', title: '새 댓글', body: '내 게시글에 새로운 댓글이 달렸습니다.', link: `/community/${postIds[2]}`, read: false },
    { userId: pick(allMemberIds), type: 'community_comment', title: '새 댓글', body: '내 게시글 "번아웃 극복 경험 공유"에 공감 댓글이 달렸습니다.', link: `/community/${postIds[3]}`, read: true },
  ]

  for (const n of notifications) {
    await admin.from('vcx_notifications').insert({
      id: randomUUID(),
      user_id: n.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      is_read: n.read,
      created_at: daysAgo(Math.floor(Math.random() * 7)),
    })
  }
  console.log(`  ✅ 알림 ${notifications.length}건 생성 완료\n`)

  // ── 13. Hiring Records ──
  console.log('💰 채용 기록 생성 중...')
  const hiringRecords = [
    {
      type: 'ceo', sessionId: sessionIds[3], // completed session
      candidateId: memberMap[`taeyoung.kim@${SEED_EMAIL_DOMAIN}`].id,
      companyId: ceoFounders[0].id,
      introducerId: memberMap[`jihoon.park@${SEED_EMAIL_DOMAIN}`].id,
      posTitle: 'Senior Backend Engineer', salary: 95000000,
      feePct: 10, rewardPct: 1, status: 'confirmed',
    },
    {
      type: 'peer', sessionId: peerChatIds[3], // matched peer chat
      candidateId: memberMap[`donghyun.oh@${SEED_EMAIL_DOMAIN}`].id,
      companyId: corpMap[`hyunwoo.park@${SEED_EMAIL_DOMAIN}`].id,
      introducerId: memberMap[`subin.lee@${SEED_EMAIL_DOMAIN}`].id,
      posTitle: 'Backend Developer', salary: 72000000,
      feePct: 10, rewardPct: 1, status: 'pending',
    },
    {
      type: 'ceo', sessionId: sessionIds[4],
      candidateId: memberMap[`chaewon.yoon@${SEED_EMAIL_DOMAIN}`].id,
      companyId: ceoFounders[3].id,
      introducerId: null,
      posTitle: 'Product Lead', salary: 130000000,
      feePct: 10, rewardPct: 1, status: 'paid',
    },
  ]

  for (const hr of hiringRecords) {
    const feeAmount = Math.round(hr.salary * hr.feePct / 100)
    const rewardAmount = Math.round(hr.salary * hr.rewardPct / 100)
    const { error } = await admin.from('vcx_hiring_records').insert({
      id: randomUUID(),
      coffeechat_type: hr.type,
      coffeechat_id: hr.sessionId,
      candidate_id: hr.candidateId,
      company_id: hr.companyId,
      introducer_id: hr.introducerId,
      position_title: hr.posTitle,
      annual_salary: hr.salary,
      fee_percentage: hr.feePct,
      fee_amount: feeAmount,
      reward_percentage: hr.rewardPct,
      reward_amount: rewardAmount,
      status: hr.status,
      confirmed_at: hr.status !== 'pending' ? daysAgo(Math.floor(Math.random() * 30)) : null,
      created_at: daysAgo(Math.floor(Math.random() * 45) + 10),
    })
    if (error) console.warn(`  ⚠️ ${hr.posTitle}: ${error.message}`)
    else console.log(`  ✅ ${hr.posTitle} — ${hr.salary.toLocaleString()}원 (${hr.status})`)
  }
  console.log()

  // ── 완료 ──
  console.log('═══════════════════════════════════════════════')
  console.log('🎉 시딩 완료!')
  console.log(`   멤버: ${MEMBERS_DATA.length}명`)
  console.log(`   기업 사용자: ${CORPORATE_USERS_DATA.length}명`)
  console.log(`   추천서: ${pendingRecommendations.length + 3}건`)
  console.log(`   CEO 커피챗: ${sessions.length}건`)
  console.log(`   피어 커피챗: ${peerChats.length}건`)
  console.log(`   커뮤니티 게시글: ${communityPosts.length}건`)
  console.log(`   포지션: ${positionsData.length}건`)
  console.log(`   채용 기록: ${hiringRecords.length}건`)
  console.log(`   알림: ${notifications.length}건`)
  console.log('═══════════════════════════════════════════════')
  console.log(`\n📧 로그인 비밀번호 (모든 계정): ${SEED_PASSWORD}`)
  console.log(`📧 관리자: admin@${SEED_EMAIL_DOMAIN}`)
  console.log(`📧 기업 CEO: jaeyong.lee@${SEED_EMAIL_DOMAIN}`)
  console.log(`📧 코어 멤버: jihoon.park@${SEED_EMAIL_DOMAIN}`)
}

// ─── 정리 함수 ─────────────────────────────────────────────────

async function cleanup() {
  console.log('🧹 시드 데이터 정리 중...\n')

  const allEmails = [
    ...MEMBERS_DATA.map(m => m.email),
    ...CORPORATE_USERS_DATA.map(c => c.email),
  ]

  // 역순으로 삭제 (FK 의존성)
  console.log('  Deleting hiring records...')
  await admin.from('vcx_hiring_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log('  Deleting notifications...')
  for (const email of allEmails) {
    const { data: users } = await admin.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email === email)
    if (user) {
      await admin.from('vcx_notifications').delete().eq('user_id', user.id)
    }
  }

  console.log('  Deleting community reactions, comments, posts...')
  await admin.from('vcx_community_reactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('community_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('community_posts').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log('  Deleting position interests and positions...')
  await admin.from('position_interests').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('positions').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log('  Deleting coffee applications and sessions...')
  await admin.from('vcx_coffee_applications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('vcx_ceo_coffee_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('peer_coffee_applications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('peer_coffee_chats').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log('  Deleting invites and recommendations...')
  await admin.from('vcx_invites').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('vcx_recommendations').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log('  Deleting members and corporate users...')
  for (const email of allEmails) {
    await admin.from('vcx_members').delete().eq('email', email)
    await admin.from('vcx_corporate_users').delete().eq('email', email)
  }

  console.log('  Deleting auth users...')
  const { data: { users } } = await admin.auth.admin.listUsers()
  for (const user of users || []) {
    if (user.email && allEmails.includes(user.email)) {
      await admin.auth.admin.deleteUser(user.id)
      console.log(`    🗑️ ${user.email}`)
    }
  }

  // pending 추천 이메일도 정리
  const pendingEmails = ['mingi.jo', 'sua.lim', 'doyoon.kang'].map(n => `${n}@${SEED_EMAIL_DOMAIN}`)
  for (const email of pendingEmails) {
    await admin.from('vcx_recommendations').delete().eq('recommended_email', email)
  }

  console.log('\n✅ 정리 완료!')
}

// ─── 실행 ──────────────────────────────────────────────────────

const isCleanup = process.argv.includes('--cleanup')

if (isCleanup) {
  cleanup().catch(console.error)
} else {
  seed().catch(console.error)
}
