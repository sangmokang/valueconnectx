import { claude, CLAUDE_MODEL } from './claude'

export interface BriefInput {
  sessionTitle: string
  sessionDescription: string
  sessionTags: string[]
  hostName: string
  hostTitle: string
  hostCompany: string
  hostCompanyDesc?: string | null
  applicantName: string
  applicantRole: string
  applicantCompany: string
  applicantSpecialties: string[]
  applicantMemberTier: 'core' | 'endorsed'
}

export interface GeneratedBrief {
  hostBrief: string
  applicantBrief: string
}

const HOST_BRIEF_PROMPT = (input: BriefInput) => `
당신은 ValueConnect X의 AI 커피챗 코디네이터입니다.
아래 정보를 바탕으로 CEO/호스트가 커피챗 전에 읽을 **호스트용 브리프**를 한국어로 작성하세요.

## 세션 정보
- 제목: ${input.sessionTitle}
- 설명: ${input.sessionDescription}
- 태그: ${input.sessionTags.join(', ')}

## 호스트 정보
- 이름: ${input.hostName}
- 직함: ${input.hostTitle}
- 회사: ${input.hostCompany}
${input.hostCompanyDesc ? `- 회사 소개: ${input.hostCompanyDesc}` : ''}

## 신청자 정보
- 이름: ${input.applicantName}
- 현재 역할: ${input.applicantRole}
- 소속: ${input.applicantCompany}
- 전문 분야: ${input.applicantSpecialties.join(', ')}
- 멤버 등급: ${input.applicantMemberTier === 'core' ? 'Core (최상위 검증 인재)' : 'Endorsed (추천 인재)'}

## 작성 지침
1. **이 멤버를 주목해야 하는 이유** (2-3문장): 세션 주제와 신청자 전문성의 교차점
2. **추천 대화 주제 3가지**: 구체적이고 실질적인 주제
3. **주의사항 1가지**: 대화 시 유의할 점

300자 이내로 간결하게 작성하세요. 불필요한 소개나 형식 없이 바로 내용으로 시작하세요.
`

const APPLICANT_BRIEF_PROMPT = (input: BriefInput) => `
당신은 ValueConnect X의 AI 커피챗 코디네이터입니다.
아래 정보를 바탕으로 커피챗 신청자가 미팅 전에 읽을 **신청자용 브리프**를 한국어로 작성하세요.

## 세션 정보
- 제목: ${input.sessionTitle}
- 설명: ${input.sessionDescription}
- 태그: ${input.sessionTags.join(', ')}

## 호스트(CEO/리더) 정보
- 이름: ${input.hostName}
- 직함: ${input.hostTitle}
- 회사: ${input.hostCompany}
${input.hostCompanyDesc ? `- 회사 소개: ${input.hostCompanyDesc}` : ''}

## 내 프로필
- 이름: ${input.applicantName}
- 역할: ${input.applicantRole}
- 전문 분야: ${input.applicantSpecialties.join(', ')}

## 작성 지침
1. **이 미팅의 가치** (2-3문장): 이 CEO/회사를 만나야 하는 이유
2. **준비할 질문 3가지**: 이 회사와 리더에게 물어볼 핵심 질문
3. **어필 포인트**: 내 경험 중 이 대화에서 빛날 수 있는 부분 1가지

300자 이내로 간결하게 작성하세요. 불필요한 소개나 형식 없이 바로 내용으로 시작하세요.
`

export async function generateCoffeechatBrief(
  input: BriefInput
): Promise<GeneratedBrief> {
  if (!claude) {
    // dev fallback when API key not set
    return {
      hostBrief: `[개발 환경 — ANTHROPIC_API_KEY 미설정]\n${input.applicantName}님 (${input.applicantRole}, ${input.applicantCompany})이 "${input.sessionTitle}" 세션에 신청했습니다. 전문 분야: ${input.applicantSpecialties.join(', ')}.`,
      applicantBrief: `[개발 환경 — ANTHROPIC_API_KEY 미설정]\n${input.hostName} (${input.hostTitle}, ${input.hostCompany})의 "${input.sessionTitle}" 세션입니다.`,
    }
  }

  const [hostRes, applicantRes] = await Promise.all([
    claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: HOST_BRIEF_PROMPT(input) }],
    }),
    claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: APPLICANT_BRIEF_PROMPT(input) }],
    }),
  ])

  const hostBrief =
    hostRes.content[0]?.type === 'text' ? hostRes.content[0].text : ''
  const applicantBrief =
    applicantRes.content[0]?.type === 'text' ? applicantRes.content[0].text : ''

  return { hostBrief, applicantBrief }
}
