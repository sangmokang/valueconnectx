# 백업 검증 런북 (Backup Verification Runbook)

> 최종 수정: 2026-04-03

VCX 데이터 무결성과 백업 가용성을 정기적으로 검증하는 프로세스입니다.

## 목적

- Supabase 자동 백업 정책 확인
- 데이터 무결성 모니터링 (vcx_members, vcx_corporate_users 등)
- RLS 정책 및 DDL 보호 작동 확인
- 마이그레이션 이력 관리
- 복구 시나리오 대비

---

## 백업 정책 (Supabase)

### 현재 플랜별 백업 정책

| 플랜 | 백업 주기 | 보관 기간 | PITR | 복구 비용 |
|------|----------|----------|------|----------|
| **Free** | 없음 | - | 불가능 | - |
| **Pro** | 자동 일일 | 7일 | 가능 (Pro 이상) | 무료 |
| **Team** | 자동 일일 | 30일 | 가능 | 무료 |
| **Enterprise** | 커스텀 | 커스텀 | 가능 | 커스텀 |

**VCX 현재 상태**: 확인 필요 (Supabase 플랜 문의)

### 백업 확인 방법

**Supabase Dashboard에서:**

1. https://app.supabase.com 접속
2. 프로젝트 선택 → **Settings** → **Backups**
3. 확인 항목:
   - **Backup Schedule**: 자동 백업 시간 (UTC 기준)
   - **Latest Backup**: 최근 백업 타임스탐프
   - **Retention**: 보관 기간
   - **PITR Enabled**: Point-in-time recovery 활성화 여부

**확인 체크리스트:**

```
□ Latest Backup이 24시간 이내?
□ Status가 "Succeeded"?
□ Retention 기간이 명시되어 있나?
□ PITR가 필요하면 활성화되어 있나?
```

---

## 데이터 무결성 체크

### 1단계: 테이블 레코드 수 모니터링

**목적**: 데이터 손상/삭제 여부 빠른 감지

**주요 테이블 임계값:**

| 테이블 | 최소 레코드 수 | 모니터링 주기 |
|--------|----------------|----------------|
| `vcx_members` | 100+ | 일일 |
| `vcx_corporate_users` | 5+ | 주간 |
| `vcx_invites` | 10+ (누적) | 주간 |
| `vcx_recommendations` | 50+ | 주간 |
| `vcx_ceo_coffeechat_sessions` | 20+ | 일일 |

**환경 스냅샷으로 확인:**

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "https://valueconnectx.vercel.app/api/ops/health?snapshot=true"

# 반환된 JSON에서 'database.tables' 섹션 확인
{
  "database": {
    "tables": {
      "vcx_members": 1250,              # ✓ 정상 범위
      "vcx_corporate_users": 45,        # ✓ 정상 범위
      "vcx_ceo_coffeechat_sessions": 380, # ✓ 정상 범위
      "vcx_invites": 2500,              # ✓ 누적 레코드
      "vcx_recommendations": 4800       # ✓ 정상 범위
    }
  }
}
```

**이상 감지 시 조치:**

```bash
# Supabase SQL Editor에서 상세 확인

-- 1. vcx_members 삭제 여부 확인
SELECT COUNT(*) as total_members, 
       COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active_members
FROM vcx_members;

-- 2. 최근 변경 확인
SELECT id, email, created_at, updated_at, deleted_at
FROM vcx_members
ORDER BY updated_at DESC
LIMIT 10;

-- 3. 급격한 감소 여부 확인
SELECT DATE_TRUNC('day', created_at) as day,
       COUNT(*) as new_members
FROM vcx_members
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC
LIMIT 7;
```

---

### 2단계: RPC 함수 작동 확인

**목적**: 비즈니스 로직 함수 정상 작동 확인

**주요 RPC 함수:**

| 함수명 | 용도 | 확인 방법 |
|--------|------|----------|
| `vcx_get_user_info` | 사용자 정보 조회 | SQL 호출 |
| `vcx_consume_invite` | 초대 수락 (멤버 생성) | SQL 호출 |
| `vcx_validate_member` | 멤버 검증 | SQL 호출 |

**Supabase SQL Editor에서 테스트:**

```sql
-- 1. vcx_get_user_info 테스트
SELECT * FROM vcx_get_user_info('user_id_here');
-- 반환: user_id, email, tier, profile_data 등

-- 2. vcx_consume_invite 시뮬레이션 (읽기만, 실행 금지)
-- 실제 호출 시에는 invite_code가 유효한지 미리 확인

SELECT 
  id, 
  invite_code, 
  claimed_by_id, 
  claimed_at, 
  expires_at
FROM vcx_invites
WHERE claimed_at IS NULL AND expires_at > NOW()
LIMIT 5;

-- 3. 최근 멤버 생성 확인 (RPC 작동 증거)
SELECT COUNT(*) as invites_claimed_today
FROM vcx_invites
WHERE claimed_at >= NOW() - INTERVAL '1 day';
```

**이상 감지 시 조치:**

```bash
# 함수가 없거나 에러 반환 시:
# 1. Supabase Dashboard → SQL Editor에서 함수 정의 확인
# 2. 함수 시그니처: CREATE OR REPLACE FUNCTION vcx_*(...) RETURNS ...
# 3. 필요시 마이그레이션 재실행
```

---

### 3단계: Row-Level Security (RLS) 정책 검증

**목적**: 권한 없는 데이터 접근 차단 확인

**Supabase Dashboard에서:**

1. **Database** → 각 테이블 선택
2. **RLS** 활성화 상태 확인 (🔐 아이콘)
3. 모든 주요 테이블에서 RLS 활성화 확인

**SQL 자동 검증:**

```sql
-- 1. RLS 활성화 여부 확인 (admin 권한 필수)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'vcx_%'
ORDER BY tablename;

-- 반환 예시 (모두 TRUE 여야 정상):
-- tablename              | rowsecurity
-- ----------------------+-----------
-- vcx_members            | true
-- vcx_corporate_users    | true
-- vcx_ceo_coffeechat_sessions | true
-- ...

-- 2. RLS 정책 개수 확인
SELECT tablename, count(*) as policy_count
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND constraint_type = 'CHECK'
GROUP BY tablename
ORDER BY tablename;

-- 3. 비정상 정책 확인
SELECT * FROM pg_policies
WHERE schemaname = 'public'
AND tablename LIKE 'vcx_%'
ORDER BY tablename, policyname;
```

**비정상 감지 시 복구:**

```sql
-- RLS가 비활성화된 테이블 다시 활성화
ALTER TABLE vcx_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_corporate_users ENABLE ROW LEVEL SECURITY;
-- ... (모든 vcx_* 테이블)

-- 정책 재적용 (마이그레이션 재실행)
-- https://app.supabase.com → Migrations
```

---

### 4단계: DDL 보호 검증

**목적**: 비인가 테이블 수정/삭제 차단 확인

**보호 메커니즘:**

- **Event Trigger**: `vcx_prevent_ddl` — 모든 비인가 DDL 자동 차단
- **허용된 역할**: `postgres`, `supabase_admin`, `supabase_auth_admin` 만 DDL 실행 가능
- **블록된 역할**: `anon`, `authenticated`, `service_role` — DDL 불가

**Supabase SQL Editor에서 확인:**

```sql
-- 1. DDL 보호 트리거 확인
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'vcx_prevent_ddl';

-- 반환 예시:
-- trigger_schema | trigger_name    | event_manipulation | action_statement
-- ---------------+-----------------+-------------------+------------------
-- public         | vcx_prevent_ddl | INSERT, UPDATE    | [트리거 함수]

-- 2. 트리거 함수 확인
SELECT pg_get_functiondef('vcx_prevent_ddl()'::regprocedure);

-- 3. 실제 작동 테스트 (anon 역할로 DDL 시도)
-- ⚠️ 주의: 실제 테이블 생성 시도 금지
-- 대신 SQL Editor에서 dry-run 또는 테스트 DB에서만 실행

-- 아래는 읽기 전용 테스트 (안전):
SELECT tablename FROM information_schema.tables
WHERE table_schema = 'public';
```

**보호 트리거 미작동 시:**

```bash
# Supabase 기술 지원팀 연락 (support@supabase.io)
# 마이그레이션 파일 확인:
# /supabase/migrations/[최신번호]_vcx_*.sql
```

---

## 마이그레이션 이력 관리

### 현재 마이그레이션 파일 현황

```
supabase/migrations/
├── 001_vcx_initial_schema.sql
├── 002_vcx_member_profiles.sql
├── ...
├── 019_vcx_pending_migration.sql  # ⚠️ 미배포
└── (최신 번호 확인 필수)
```

**마이그레이션 파일 네이밍 규칙:**
- 형식: `NNN_vcx_<description>.sql`
- `NNN`: 3자리 순번 (001, 002, ..., 019)
- 순번은 중복 불가, 반드시 증가

### 마이그레이션 이력 확인

**Supabase Dashboard에서:**

1. **Migrations** 탭 접속
2. **Local migrations** 리스트 확인:
   - 녹색 체크: 배포 완료
   - 회색 대기: 미배포
   - 빨강 오류: 배포 실패

**SQL로 확인:**

```sql
-- Supabase 시스템 테이블
SELECT * FROM supabase.schema_migrations
ORDER BY version DESC
LIMIT 10;

-- 반환 예시:
-- version | executed_at
-- ---------+------------------------------------
-- 019     | NULL (미배포)
-- 018     | 2026-04-02 08:15:22
-- 017     | 2026-04-01 15:30:45
```

### 마이그레이션 배포 절차

```bash
# 1. 로컬 마이그레이션 파일 확인
ls -la supabase/migrations/

# 2. 파일명 순번 검증 (중복, 공백 없는지)
for f in supabase/migrations/*.sql; do
  basename "$f" | grep -o '^[0-9]*'
done | sort -n

# 3. Vercel 배포 시 자동 마이그레이션
git push origin main
# → Vercel 자동 빌드 → Supabase 마이그레이션 자동 실행

# 4. 배포 확인 (Supabase Dashboard)
# https://app.supabase.com → Migrations → 최신 파일 체크
```

**마이그레이션 실패 시:**

```bash
# 1. 실패 원인 확인 (Supabase Dashboard)
# Migrations 탭 → 실패한 마이그레이션 클릭 → 에러 메시지

# 2. 로컬에서 수정
# supabase/migrations/NNN_vcx_*.sql 수정

# 3. 재배포
git push origin main

# 4. 최악의 경우 (Supabase 고객지원팀)
# support@supabase.io 연락
```

---

## 복구 시나리오

### 시나리오 1: Point-in-Time Recovery (PITR)

**조건**: Supabase Pro 플랜 이상, PITR 활성화됨

**사용 사례:**
- 실수로 데이터 삭제
- 마이그레이션 오류로 테이블 구조 손상
- 악의적 데이터 변경

**복구 절차:**

```bash
# 1. Supabase Dashboard → Settings → Backups
# 2. "Point-in-time recovery" 섹션 확인
# 3. "Restore" 버튼 클릭
# 4. 복구 시점(타임스탐프) 선택
# 5. 대상 데이터베이스 선택 (복구용 DB 또는 본 DB)
# 6. "Restore" 버튼 클릭
# 7. 복구 완료 대기 (보통 5~30분)
```

**복구 후 검증:**

```sql
-- 복구된 데이터 확인
SELECT COUNT(*) FROM vcx_members;
SELECT MAX(created_at) FROM vcx_members;

-- RLS 정책 확인
SELECT * FROM information_schema.table_constraints
WHERE table_schema = 'public';
```

---

### 시나리오 2: 전체 데이터베이스 복구

**조건**: Free 플랜도 불가능 (백업 불가), Pro 이상만 가능

**복구 절차:**

```bash
# Supabase 기술 지원팀 (support@supabase.io)에 연락
# - 복구 시점 명시
# - 복구 방법 (PITR vs 매뉴얼 백업)
# - 응급 우선순위 지정
```

**예상 복구 시간:** 24~72시간 (긴급: 4~8시간)

---

## 정기 검증 일정

### 일일 검증 (자동)

```
⏰ 매일 자정 (UTC) 헬스 체크 실행
→ 환경 스냅샷 수집
→ 테이블 레코드 수 기록
→ 이상 감지 시 Discord 알림
```

**확인 항목:**
- 테이블 레코드 수 증감
- 헬스 체크 상태 (healthy/degraded/unhealthy)

### 주간 검증 (수동)

**매주 월요일 오전:**

```bash
# 1. 백업 정책 확인 (Supabase Dashboard)
# 2. RLS 정책 검증 (SQL)
# 3. DDL 보호 작동 확인 (SQL)
# 4. 마이그레이션 이력 확인 (Dashboard)
# 5. RPC 함수 테스트 (SQL)
```

**체크리스트:**

```
□ Latest Backup이 24시간 이내?
□ 모든 vcx_* 테이블에서 RLS 활성화?
□ vcx_prevent_ddl 트리거 활성 상태?
□ 미배포 마이그레이션 파일 없는가?
□ RPC 함수 (vcx_get_user_info 등) 호출 성공?
```

### 월간 검증 (종합)

**매월 1일:**

```bash
# 1. 환경 스냅샷 전체 조회
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "https://valueconnectx.vercel.app/api/ops/health?snapshot=true"

# 2. 데이터 무결성 리포트 생성
# - 총 멤버 수, 기업 사용자 수, 커피챗 세션 수
# - 월간 변화율 (증가/감소 추세)
# - 이상 현상 정리

# 3. 백업 복구 시뮬레이션 (테스트 DB)
# - 전월 백업으로 테스트 DB 복구
# - 데이터 무결성 확인
# - 복구 시간 측정

# 4. RLS/DDL 정책 재검토
# - 정책 변경 여부 (비인가 수정 감지)
# - 신규 테이블 RLS 적용 여부
```

---

## 관련 리소스

### 링크
- **Supabase 백업**: https://app.supabase.com → 프로젝트 → Settings → Backups
- **Supabase Migrations**: https://app.supabase.com → 프로젝트 → Migrations
- **환경 스냅샷 API**: `/api/ops/health?snapshot=true`
- **SQL 명령어**: https://supabase.com/docs/guides/database/postgres

### 문서
- 마이그레이션 파일: `/supabase/migrations/`
- 스냅샷 로직: `/src/lib/ops/snapshot.ts`
- 헬스 체크: `/src/lib/ops/health-checks.ts`

### 연락처
- **Supabase 기술지원**: support@supabase.io
- **Discord**: #ops 채널

---

## FAQ

**Q: 일일 자동 헬스 체크는 언제 실행되나요?**
- A: 매일 자정(UTC)에 Vercel Cron으로 자동 실행. Discord #ops 채널에 결과 알림.

**Q: Free 플랜에서 백업은 불가능한가요?**
- A: 네. 백업 기능이 없습니다. Pro 플랜 이상으로 업그레이드 필요.

**Q: 테이블 레코드 수가 갑자기 0이 되면?**
- A: 긴급 상황. 즉시 incident-response 런북으로 장애 대응 시작. 필요시 PITR로 복구.

**Q: RLS 정책이 모두 비활성화되면?**
- A: 보안 위험. 즉시 ALTER TABLE ... ENABLE ROW LEVEL SECURITY로 복구. 마이그레이션 재실행 고려.

**Q: 마이그레이션 파일 순번이 중복되면?**
- A: Supabase가 배포 거부. 파일명 수정 후 재푸시. 기술지원 불필요 (일반적인 수정 사항).
