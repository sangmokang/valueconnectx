# 보안 사고 대응 런북 (Security Incident Runbook)

> 최종 수정: 2026-04-03

VCX 보안 사고를 신속하게 감지하고 대응하기 위한 단계별 지침입니다.

## 트리거 조건

다음 중 하나 이상 발생 시 즉시 이 런북을 실행하세요.

- **Sentry 비정상 에러 패턴**: `401 Unauthorized`, `403 Forbidden` 급증
- **Rate Limit 대량 차단**: 단일 IP에서 수천 건 요청 (DDoS 의심)
- **CSP 위반 리포트**: 비인가 외부 도메인 리소스 로드 시도
- **RLS 우회 의심**: 권한 없는 사용자가 다른 사용자 데이터 접근
- **API 키 유출 보고**: 공개 저장소/로그에서 발견
- **의심 계정 활동**: 비정상 로그인, 대량 데이터 다운로드

---

## 영향 범위 평가

| 사고 유형 | 영향 | 복구 시간 |
|----------|------|----------|
| 단일 API 키 유출 | 중간 (해당 서비스만) | 5~30분 |
| 환경변수 유출 (3개+) | 높음 (전체 시스템) | 30분~2시간 |
| RLS 정책 우회 | 높음 (데이터 접근 제어 실패) | 1~4시간 |
| DDoS/Rate Limit 돌파 | 중간 (서비스 성능 저하) | 30분~1시간 |
| CSRF/XSS 공격 | 낮음 (개별 세션만 영향) | 5~15분 |

---

## 대응 절차

### 1단계: 초기 감지 및 격리 (5분)

**1.1. 사고 확인**

```bash
# Sentry 대시보드 접속
https://sentry.io → VCX 프로젝트 → Issues

# 최근 에러 패턴 확인:
# - 4xx 에러 급증? (401, 403 등)
# - 5xx 에러 급증? (500, 503 등)
# - 특정 엔드포인트 집중?

# Discord #ops 채널 확인
# - 헬스 체크 알림 메시지 읽기
# - 에러 발생 시간대 기록
```

**1.2. Slack/Discord 긴급 채널 공지**

```
[보안 사고 감지]
- 사고 유형: [유출|우회|공격|의심]
- 영향 범위: [API|데이터|로그인|레이트리밋]
- 발견 시간: [UTC 타임스탐프]
- 초기 조치: [진행 중]

대응팀 호출 필요 시 @security-team
```

**1.3. 로그 수집**

```bash
# Sentry에서 에러 로그 다운로드
# Issues → 해당 이슈 → Download Raw JSON

# Vercel 함수 로그 확인
# https://vercel.com/dashboard → 프로젝트 → Functions → Logs

# 수집 항목:
# - 요청 시간 (UTC)
# - 요청 IP 주소
# - 요청 헤더 (Authorization, User-Agent 등)
# - 응답 상태 코드
# - 에러 메시지 전문
```

---

### 2단계: API 키 유출 대응

#### 시나리오: SUPABASE_SERVICE_ROLE_KEY 유출

**유출 징후:**
- GitHub 공개 저장소에서 발견
- Slack 메시지/Discord에 실수로 붙여넣음
- 외부인이 신고 (security@valconnectx.com)

**즉시 조치 (3분):**

```bash
# 1단계: 유출 범위 파악
# - 누가 접근 가능한가? (공개 저장소라면 전 인터넷)
# - 얼마나 오래 노출되었는가? (커밋 시간부터 발견까지)

# 2단계: Supabase Dashboard에서 새 키 발급
# https://app.supabase.com → 프로젝트 → Settings → API

# "Service Role Key" 섹션 찾기:
# [Reveal] → [복사] (현재 유출된 키 기록)
# [Regenerate] → [Confirm] → 새로운 키 생성

# 3단계: 새 키 확인
# 새 키는 "sk-..." 형태로 시작
# 이전 키와 완전히 다른가 확인
```

**Vercel 환경변수 업데이트:**

```bash
# Vercel Dashboard 접속
# https://vercel.com/dashboard → 프로젝트 → Settings

# Environment Variables 탭:
# SUPABASE_SERVICE_ROLE_KEY 찾기
# → 값 수정 (새로운 키로 변경)
# → Save

# 배포 트리거
git push origin main
# (또는 Deployments → Redeploy)
```

**로컬 환경 업데이트:**

```bash
# .env.local 파일 수정
SUPABASE_SERVICE_ROLE_KEY=sk_[새로운_키]

# 검증
npm run dev
# localhost:3000 접속 가능한가?
```

**유출된 키 추적:**

```bash
# Supabase 감사 로그 (Pro 플랜만)
# Dashboard → Settings → Audit logs
# - 유출된 키로 만든 요청 추적
# - 비정상 데이터 접근 여부 확인

SQL: SELECT * FROM auth.audit_log_entries
WHERE created_at > 'YYYY-MM-DD HH:MM:SS'
ORDER BY created_at DESC;

# 비정상 접근 발견 시:
# 1. 커밋 로그 확인 (비인가 변경)
# 2. 데이터 백업으로부터 복구 (필요시)
# 3. 사용자 비밀번호 리셋 권고
```

---

#### 시나리오: RESEND_API_KEY 유출

**유출 징후:**
- 비인증 이메일 발송 시작
- Resend Dashboard에서 비정상 활동
- 외부인이 고객에게 가짜 이메일 발송

**즉시 조치 (5분):**

```bash
# 1단계: Resend Dashboard 접속
# https://dashboard.resend.com → API Keys

# 2단계: 유출된 키 비활성화
# [Delete] → [Confirm]

# 3단계: 새 키 생성
# [Create API Key] → 이름 입력 (예: "vcx-prod-2026-04")
# 새 키 복사

# 4단계: Vercel 환경변수 업데이트
# https://vercel.com/dashboard → Settings → Environment Variables
# RESEND_API_KEY 수정

# 5단계: 재배포
git push origin main
```

**영향 범위:**
- 이메일 발송 기능: 초대, 비밀번호 리셋 (잠시 중단)
- 사용자 데이터: 안전 (이메일은 읽기만 하고 발송)

---

#### 시나리오: UPSTASH_REDIS_REST_TOKEN 유출

**유출 징후:**
- 레이트리밋 정책 우회 (비정상 다량 요청 성공)
- Upstash Console에서 비정상 명령 (GET, DEL)

**즉시 조치 (5분):**

```bash
# 1단계: Upstash Console 접속
# https://console.upstash.com → 데이터베이스 선택

# 2단계: API Key 재발급
# Settings → API Keys → [Delete Current] → [Create New]

# 3단계: 새 토큰 정보
# REST URL: https://[host]:[port]
# REST Token: [새로운 토큰]

# 4단계: Vercel 환경변수 업데이트
# https://vercel.com/dashboard → Settings
# UPSTASH_REDIS_REST_URL
# UPSTASH_REDIS_REST_TOKEN
# (두 항목 모두 업데이트)

# 5단계: 재배포
git push origin main
```

**레이트리밋 재설정:**

```bash
# Upstash Console에서 비정상 키 삭제
# rate_limit:* 검색 → 모두 삭제

SQL: DEL rate_limit:*
```

---

#### 시나리오: DISCORD_OPS_WEBHOOK_URL 유출

**유출 징후:**
- 외부인이 #ops 채널에 메시지 발송
- 비인가 알림 스팸

**즉시 조치 (2분):**

```bash
# 1단계: Discord 서버 설정 접속
# → #ops 채널 → 톱니바퀴(⚙️) → Webhooks

# 2단계: vcx-ops 웹훅 선택
# [Delete] → [Confirm]

# 3단계: 새 웹훅 생성
# [New Webhook]
# - Name: "vcx-ops"
# - Channel: #ops
# [Copy Webhook URL]

# 4단계: Vercel 환경변수 업데이트
# https://vercel.com/dashboard
# DISCORD_OPS_WEBHOOK_URL 수정

# 5단계: 재배포
git push origin main

# 6단계: 테스트
curl -X POST \
  -H 'Content-type: application/json' \
  --data '{"text":"[테스트] 웹훅 작동 확인"}' \
  https://discord.com/api/webhooks/[WEBHOOK_ID]/[WEBHOOK_TOKEN]
```

**영향 범위:**
- 헬스 체크 알림: 잠시 중단
- 서비스 성능: 영향 없음

---

### 3단계: RLS 우회 의심

**징후:**
- Sentry에서 `403 Forbidden` 급감 (또는 `200 OK`로 급변)
- 사용자가 자신 데이터 외에 타인 정보 조회 가능
- SQL 쿼리 로그에서 비정상 SELECT 패턴

**진단 (10분):**

```sql
-- Supabase SQL Editor에서 (admin 권한)

-- 1단계: RLS 정책 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'vcx_%';

-- 결과: 모두 TRUE여야 정상
-- 하나라도 FALSE면 즉시 복구

-- 2단계: 비정상 쿼리 추적
SELECT * FROM pg_stat_statements
WHERE query LIKE '%vcx_members%'
ORDER BY calls DESC
LIMIT 10;

-- 3단계: RLS 정책 상세 확인
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'vcx_members'
ORDER BY policyname;

-- 출력 예시:
-- schemaname | tablename | policyname | permissive | roles | qual | with_check
-- -----------+-----------+----------------------------+---------+--------+---+---
-- public | vcx_members | auth_users_select | true | authenticated | auth.uid()=user_id | NULL
-- (정책이 비어있으면 즉시 복구)
```

**복구 (5분):**

```sql
-- RLS 재활성화 (비활성화된 테이블)
ALTER TABLE vcx_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_corporate_users ENABLE ROW LEVEL SECURITY;

-- RLS 정책 재적용 (삭제된 정책)
-- 마이그레이션 파일에서 정책 DDL 복사
-- /supabase/migrations/[최신]_vcx_*.sql

-- 또는 마이그레이션 재실행
git push origin main
```

**감시 강화:**

```bash
# Supabase Audit Logs 활성화 (Pro 플랜)
# Dashboard → Settings → Audit logs

# 향후 모니터링:
# - AUTH 테이블 접근 (user_id, role)
# - RLS 정책 변경 (DROP POLICY, ALTER POLICY)
```

---

### 4단계: 레이트리밋 돌파 (DDoS)

**징후:**
- 단일 IP에서 초당 수천 건 요청
- `/api/*` 엔드포인트 응답 시간 급증 (5초 이상)
- `rate_limit:*` Redis 키 급증

**진단 (3분):**

```bash
# 1단계: Vercel Analytics 확인
# https://vercel.com/dashboard → Analytics
# Requests 탭에서 IP 주소 필터링

# 2단계: Redis 레이트리밋 상태 확인
# Upstash Console → Database

redis-cli KEYS "rate_limit:*" | wc -l
# (정상: <100, 공격: >1000)

# 3단계: 공격 IP 패턴 분석
redis-cli KEYS "rate_limit:*" | head -20
# 반환 예시:
# rate_limit:192.168.1.100:directory
# rate_limit:192.168.1.100:coffeechat
# (같은 IP에서 다중 엔드포인트)
```

**긴급 조치 (5분):**

```bash
# 1단계: Vercel 응급 방화벽 규칙 추가
# https://vercel.com/dashboard → Settings → Security
# IP Whitelist/Blacklist 활성화

# 공격 IP를 임시 차단
BLOCK IP: [공격_IP]

# 2단계: Redis 레이트리밋 한도 강화
# Upstash Console → Database

# directoryDailyLimiter 조회
GET directoryDailyLimiter:user_id:2024-04-03

# 임시 더 엄격한 한도 설정
SET directoryDailyLimiter:user_id:2024-04-03 10  # 기본 50 → 10

# 3단계: 아무 엔드포인트나 차단 (테스트 안 함)
# 대신 Vercel 함수 타임아웃 설정 확인
# maxDuration: 60 (초)
```

**장기 대응:**

```bash
# 1. WAF (Web Application Firewall) 도입 검토
#    - Cloudflare + Vercel 통합 (DDoS 보호)

# 2. 레이트리밋 로직 개선
#    /src/lib/rate-limit.ts 검토
#    - 사용자별 한도 개선
#    - 엔드포인트별 차등 한도

# 3. 모니터링 강화
#    - Sentry Rate Limit 에러 추적
#    - Discord 알림 (요청/초 임계값)
```

---

### 5단계: CSRF/XSS 의심

**징후:**
- CSP (Content Security Policy) 위반 리포트
- 사용자가 예상치 못한 계정 변경 (비밀번호, 이메일)
- 비정상 토큰 사용

**진단:**

```bash
# 1단계: Sentry CSP 리포트 확인
# https://sentry.io → Issues → CSP Violations

# 실제 콘텐츠 로드 도메인 확인:
# - 외부 JavaScript? (악의적 스크립트 주입)
# - 외부 CSS? (스타일 변경)
# - 외부 iframe? (피싱)

# 2단계: CSRF 토큰 검증
# src/middleware.ts에서 CSRF 미들웨어 확인

grep -r "csrf" src/
grep -r "csrf-token" src/

# 3단계: 쿠키 보안 설정 확인
# src/middleware.ts, src/lib/supabase/client.ts

# SameSite: Strict?
# Secure: true (HTTPS only)?
# HttpOnly: true (JavaScript 접근 불가)?
```

**복구:**

```bash
# 1단계: CSP 헤더 강화
# src/middleware.ts 또는 next.config.js

// next.config.js 예시
module.exports = {
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
        },
      ],
    },
  ],
};

# 2단계: CSRF 토큰 재검증
npm test -- csrf.test.ts

# 3단계: 쿠키 설정 확인 및 강화
# HttpOnly = true, Secure = true, SameSite = Strict

# 4단계: 재배포
git push origin main
```

**영향받은 사용자 대응:**

```bash
# 1. 비정상 계정 변경 감지된 사용자:
#    - 자동 이메일: "비정상 활동 감지"
#    - 비밀번호 리셋 권고
#    - 이중 인증 (2FA) 활성화 권고

# 2. 모든 사용자 공지 (선택사항):
#    - 커뮤니티 공지
#    - 이메일 알림
#    - "보안 업데이트 완료" 메시지
```

---

## 사고 후 조치

### 1단계: 타임라인 기록

```
[yyyy-mm-dd hh:mm:ss UTC] 사고 감지
  발견 경로: [Sentry|사용자 보고|자동 모니터링]
  초기 증상: [에러 메시지|이상 패턴]

[yyyy-mm-dd hh:mm:ss UTC] 원인 파악
  근본 원인: [API 키 유출|RLS 우회|DDoS 등]
  영향 범위: [시스템|데이터|사용자]
  영향 기간: [시작 ~ 종료]

[yyyy-mm-dd hh:mm:ss UTC] 조치 실행
  조치 1: [환경변수 업데이트|RLS 복구 등]
  조치 2: ...
  결과: [성공|부분 성공|실패]

[yyyy-mm-dd hh:mm:ss UTC] 복구 확인
  검증 방법: [테스트|모니터링 확인]
  복구 상태: [완료|진행 중]
```

### 2단계: 영향 범위 문서화

```markdown
## 보안 사고 보고서

**사고명**: [예: Supabase API 키 유출]
**보고일**: 2026-04-03
**심각도**: [Critical|High|Medium|Low]

### 타임라인
- 14:30 UTC: 사고 감지 (Sentry)
- 14:35 UTC: 대응팀 소집
- 14:45 UTC: 새 API 키 발급
- 15:15 UTC: 환경변수 업데이트 완료

### 영향 범위
- **기간**: 30분 (14:15~14:45 UTC)
- **시스템**: API 백엔드, 사용자 인증
- **영향 사용자**: 실제 데이터 접근 시도: 0명 (신속 대응)
- **유출 데이터**: vcx_members 테이블 스키마 (민감한 개인정보 아님)

### 재발 방지
1. GitHub 보안 스캔 활성화 (자동 키 감지)
2. .env 파일 .gitignore 확인
3. Pre-commit hook으로 민감한 패턴 차단
4. 정기 환경변수 감사 (월 1회)
```

### 3단계: 재발 방지 조치

```bash
# 1. GitHub 보안 설정 강화
# Repository Settings → Security → Secret scanning
# [Enable] GitHub Secret Scanning

# 2. Pre-commit hook 설치
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
git diff-index --cached HEAD | grep -E 'sk_|rk_|SUPABASE_SERVICE_ROLE' && {
  echo "⚠️  API 키 감지됨. 커밋 중단."
  exit 1
}
exit 0
EOF
chmod +x .git/hooks/pre-commit

# 3. .env 파일 .gitignore 재확인
grep -E "\.env|secrets|credentials" .gitignore
# 없으면 추가

# 4. 환경변수 감사 일정 설정
# 매월 1일 10:00 UTC: Vercel 환경변수 목록 검토
```

---

## 에스컬레이션 기준

| 경과 시간 | 조치 | 대상 |
|-----------|------|------|
| 5분 | 초기 대응, 로그 수집 | 자체 |
| 15분 | 영향 범위 파악, 임시 차단 | CTO 알림 |
| 30분 | 근본 원인 제거, 환경변수 업데이트 | CTO + 보안팀 |
| 60분 | 고객 공지 준비 | 경영진 알림 |
| 24시간 | 사고 보고서 작성, 재발 방지 | 전사 공유 |

---

## 관련 리소스

### 링크
- **Sentry**: https://sentry.io
- **Vercel 대시보드**: https://vercel.com/dashboard
- **Supabase**: https://app.supabase.com
- **Upstash Console**: https://console.upstash.com
- **Discord 서버 설정**: Discord → 서버명 → Settings

### 환경변수 참조
```
NEXT_PUBLIC_SUPABASE_URL           # 공개 (문제 없음)
NEXT_PUBLIC_SUPABASE_ANON_KEY      # 공개 (문제 없음)
SUPABASE_SERVICE_ROLE_KEY          # ⚠️ 보안 필수
RESEND_API_KEY                     # ⚠️ 보안 필수
UPSTASH_REDIS_REST_TOKEN           # ⚠️ 보안 필수
DISCORD_OPS_WEBHOOK_URL            # ⚠️ 보안 필수
```

### 코드 참조
- **인증 로직**: `src/lib/auth/`
- **RLS 정책**: `supabase/migrations/`
- **CSRF 미들웨어**: `src/middleware.ts`
- **레이트리밋**: `src/lib/rate-limit.ts`
- **보안 헤더**: `next.config.js`

### 연락처
- **GitHub 보안 팀**: support@github.com
- **Supabase 보안**: security@supabase.io
- **Vercel 보안**: support@vercel.com
- **Discord 보안**: security@discord.com

---

## FAQ

**Q: API 키 유출 후 얼마나 빨리 대응해야 하나요?**
- A: 즉시 (5분 이내). 새 키 발급 후 배포까지 총 15~30분 목표.

**Q: RLS 정책이 모두 삭제되면?**
- A: 긴급 상황. 모든 인증 필요 엔드포인트가 권한 없이 열립니다. 즉시 마이그레이션 재실행.

**Q: 공격자가 접근한 기간 동안 어떤 데이터를 볼 수 있었을까요?**
- A: Supabase 감사 로그로 추적 (Pro 플랜만). Free/Hobby 플랜은 상세 로그 불가.

**Q: DDoS 공격 시 서비스를 완전히 차단해야 하나요?**
- A: 아니요. Vercel의 자동 스로틀링이 작동합니다. IP 차단으로 충분.

**Q: 사용자에게 보안 사고를 공지해야 하나요?**
- A: 개인정보 노출이 없으면 선택사항. 영업 담당자와 상의 후 결정.

**Q: 정기 보안 감사는 얼마나 자주?**
- A: 최소 월 1회, 권장: 주 1회 (API 키 회전, RLS 정책 검증).
