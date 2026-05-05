import { claude, CLAUDE_MODEL } from './claude'

export interface CareerInput {
  name: string
  title?: string | null
  currentCompany?: string | null
  professionalFields: string[]
  yearsOfExperience?: number | null
  existingBio?: string | null
}

function buildFallbackSummary(input: CareerInput): string {
  const fields = input.professionalFields.length > 0
    ? input.professionalFields.join(', ')
    : '다양한 분야'
  const years = input.yearsOfExperience != null ? `${input.yearsOfExperience}년` : ''
  const company = input.currentCompany ? ` ${input.currentCompany}에서` : ''
  const title = input.title ? ` ${input.title}로` : ''

  return `${input.name}님은${company}${title} 활동하고 있으며, ${fields} 분야의 전문가입니다.${years ? ` ${years}의 경력을 보유하고 있습니다.` : ''}`
}

const CAREER_SUMMARY_PROMPT = (input: CareerInput) => `
당신은 ValueConnect X의 프로필 작성 도우미입니다.
아래 정보를 바탕으로 한국어로 간결하고 전문적인 프로필 소개를 2~3문장으로 작성하세요.

## 프로필 정보
- 이름: ${input.name}
${input.title ? `- 직함: ${input.title}` : ''}
${input.currentCompany ? `- 현재 회사: ${input.currentCompany}` : ''}
${input.professionalFields.length > 0 ? `- 전문 분야: ${input.professionalFields.join(', ')}` : ''}
${input.yearsOfExperience != null ? `- 경력 년수: ${input.yearsOfExperience}년` : ''}
${input.existingBio ? `- 기존 소개: ${input.existingBio}` : ''}

## 작성 지침
- 한국어로 작성하세요.
- 2~3문장으로 간결하게 작성하세요.
- 200자 이내로 작성하세요.
- 불필요한 인사말이나 형식 없이 바로 내용으로 시작하세요.
- 전문성과 경험을 자연스럽게 녹여내세요.
- 1인칭(저는)이 아닌 3인칭(이름+님은) 또는 직함 기준으로 작성하세요.
`

export async function generateCareerSummary(input: CareerInput): Promise<string> {
  if (!claude) {
    return buildFallbackSummary(input)
  }

  try {
    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 256,
      messages: [{ role: 'user', content: CAREER_SUMMARY_PROMPT(input) }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : ''
    if (!text) return buildFallbackSummary(input)

    return text
  } catch {
    return buildFallbackSummary(input)
  }
}
