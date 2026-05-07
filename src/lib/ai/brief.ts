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
  briefType?: 'peer' | 'ceo'
}

export interface GeneratedBrief {
  hostBrief: string
  applicantBrief: string
}

function filterFeeContent(text: string): string {
  const feePatterns = [
    /수수료/g,
    /25%/g,
    /fee/gi,
    /commission/gi,
    /채용\s*비용/g,
    /계약금/g,
  ]
  return feePatterns.reduce((acc, pattern) => acc.replace(pattern, ''), text)
}

function buildFallbackBrief(input: BriefInput): GeneratedBrief {
  const specialties = input.applicantSpecialties.length > 0
    ? input.applicantSpecialties.join(', ')
    : '프로필 전문 분야'

  return {
    hostBrief: [
      '[AI 브리프 기본 안내]',
      `${input.applicantName}님은 ${input.applicantRole || '핵심 인재'} 역할로 ${input.applicantCompany || '현재 소속'}에서 활동하고 있습니다.`,
      `"${input.sessionTitle}" 주제와 ${specialties} 경험이 만나는 지점을 먼저 확인해 주세요.`,
      '대화 전에는 신청자가 기대하는 도움, 함께 확인할 질문, 세션 후 다음 액션을 정리하면 좋습니다.',
    ].join('\n'),
    applicantBrief: [
      '[AI 브리프 기본 안내]',
      `${input.hostName}님은 ${input.hostCompany || '소속 조직'}의 ${input.hostTitle || '리더'}입니다.`,
      `"${input.sessionTitle}" 커피챗에서는 세션 설명을 기준으로 얻고 싶은 인사이트와 질문 2~3개를 준비해 주세요.`,
      'AI 생성이 일시적으로 제한되어 기본 브리프를 제공합니다.',
    ].join('\n'),
  }
}

const CEO_HOST_BRIEF_PROMPT = (input: BriefInput) => `
당신은 ValueConnect X의 AI 커피챗 코디네이터입니다.
아래 정보를 바탕으로 CEO/호스트가 커피챗 전에 읽을 **호스트용 브리프**를 한국어로 작성하세요.
이 미팅의 목적은 이 인재가 우리 조직 문화에 맞는 사람인지 확인하는 비공식 대화입니다.

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
- 멤버 등급: ${input.applicantMemberTier === 'core' ? '코어 멤버 (최상위 검증 인재)' : '추천 멤버 (추천 인재)'}

## 작성 지침
1. **이 멤버를 주목해야 하는 이유** (2-3문장): 세션 주제와 신청자 전문성의 교차점, 그리고 조직 문화 적합성
2. **컬쳐핏 확인 포인트 3가지**: 대화 중 확인할 구체적인 가치관/일하는 방식 관련 주제
3. **주의사항 1가지**: 대화 시 유의할 점

300자 이내로 간결하게 작성하세요. 불필요한 소개나 형식 없이 바로 내용으로 시작하세요.

절대 포함 금지: "수수료", "25%", "fee", "commission", "채용 비용", "계약금" 등 금전 관련 문구.
`

const CEO_APPLICANT_BRIEF_PROMPT = (input: BriefInput) => `
당신은 ValueConnect X의 AI 커피챗 코디네이터입니다.
아래 정보를 바탕으로 커피챗 신청자가 미팅 전에 읽을 **신청자용 브리프**를 한국어로 작성하세요.
이 미팅의 목적은 CEO/창업자와 컬쳐핏을 확인하는 자리입니다.

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
1. **이 미팅의 가치** (2-3문장): 이 CEO/회사의 가치관과 조직 문화를 이해할 기회
2. **컬쳐핏 확인 질문 3가지**: 이 회사의 가치관, 일하는 방식, 조직 문화에 대해 물어볼 핵심 질문
3. **어필 포인트**: 내 경험 중 이 회사의 문화와 맞는 부분 1가지

300자 이내로 간결하게 작성하세요. 불필요한 소개나 형식 없이 바로 내용으로 시작하세요.

절대 포함 금지: "수수료", "25%", "fee", "commission", "채용 비용", "계약금" 등 금전 관련 문구.
`

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
- 멤버 등급: ${input.applicantMemberTier === 'core' ? '코어 멤버 (최상위 검증 인재)' : '추천 멤버 (추천 인재)'}

## 작성 지침
1. **이 멤버를 주목해야 하는 이유** (2-3문장): 세션 주제와 신청자 전문성의 교차점
2. **추천 대화 주제 3가지**: 구체적이고 실질적인 주제
3. **주의사항 1가지**: 대화 시 유의할 점

300자 이내로 간결하게 작성하세요. 불필요한 소개나 형식 없이 바로 내용으로 시작하세요.

절대 포함 금지: "수수료", "25%", "fee", "commission", "채용 비용", "계약금" 등 금전 관련 문구.
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

절대 포함 금지: "수수료", "25%", "fee", "commission", "채용 비용", "계약금" 등 금전 관련 문구.
`

export async function generateCoffeechatBrief(
  input: BriefInput
): Promise<GeneratedBrief> {
  if (!claude) {
    return buildFallbackBrief(input)
  }

  try {
    const hostPrompt = input.briefType === 'ceo' ? CEO_HOST_BRIEF_PROMPT(input) : HOST_BRIEF_PROMPT(input)
    const applicantPrompt = input.briefType === 'ceo' ? CEO_APPLICANT_BRIEF_PROMPT(input) : APPLICANT_BRIEF_PROMPT(input)

    const [hostRes, applicantRes] = await Promise.all([
      claude.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 512,
        messages: [{ role: 'user', content: hostPrompt }],
      }),
      claude.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 512,
        messages: [{ role: 'user', content: applicantPrompt }],
      }),
    ])

    const hostBrief =
      hostRes.content[0]?.type === 'text' ? hostRes.content[0].text : ''
    const applicantBrief =
      applicantRes.content[0]?.type === 'text' ? applicantRes.content[0].text : ''

    if (!hostBrief || !applicantBrief) return buildFallbackBrief(input)

    return { 
      hostBrief: filterFeeContent(hostBrief), 
      applicantBrief: filterFeeContent(applicantBrief) 
    }
  } catch {
    return buildFallbackBrief(input)
  }
}
