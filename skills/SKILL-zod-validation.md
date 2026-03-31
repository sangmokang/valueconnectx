# SKILL: Zod v4 검증 패턴

VCX 프로젝트에서 Zod v4를 사용한 요청 검증 표준 가이드.

---

## 핵심 규칙

| 항목 | DO | DON'T |
|------|-----|-------|
| 타입 import | `ZodType` | `ZodSchema` (v4에서 deprecated) |
| 에러 필드 | `error.issues` | `error.errors` |
| nullable + optional | `.nullish()` | `.nullable().optional()` 순서 혼용 |
| 에러 메시지 | 한국어 | 영어 |
| URL 검증 | v4 엄격한 검증 주의 | 기존 v3 패턴 그대로 복사 |

---

## parseBody / parseSearchParams 패턴

```typescript
import { ZodType, ZodError } from 'zod';
import { badRequest } from './error';

export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>
): Promise<{ data: T; error: null } | { data: null; error: ReturnType<typeof badRequest> }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (e) {
    if (e instanceof ZodError) {
      return { data: null, error: badRequest('유효하지 않은 요청입니다', e.issues) };
    }
    return { data: null, error: badRequest('요청 본문을 파싱할 수 없습니다') };
  }
}

export async function parseSearchParams<T>(
  searchParams: URLSearchParams,
  schema: ZodType<T>
): Promise<{ data: T; error: null } | { data: null; error: ReturnType<typeof badRequest> }> {
  try {
    const raw = Object.fromEntries(searchParams.entries());
    const data = schema.parse(raw);
    return { data, error: null };
  } catch (e) {
    if (e instanceof ZodError) {
      return { data: null, error: badRequest('유효하지 않은 쿼리 파라미터입니다', e.issues) };
    }
    return { data: null, error: badRequest('쿼리 파라미터를 파싱할 수 없습니다') };
  }
}
```

---

## 스키마 작성 패턴

### DO: 올바른 스키마 정의

```typescript
import { z } from 'zod'

// Route Handler 요청 검증
const CreatePostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  content: z.string().min(1, '내용을 입력해주세요'),
  category: z.enum(['discussion', 'question', 'insight']),
})

// 선택적 필드
const UpdateProfileSchema = z.object({
  bio: z.string().max(500, '자기소개는 500자 이하로 입력해주세요').nullish(),
  linkedinUrl: z.string().url('올바른 URL 형식이 아닙니다').nullish(),
})

// 사용법
export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, CreatePostSchema)
  if (error) return error
  // data는 타입 안전 — CreatePostSchema의 inferred type
}
```

### DON'T: 금지 패턴

```typescript
// ❌ ZodSchema 사용 (v4 deprecated)
import { ZodSchema } from 'zod'
function validate(schema: ZodSchema<T>) { ... }

// ❌ error.errors 사용 (v4에서 error.issues 사용)
catch (e) {
  if (e instanceof ZodError) {
    console.log(e.errors) // 사용 금지
  }
}

// ❌ 스키마 없이 직접 parse
const body = await request.json()
// 바로 사용 — 검증 없음

// ❌ 영어 에러 메시지
z.string().min(1, 'Title is required')

// ❌ .nullable().optional() 혼용 (순서 불명확)
z.string().nullable().optional() // .nullish() 사용
```

---

## 타입 추론 패턴

```typescript
import { z } from 'zod'

const CreatePostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  content: z.string().min(1, '내용을 입력해주세요'),
})

// 스키마에서 타입 자동 추론 — 별도 타입 정의 불필요
type CreatePostInput = z.infer<typeof CreatePostSchema>
```

---

## v4 주요 변경점 요약

- `ZodSchema` → `ZodType` (import 변경 필수)
- `error.errors` → `error.issues`
- URL 검증이 더 엄격해짐 (프로토콜 필수 등)
- `.nullable().optional()` 대신 `.nullish()` 권장
