# P0 Critical Bugs - Post-Login Flow Broken

**Date:** 2026-03-31
**Priority:** P0 (service unusable after login)
**Estimated Complexity:** MEDIUM (4 files, 1 migration)

---

## Context

UX 테스트에서 로그인 후 서비스 사용이 완전히 불가능한 P0 버그 3건이 발견됨.
근본 원인은 2가지이며, 이 2가지가 3개 증상을 모두 발생시킴.

### Root Cause 1: `vcx_get_user_info` RPC가 프로필 필드를 반환하지 않음

SQL 함수(`src/lib/supabase/migrations/get_user_info.sql`)가 `system_role`, `member_tier`, `is_active`만 반환.
그런데 `middleware.ts` (line 90, 134)에서 `name`, `current_company`, `title`, `linkedin_url` 4개 필드를 체크함.
RPC 응답에 이 필드가 없으므로 항상 `undefined` → 모든 멤버가 프로필 미완성으로 판정됨.

**추가 위험:** 이 SQL 파일이 `supabase/migrations/`에 없음 (001~018만 존재).
수동으로 적용하지 않았다면 RPC 자체가 존재하지 않아 `data`가 null → 모든 사용자 403.

### Root Cause 2: 로그인 후 `/` (public route)로 리다이렉트

`login-form.tsx` line 24: `router.push(redirectTo || '/')`
`/`는 public route이므로 미들웨어가 auth 체크를 스킵 → 온보딩 인터셉트 불가.

### 증상 매핑

| 버그 | 증상 | 원인 |
|------|------|------|
| BUG-1 | 모든 non-GET API 호출 403 | Root Cause 1 |
| BUG-2 | Protected 페이지에서 비인증 오버레이 표시 | Root Cause 1 (x-vcx-authenticated=false) |
| BUG-3 | 온보딩 리다이렉트 작동 안 함 | Root Cause 1 + Root Cause 2 |

---

## Work Objectives

1. `vcx_get_user_info` RPC가 프로필 완성도 판단에 필요한 4개 필드를 반환하도록 수정
2. RPC 호출 실패 시 에러 핸들링 추가 (디버깅 가능하도록)
3. 로그인 후 protected route로 리다이렉트하여 미들웨어 인터셉트가 작동하도록 수정
4. 빌드 및 타입 검증

---

## Guardrails

### Must Have
- SECURITY DEFINER 유지 (RLS 우회 필요)
- 마이그레이션 파일 번호 019 사용 (013, 014 중복 존재하므로)
- TypeScript strict mode 준수
- 한국어 에러 메시지 유지

### Must NOT Have
- Supabase Dashboard에서 직접 DDL 실행 금지
- 기존 RPC 반환값 구조 변경 금지 (기존 `system_role`, `member_tier`, `is_active` 유지하고 필드 추가)
- 새로운 npm 의존성 추가 금지

---

## Task Flow

```
Task 1 (Migration) → Task 2 (Middleware error handling) → Task 3 (Login redirect) → Task 4 (Verify)
         ↓                      ↓                                ↓
   독립적이지만         Task 1의 RPC 응답 구조를           독립적 (다른 파일)
   순서상 먼저          이해해야 에러 핸들링 작성
```

Tasks 2와 3는 서로 독립적이므로 병렬 가능. Task 1이 선행되어야 함.

---

## Detailed TODOs

### Task 1: `vcx_get_user_info` RPC에 프로필 필드 추가

**파일:** `supabase/migrations/019_vcx_fix_get_user_info.sql` (신규 생성)
**참조:** `src/lib/supabase/migrations/get_user_info.sql` (기존 참조 파일도 동기화)

**변경 내용:**

CREATE OR REPLACE로 함수를 재정의하여 member 객체에 4개 필드 추가:

```sql
CREATE OR REPLACE FUNCTION vcx_get_user_info(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'member', (
      SELECT json_build_object(
        'system_role', m.system_role,
        'member_tier', m.member_tier,
        'is_active',   m.is_active,
        'name',        m.name,
        'current_company', m.current_company,
        'title',       m.title,
        'linkedin_url', m.linkedin_url
      )
      FROM vcx_members m
      WHERE m.id = p_user_id AND m.is_active = true
    ),
    'corporate', (
      SELECT json_build_object('role', c.role)
      FROM vcx_corporate_users c
      WHERE c.id = p_user_id
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

참조 파일 `src/lib/supabase/migrations/get_user_info.sql`도 동일하게 업데이트하여 코드와 실제 DB 함수의 동기화 유지.

**Acceptance Criteria:**
- [x] `supabase/migrations/019_vcx_fix_get_user_info.sql` 파일 생성됨
- [x] 기존 3개 필드(`system_role`, `member_tier`, `is_active`) 유지
- [x] 4개 필드(`name`, `current_company`, `title`, `linkedin_url`) 추가
- [x] SECURITY DEFINER 유지
- [x] 참조 파일도 동기화됨

---

### Task 2: Middleware RPC 에러 핸들링 추가

**파일:** `src/middleware.ts`

**변경 내용:**

3곳의 RPC 호출(line 55, 111, 125)에서 `error` 필드를 디스트럭처링하고 에러 로깅 추가.

**Line 55 (API routes) 변경:**
```typescript
const { data: info, error: rpcError } = await supabase.rpc('vcx_get_user_info', { p_user_id: user.id })
if (rpcError) {
  console.error('[middleware] vcx_get_user_info RPC failed (API):', rpcError.message)
  return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
}
```

**Line 111 (Admin routes) 변경:**
```typescript
const { data: info, error: rpcError } = await supabase.rpc('vcx_get_user_info', { p_user_id: user.id })
if (rpcError) {
  console.error('[middleware] vcx_get_user_info RPC failed (admin):', rpcError.message)
  return NextResponse.redirect(new URL('/', request.url))
}
```

**Line 125 (Protected routes) 변경:**
```typescript
const { data: info, error: rpcError } = await supabase.rpc('vcx_get_user_info', { p_user_id: user.id })
if (rpcError) {
  console.error('[middleware] vcx_get_user_info RPC failed (protected):', rpcError.message)
  response.headers.set('x-vcx-authenticated', 'false')
  return response
}
```

**Acceptance Criteria:**
- [x] 3곳의 RPC 호출 모두 `error` 필드 핸들링
- [x] 각 호출 위치를 구분할 수 있는 로그 메시지 포함
- [x] API route: 500 에러 반환 (한국어 메시지)
- [x] Admin route: 안전하게 홈으로 리다이렉트
- [x] Protected route: 비인증 상태로 graceful fallback
- [x] TypeScript 컴파일 에러 없음

---

### Task 3: 로그인 후 리다이렉트를 `/directory`로 변경

**파일:** `src/components/auth/login-form.tsx`

**변경 내용:**

Line 24에서 기본 리다이렉트 경로를 `/`에서 `/directory`로 변경:

```typescript
// Before
router.push(redirectTo || '/')

// After
router.push(redirectTo || '/directory')
```

`/directory`는 protected route이므로 미들웨어가 자동으로:
- 프로필 완성 → `/directory` 진입 허용
- 프로필 미완성 → `/onboarding`으로 리다이렉트

**Acceptance Criteria:**
- [x] 기본 리다이렉트가 `/directory`
- [x] `redirectTo` 파라미터가 있으면 해당 경로 우선 (기존 동작 유지)
- [x] 프로필 미완성 사용자가 로그인 시 `/onboarding`에 도달함 (미들웨어 경유)

---

### Task 4: 빌드 검증 및 타입 체크

**명령어:**
```bash
npm run build
npm run lint
npm test
```

**Acceptance Criteria:**
- [x] `npm run build` 에러 제로
- [x] `npm run lint` 에러 제로
- [x] `npm test` 기존 테스트 전부 통과
- [x] middleware 관련 기존 테스트가 있다면 통과 확인

---

## Success Criteria

1. 프로필 완성된 멤버가 non-GET API 호출 시 403이 발생하지 않음 (BUG-1 해결)
2. Protected 페이지에서 인증된 사용자에게 비인증 오버레이가 표시되지 않음 (BUG-2 해결)
3. 로그인 후 프로필 미완성 시 `/onboarding`으로, 완성 시 `/directory`로 정상 라우팅 (BUG-3 해결)
4. RPC 함수 미존재 시 500 에러와 함께 서버 로그에 원인이 기록됨 (디버깅 개선)
5. 빌드/린트/테스트 모두 통과

---

## Deployment Notes

- Migration `019_vcx_fix_get_user_info.sql`은 `supabase db push` 또는 `supabase migration up`으로 적용 필요
- CREATE OR REPLACE이므로 기존 함수가 있든 없든 안전하게 적용됨
- 롤백: 기존 3필드 버전으로 CREATE OR REPLACE 재실행 (데이터 손실 없음)
