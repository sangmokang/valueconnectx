import { MEMBERS_DATA, CORPORATE_USERS_DATA, SEED_EMAIL_DOMAIN, SEED_PASSWORD } from './fixtures'
import { createAuthUser, daysAgo, pick, checkResult, type DemoClient } from './common'
import { randomUUID } from 'node:crypto'

export async function seedProfiles(admin: DemoClient) {
  // ── 1. Auth Users + vcx_members ──
  console.log('👤 멤버 계정 생성 중...')
  const memberIds: string[] = []
  const memberMap: Record<string, typeof MEMBERS_DATA[0] & { id: string }> = {}

  for (const m of MEMBERS_DATA) {
    const id = await createAuthUser(admin, m.email, SEED_PASSWORD)
    memberIds.push(id)
    memberMap[m.email] = { ...m, id }

    checkResult(await admin.from('vcx_members').upsert({
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
    }, { onConflict: 'id' }))

    console.log(`  ✅ ${m.name} (${m.tier}/${m.role}) — ${m.company}`)
  }

  // endorsed_by 설정 (endorsed 멤버 → core 멤버가 추천)
  const coreMembers = Object.values(memberMap).filter((m) => m.tier === 'core')
  const endorsedMembers = Object.values(memberMap).filter((m) => m.tier === 'endorsed')

  for (const em of endorsedMembers) {
    const endorser = pick(coreMembers)
    checkResult(await admin.from('vcx_members').update({
      endorsed_by: endorser.id,
      endorsed_by_name: endorser.name,
    }).eq('id', em.id))
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

    checkResult(await admin.from('vcx_corporate_users').upsert({
      id,
      name: c.name,
      email: c.email,
      company: c.company,
      role: c.corpRole,
      title: c.title,
      is_verified: true,
    }, { onConflict: 'id' }))

    console.log(`  ✅ ${c.name} (${c.corpRole}) — ${c.company}`)
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
    checkResult(await admin.from('vcx_recommendations').insert({
      id: recId,
      recommender_id: rec.recommender.id,
      recommended_email: rec.email,
      recommended_name: rec.name,
      reason: rec.reason,
      member_tier: rec.tier,
      status: 'pending',
      created_at: daysAgo(Math.floor(Math.random() * 7) + 1),
    }))
    console.log(`  ✅ ${rec.recommender.name} → ${rec.name} (pending)`)
  }

  // 승인된 추천 (endorsed 멤버들에 대한 과거 추천)
  for (let i = 0; i < Math.min(3, endorsedMembers.length); i++) {
    const em = endorsedMembers[i]
    const endorser = coreMembers[i % coreMembers.length]
    const recId = randomUUID()
    const adminMember = Object.values(memberMap).find(m => m.role === 'admin' || m.role === 'super_admin')!
    checkResult(await admin.from('vcx_recommendations').insert({
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
    }))
  }
  console.log(`  🔗 승인된 과거 추천 3건 생성\n`)

  return { memberIds, memberMap, corpIds, corpMap, coreMembers, endorsedMembers }
}
