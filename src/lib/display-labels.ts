const FIELD_LABELS: Record<string, string> = {
  Business: '사업개발',
  Product: '프로덕트',
  Engineering: '엔지니어링',
  Finance: '재무',
  Sales: '세일즈',
  General: '일반',
  Career: '커리어',
  Hiring: '채용',
  Mentoring: '멘토링',
  'AI / ML': 'AI·머신러닝',
  'Series A 스타트업': '시리즈 A 스타트업',
  '엔터프라이즈 SaaS': '엔터프라이즈 소프트웨어',
  Technology: '기술',
  'AI Product': 'AI 프로덕트',
  'Engineering Leadership': '엔지니어링 리더십',
  'Private Talent Network': '프라이빗 인재 네트워크',
}

const FIELD_REPLACEMENTS: Array<[string, string]> = [
  ['Engineering', '엔지니어링'],
  ['Product', '프로덕트'],
  ['Finance', '재무'],
  ['Sales', '세일즈'],
  ['Business', '사업개발'],
]

export function displayFieldLabel(value: string): string {
  if (FIELD_LABELS[value]) return FIELD_LABELS[value]
  return FIELD_REPLACEMENTS.reduce(
    (label, [from, to]) => label.replaceAll(from, to),
    value
  )
}

export function displayMemberTier(value: string): string {
  return value.toLowerCase() === 'endorsed' ? '추천 멤버' : '코어 멤버'
}

const ROLE_REPLACEMENTS: Array<[string, string]> = [
  ['VP of Engineering', '엔지니어링 VP'],
  ['Director of Data Science', '데이터 사이언스 디렉터'],
  ['Senior Software Engineer', '시니어 소프트웨어 엔지니어'],
  ['Product Manager', '프로덕트 매니저'],
  ['Head of Product', '프로덕트 총괄'],
  ['Head of Design', '디자인 총괄'],
  ['Product Lead', '프로덕트 리드'],
  ['Frontend Lead', '프론트엔드 리드'],
  ['Backend Engineer', '백엔드 엔지니어'],
  ['DevRel Engineer', '개발자 경험 엔지니어'],
  ['iOS Developer', 'iOS 개발자'],
  ['CTO', '기술총괄'],
  ['CPO', '프로덕트총괄'],
  ['Co-founder', '공동창업자'],
  ['Engineering', '엔지니어링'],
  ['Product', '프로덕트'],
]

export function displayRoleLabel(value: string): string {
  return ROLE_REPLACEMENTS.reduce(
    (label, [from, to]) => label.replaceAll(from, to),
    value
  )
}
