# AI Pre-Brief System (CEO Staff Agent 개념 적용) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CEO 커피챗 신청 수락 시 Claude API가 양측(CEO/멤버)에게 맞춤형 Pre-Brief를 자동 생성하고, 세션 종료 후 피드백을 수집해 매칭 품질을 개선하는 CEO Staff Agent 시스템 프로토타입 구축.

**Architecture:** 기존 `vcx_coffee_applications` 테이블에 brief 컬럼 추가 → 신청 수락 시 Claude API 호출로 host_brief/applicant_brief 생성 → CEO 커피챗 상세 페이지에서 브리프 표시 → 세션 완료 후 피드백 폼 노출.

**Tech Stack:** `@anthropic-ai/sdk` (Claude claude-sonnet-4-6), Supabase (PostgreSQL RLS), Next.js 14 App Router, TypeScript strict, Tailwind v4, Zod v4.

---

## File Map

### 새로 생성
| 파일 | 역할 |
|------|------|
| `supabase/migrations/021_vcx_ai_brief_feedback.sql` | brief 컬럼 + feedback 테이블 |
| `src/lib/ai/claude.ts` | Anthropic SDK 싱글톤 클라이언트 |
| `src/lib/ai/brief.ts` | Pre-Brief 생성 로직 (프롬프트 + 파싱) |
| `src/app/api/ceo-coffeechat/[id]/brief/route.ts` | Brief 조회 API |
| `src/app/api/ceo-coffeechat/[id]/feedback/route.ts` | 피드백 제출 API |
| `src/components/coffeechat/pre-brief-card.tsx` | Pre-Brief UI 카드 |
| `src/components/coffeechat/feedback-form.tsx` | 피드백 폼 컴포넌트 |
| `src/__tests__/lib/ai/brief.test.ts` | brief 생성 함수 단위 테스트 |
| `src/__tests__/api/ceo-coffeechat-brief.test.ts` | Brief API 테스트 |

### 수정
| 파일 | 변경 내용 |
|------|----------|
| `src/app/api/ceo-coffeechat/[id]/applications/[appId]/route.ts` | accepted 시 brief 생성 트리거 |
| `src/app/(protected)/ceo-coffeechat/[id]/page.tsx` | brief + feedback 표시 |

---

## Task 1: DB Migration — Brief 컬럼 + Feedback 테이블

**Files:**
- Create: `supabase/migrations/021_vcx_ai_brief_feedback.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- 021_vcx_ai_brief_feedback.sql
-- CEO 커피챗 신청 테이블에 AI Brief 컬럼 추가

ALTER TABLE vcx_coffee_applications
  ADD COLUMN IF NOT EXISTS host_brief text,
  ADD COLUMN IF NOT EXISTS applicant_brief text,
  ADD COLUMN IF NOT EXISTS brief_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS brief_error text;

-- 커피챗 피드백 테이블 (CEO 세션 종료 후 수집)
CREATE TABLE vcx_coffeechat_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES vcx_ceo_coffee_sessions(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES vcx_coffee_applications(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  reviewer_role text NOT NULL CHECK (reviewer_role IN ('host', 'applicant')),

  -- 평가 항목
  overall_rating int NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  culture_fit_score int CHECK (culture_fit_score BETWEEN 1 AND 5),
  would_connect_again boolean,
  feedback_tags text[] DEFAULT '{}',
  comment text,

  -- 브리프 유용성 평가
  brief_helpful boolean,

  created_at timestamptz DEFAULT now(),
  UNIQUE(application_id, reviewer_id)
);

-- RLS 정책
ALTER TABLE vcx_coffeechat_feedback ENABLE ROW LEVEL SECURITY;

-- 피드백 작성: 본인만
CREATE POLICY "feedback_insert_own"
  ON vcx_coffeechat_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

-- 피드백 조회: admin만 (집계용)
CREATE POLICY "feedback_select_admin"
  ON vcx_coffeechat_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vcx_members
      WHERE id = auth.uid()
        AND system_role IN ('admin', 'super_admin')
    )
  );
```

- [ ] **Step 2: 마이그레이션 검증 (로컬 Supabase 없으면 스킵, 파일만 저장)**

```bash
# 로컬 supabase가 있다면:
# npx supabase db push
# 없으면 파일 저장만으로 OK — 원격 배포는 별도 진행
echo "Migration file created: 021_vcx_ai_brief_feedback.sql"
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/021_vcx_ai_brief_feedback.sql
git commit -m "feat: add AI brief columns and feedback table (migration 021)"
```

---

## Task 2: Anthropic SDK 설치 + AI 클라이언트 구성

**Files:**
- Create: `src/lib/ai/claude.ts`
- Create: `src/lib/ai/brief.ts`
- Modify: `.env.local` (ANTHROPIC_API_KEY 추가 안내)

- [ ] **Step 1: SDK 설치**

```bash
npm install @anthropic-ai/sdk
```

Expected output: `added 1 package` (또는 유사한 성공 메시지)

- [ ] **Step 2: Claude 클라이언트 싱글톤 작성**

`src/lib/ai/claude.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk'

const apiKey = process.env.ANTHROPIC_API_KEY

if (!apiKey && process.env.NODE_ENV === 'production') {
  throw new Error('ANTHROPIC_API_KEY environment variable is required')
}

export const claude = apiKey
  ? new Anthropic({ apiKey })
  : null

export const CLAUDE_MODEL = 'claude-sonnet-4-6'
```

- [ ] **Step 3: Brief 생성 함수 작성**

`src/lib/ai/brief.ts`:
```typescript
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
```

- [ ] **Step 4: `.env.local`에 API 키 추가 안내 (파일 직접 수정 금지)**

```bash
# 사용자가 수동으로 .env.local에 추가:
# ANTHROPIC_API_KEY=sk-ant-...
echo "ANTHROPIC_API_KEY= # Anthropic Console에서 발급" >> .env.local.example
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/claude.ts src/lib/ai/brief.ts
git commit -m "feat: add Claude AI client and brief generation logic"
```

---

## Task 3: Brief 생성 단위 테스트

**Files:**
- Create: `src/__tests__/lib/ai/brief.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

`src/__tests__/lib/ai/brief.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

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
})
```

- [ ] **Step 2: 테스트 실행 — PASS 확인**

```bash
npm test -- src/__tests__/lib/ai/brief.test.ts
```

Expected: `3 tests passed`

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/lib/ai/brief.test.ts
git commit -m "test: add unit tests for brief generation"
```

---

## Task 4: 신청 수락 시 Brief 자동 생성 (기존 API 수정)

**Files:**
- Modify: `src/app/api/ceo-coffeechat/[id]/applications/[appId]/route.ts`

현재 파일 끝부분(accepted 처리 블록 이후)에 brief 생성 로직을 추가한다.

- [ ] **Step 1: 파일 끝 부분 확인 후 brief 트리거 추가**

`src/app/api/ceo-coffeechat/[id]/applications/[appId]/route.ts`의 `status === 'accepted'` 블록 이후에 추가:

```typescript
// 파일 상단 import에 추가:
import { generateCoffeechatBrief } from '@/lib/ai/brief'

// accepted 처리 블록 마지막, return NextResponse.json 직전에 추가:
if (status === 'accepted') {
  // Brief 비동기 생성 (fire-and-forget, 응답 지연 방지)
  generateCoffeechatBriefAsync(
    supabase,
    sessionId,
    appId,
    application.applicant_id
  ).catch((err) => console.error('Brief generation failed:', err))
}
```

- [ ] **Step 2: 헬퍼 함수 추가 (같은 파일 하단)**

```typescript
async function generateCoffeechatBriefAsync(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
  appId: string,
  applicantId: string
) {
  // 세션 정보 조회
  const { data: session } = await supabase
    .from('vcx_ceo_coffee_sessions')
    .select('title, description, tags, host:vcx_corporate_users(name, title, company, company_desc)')
    .eq('id', sessionId)
    .single()

  if (!session) return

  // 신청자 정보 조회
  const { data: member } = await supabase
    .from('vcx_members')
    .select('name, role, company, specialties, member_tier')
    .eq('id', applicantId)
    .single()

  if (!member) return

  const host = Array.isArray(session.host) ? session.host[0] : session.host
  if (!host) return

  const { hostBrief, applicantBrief } = await generateCoffeechatBrief({
    sessionTitle: session.title,
    sessionDescription: session.description ?? '',
    sessionTags: session.tags ?? [],
    hostName: host.name,
    hostTitle: host.title ?? '',
    hostCompany: host.company,
    hostCompanyDesc: host.company_desc,
    applicantName: member.name,
    applicantRole: member.role ?? '',
    applicantCompany: member.company ?? '',
    applicantSpecialties: member.specialties ?? [],
    applicantMemberTier: member.member_tier as 'core' | 'endorsed',
  })

  await supabase
    .from('vcx_coffee_applications')
    .update({
      host_brief: hostBrief,
      applicant_brief: applicantBrief,
      brief_generated_at: new Date().toISOString(),
    })
    .eq('id', appId)
}
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` (또는 에러 없음)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ceo-coffeechat/\[id\]/applications/\[appId\]/route.ts
git commit -m "feat: trigger AI brief generation on coffee chat acceptance"
```

---

## Task 5: Brief 조회 API

**Files:**
- Create: `src/app/api/ceo-coffeechat/[id]/brief/route.ts`

- [ ] **Step 1: Brief 조회 API 작성**

`src/app/api/ceo-coffeechat/[id]/brief/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, notFound, forbidden, serverError } from '@/lib/api/error'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const { id: sessionId } = await params

    // 이 세션의 수락된 신청 중 현재 사용자 관련 brief 조회
    // 호스트인 경우: host_brief 반환
    // 신청자인 경우: applicant_brief 반환
    const { data: application, error } = await supabase
      .from('vcx_coffee_applications')
      .select('id, applicant_id, host_brief, applicant_brief, brief_generated_at, status')
      .eq('session_id', sessionId)
      .eq('status', 'accepted')
      .or(`applicant_id.eq.${user.id}`)
      .maybeSingle()

    // 호스트 여부 확인
    const { data: session } = await supabase
      .from('vcx_ceo_coffee_sessions')
      .select('host_id')
      .eq('id', sessionId)
      .single()

    if (!session) return notFound('세션을 찾을 수 없습니다')

    const isHost = session.host_id === user.id

    if (!isHost && !application) {
      return forbidden('이 세션의 브리프에 접근할 권한이 없습니다')
    }

    if (error) return serverError('브리프 조회에 실패했습니다')

    if (!application) {
      return NextResponse.json({ brief: null, briefGeneratedAt: null })
    }

    const brief = isHost ? application.host_brief : application.applicant_brief

    return NextResponse.json({
      brief,
      briefGeneratedAt: application.brief_generated_at,
      applicationId: application.id,
    })
  } catch {
    return serverError()
  }
}
```

- [ ] **Step 2: Lint 확인**

```bash
npm run lint -- --quiet 2>&1 | grep -E "Error|error" | head -10
```

Expected: 출력 없음 (에러 없음)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ceo-coffeechat/\[id\]/brief/route.ts
git commit -m "feat: add brief retrieval API endpoint"
```

---

## Task 6: Pre-Brief UI 컴포넌트

**Files:**
- Create: `src/components/coffeechat/pre-brief-card.tsx`

- [ ] **Step 1: Pre-Brief 카드 컴포넌트 작성**

`src/components/coffeechat/pre-brief-card.tsx`:
```typescript
'use client'

import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'

interface PreBriefCardProps {
  sessionId: string
}

interface BriefData {
  brief: string | null
  briefGeneratedAt: string | null
  applicationId: string
}

export function PreBriefCard({ sessionId }: PreBriefCardProps) {
  const [data, setData] = useState<BriefData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/ceo-coffeechat/${sessionId}/brief`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="border border-[#c9a84c]/30 bg-[#c9a84c]/5 p-4">
        <div className="flex items-center gap-2 text-[#c9a84c] text-sm">
          <RefreshCw size={14} className="animate-spin" />
          <span>AI 브리프 생성 중...</span>
        </div>
      </div>
    )
  }

  if (!data?.brief) return null

  const generatedAt = data.briefGeneratedAt
    ? new Date(data.briefGeneratedAt).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="border border-[#c9a84c]/40 bg-[#c9a84c]/5 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={15} className="text-[#c9a84c]" />
        <span className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider">
          AI Pre-Brief
        </span>
        {generatedAt && (
          <span className="text-xs text-neutral-500 ml-auto">{generatedAt} 생성</span>
        )}
      </div>
      <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
        {data.brief}
      </p>
      <p className="text-xs text-neutral-600">
        이 브리프는 Claude AI가 세션 정보와 프로필을 분석해 자동 생성했습니다.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: CEO 커피챗 상세 페이지에 PreBriefCard 추가**

`src/app/(protected)/ceo-coffeechat/[id]/page.tsx` 파일을 읽고, 세션 상세 정보 영역 (status가 `accepted` 또는 `completed`인 신청이 있는 경우) 아래에 `<PreBriefCard sessionId={id} />` 삽입.

파일에서 세션 정보를 렌더링하는 부분 하단에 추가:
```typescript
// 파일 상단 import 추가:
import { PreBriefCard } from '@/components/coffeechat/pre-brief-card'

// JSX 내 적절한 위치 (세션 상세 카드 아래)에 추가:
<PreBriefCard sessionId={id} />
```

- [ ] **Step 3: Lint + Build 확인**

```bash
npm run lint -- --quiet 2>&1 | grep -E "^.*Error" | head -5
npm run build 2>&1 | tail -5
```

Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add src/components/coffeechat/pre-brief-card.tsx
git add src/app/\(protected\)/ceo-coffeechat/\[id\]/page.tsx
git commit -m "feat: add PreBriefCard UI component and wire to coffeechat detail page"
```

---

## Task 7: 피드백 API + 폼

**Files:**
- Create: `src/app/api/ceo-coffeechat/[id]/feedback/route.ts`
- Create: `src/components/coffeechat/feedback-form.tsx`

- [ ] **Step 1: 피드백 API 작성**

`src/app/api/ceo-coffeechat/[id]/feedback/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { unauthorized, badRequest, conflict, serverError, forbidden } from '@/lib/api/error'

const feedbackSchema = z.object({
  applicationId: z.string().uuid(),
  overallRating: z.number().int().min(1).max(5),
  cultureFitScore: z.number().int().min(1).max(5).optional(),
  wouldConnectAgain: z.boolean().optional(),
  feedbackTags: z.array(z.string()).default([]),
  comment: z.string().max(500).optional(),
  briefHelpful: z.boolean().optional(),
})

const FEEDBACK_TAGS = [
  '인사이트 풍부', '실질적 조언', '업계 전문성', '문화 공유',
  '네트워킹 확장', '기대 미충족', '시간 부족', '방향성 불일치',
]

export const AVAILABLE_FEEDBACK_TAGS = FEEDBACK_TAGS

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const { id: sessionId } = await params

    let body: unknown
    try { body = await request.json() } catch { return badRequest('유효하지 않은 요청 형식입니다') }

    const parsed = feedbackSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? '검증 오류')

    const { applicationId, overallRating, cultureFitScore, wouldConnectAgain, feedbackTags, comment, briefHelpful } = parsed.data

    // 세션 완료 상태 확인
    const { data: session } = await supabase
      .from('vcx_ceo_coffee_sessions')
      .select('id, host_id, status')
      .eq('id', sessionId)
      .single()

    if (!session || session.status !== 'completed') {
      return forbidden('완료된 세션에만 피드백을 작성할 수 있습니다')
    }

    // reviewer_role 결정
    const isHost = session.host_id === user.id
    const reviewerRole = isHost ? 'host' : 'applicant'

    // 신청 검증
    const { data: application } = await supabase
      .from('vcx_coffee_applications')
      .select('id, applicant_id, status')
      .eq('id', applicationId)
      .eq('session_id', sessionId)
      .single()

    if (!application || application.status !== 'accepted') {
      return forbidden('유효하지 않은 신청입니다')
    }

    if (!isHost && application.applicant_id !== user.id) {
      return forbidden('이 신청에 대한 피드백 권한이 없습니다')
    }

    const { error: insertError } = await supabase
      .from('vcx_coffeechat_feedback')
      .insert({
        session_id: sessionId,
        application_id: applicationId,
        reviewer_id: user.id,
        reviewer_role: reviewerRole,
        overall_rating: overallRating,
        culture_fit_score: cultureFitScore,
        would_connect_again: wouldConnectAgain,
        feedback_tags: feedbackTags,
        comment,
        brief_helpful: briefHelpful,
      })

    if (insertError) {
      if (insertError.code === '23505') return conflict('이미 피드백을 제출했습니다')
      console.error('Feedback insert error:', insertError)
      return serverError()
    }

    return NextResponse.json({ success: true })
  } catch {
    return serverError()
  }
}
```

- [ ] **Step 2: 피드백 폼 컴포넌트 작성**

`src/components/coffeechat/feedback-form.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { Star, CheckCircle } from 'lucide-react'

interface FeedbackFormProps {
  sessionId: string
  applicationId: string
  onSubmitted?: () => void
}

const TAGS = [
  '인사이트 풍부', '실질적 조언', '업계 전문성', '문화 공유',
  '네트워킹 확장', '기대 미충족', '시간 부족', '방향성 불일치',
]

export function FeedbackForm({ sessionId, applicationId, onSubmitted }: FeedbackFormProps) {
  const [rating, setRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [wouldConnect, setWouldConnect] = useState<boolean | null>(null)
  const [briefHelpful, setBriefHelpful] = useState<boolean | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) { setError('전체 평점을 선택해주세요'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/ceo-coffeechat/${sessionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          overallRating: rating,
          feedbackTags: selectedTags,
          wouldConnectAgain: wouldConnect ?? undefined,
          briefHelpful: briefHelpful ?? undefined,
          comment: comment || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? '피드백 제출에 실패했습니다')
      } else {
        setSubmitted(true)
        onSubmitted?.()
      }
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-400 py-4">
        <CheckCircle size={16} className="text-[#c9a84c]" />
        <span>피드백이 제출되었습니다. 감사합니다.</span>
      </div>
    )
  }

  return (
    <div className="space-y-5 border border-neutral-800 p-5">
      <h3 className="text-sm font-semibold text-neutral-200">커피챗 피드백</h3>

      {/* 별점 */}
      <div className="space-y-1">
        <p className="text-xs text-neutral-500">전체 만족도</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} type="button">
              <Star
                size={22}
                className={n <= rating ? 'text-[#c9a84c] fill-[#c9a84c]' : 'text-neutral-700'}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 태그 */}
      <div className="space-y-2">
        <p className="text-xs text-neutral-500">키워드 (복수 선택)</p>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-xs px-3 py-1 border transition-colors ${
                selectedTags.includes(tag)
                  ? 'border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10'
                  : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 재연결 */}
      <div className="space-y-2">
        <p className="text-xs text-neutral-500">다시 만나고 싶으신가요?</p>
        <div className="flex gap-3">
          {[{ v: true, label: '네' }, { v: false, label: '아니오' }].map(({ v, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setWouldConnect(v)}
              className={`text-xs px-4 py-1.5 border transition-colors ${
                wouldConnect === v
                  ? 'border-[#c9a84c] text-[#c9a84c]'
                  : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 브리프 유용성 */}
      <div className="space-y-2">
        <p className="text-xs text-neutral-500">AI 브리프가 도움이 되었나요?</p>
        <div className="flex gap-3">
          {[{ v: true, label: '도움됨' }, { v: false, label: '별로' }].map(({ v, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setBriefHelpful(v)}
              className={`text-xs px-4 py-1.5 border transition-colors ${
                briefHelpful === v
                  ? 'border-[#c9a84c] text-[#c9a84c]'
                  : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 코멘트 */}
      <div className="space-y-1">
        <p className="text-xs text-neutral-500">한 줄 코멘트 (선택)</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="자유롭게 남겨주세요"
          className="w-full bg-neutral-900 border border-neutral-800 text-sm text-neutral-300 px-3 py-2 resize-none focus:outline-none focus:border-neutral-600 placeholder:text-neutral-700"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 text-sm font-medium bg-[#c9a84c] text-black hover:bg-[#d4b05a] disabled:opacity-50 transition-colors"
      >
        {loading ? '제출 중...' : '피드백 제출'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: CEO 커피챗 상세 페이지에 FeedbackForm 추가**

`src/app/(protected)/ceo-coffeechat/[id]/page.tsx`에서 세션 status가 `'completed'`일 때 `<FeedbackForm>` 렌더링:

```typescript
// import 추가:
import { FeedbackForm } from '@/components/coffeechat/feedback-form'

// JSX 내 completed 세션 섹션에 추가:
// (applicationId는 기존 데이터에서 가져옴)
{session.status === 'completed' && acceptedApplicationId && (
  <FeedbackForm
    sessionId={id}
    applicationId={acceptedApplicationId}
  />
)}
```

- [ ] **Step 4: Build + Lint 최종 확인**

```bash
npm run lint -- --quiet 2>&1 | grep -c "Error" || echo "Lint OK"
npm run build 2>&1 | tail -10
```

Expected: `Lint OK` + 빌드 성공

- [ ] **Step 5: 테스트 전체 실행**

```bash
npm test 2>&1 | tail -15
```

Expected: 기존 테스트 + brief 테스트 모두 PASS

- [ ] **Step 6: 최종 Commit**

```bash
git add src/app/api/ceo-coffeechat/\[id\]/feedback/route.ts
git add src/components/coffeechat/feedback-form.tsx
git add src/app/\(protected\)/ceo-coffeechat/\[id\]/page.tsx
git commit -m "feat: add post-session feedback form and API"
```

---

## Self-Review Checklist

### Spec Coverage
- [x] 기업 온톨로지 기반 brief 생성 → Task 2-4 (기존 데이터를 온톨로지로 활용)
- [x] Claude API 연동 → Task 2 (claude.ts + brief.ts)
- [x] 신청 수락 시 자동 트리거 → Task 4
- [x] 호스트/신청자 각각 다른 brief → brief.ts 양방향 생성
- [x] Pre-Brief UI → Task 6
- [x] 피드백 수집 → Task 7
- [x] RLVR 피드백 루프 기반 → feedback DB 저장으로 후속 분석 가능

### Placeholder 검사
- 모든 코드 블록: 실제 코드 포함 ✓
- 모든 커맨드: 실행 가능한 형태 ✓
- "TBD"/"TODO" 없음 ✓

### Type Consistency
- `BriefInput` → Task 2에서 정의, Task 4에서 동일하게 사용 ✓
- `vcx_coffee_applications` 컬럼명: `host_brief`, `applicant_brief`, `brief_generated_at` ✓ (migration과 일치)
- `vcx_coffeechat_feedback` 컬럼명: migration과 API 코드 일치 ✓

---

## 환경 변수 요약

```bash
# .env.local에 추가 필요:
ANTHROPIC_API_KEY=sk-ant-...   # https://console.anthropic.com/
```

## 다음 단계 (Phase 2)

프로토타입 완성 후 확장 가능한 방향:
1. **기업 온톨로지 폼** — 기업 사용자가 성장 단계, 핵심 과제, 필요 인재 상세 입력
2. **벡터 임베딩 매칭** — Supabase pgvector + Voyage AI 임베딩으로 정밀 매칭
3. **피드백 → 매칭 가중치** — 피드백 데이터 분석으로 추천 알고리즘 개선
4. **멤버 측 도메인 에이전트 프로필** — 이미지의 7개 도메인 기반 전문성 맵핑
