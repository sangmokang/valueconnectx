import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

// HOT LINE 더미 데이터 — CEO가 직접 등록한 긴급 채용 공고
const HOT_LINE_ITEMS = [
  {
    company: 'Toss (비바리퍼블리카)',
    company_tag: '핀테크 B2B',
    role: '긴급 채용 | AI 제품 리드 엔지니어',
    summary:
      '토스 AI 팀이 프로덕트 전반에 AI를 적용할 리드 엔지니어를 긴급 채용합니다. LLM 파인튜닝, RAG 파이프라인 설계, 제품 통합 경험 있는 분을 찾습니다. 시리즈 G 이후 가장 큰 규모의 엔지니어링 확장으로, 합류 시 전사 AI 전략에 직접 기여합니다. 면접 프로세스를 최단 2주로 압축 운영 중입니다.',
    tags: ['핀테크 B2B', 'AI·머신러닝', '시니어', '긴급채용'],
    exclusive: true,
    published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    company: 'Kakao Pay',
    company_tag: '핀테크 B2B',
    role: '긴급 채용 | 결제 인프라 시니어 백엔드',
    summary:
      '카카오페이 결제 코어 팀에서 초당 10만 건 트랜잭션을 처리하는 인프라를 함께 설계할 시니어 백엔드 엔지니어를 구합니다. Java/Kotlin + 분산 시스템 5년 이상 경험자 우대. 팀 확장으로 인해 면접 슬롯이 이번 주 한정으로 운영됩니다. 연봉 상단 오퍼 가능.',
    tags: ['핀테크 B2B', '클라우드 인프라', '백엔드', '시니어'],
    exclusive: true,
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    company: 'Moloco',
    company_tag: '딥테크',
    role: '긴급 채용 | ML 플랫폼 엔지니어 (서울)',
    summary:
      '머신러닝 광고 플랫폼 Moloco 서울 팀에서 ML 플랫폼 엔지니어를 긴급 채용합니다. Kubernetes 기반 ML 학습/추론 인프라 설계 및 운영 경험이 있는 분을 찾습니다. 미국 본사와 동일한 RSU 패키지 제공, 글로벌 팀과 직접 협업 기회. 다음 달 신규 프로젝트 킥오프 전까지 합류 필요.',
    tags: ['딥테크', 'AI·머신러닝', '클라우드 인프라', '시니어'],
    exclusive: true,
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    company: 'Krafton',
    company_tag: '컨텐츠·미디어',
    role: '긴급 채용 | 게임 AI 리서처',
    summary:
      '크래프톤 AI 리서치 팀에서 게임 NPC 행동 지능화를 위한 AI 리서처를 모집합니다. RL(강화학습) 또는 게임 AI 관련 논문 실적 보유자 우대. 연구 결과를 PUBG·TERA 등 글로벌 라이브 서비스에 즉시 적용할 수 있는 드문 기회입니다. 박사 학위 또는 동등한 연구 경력 필수.',
    tags: ['딥테크', 'AI·머신러닝', '컨텐츠·미디어', '리서처'],
    exclusive: true,
    published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    company: 'Naver Cloud',
    company_tag: '클라우드 인프라',
    role: '긴급 채용 | 클라우드 아키텍트 (엔터프라이즈)',
    summary:
      '네이버 클라우드 엔터프라이즈 영업 확대에 따라 대기업 고객사 기술 설계를 담당할 클라우드 아키텍트를 긴급 채용합니다. AWS/GCP/Azure 중 1개 이상 Professional 인증 보유자 우대. 국내 최대 규모 엔터프라이즈 클라우드 마이그레이션 프로젝트에 핵심 멤버로 합류합니다.',
    tags: ['클라우드 인프라', '엔터프라이즈 소프트웨어', '시니어'],
    exclusive: true,
    published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    company: 'Kakao Brain',
    company_tag: 'AI·머신러닝',
    role: '긴급 채용 | LLM 파인튜닝 리서치 엔지니어',
    summary:
      '카카오브레인에서 한국어 특화 LLM 파인튜닝을 주도할 리서치 엔지니어를 구합니다. RLHF, DPO, LoRA 등 최신 파인튜닝 기법 실무 경험 보유자 우대. KoGPT 차기 버전 개발에 핵심 역할로 참여하며, 최상위급 GPU 클러스터 환경에서 연구합니다.',
    tags: ['AI·머신러닝', '딥테크', 'LLM', '리서처'],
    exclusive: true,
    published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    company: 'Coupang',
    company_tag: '컨슈머 앱',
    role: '긴급 채용 | 검색 추천 시스템 엔지니어',
    summary:
      '쿠팡 서울 R&D 센터에서 수억 건 상품 데이터를 다루는 검색·추천 시스템 엔지니어를 모집합니다. 대규모 분산 시스템 + ML 파이프라인 경험 필수. 미국 본사와 동일한 컴펜세이션 밴드 적용, 실리콘밸리급 엔지니어링 문화. 하반기 대규모 팀 확장의 일환입니다.',
    tags: ['컨슈머 앱', 'AI·머신러닝', '클라우드 인프라', '시니어'],
    exclusive: true,
    published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

async function main() {
  console.log('HOT LINE 더미 데이터 삽입 중...')

  // 기존 HOT LINE 삭제
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: delErr } = await (admin as any)
    .from('vcx_feed_items')
    .delete()
    .eq('exclusive', true)
  console.log('기존 HOT LINE 삭제:', delErr ? delErr.message : 'OK')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { users } } = await (admin as any).auth.admin.listUsers()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminUser = (users as any[]).find((u) => u.email === 'e2e-admin@vcx-test.com')

  const toInsert = HOT_LINE_ITEMS.map((item) => ({
    ...item,
    created_by: adminUser?.id ?? null,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error: insertErr } = await (admin as any)
    .from('vcx_feed_items')
    .insert(toInsert)
    .select('id, company, role')

  if (insertErr) {
    console.error('삽입 오류:', insertErr.message)
    return
  }

  console.log(`\n✅ HOT LINE ${inserted?.length}건 삽입 완료`)
  for (const item of (inserted ?? [])) {
    console.log(`  🔴 [${item.company}] ${item.role}`)
  }
}

main().catch(console.error)
