import { SEED_EMAIL_DOMAIN } from './fixtures'
import { daysAgo, daysFromNow, pick, checkResult, type DemoClient } from './common'
import type { seedProfiles } from './profiles'
import { randomUUID } from 'node:crypto'

export async function seedCoffee(admin: DemoClient, profiles: Awaited<ReturnType<typeof seedProfiles>>) {
  const { memberMap, corpMap, memberIds, corpIds } = profiles
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
    checkResult(await admin.from('vcx_ceo_coffee_sessions').insert({
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
    }))
    console.log(`  ✅ ${s.title} (${s.status})`)
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
      checkResult(await admin.from('vcx_coffee_applications').insert({
        id: randomUUID(),
        session_id: sessionIds[si],
        applicant_id: applicantId,
        message: pick(applicationMessages),
        status: pick(statuses),
        created_at: daysAgo(Math.floor(Math.random() * 10) + 1),
      }))

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
    checkResult(await admin.from('peer_coffee_chats').insert({
      id: pcId,
      author_id: pc.author.id,
      title: pc.title,
      content: pc.content,
      category: pc.category,
      status: pc.status,
      created_at: daysAgo(Math.floor(Math.random() * 15) + 1),
    }))
    console.log(`  ✅ ${pc.title} (${pc.status})`)
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
      checkResult(await admin.from('peer_coffee_applications').insert({
        id: randomUUID(),
        chat_id: peerChatIds[i],
        applicant_id: appId,
        message: pick(peerAppMessages),
        status,
        created_at: daysAgo(Math.floor(Math.random() * 10)),
      }))
    }
  }
  console.log(`  ✅ 피어 커피챗 신청 생성 완료\n`)

  return { ceoFounders, sessionIds, peerChatIds }
}
