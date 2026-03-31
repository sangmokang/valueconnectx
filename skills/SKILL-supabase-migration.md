# SKILL: VCX Supabase 마이그레이션 작성 규칙

VCX 프로젝트의 Supabase 마이그레이션 파일 표준 작성 가이드.

---

## 파일 위치 및 네이밍

```
supabase/migrations/NNN_vcx_<description>.sql
```

### 번호 규칙

- 현재 마지막 번호: **018**
- 다음 신규 마이그레이션: **019**부터 시작
- ⚠️ 013, 014 번호가 과거 실수로 중복 존재 — 절대 기존 번호 재사용 금지
- 번호는 항상 3자리 zero-padding (`019`, `020`, ...)

---

## DDL 보호 정책

Event Trigger `vcx_prevent_ddl`이 비인가 DDL을 자동 차단한다.

| 역할 | DDL 허용 여부 |
|------|-------------|
| `postgres` | 허용 |
| `supabase_admin` | 허용 |
| `supabase_auth_admin` | 허용 |
| `anon` | **차단** |
| `authenticated` | **차단** |
| `service_role` | **차단** |

---

## 마이그레이션 템플릿

### DO: 표준 마이그레이션 구조

```sql
-- 019_vcx_<description>.sql
-- 설명: [변경 사항 한국어로 설명]

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS vcx_<table_name> (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 비즈니스 컬럼들...
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. RLS 활성화 (필수 — 빠뜨리면 안 됨)
ALTER TABLE vcx_<table_name> ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책
CREATE POLICY "vcx_<table_name>_select_own"
  ON vcx_<table_name>
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "vcx_<table_name>_insert_own"
  ON vcx_<table_name>
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vcx_<table_name>_update_own"
  ON vcx_<table_name>
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vcx_<table_name>_delete_own"
  ON vcx_<table_name>
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. 인덱스 (자주 조회되는 컬럼)
CREATE INDEX IF NOT EXISTS idx_vcx_<table_name>_user_id
  ON vcx_<table_name>(user_id);

-- 5. updated_at 자동 갱신 트리거 (필요한 경우)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER vcx_<table_name>_updated_at
  BEFORE UPDATE ON vcx_<table_name>
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 테이블 네이밍 규칙

### DO: 올바른 네이밍

```sql
-- ✅ vcx_ 접두사 + snake_case
CREATE TABLE IF NOT EXISTS vcx_members (...);
CREATE TABLE IF NOT EXISTS vcx_corporate_users (...);
CREATE TABLE IF NOT EXISTS vcx_coffeechat_sessions (...);
CREATE TABLE IF NOT EXISTS vcx_community_posts (...);
CREATE TABLE IF NOT EXISTS vcx_position_applications (...);
```

### DON'T: 잘못된 네이밍

```sql
-- ❌ vcx_ 접두사 없음
CREATE TABLE IF NOT EXISTS members (...);
CREATE TABLE IF NOT EXISTS users (...);

-- ❌ camelCase
CREATE TABLE IF NOT EXISTS vcxCoffeeChatSessions (...);
```

---

## RLS 정책 네이밍

```
vcx_<table>_<action>_<scope>
```

| 예시 | 설명 |
|------|------|
| `vcx_members_select_own` | 본인 데이터 조회 |
| `vcx_members_select_all` | 전체 조회 (admin 등) |
| `vcx_posts_insert_authenticated` | 인증된 사용자 생성 |
| `vcx_admin_logs_select_admin` | 관리자 전용 조회 |

---

## 컬럼 작성 DO/DON'T

### DO

```sql
-- 기본값과 NOT NULL 명시
id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

-- 외래 키에 ON DELETE 정책 명시
user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

-- ENUM은 CHECK 제약 또는 별도 타입으로
status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
```

### DON'T

```sql
-- ❌ NOT NULL 없는 필수 컬럼
user_id UUID REFERENCES auth.users(id),

-- ❌ ON DELETE 정책 없는 외래 키
post_id UUID NOT NULL REFERENCES vcx_posts(id),

-- ❌ updated_at 없는 뮤터블 테이블
CREATE TABLE vcx_profiles (
  id UUID PRIMARY KEY,
  name TEXT
  -- updated_at 없음
);
```

---

## 마이그레이션 적용 방법

```bash
# 로컬 적용
supabase db push

# 마이그레이션 상태 확인
supabase migration list
```

---

## 금지 패턴 요약

- ❌ Supabase Dashboard Table Editor로 직접 테이블 생성/수정/삭제
- ❌ 기존 마이그레이션 번호 재사용 (특히 013, 014 주의)
- ❌ RLS 없이 테이블 생성
- ❌ `vcx_` 접두사 없는 테이블명
- ❌ `service_role`로 DDL 실행 시도
- ❌ 기존 마이그레이션 파일 직접 수정 (새 파일 추가만 허용)
- ❌ 롤백 없는 파괴적 변경 (DROP COLUMN, TRUNCATE 등) — 별도 확인 필요
