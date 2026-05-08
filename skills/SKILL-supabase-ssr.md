# SKILL: Supabase SSR 클라이언트 패턴 (VCX)

VCX 프로젝트에서 Supabase 코드 작성 시 반드시 참조하는 문서.
AI 에이전트가 Supabase 관련 코드를 작성하기 전에 이 파일을 먼저 읽어야 한다.

---

## 1. 4종 클라이언트 구분 (가장 중요)

| 클라이언트 | 파일 | 핵심 함수 | 용도 |
|-----------|------|----------|------|
| **Server** | `@/lib/supabase/server` | `createServerClient` from `@supabase/ssr` | Server Component, Route Handler |
| **Client** | `@/lib/supabase/client` | `createBrowserClient` from `@supabase/ssr` | Client Component (`'use client'`) |
| **Middleware** | `@/lib/supabase/middleware` | `createServerClient` from `@supabase/ssr` | `middleware.ts` 전용 |
| **Admin** | `@/lib/supabase/admin` | `createClient` from `@supabase/supabase-js` | `service_role` 키, RLS 우회 |

---

## 2. 선택 결정 트리

```
코드 위치?
├── 'use client' 있음 → client.ts의 createClient()
├── middleware.ts → middleware.ts의 updateSession()
└── Server Component / Route Handler
    ├── RLS 우회 필요 → admin.ts의 createAdminClient()
    └── 일반 → server.ts의 createClient()  ← await 필수
```

---

## 3. 각 클라이언트 정확한 패턴

### Server 클라이언트 (`@/lib/supabase/server`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()  // ⚠️ await 필수 (Next.js 14)
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {} // Server Component 읽기 전용 — 무시
        },
      },
    }
  )
}
```

### Client 클라이언트 (`@/lib/supabase/client`)

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {  // ⚠️ async 아님
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Admin 클라이언트 (`@/lib/supabase/admin`)

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // service_role 키
  )
}
```

---

## 4. 금지 패턴 (DO NOT)

| 금지 | 이유 |
|------|------|
| `createClientComponentClient` 사용 | 삭제됨 — `@supabase/auth-helpers-nextjs` 구 API |
| `createServerComponentClient` 사용 | 삭제됨 — 동일 이유 |
| 쿠키 핸들러에 `{get, set, remove}` 사용 | 삭제됨. 반드시 `{getAll, setAll}` 사용 |
| `cookies()` without `await` | Next.js 14에서 `cookies()`는 async — 반드시 `await` |
| Server Component에서 `@/lib/supabase/client` import | 브라우저 전용 함수 — 서버에서 실행 불가 |
| Client Component에서 `@/lib/supabase/server` import | `next/headers`는 서버 전용 — 클라이언트에서 실행 불가 |
| Admin 클라이언트를 클라이언트 사이드에서 사용 | `SUPABASE_SERVICE_ROLE_KEY` 노출 위험 |
| `<Database>` 제네릭 생략 | 타입 안전성 손실 |

---

## 5. 인증 패턴

### Server Component에서 사용자 확인

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ...
}
```

### Route Handler에서 사용자 확인

```typescript
import { getVcxUser } from '@/lib/auth/get-vcx-user'

export async function GET() {
  const user = await getVcxUser()
  if (!user) return unauthorized()

  // ...
}
```

### Route Handler에서 Bearer + Cookie Fallback (E2E / 외부 클라이언트)

E2E 테스트나 외부 클라이언트가 `Authorization: Bearer <access_token>` 헤더로만 호출하는 경우, cookie 단독으로는 RLS 컨텍스트를 만들 수 없다. 이때는 반드시 통합 헬퍼 `getVcxAuthContext(request)` 를 사용한다.

**언제 사용하는가**
- Playwright E2E 테스트가 `request.fetch(...)` 또는 `apiRequest`로 토큰을 헤더에 직접 실어 보낼 때.
- 외부 백엔드/스크립트가 Supabase 세션 쿠키 없이 access token만 들고 호출할 때.
- 한 Route Handler가 cookie 사용자(브라우저)와 Bearer 사용자(테스트) 양쪽을 모두 받아야 할 때.

**왜 cookie 단독으로 안 되는가**
- cross-origin 호출이나 헤더 전용 환경에서는 `cookies()`가 비어 있어 `auth.getUser()`가 `null`을 반환한다.
- 이 상태에서 별도 token client를 만들고 후속 `.from(...)` 쿼리를 anon supabase로 실행하면 RLS가 anon 컨텍스트로 평가되어 결과가 비어 보인다 (예: `chat=null`, `application=null`).

**`getVcxAuthContext` 시그니처** (`src/lib/auth/get-vcx-auth-context.ts`)

```typescript
export type VcxAuthContext = {
  user: User | null
  supabase: SupabaseClient<Database>
}

export async function getVcxAuthContext(request: NextRequest): Promise<VcxAuthContext>
```

내부 동작: cookie로 `auth.getUser()` → 실패 시 `Authorization` 헤더에서 Bearer 추출 → 동일 supabase 인스턴스에 `auth.setSession({ access_token, refresh_token: '' })` 호출 → `auth.getUser(bearer)`로 사용자 확정. 반환된 `supabase` 는 cookie/Bearer 중 어느 경로든 인증된 컨텍스트를 가지므로 후속 `.from(...)` 쿼리는 단일 인스턴스로 안전하다.

**호출 예제** (`src/app/api/peer-coffeechat/[id]/brief/route.ts` 발췌)

```typescript
import { getVcxAuthContext } from '@/lib/auth/get-vcx-auth-context'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, supabase } = await getVcxAuthContext(request)
  if (!user) return unauthorized()
  const { data: chat } = await supabase.from('peer_coffee_chats').select('...').eq('id', chatId).single()
}
```

**안티패턴 (DO NOT)**

| 안티패턴 | 결과 |
|---------|------|
| Bearer로 token client 만들고 후속 쿼리는 `@/lib/supabase/server` anon 인스턴스 사용 | RLS 컨텍스트 분기 → `.from()` 결과 `null`/빈 배열 (예: `chat=null`) |
| Bearer 경로에서 service_role admin client로 폴백 | RLS 우회 → 권한 검증 누락, 보안 사고 |
| `request.headers.get('authorization')` 직접 파싱해서 매 핸들러마다 재구현 | 동일 패턴 재발 + 헤더 대소문자 처리 누락 |

> Bearer 인증이 필요한 모든 신규 Route Handler 는 `getVcxAuthContext(request)` 를 통해서만 사용자/클라이언트 쌍을 얻는다. 별도 token client 분기 금지.

### Client Component에서 사용

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function MyComponent() {
  const supabase = createClient()  // ⚠️ await 없음 — 동기 함수

  useEffect(() => {
    supabase.from('table').select('*').then(/* ... */)
  }, [])
}
```

---

## 6. Database 타입

- 항상 `<Database>` 제네릭 사용
- 타입 파일 경로: `@/types/supabase`
- 테이블 타입 참조: `Database['public']['Tables']['table_name']['Row']`

```typescript
import type { Database } from '@/types/supabase'

type Member = Database['public']['Tables']['vcx_members']['Row']
```

---

## 7. 핵심 요약 (빠른 참조)

```
'use client' 있음?  YES → createBrowserClient  (async 아님)
                    NO  → createServerClient   (await 필수)

middleware.ts?      YES → updateSession() in @/lib/supabase/middleware

RLS 우회 필요?      YES → createAdminClient()  (서버 전용)
```
