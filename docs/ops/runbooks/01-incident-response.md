# 장애 대응 런북 (Incident Response Runbook)

> 최종 수정: 2026-04-03

VCX 프로덕션 환경의 장애를 빠르게 진단하고 대응하기 위한 단계별 지침입니다.

## 트리거 조건

다음 중 하나 이상 발생 시 이 런북을 실행하세요.

- **Discord 알림 수신**: `DISCORD_OPS_WEBHOOK_URL`로 unhealthy 또는 degraded 상태 알림
- **사용자 장애 리포트**: 로그인 실패, 커피챗 매칭 오류, 프로필 조회 불가
- **Sentry 에러 급증**: 실시간 에러 발생률 2배 이상 증가
- **외부 상태 페이지**: Vercel, Supabase, Upstash 서비스 장애 공지

## 영향 범위

| 서비스 | 영향 | 복구 가능 |
|--------|------|----------|
| Vercel 다운 | 웹 접속 불가 | 1~5분 |
| Supabase 다운 | 모든 인증/데이터 접근 불가 | 5~30분 |
| Redis 다운 | 레이트리밋 비활성화, 성능 저하 | 5~10분 |
| 환경변수 누락 | API 500 에러 반복 | 5분 이내 |

---

## 대응 절차

### 1단계: 초기 진단 (1분)

**1.1. 헬스 체크 API 호출**

```bash
# 관리자 권한으로 직접 호출 (Cron 없이)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://valueconnectx.vercel.app/api/ops/health

# 반환 예시 (healthy)
{
  "status": "healthy",
  "timestamp": "2026-04-03T12:00:00Z",
  "version": "a1b2c3d",
  "checks": {
    "supabase": { "status": "ok", "latency_ms": 145 },
    "redis": { "status": "ok", "latency_ms": 67 },
    "env_vars": { "status": "ok", "missing": [] }
  }
}

# 반환 예시 (unhealthy)
{
  "status": "unhealthy",
  "timestamp": "2026-04-03T12:05:00Z",
  "checks": {
    "supabase": { "status": "error", "latency_ms": 5000, "message": "연결 실패" },
    "redis": { "status": "ok", "latency_ms": 45 },
    "env_vars": { "status": "ok", "missing": [] }
  }
}
```

**1.2. 외부 상태 페이지 확인**

- **Vercel**: https://www.vercel.com/status
- **Supabase**: https://status.supabase.com
- **Upstash**: https://status.upstash.com

상태 페이지에서 `Operational`이 아니면 **2단계는 스킵하고 3단계 대기 모드로 진입**.

**1.3. 환경 스냅샷 조회** (선택사항)

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "https://valueconnectx.vercel.app/api/ops/health?snapshot=true"

# 반환 예시
{
  "health": { ... },
  "snapshot": {
    "timestamp": "2026-04-03T12:00:00Z",
    "deployment": {
      "env": "production",
      "commitSha": "a1b2c3d",
      "region": "sfo1"
    },
    "database": {
      "tables": {
        "vcx_members": 1250,
        "vcx_corporate_users": 45,
        "vcx_ceo_coffeechat_sessions": 380
      }
    },
    "security": {
      "envVarsPresent": {
        "NEXT_PUBLIC_SUPABASE_URL": true,
        "SUPABASE_SERVICE_ROLE_KEY": true,
        ...
      }
    }
  }
}
```

---

### 2단계: 원인 파악

#### 시나리오 A: Vercel 장애

**증상:**
- 헬스 체크 API 연결 자체가 불가 (타임아웃)
- 웹 UI 접속 불가
- Vercel 상태 페이지에서 incident 표시

**진단:**

```bash
# Vercel Dashboard에서 함수 로그 확인
# https://vercel.com/dashboard → 프로젝트 → Deployments

# 최근 배포 확인
# https://vercel.com/dashboard → 프로젝트 → Deployments → 최신 배포

# 배포 상태: Building/Ready/Error 확인
```

**조치:**

1. Vercel 상태 페이지에서 상태 변화 대기 (일반적으로 자동 복구)
2. 만약 상태 페이지에서 해결되었는데 여전히 접속 불가:
   - 최신 배포가 완료되었는지 확인
   - 브라우저 캐시 삭제 후 재접속

---

#### 시나리오 B: Supabase 장애

**증상:**
- 헬스 체크: `supabase.status === 'error'` 또는 `degraded`
- `latency_ms > 3000` (응답 지연 > 3초)
- 에러 메시지에 "connection failed", "pgbouncer", "max_connections" 포함

**진단:**

```bash
# Supabase Dashboard 접속
# https://app.supabase.com → 프로젝트 선택 → Database

# 1. 상태 확인
# Dashboard 우상단 "Status" 확인 (초록색 = 정상)

# 2. 연결 풀 상태 확인
# Database → Connections 탭
# - Idle connections: 정상 범위 (0~50)
# - Active connections: 갑작스러운 증가 여부 확인

# 3. 쿼리 실행 (SQL Editor에서 직접)
SELECT 1 AS health_check;
```

**조치:**

1. Supabase 상태 페이지에서 상태 확인 (https://status.supabase.com)
2. 만약 상태 페이지에서 정상인데 연결 오류:
   - 연결 풀 모니터링 대기 (자동 복구)
   - 필요시 Supabase 고객지원팀 연락 (support@supabase.io)
3. DDL 보호 트리거 작동 확인:

```sql
-- Supabase SQL Editor에서 실행
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'vcx_prevent_ddl';
```

---

#### 시나리오 C: Redis (Upstash) 장애

**증상:**
- 헬스 체크: `redis.status === 'error'` 또는 `degraded`
- `latency_ms > 500` (응답 지연 > 500ms)
- 에러 메시지에 "TIMEOUT", "connection reset" 포함

**진단:**

```bash
# Upstash Console 접속
# https://console.upstash.com → database 선택

# 1. 연결 상태 확인
# Overview 탭에서 "Status" 확인

# 2. 명령 실행 (Console 탭에서)
PING

# 3. 메모리 사용량 확인
# Stats 탭에서 메모리/명령 통계 확인

# 4. rate-limit 키 모니터링
KEYS ops:*
KEYS rate_limit:*
```

**조치:**

1. Upstash 상태 페이지에서 상태 확인 (https://status.upstash.com)
2. Redis 다운 시 영향 범위 (제한적):
   - 레이트리밋 비활성화 (누락된 검증)
   - 헬스 체크 알림 중복 발송 가능
3. **Redis 없이 서비스는 정상 작동** (선택 기능)

---

#### 시나리오 D: API 5xx 에러 (환경변수 누락)

**증상:**
- 헬스 체크: `env_vars.status === 'error'`, `missing: [...]` 나열
- API 호출 시 500 에러
- Sentry에서 `SUPABASE_SERVICE_ROLE_KEY is undefined` 에러

**진단:**

```bash
# Vercel Dashboard에서 환경변수 확인
# https://vercel.com/dashboard → 프로젝트 → Settings → Environment Variables

# 필수 변수 체크리스트:
# ✓ NEXT_PUBLIC_SUPABASE_URL
# ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
# ✓ SUPABASE_SERVICE_ROLE_KEY
# ✓ UPSTASH_REDIS_REST_URL
# ✓ UPSTASH_REDIS_REST_TOKEN
# (선택) RESEND_API_KEY, DISCORD_OPS_WEBHOOK_URL
```

**조치:**

1. 누락된 환경변수 확인
2. Vercel Dashboard에서 추가/수정:
   - Settings → Environment Variables → Edit → 값 입력
3. **반드시 재배포 필요**:
   - Deployments 탭 → 최신 배포 → Redeploy 클릭
   - 또는: `git push` → 자동 배포 (권장)
4. 재배포 완료 후 헬스 체크 재호출

---

### 3단계: 조치 실행

#### Redis 장애 시 임시 비활성화

```bash
# /src/lib/redis.ts에서 getRedis() 반환 null로 수정
# (단기 응급 조치만 적용)

export function getRedis(): Redis | null {
  // return new Redis({ ... }); // 주석 처리
  return null; // 임시 비활성화
}

# 변경 후 재배포
```

#### Supabase RLS 정책 복구 (관리자 권한 필요)

```sql
-- Supabase SQL Editor에서 실행

-- 1. 현재 RLS 정책 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 2. 비정상적으로 비활성화된 RLS 활성화
ALTER TABLE vcx_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_corporate_users ENABLE ROW LEVEL SECURITY;
```

---

### 4단계: 복구 확인

**복구 체크리스트:**

1. **헬스 체크 API 다시 호출**
   ```bash
   curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     https://valueconnectx.vercel.app/api/ops/health
   
   # status === "healthy" 확인
   ```

2. **주요 기능 수동 테스트**
   - 로그인/로그아웃
   - 디렉토리 프로필 조회
   - 커피챗 매칭 (데이터 조회)

3. **Discord 복구 알림 확인**
   - `#ops` 채널에서 recovery 알림 자동 발송 (약 1분 후)

4. **Sentry 에러율 모니터링**
   - https://sentry.io → VCX 프로젝트 → Issues
   - 5분 이내 에러율이 정상 수준으로 복구되는지 확인

---

## 에스컬레이션 기준

| 경과 시간 | 조치 | 대상 |
|-----------|------|------|
| 5분 | 헬스 체크 재호출, 상태 페이지 확인 | 자체 |
| 15분 | 환경 스냅샷 조회, 로그 검토 | 자체 + Sentry |
| 30분 | 외부 서비스 문의 (Vercel/Supabase) | 기술 지원팀 |
| 60분 | 고객 공지 준비, 언론 대응 검토 | 경영진 알림 |

---

## 관련 리소스

### 링크
- **헬스 체크 API**: `/api/ops/health`
- **환경 스냅샷 API**: `/api/ops/health?snapshot=true`
- **Sentry 대시보드**: https://sentry.io
- **Discord**: #ops 채널 알림

### 환경변수 참조
- `DISCORD_OPS_WEBHOOK_URL`: 알림 전송 주소
- `CRON_SECRET`: 정기 헬스 체크 인증 (Vercel Cron)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: Redis 연결

### 코드 참조
- **헬스 체크 로직**: `src/lib/ops/health-checks.ts`
- **알림 규칙**: `src/lib/ops/alert-rules.ts`
- **API 엔드포인트**: `src/app/api/ops/health/route.ts`
- **환경 스냅샷**: `src/lib/ops/snapshot.ts`

---

## FAQ

**Q: 헬스 체크 API를 자주 호출해도 괜찮나요?**
- A: 네. 읽기 전용이며 부작용이 없습니다. 필요할 때마다 호출하세요.

**Q: Discord 알림이 오지 않으면?**
- A: `DISCORD_OPS_WEBHOOK_URL`이 누락되었을 수 있습니다. Vercel 환경변수 확인.

**Q: Redis 없이 서비스가 작동하나요?**
- A: 네. 레이트리밋 기능만 비활성화됩니다. 핵심 기능(로그인, 프로필, 매칭)은 정상 작동.

**Q: 30분 이상 미해결 시?**
- A: Vercel/Supabase 기술 지원팀에 연락하세요. (support@vercel.com, support@supabase.io)
