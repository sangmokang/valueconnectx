# SKILL: VCX API Route Handler 작성 규칙

VCX 프로젝트의 Next.js App Router Route Handler 표준 작성 가이드.

---

## 파일 위치

```
src/app/api/{resource}/route.ts
src/app/api/{resource}/[id]/route.ts
```

---

## 기본 구조 (표준 템플릿)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVcxUser } from '@/lib/auth/get-vcx-user'
import { parseBody } from '@/lib/api/validation'
import { badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/api/error'
import { z } from 'zod'

const RequestSchema = z.object({
  // 스키마 정의 — 한국어 에러 메시지
})

export async function POST(request: NextRequest) {
  // 1. 인증 (항상 첫 번째)
  const user = await getVcxUser()
  if (!user) return unauthorized()

  // 2. 권한 확인 (필요한 경우)
  if (user.system_role !== 'admin') return forbidden()

  // 3. 요청 검증
  const { data, error } = await parseBody(request, RequestSchema)
  if (error) return error

  // 4. 비즈니스 로직
  const supabase = await createClient()
  const { data: result, error: dbError } = await supabase
    .from('vcx_table')
    .insert(data)
    .select()
    .single()

  if (dbError) return serverError()

  // 5. 응답
  return NextResponse.json(result, { status: 201 })
}

export async function GET(request: NextRequest) {
  // 인증
  const user = await getVcxUser()
  if (!user) return unauthorized()

  // 쿼리 파라미터 검증 (필요한 경우)
  const { searchParams } = new URL(request.url)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vcx_table')
    .select('*')

  if (error) return serverError()
  if (!data) return notFound('리소스를 찾을 수 없습니다')

  return NextResponse.json(data)
}
```

---

## 에러 헬퍼 (필수 사용)

| 헬퍼 | 상태 코드 | 사용 상황 |
|------|----------|----------|
| `badRequest(msg, details?)` | 400 | 잘못된 요청, 검증 실패 |
| `unauthorized(msg?)` | 401 | 인증 필요 (로그인 안 됨) |
| `forbidden(msg?)` | 403 | 권한 없음 (로그인은 됐지만 접근 불가) |
| `notFound(msg?)` | 404 | 리소스 없음 |
| `conflict(msg)` | 409 | 중복 (이미 존재하는 데이터) |
| `serverError(msg?)` | 500 | 예상치 못한 서버 에러 |

### DO: 에러 헬퍼 사용

```typescript
// 인증 없음
if (!user) return unauthorized()

// 권한 없음
if (user.system_role !== 'admin') return forbidden('관리자만 접근할 수 있습니다')

// 리소스 없음
if (!profile) return notFound('프로필을 찾을 수 없습니다')

// 중복
if (existingInvite) return conflict('이미 초대가 발송된 이메일입니다')

// DB 에러
if (dbError) return serverError()
```

### DON'T: 직접 Response 생성

```typescript
// ❌ new Response() 직접 생성
return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

// ❌ NextResponse.json()으로 에러 직접 생성
return NextResponse.json({ error: 'Not found' }, { status: 404 })

// ❌ 에러 무시
const { data, error } = await supabase.from('table').select()
// error 체크 없이 data 바로 사용
```

---

## 인증 규칙

### DO: getVcxUser 첫 줄 호출

```typescript
export async function POST(request: NextRequest) {
  // 항상 첫 번째로 인증 확인
  const user = await getVcxUser()
  if (!user) return unauthorized()

  // 이후 로직...
}
```

### DON'T: 인증 없는 보호된 API

```typescript
// ❌ 인증 확인 없이 바로 DB 접근
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data } = await supabase.from('vcx_members').select()
  return NextResponse.json(data)
}
```

---

## 검증 규칙

### DO: parseBody/parseSearchParams 사용

```typescript
const { data, error } = await parseBody(request, RequestSchema)
if (error) return error
// data는 타입 안전
```

### DON'T: 수동 검증

```typescript
// ❌ Zod 없이 수동 검증
const body = await request.json()
if (!body.title || typeof body.title !== 'string') {
  return NextResponse.json({ error: 'Invalid' }, { status: 400 })
}
```

---

## 응답 규칙

- 생성: `status: 201`
- 조회: `status: 200` (기본값)
- 업데이트: `status: 200`
- 삭제: `status: 204` (본문 없음)
- 에러: 에러 헬퍼 사용 (위 표 참고)

---

## 금지 패턴 요약

- ❌ `new Response()` 직접 생성 → `NextResponse.json()` + 에러 헬퍼
- ❌ try/catch에서 에러 무시 → `serverError()` 반환
- ❌ 인증 없이 보호된 API → `getVcxUser()` 첫 줄
- ❌ Zod 없이 수동 검증 → `parseBody` / `parseSearchParams`
- ❌ 영어 에러 메시지 → 한국어
- ❌ `console.log`로 에러 로깅만 하고 응답 반환 생략
