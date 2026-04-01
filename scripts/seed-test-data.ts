/**
 * ValueConnect X — 서비스 검증용 테스트 데이터 시딩
 * 실행: npx tsx scripts/seed-test-data.ts
 *
 * 기존 시드 유저(auth.users)를 활용하여 vcx_members + 커뮤니티 데이터 삽입
 * migration 005 미적용 환경에서도 동작하도록 최소 컬럼만 사용
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// .env.local 파싱
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
} catch { /* ignore */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString()
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 기존 시드 유저 매핑 (auth에는 이미 존재)
const SEED_PASSWORD = 'VcxSeed2026!'
const SEED_DOMAIN = 'vcx-seed.com'

const MEMBERS = [
  { email: `admin@${SEED_DOMAIN}`, name: '강상모', company: 'ValueConnect', title: 'CTO & Co-founder', fields: ['Engineering', 'Product'], years: 15, tier: 'core', role: 'super_admin', bio: 'ValueConnect X를 만들고 있습니다.' },
  { email: `seoyeon@${SEED_DOMAIN}`, name: '김서연', company: 'ValueConnect', title: 'Head of Operations', fields: ['Operations', 'HR'], years: 12, tier: 'core', role: 'admin', bio: '커뮤니티 운영과 인재 검증을 책임지고 있습니다.' },
  { email: `jihoon.park@${SEED_DOMAIN}`, name: '박지훈', company: '토스', title: 'VP of Engineering', fields: ['Engineering', 'Product'], years: 14, tier: 'core', role: 'member', bio: '토스에서 결제 플랫폼 엔지니어링을 리드하고 있습니다.' },
  { email: `hyuna.lee@${SEED_DOMAIN}`, name: '이현아', company: '쿠팡', title: 'Director of Data Science', fields: ['Data', 'Engineering'], years: 11, tier: 'core', role: 'member', bio: '쿠팡 추천 알고리즘과 검색 랭킹을 총괄합니다.' },
  { email: `minsu.jung@${SEED_DOMAIN}`, name: '정민수', company: '크래프톤', title: 'Head of Product', fields: ['Product', 'Design'], years: 13, tier: 'core', role: 'member', bio: '배틀그라운드 글로벌 프로덕트를 리드했습니다.' },
  { email: `sohee.han@${SEED_DOMAIN}`, name: '한소희', company: '당근', title: 'Head of Design', fields: ['Design', 'Product'], years: 10, tier: 'core', role: 'member', bio: '당근마켓의 디자인 시스템과 UX를 총괄합니다.' },
  { email: `woojin.choi@${SEED_DOMAIN}`, name: '최우진', company: '두나무', title: 'CTO', fields: ['Engineering', 'Data'], years: 16, tier: 'core', role: 'member', bio: '업비트의 거래 엔진과 인프라를 설계했습니다.' },
  { email: `chaewon.yoon@${SEED_DOMAIN}`, name: '윤채원', company: '뱅크샐러드', title: 'CPO', fields: ['Product', 'Data'], years: 12, tier: 'core', role: 'member', bio: '데이터 기반 금융 상품 추천 프로덕트를 만듭니다.' },
  { email: `taeyoung.kim@${SEED_DOMAIN}`, name: '김태영', company: '네이버', title: 'Senior Software Engineer', fields: ['Engineering'], years: 7, tier: 'endorsed', role: 'member', bio: '네이버 검색 백엔드를 담당합니다.' },
  { email: `subin.lee@${SEED_DOMAIN}`, name: '이수빈', company: '카카오', title: 'Product Manager', fields: ['Product', 'Marketing'], years: 6, tier: 'endorsed', role: 'member', bio: '카카오톡 비즈니스 기능 PM입니다.' },
  { email: `junhyuk.park@${SEED_DOMAIN}`, name: '박준혁', company: '리디', title: 'Frontend Lead', fields: ['Engineering', 'Design'], years: 8, tier: 'endorsed', role: 'member', bio: '리디의 웹/앱 프론트엔드를 리드합니다.' },
  { email: `yerin.shin@${SEED_DOMAIN}`, name: '신예린', company: '마이리얼트립', title: 'Data Analyst', fields: ['Data', 'Marketing'], years: 5, tier: 'endorsed', role: 'member', bio: '여행 플랫폼의 데이터 분석을 담당합니다.' },
  { email: `donghyun.oh@${SEED_DOMAIN}`, name: '오동현', company: '번개장터', title: 'Backend Engineer', fields: ['Engineering'], years: 4, tier: 'endorsed', role: 'member', bio: '결제/정산 시스템을 개발합니다.' },
  { email: `haeun.jang@${SEED_DOMAIN}`, name: '장하은', company: '센드버드', title: 'DevRel Engineer', fields: ['Engineering', 'Marketing'], years: 6, tier: 'endorsed', role: 'member', bio: '개발자 경험(DX)과 기술 커뮤니티 성장에 집중합니다.' },
  { email: `sungjun.ryu@${SEED_DOMAIN}`, name: '류성준', company: '힐링페이퍼', title: 'iOS Developer', fields: ['Engineering', 'Design'], years: 5, tier: 'endorsed', role: 'member', bio: '강남언니 iOS 앱을 개발합니다.' },
]

async function seed() {
  console.log('🌱 서비스 검증용 테스트 데이터 시딩 시작...\n')

  // ── 1. 기존 auth 유저 ID 수집 ──
  console.log('👤 기존 auth 유저 확인 중...')
  const { data: { users } } = await admin.auth.admin.listUsers()
  const userMap = new Map<string, string>() // email -> id

  for (const u of users || []) {
    if (u.email?.endsWith(SEED_DOMAIN)) {
      userMap.set(u.email, u.id)
    }
  }
  console.log(`  ✅ 시드 유저 ${userMap.size}명 확인\n`)

  // ── 2. vcx_members 삽입 (migration 001 컬럼만 사용) ──
  console.log('👥 vcx_members 삽입 중...')
  const memberIds: string[] = []

  for (const m of MEMBERS) {
    const userId = userMap.get(m.email)
    if (!userId) {
      console.warn(`  ⚠️ ${m.name}: auth 유저 없음, 스킵`)
      continue
    }

    const { error } = await admin.from('vcx_members').upsert({
      id: userId,
      name: m.name,
      email: m.email,
      current_company: m.company,
      title: m.title,
      professional_fields: m.fields,
      years_of_experience: m.years,
      bio: m.bio,
      member_tier: m.tier,
      system_role: m.role,
      is_active: true,
      linkedin_url: `https://linkedin.com/in/${m.email.split('@')[0]}`,
      join_date: daysAgo(Math.floor(Math.random() * 180) + 30),
    }, { onConflict: 'id' })

    if (error) {
      console.warn(`  ⚠️ ${m.name}: ${error.message}`)
    } else {
      memberIds.push(userId)
      console.log(`  ✅ ${m.name} (${m.tier}/${m.role}) — ${m.company}`)
    }
  }

  // endorsed_by 설정
  const coreIds = memberIds.slice(0, 8)
  const endorsedIds = memberIds.slice(8)
  for (let i = 0; i < endorsedIds.length; i++) {
    const endorserId = coreIds[i % coreIds.length]
    const endorserMember = MEMBERS.find(m => userMap.get(m.email) === endorserId)
    await admin.from('vcx_members').update({
      endorsed_by: endorserId,
      endorsed_by_name: endorserMember?.name,
    }).eq('id', endorsedIds[i])
  }
  console.log(`  🔗 endorsed 멤버에 추천인 연결 완료\n`)

  // ── 3. 커뮤니티 게시글 ──
  console.log('💬 커뮤니티 게시글 생성 중...')
  const posts = [
    { category: 'career', title: '10년차 개발자, 매니지먼트 vs 아키텍트 고민', content: '개발 10년차입니다. 최근 EM 오퍼와 Staff Engineer 오퍼를 동시에 받았는데, 어떤 길이 더 나을지 고민됩니다.\n\nEM은 팀 빌딩과 피플 매니지먼트를 해야 하고, Staff Engineer는 기술 방향을 리드하는 역할입니다.\n\n비슷한 갈림길에 서보신 분들의 경험담을 듣고 싶습니다.', anonymous: false },
    { category: 'salary', title: '시리즈 B 스타트업 VP of Engineering 연봉 수준', content: '시리즈 B 스타트업에서 VP of Engineering 오퍼를 받았습니다. 현금 1.8억 + 스톡옵션 제안인데, 시장 수준에 맞는지 감이 안 잡힙니다.\n\n비슷한 포지션에 계신 분들의 의견을 구합니다.', anonymous: true },
    { category: 'leadership', title: '새로 합류한 팀에서 신뢰를 쌓는 법', content: '최근 새 회사에 디렉터로 합류했습니다. 기존 팀원들이 이전 리더를 좋아했던 상황에서 어떻게 신뢰를 쌓아야 할지 고민입니다.\n\n첫 90일 계획을 세우고 있는데, 비슷한 경험이 있으신 분들의 조언을 구합니다.', anonymous: false },
    { category: 'burnout', title: '번아웃 극복 경험 공유', content: '6개월간의 크런치 모드 후 심각한 번아웃을 겪었습니다.\n\n효과를 본 방법들:\n1. 칼퇴근 실천\n2. 주말 코딩 금지\n3. 운동 루틴 확립 (주 3회 러닝)\n4. 사이드 프로젝트 중단\n\n번아웃 경험과 극복 방법을 공유해주세요.', anonymous: false },
    { category: 'productivity', title: 'AI 코딩 도구 실사용 후기 — Cursor vs Claude Code', content: '3개월간 Cursor와 Claude Code를 병행 사용한 후기입니다.\n\nCursor: 에디터 내 자동완성이 자연스러움\nClaude Code: CLI 기반이라 워크플로우 유연, 멀티파일 변경에 강함\n\n결론: 일상적 코딩은 Cursor, 큰 작업은 Claude Code 조합이 최강!', anonymous: false },
    { category: 'company_review', title: '네이버 vs 카카오 2026년 개발 문화 비교', content: '두 회사 모두 경험한 입장에서 비교합니다.\n\n네이버: 조직별 자율성 높음, 기술 스택 선택 자유\n카카오: 최근 조직 개편으로 효율성 강조, 카카오 클라우드 전환 중\n\n선택은 본인의 가치관과 맞는 곳으로!', anonymous: true },
    { category: 'career', title: '외국계 vs 국내 테크 기업 — 시니어 레벨 차이', content: '외국계 3년, 국내 대기업 5년, 스타트업 4년을 거쳤습니다.\n\n외국계: IC 트랙 확실, 연봉 상한 높음\n국내 대기업: 팀 성과 중심, 안정성과 복지\n스타트업: 임팩트 크지만 리스크도 큼', anonymous: false },
    { category: 'leadership', title: '원격근무 팀의 성과 관리 노하우', content: '완전 원격 팀 3년째 리드 중입니다.\n\n1. OKR 기반 목표 설정\n2. 주간 스탠드업은 비동기 (Slack)\n3. 월 1회 오프라인 워크샵\n4. 1:1은 주 1회 30분 고정\n\n가장 중요한 건 "결과로 평가하되, 과정에서 소통하라"입니다.', anonymous: false },
  ]

  const postIds: string[] = []
  for (const p of posts) {
    const postId = randomUUID()
    const authorId = pick(memberIds)
    const { error } = await admin.from('community_posts').insert({
      id: postId,
      author_id: authorId,
      category: p.category,
      title: p.title,
      content: p.content,
      is_anonymous: p.anonymous,
      status: 'active',
      created_at: daysAgo(Math.floor(Math.random() * 25) + 1),
    })
    if (error) {
      console.warn(`  ⚠️ ${p.title}: ${error.message}`)
    } else {
      postIds.push(postId)
      console.log(`  ✅ [${p.category}] ${p.title}`)
    }
  }
  console.log()

  // ── 4. 댓글 ──
  console.log('💭 댓글 생성 중...')
  const commentTexts = [
    '정말 공감됩니다. 저도 비슷한 경험이 있어요.',
    '좋은 글 감사합니다. 저는 조금 다른 관점인데, 팀 상황도 중요하다고 생각해요.',
    '이 부분 정말 중요한 포인트네요. 도움이 됩니다.',
    '경험에서 우러나온 조언이라 더 와닿습니다!',
    '혹시 좀 더 구체적으로 설명해주실 수 있을까요?',
    '완전 동의합니다. 특히 마지막 부분이 핵심이에요.',
    '저도 비슷한 시도를 했는데, 팀원 피드백을 주기적으로 수집하는 것도 효과적이었습니다.',
    '좋은 인사이트 감사합니다. 북마크해둡니다.',
    '이런 솔직한 공유가 이 커뮤니티의 가치라고 생각합니다.',
    '반대 의견일 수 있지만, 저는 오히려 반대 접근이 효과적이었어요.',
  ]

  let totalComments = 0
  for (const postId of postIds) {
    const numComments = pick([2, 3, 4, 5])
    for (let c = 0; c < numComments; c++) {
      const authorId = pick(memberIds)
      const { error } = await admin.from('community_comments').insert({
        id: randomUUID(),
        post_id: postId,
        author_id: authorId,
        content: pick(commentTexts),
        is_anonymous: Math.random() < 0.3,
        status: 'active',
        created_at: daysAgo(Math.floor(Math.random() * 20)),
      })
      if (!error) totalComments++
    }
  }
  console.log(`  ✅ 총 ${totalComments}건 댓글 생성\n`)

  // ── 5. 좋아요 ──
  console.log('❤️ 좋아요 생성 중...')
  let totalLikes = 0
  for (const postId of postIds) {
    const numLikes = pick([3, 5, 7, 9])
    const likers = [...memberIds].sort(() => Math.random() - 0.5).slice(0, Math.min(numLikes, memberIds.length))
    for (const userId of likers) {
      const { error } = await admin.from('vcx_community_reactions').insert({
        id: randomUUID(),
        post_id: postId,
        user_id: userId,
        reaction_type: 'like',
        created_at: daysAgo(Math.floor(Math.random() * 20)),
      })
      if (!error) totalLikes++
    }
  }
  console.log(`  ✅ 총 ${totalLikes}건 좋아요 생성\n`)

  // ── 6. likes_count, comments_count 업데이트 ──
  console.log('📊 카운트 동기화 중...')
  for (const postId of postIds) {
    const { count: commentsCount } = await admin.from('community_comments').select('*', { count: 'exact', head: true }).eq('post_id', postId).eq('status', 'active')
    const { count: likesCount } = await admin.from('vcx_community_reactions').select('*', { count: 'exact', head: true }).eq('post_id', postId)
    await admin.from('community_posts').update({
      comments_count: commentsCount || 0,
      likes_count: likesCount || 0,
    }).eq('id', postId)
  }
  console.log('  ✅ 카운트 동기화 완료\n')

  // ── 결과 요약 ──
  console.log('═══════════════════════════════════════════════')
  console.log('🎉 테스트 데이터 시딩 완료!')
  console.log(`   멤버: ${memberIds.length}명`)
  console.log(`   커뮤니티 게시글: ${postIds.length}건`)
  console.log(`   댓글: ${totalComments}건`)
  console.log(`   좋아요: ${totalLikes}건`)
  console.log('═══════════════════════════════════════════════')
  console.log()
  console.log('📧 테스트 로그인 정보:')
  console.log(`   관리자: admin@${SEED_DOMAIN} / ${SEED_PASSWORD}`)
  console.log(`   코어 멤버: jihoon.park@${SEED_DOMAIN} / ${SEED_PASSWORD}`)
  console.log(`   기업 CEO: jaeyong.lee@${SEED_DOMAIN} / ${SEED_PASSWORD}`)

  // ── 검증: 데이터 확인 ──
  console.log('\n🔍 데이터 검증...')
  const { count: mCount } = await admin.from('vcx_members').select('*', { count: 'exact', head: true }).eq('is_active', true)
  const { count: pCount } = await admin.from('community_posts').select('*', { count: 'exact', head: true }).eq('status', 'active')
  const { count: cCount } = await admin.from('community_comments').select('*', { count: 'exact', head: true }).eq('status', 'active')
  console.log(`   vcx_members: ${mCount}명`)
  console.log(`   community_posts: ${pCount}건`)
  console.log(`   community_comments: ${cCount}건`)
}

seed().catch(err => {
  console.error('❌ 시딩 실패:', err)
  process.exit(1)
})
