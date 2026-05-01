import type {
  CandidateResumeInput,
  CompanyJDInput,
  MarketJobSignalInput,
} from '@/lib/b2b-intelligence'

export const demoCompanyJD: CompanyJDInput = {
  id: 'eaeaeaea-eaea-4eae-8eae-eaeaeaeaeae1',
  company_name: 'Acme Korea',
  title: 'B2B SaaS Product Lead',
  domain_sector: 'B2B SaaS',
  seniority: 'Lead',
  jd_text:
    'B2B SaaS 제품의 초기 GTM과 리텐션 개선을 주도할 Product Lead를 찾습니다. 고객 인터뷰, 제품 전략, 데이터 기반 우선순위 설정, 세일즈 협업 경험이 필요합니다.',
  required_skills: ['product', 'b2b', 'gtm', 'retention'],
  preferred_skills: ['pricing', 'sales', 'analytics'],
  source_type: 'gdrive',
  source_uri: 'gdrive://sample/acme-product-lead-jd',
}

export const demoCandidateResumes: CandidateResumeInput[] = [
  {
    id: 'ebebebeb-ebeb-4beb-8beb-ebebebebebe1',
    candidate_name: '김코어',
    current_title: 'Head of Product',
    years_of_experience: 12,
    domain_sectors: ['B2B SaaS', 'Marketplace'],
    skills: ['product', 'strategy', 'b2b', 'retention', 'analytics'],
    resume_text:
      '요약: 12년 경력의 Product Lead. B2B SaaS에서 온보딩 전환율 18% 개선, 리텐션 지표 12%p 개선, 신규 가격 정책 출시를 주도했습니다. 경력: Value Labs Head of Product로 고객 인터뷰, GTM, 세일즈 협업, 데이터 기반 제품 전략을 총괄했습니다. 프로젝트: 엔터프라이즈 대시보드 출시, ARR 성장 기여, 조직 채용과 멘토링 수행. 스킬: product, strategy, b2b, retention, analytics.',
    source_type: 'desktop',
    source_uri: 'desktop://sample/kim-core-resume.pdf',
  },
  {
    id: 'ecececec-ecec-4ece-8ece-ececececece2',
    candidate_name: '이그로스',
    current_title: 'Growth PM',
    years_of_experience: 7,
    domain_sectors: ['Consumer App', 'B2B SaaS'],
    skills: ['growth', 'analytics', 'experiment', 'activation', 'pricing'],
    resume_text:
      '7년차 Growth PM. 구독 제품 활성화 퍼널과 가격 실험을 운영했고, 신규 온보딩 전환율 21% 개선을 달성했습니다. B2B SaaS에서는 세일즈 협업 경험이 일부 있으나 엔터프라이즈 리텐션 운영 경험은 제한적입니다. 스킬: growth, analytics, experiment, activation, pricing.',
    source_type: 'desktop',
    source_uri: 'desktop://sample/growth-pm-resume.pdf',
  },
  {
    id: 'edededed-eded-4ede-8ede-ededededede3',
    candidate_name: '박플랫폼',
    current_title: 'AI Platform PM',
    years_of_experience: 9,
    domain_sectors: ['AI Infra'],
    skills: ['ai', 'platform', 'roadmap', 'analytics', 'stakeholder'],
    resume_text:
      'AI 플랫폼 제품 로드맵과 데이터 기반 우선순위 설정을 담당했습니다. 엔지니어링 조직과 협업해 모델 배포 운영 시간을 32% 절감했고, 사내 플랫폼 adoption을 개선했습니다. B2B SaaS GTM과 가격 정책 경험은 이력서에서 명확하지 않습니다.',
    source_type: 'manual',
  },
]

export const demoMarketJobSignals: MarketJobSignalInput[] = [
  {
    id: 'efefefef-efef-4efe-8efe-efefefefefe1',
    source: 'wanted',
    company_name: 'Acme Korea',
    title: 'Product Lead',
    domain_sector: 'B2B SaaS',
    function_tags: ['product', 'b2b', 'gtm', 'retention'],
    seniority: 'Lead',
    location: 'Seoul',
    salary_band: '협의',
    jd_text:
      'B2B SaaS 제품 전략, 고객 인터뷰, 리텐션 개선, 세일즈 협업을 담당합니다.',
    url: 'https://example.com/jobs/acme-product-lead',
    published_at: '2026-05-01T09:00:00+09:00',
  },
  {
    id: 'fafafafa-fafa-4faf-8faf-fafafafafaf2',
    source: 'linkedin',
    company_name: 'Northstar AI',
    title: 'AI Platform PM',
    domain_sector: 'AI Infra',
    function_tags: ['product', 'ai', 'platform', 'analytics'],
    seniority: 'Senior',
    location: 'Remote',
    salary_band: '협의',
    jd_text: 'AI 플랫폼 제품 로드맵과 데이터 기반 의사결정을 담당합니다.',
    url: 'https://example.com/jobs/northstar-ai-pm',
    published_at: '2026-04-30T09:00:00+09:00',
  },
  {
    id: 'fbfbfbfb-fbfb-4bfb-8bfb-fbfbfbfbfbf3',
    source: 'programmers',
    company_name: 'RetainCloud',
    title: 'Senior Product Manager',
    domain_sector: 'B2B SaaS',
    function_tags: ['product', 'retention', 'pricing', 'analytics'],
    seniority: 'Senior',
    location: 'Seoul',
    salary_band: '8,000만-1.2억',
    jd_text:
      '구독형 B2B SaaS의 리텐션, 가격 정책, 고객 세그먼트 분석을 주도합니다.',
    url: 'https://example.com/jobs/retaincloud-senior-pm',
    published_at: '2026-04-29T09:00:00+09:00',
  },
  {
    id: 'fcfcfcfc-fcfc-4cfc-8cfc-fcfcfcfcfcf4',
    source: 'jumpit',
    company_name: 'SalesMesh',
    title: 'GTM Product Manager',
    domain_sector: 'B2B SaaS',
    function_tags: ['gtm', 'sales', 'product', 'b2b'],
    seniority: 'Lead',
    location: 'Seoul',
    salary_band: '협의',
    jd_text:
      '세일즈 조직과 함께 GTM 실험, 고객 인터뷰, 제품 패키징을 설계합니다.',
    url: 'https://example.com/jobs/salesmesh-gtm-pm',
    published_at: '2026-04-28T09:00:00+09:00',
  },
]
