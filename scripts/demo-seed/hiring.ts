import { SEED_EMAIL_DOMAIN } from './fixtures'
import { daysAgo, pick, checkResult, type DemoClient } from './common'
import type { seedProfiles } from './profiles'
import type { seedCoffee } from './coffee'
import type { seedCommunity } from './community'
import { randomUUID } from 'node:crypto'

export async function seedHiring(admin: DemoClient, profiles: Awaited<ReturnType<typeof seedProfiles>>, coffee: Awaited<ReturnType<typeof seedCoffee>>, community: Awaited<ReturnType<typeof seedCommunity>>) {
  const { memberMap, corpMap } = profiles
  const { ceoFounders, sessionIds, peerChatIds } = coffee
  const { allMemberIds, postIds } = community
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
    checkResult(await admin.from('positions').insert({
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
    }))
    console.log(`  ✅ ${pos.company} — ${pos.title} (${pos.status})`)
  }
  console.log()

  // ── 11. Position Interests ──
  console.log('⭐ 포지션 관심 표현 생성 중...')
  const interestTypes = ['interested', 'bookmark', 'not_interested'] as const
  for (const posId of positionIds) {
    const numInterests = pick([2, 3, 4, 5])
    const interestedMembers = [...allMemberIds].sort(() => Math.random() - 0.5).slice(0, numInterests)
    for (const userId of interestedMembers) {
      checkResult(await admin.from('position_interests').insert({
        id: randomUUID(),
        position_id: posId,
        user_id: userId,
        interest_type: pick([...interestTypes.slice(0, 2), ...interestTypes.slice(0, 2)]), // interested/bookmark 가중치
        created_at: daysAgo(Math.floor(Math.random() * 20)),
      }))
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
    checkResult(await admin.from('vcx_notifications').insert({
      id: randomUUID(),
      user_id: n.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      is_read: n.read,
      created_at: daysAgo(Math.floor(Math.random() * 7)),
    }))
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
    checkResult(await admin.from('vcx_hiring_records').insert({
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
    }))
    console.log(`  ✅ ${hr.posTitle} — ${hr.salary.toLocaleString()}원 (${hr.status})`)
  }
  console.log()

  return { positions: positionsData.length, hiringRecords: hiringRecords.length, notifications: notifications.length }
}
