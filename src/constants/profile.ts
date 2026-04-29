// 프로필 관련 공통 상수 — 온보딩, 디렉토리, 필터에서 공유

export const PROFESSIONAL_FIELDS = [
  '엔지니어링', '프로덕트', '디자인', '데이터',
  '마케팅', '세일즈', '운영', '인사', '재무', '전략',
] as const

export const INDUSTRIES = [
  'IT/소프트웨어', '금융/핀테크', '이커머스',
  '바이오/헬스케어', '제조', '교육', '미디어/콘텐츠',
  '컨설팅', '스타트업', '기타',
] as const

export type ProfessionalField = typeof PROFESSIONAL_FIELDS[number]
export type Industry = typeof INDUSTRIES[number]
