# 019 마이그레이션 적용 가이드

## 마이그레이션 개요

**파일**: `supabase/migrations/019_vcx_fix_get_user_info.sql`

### 수정 대상
`vcx_get_user_info` RPC 함수 v2

### 추가된 필드
프로필 완성도 판단용 4개 필드를 member 오브젝트에 추가:
- `name` (string | null)
- `current_company` (string | null)
- `title` (string | null)
- `linkedin_url` (string | null)

### 이전 쿼리 방식
미들웨어(`src/middleware.ts`)가 `vcx_get_user_info` 후 프로필 완성도를 판단하기 위해 추가로 직접 테이블 쿼리를 실행하고 있었음.

### 이후 쿼리 방식
`vcx_get_user_info` 1회 호출로 모든 필요한 정보(member + corporate + 프로필 필드)를 한 번에 조회 가능.

---

## 적용 절차

### 방법 1: Supabase CLI (권장)
```bash
supabase db push
```
현재 마이그레이션 파일들을 프로덕션 DB에 적용합니다.

### 방법 2: Supabase Dashboard SQL Editor
1. [Supabase Dashboard](https://app.supabase.com)로 이동
2. 해당 프로젝트 선택
3. **SQL Editor** 탭 클릭
4. `supabase/migrations/019_vcx_fix_get_user_info.sql` 파일 내용 복사
5. SQL Editor에 붙여넣기 후 **실행** 버튼 클릭

---

## 적용 후 검증

### 1. RPC 함수 확인
SQL Editor에서 다음 쿼리 실행:
```sql
-- 샘플 user_id 대입 (실제 멤버 ID 사용)
SELECT vcx_get_user_info('00000000-0000-0000-0000-000000000000'::uuid);
```

결과에 `name`, `current_company`, `title`, `linkedin_url` 필드가 포함되는지 확인.

### 2. 애플리케이션 동작 확인
프로필이 완성된 멤버로 로그인 후:
- 미들웨어에서 `isProfileIncomplete` 값이 `false`로 정상 판단되는지 확인
- `/onboarding` 페이지로 리다이렉트되지 않는지 확인

프로필이 미완성된 멤버로 로그인 후:
- `isProfileIncomplete` 값이 `true`로 정상 판단되는지 확인
- 예상대로 `/onboarding` 페이지로 리다이렉트되는지 확인

### 3. 타입 동기화 확인
TypeScript 빌드 통과:
```bash
npm run build
```

타입 에러가 없는지 확인. 미들웨어 코드에서 name/current_company/title/linkedin_url 필드를 정상 읽을 수 있어야 합니다.

---

## 롤백 절차

마이그레이션을 되돌려야 하는 경우:

### 1. Supabase CLI 롤백
```bash
supabase migration list
supabase db reset
```

또는 특정 마이그레이션 이전 상태로 복원:
```bash
supabase db push --version <pre-019-version>
```

### 2. 수동 롤백 (SQL Editor)
```sql
-- vcx_get_user_info를 이전 버전으로 복원
CREATE OR REPLACE FUNCTION vcx_get_user_info(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'member', (
      SELECT json_build_object(
        'system_role',    m.system_role,
        'member_tier',    m.member_tier,
        'is_active',      m.is_active
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
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public, pg_temp;
```

---

## 주의 사항

- ❌ **Supabase Dashboard Table Editor에서 직접 수정 금지**
- ⚠️ 마이그레이션은 SQL 파일로만 관리
- ✅ 프로덕션 배포 전 스테이징 환경에서 먼저 검증
- ✅ 마이그레이션 번호 중복 방지 (현재 최신: 019)

---

## 타입 재생성

마이그레이션 적용 후 타입이 자동 동기화되지 않으면 수동 재생성:

```bash
# Supabase 타입 생성 (있다면)
supabase gen types typescript --local
```

또는 `src/types/supabase.ts`를 직접 업데이트 (이미 수정됨).

---

## 더 읽을 것

- [RPC 함수 문서](../supabase-type-workflow.md)
- [인증 파이프라인](../auth_pipeline.md)
- [미들웨어 로직](../../src/middleware.ts)
