import { describe, it, expect, vi } from 'vitest'

// Claude 클라이언트 모킹 — SDK import 전에 mock 설정
vi.mock('@/lib/ai/claude', () => ({
  claude: null, // API 키 없는 환경 시뮬레이션
  CLAUDE_MODEL: 'claude-sonnet-4-6',
}))

import { generateCoffeechatBrief, type BriefInput } from '@/lib/ai/brief'

const mockInput: BriefInput = {
  sessionTitle: 'AI 스타트업 창업자와의 커피챗',
  sessionDescription: 'AI 제품 개발 경험을 가진 엔지니어를 찾습니다',
  sessionTags: ['AI', '스타트업', '엔지니어링'],
  hostName: '김창업',
  hostTitle: 'CEO',
  hostCompany: 'TechCo',
  hostCompanyDesc: 'B2B SaaS 스타트업',
  applicantName: '이개발',
  applicantRole: 'Senior ML Engineer',
  applicantCompany: '네이버',
  applicantSpecialties: ['머신러닝', 'NLP', 'Python'],
  applicantMemberTier: 'core',
}

describe('generateCoffeechatBrief', () => {
  it('API 키 없을 때 fallback 브리프를 반환한다', async () => {
    const result = await generateCoffeechatBrief(mockInput)

    expect(result.hostBrief).toContain('이개발')
    expect(result.hostBrief).toContain('Senior ML Engineer')
    expect(result.applicantBrief).toContain('김창업')
    expect(result.applicantBrief).toContain('AI 스타트업 창업자와의 커피챗')
  })

  it('결과에 hostBrief와 applicantBrief가 모두 포함된다', async () => {
    const result = await generateCoffeechatBrief(mockInput)

    expect(result).toHaveProperty('hostBrief')
    expect(result).toHaveProperty('applicantBrief')
    expect(typeof result.hostBrief).toBe('string')
    expect(typeof result.applicantBrief).toBe('string')
  })

  it('hostBrief는 비어있지 않다', async () => {
    const result = await generateCoffeechatBrief(mockInput)
    expect(result.hostBrief.length).toBeGreaterThan(10)
  })

  it('applicantBrief는 비어있지 않다', async () => {
    const result = await generateCoffeechatBrief(mockInput)
    expect(result.applicantBrief.length).toBeGreaterThan(10)
  })
})
