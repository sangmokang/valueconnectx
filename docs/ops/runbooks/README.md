# VCX 운영 런북 (Runbooks)

> 최종 수정: 2026-04-03

VCX 프로덕션 환경의 장애 대응, 백업 검증, 보안 사고 처리를 위한 단계별 지침 모음입니다.

## 런북 목록

### 1. [장애 대응 런북](01-incident-response.md) (351줄)

**언제 사용**: Discord 알림, 사용자 장애 리포트, Sentry 에러 급증

**주요 내용**:
- 헬스 체크 API 호출 및 해석
- Vercel/Supabase/Redis 장애 진단 절차
- API 5xx 에러 원인 파악 (환경변수 누락)
- 30분 에스컬레이션 기준
- 장애 유형별 복구 절차

**읽는 시간**: 5~10분 | **대응 시간**: 5~30분

---

### 2. [백업 검증 런북](02-backup-verification.md) (497줄)

**언제 사용**: 정기 데이터 무결성 확인, 월간 감사, 복구 시뮬레이션

**주요 내용**:
- Supabase 백업 정책 (플랜별)
- 테이블 레코드 수 모니터링 (임계값)
- RPC 함수 작동 확인
- Row-Level Security (RLS) 검증
- DDL 보호 메커니즘 (vcx_prevent_ddl)
- 마이그레이션 이력 관리
- Point-in-Time Recovery (PITR) 절차

**정기 검증 일정**:
- 일일: 자동 헬스 체크 (자정 UTC)
- 주간: 수동 검증 (월요일 오전)
- 월간: 종합 감사 (매월 1일)

**읽는 시간**: 10~15분 | **검증 시간**: 30~60분

---

### 3. [보안 사고 대응 런북](03-security-incident.md) (635줄)

**언제 사용**: API 키 유출, RLS 우회, DDoS, CSRF/XSS, 계정 비정상 활동

**주요 내용**:
- API 키 유출 대응 (4가지 시나리오):
  - SUPABASE_SERVICE_ROLE_KEY
  - RESEND_API_KEY
  - UPSTASH_REDIS_REST_TOKEN
  - DISCORD_OPS_WEBHOOK_URL
- RLS 정책 우회 진단 및 복구
- DDoS/Rate Limit 돌파 대응
- CSRF/XSS 공격 대응
- 사고 후 조치 (타임라인, 영향 범위, 재발 방지)

**에스컬레이션 기준**: 5분 → 15분 → 30분 → 60분 → 24시간

**읽는 시간**: 15~20분 | **대응 시간**: 5~60분 (사고 유형에 따라)

---

## 빠른 참조

### 긴급 상황별 선택 가이드

| 상황 | 런북 | 첫 단계 |
|------|------|--------|
| 웹 접속 불가 | 01 | `/api/ops/health` 호출 |
| 데이터 손상 의심 | 02 | 테이블 레코드 수 확인 |
| 권한 없이 데이터 조회 가능 | 03 | RLS 정책 확인 |
| API 키 노출 | 03 | 즉시 새 키 발급 |
| 비정상 요청 폭증 | 03 | IP 차단 |
| 사용자가 비밀번호 변경 안 했는데 변경됨 | 03 | CSRF 검증 |

### 환경변수 참조

```
공개 (안전):
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY

보안 필수 (유출 시 즉시 재발급):
  - SUPABASE_SERVICE_ROLE_KEY
  - RESEND_API_KEY
  - UPSTASH_REDIS_REST_TOKEN
  - DISCORD_OPS_WEBHOOK_URL
```

### 주요 API 엔드포인트

```
헬스 체크:
  GET /api/ops/health
  GET /api/ops/health?snapshot=true (admin만)

인증:
  Authorization: Bearer [ADMIN_TOKEN] (관리자 권한)
  또는 Cron Secret: Bearer [CRON_SECRET] (자동화)
```

### 모니터링 링크

- **Sentry**: https://sentry.io → VCX
- **Vercel**: https://vercel.com/dashboard → valueconnectx
- **Supabase**: https://app.supabase.com → valueconnectx
- **Upstash**: https://console.upstash.com
- **Discord**: #ops 채널

---

## 정기 일정

### 일일 (자동)
```
자정 UTC: /api/ops/health 실행 (Vercel Cron)
  → 환경 스냅샷 수집
  → 이상 감지 시 Discord #ops 알림
```

### 주간 (수동)
```
매주 월요일 오전:
  □ 백업 정책 확인 (Supabase Dashboard)
  □ RLS 정책 검증 (SQL Editor)
  □ DDL 보호 작동 확인
  □ 마이그레이션 이력 확인
  □ RPC 함수 테스트
  → 이상 발견 시 보안 사고 런북 실행
```

### 월간 (종합 감사)
```
매월 1일:
  □ 환경 스냅샷 전체 조회
  □ 데이터 무결성 리포트
  □ 백업 복구 시뮬레이션
  □ RLS/DDL 정책 재검토
```

---

## 중요 연락처

| 담당 | 연락처 | 우선순위 |
|------|--------|----------|
| Vercel 기술지원 | support@vercel.com | 높음 |
| Supabase 기술지원 | support@supabase.io | 높음 |
| Upstash 기술지원 | support@upstash.com | 중간 |
| GitHub 보안 | support@github.com | 높음 |
| 내부 CTO | Slack @cto | 매우 높음 |

---

## 문서 구조

```
docs/ops/runbooks/
├── README.md (이 파일)
├── 01-incident-response.md     (351줄, 5-30분 대응)
├── 02-backup-verification.md   (497줄, 정기 감시)
└── 03-security-incident.md     (635줄, 5-60분 대응)

총 1,483줄
```

---

## 사용 팁

1. **모바일 접근**: GitHub에서 보기 (마크다운 포맷)
2. **검색**: Ctrl+F (또는 Cmd+F)로 키워드 검색 (예: "RLS", "환경변수")
3. **SQL 복사**: SQL 블록을 Supabase SQL Editor에 붙여넣기 (★ 읽기만 하지 않도록)
4. **curl 복사**: 터미널에 붙여넣기 (환경변수 치환 필수)
5. **북마크**: 긴급 상황에 대비해 링크 북마크

---

## 마지막 업데이트

- **문서**: 2026-04-03
- **검증 상태**: 모든 curl/SQL 예제 검증됨
- **제작**: Writer Agent (Claude Code)

---

## 문의

런북 내용 관련 질문이 있으면:
1. 해당 런북의 FAQ 섹션 참고
2. 관련 리소스 링크 확인
3. 필요시 기술지원팀 연락
