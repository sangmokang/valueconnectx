# VCX AI 서버 운영 에이전트 구현 계획

## 생성일: 2026-04-03
## 상태: 사용자 확인 대기

---

## Context

ValueConnect X는 Vercel(서버리스) + Supabase(관리형 DB) + Sentry(에러 트래킹) + Upstash Redis(레이트리밋) 스택으로 운영 중이다. 현재 헬스체크 엔드포인트, 크론잡, Slack 통합, 구조화된 로깅, 업타임 모니터링이 모두 부재하다.

"Markdown 기반 AI 서버 운영 에이전트" 방법론의 7개 요소를 VCX 서버리스 특성에 맞게 변환하여 구현한다.

### 현재 인프라 현황
- **API**: 48개 Route Handler (`src/app/api/`)
- **인증**: Supabase Auth + 미들웨어 기반 세션 관리 (`src/middleware.ts`)
- **레이트리밋**: Upstash Redis, 5개 리미터 (api/auth/directory/burst/daily) (`src/lib/rate-limit.ts`)
- **에러**: Sentry + `src/lib/api/error.ts` 헬퍼 (badRequest, unauthorized, forbidden 등)
- **보안**: CSP, HSTS, X-Frame-Options, Permissions-Policy (`next.config.mjs`)
- **DB 보호**: DDL Protection Event Trigger, 23개 마이그레이션, 14개 RPC
- **환경변수**: Supabase URL/Key, Service Role Key, Resend API Key, Upstash Redis, Sentry

---

## Work Objectives

VCX 운영 안전성과 가시성을 확보하기 위해 다음을 구현한다:
1. 서비스 헬스체크 시스템 (Vercel Cron 기반)
2. 3단계 안전 게이트 (운영 명령 위험도 분류)
3. 7개 런북 (VCX 서버리스 맞춤)
4. Slack 알림 통합
5. 환경 스냅샷 API

---

## Guardrails

### Must Have
- Vercel Cron Functions 사용 (서버리스 호환)
- 기존 Sentry와 중복 없이 보완적 역할
- 기존 Upstash Redis 인프라 재활용
- 비용 최소화 (Vercel Hobby/Pro 크론 한도 내)
- 한국어 알림 메시지
- 기존 `src/lib/api/error.ts` 패턴 준수

### Must NOT Have
- 별도 서버/데몬 프로세스
- Supabase DB 직접 서버 접근 (관리형이므로)
- 유료 외부 모니터링 서비스 추가
- 기존 API Route Handler 동작 변경
- `tailwind.config.ts` 생성 (Tailwind v4 CSS-first)

---

## Task Flow

```
[Step 1: 헬스체크 API + Vercel Cron] 
    → [Step 2: Slack Webhook 통합]
    → [Step 3: 환경 스냅샷 API]
    → [Step 4: 3단계 안전 게이트 문서 + 검증 로직]
    → [Step 5: 7개 런북 마크다운]
    → [Step 6: 운영 대시보드 페이지]
```

Step 1~2는 순차 (Slack이 헬스체크 알림 발송 대상), Step 3은 독립, Step 4~5는 독립(문서), Step 6은 1~3 완료 후.

---

## Detailed TODOs

### Step 1: 헬스체크 API + Vercel Cron 설정
**예상 복잡도**: 5~7 파일 | MEDIUM

신규 파일:
- `src/app/api/ops/health/route.ts` — 메인 헬스체크 엔드포인트
- `src/lib/ops/health-checks.ts` — 개별 체크 로직 모듈
- `vercel.json` — Vercel Cron 설정 (10분 주기)

구현 내용:
1. **Supabase 연결 체크**: `supabase.from('vcx_members').select('count').limit(1)` 쿼리 성공 여부
2. **Upstash Redis 체크**: `redis.ping()` 응답 확인
3. **Sentry 상태**: Sentry API를 통한 최근 에러 카운트 (선택적)
4. **API 응답 시간**: 주요 엔드포인트 셀프 체크 (directory, positions)
5. **환경변수 존재 확인**: 필수 env 키 존재 여부 (값은 노출 안 함)

응답 형식:
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "ISO-8601",
  "checks": {
    "supabase": { "status": "ok", "latency_ms": 45 },
    "redis": { "status": "ok", "latency_ms": 12 },
    "env_vars": { "status": "ok", "missing": [] }
  },
  "version": "git-sha or package version"
}
```

Vercel Cron 설정 (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/ops/health",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

**수락 기준**:
- [ ] `/api/ops/health` GET 요청 시 JSON 응답 반환
- [ ] Supabase, Redis 연결 상태 개별 체크
- [ ] 하나라도 실패 시 `degraded` 또는 `unhealthy` 상태
- [ ] Vercel Cron이 10분마다 호출
- [ ] 인증 없이 접근 불가 (CRON_SECRET 헤더 검증)

---

### Step 2: Slack Webhook 알림 통합
**예상 복잡도**: 3~4 파일 | LOW-MEDIUM

신규 파일:
- `src/lib/ops/slack.ts` — Slack Incoming Webhook 클라이언트
- `src/lib/ops/alert-rules.ts` — 알림 규칙 정의

수정 파일:
- `src/app/api/ops/health/route.ts` — 비정상 시 Slack 알림 발송
- `.env.example` (또는 문서) — `SLACK_OPS_WEBHOOK_URL` 추가

구현 내용:
1. **Slack Incoming Webhook**: 외부 라이브러리 없이 `fetch`로 직접 호출
2. **알림 규칙**:
   - `unhealthy` → 즉시 알림 (RED)
   - `degraded` → 3회 연속 시 알림 (YELLOW, Redis 카운터 활용)
   - `healthy` → 복구 알림 (이전 상태가 비정상이었을 때만)
3. **알림 포맷**: 한국어, Block Kit 사용, 상태별 색상 (빨강/노랑/녹색)
4. **연속 알림 방지**: Upstash Redis에 마지막 알림 타임스탬프 저장, 동일 상태 30분 내 중복 방지

**수락 기준**:
- [ ] `unhealthy` 상태 시 Slack 채널에 한국어 알림 도착
- [ ] 동일 상태 30분 내 중복 알림 없음
- [ ] 복구 시 "정상 복구" 알림 발송
- [ ] `SLACK_OPS_WEBHOOK_URL` 미설정 시 graceful 스킵 (로그만)

---

### Step 3: 환경 스냅샷 API
**예상 복잡도**: 3~4 파일 | LOW-MEDIUM

신규 파일:
- `src/app/api/ops/snapshot/route.ts` — 환경 스냅샷 엔드포인트
- `src/lib/ops/snapshot.ts` — 스냅샷 수집 로직

구현 내용:
1. **서비스 메트릭 수집**:
   - DB: 테이블별 레코드 수 (vcx_members, vcx_corporate_users, positions 등)
   - Redis: 활성 레이트리밋 키 수
   - API: 48개 Route Handler 목록 + 마지막 헬스체크 결과
2. **배포 정보**: `process.env.VERCEL_GIT_COMMIT_SHA`, `VERCEL_ENV`
3. **보안 상태**: 필수 env 존재 확인, CSP 헤더 설정 확인

응답은 admin 인증 필수 (`system_role: admin | super_admin`).

**수락 기준**:
- [ ] admin 인증된 사용자만 접근 가능
- [ ] DB 테이블별 레코드 수 반환
- [ ] 배포 정보 (commit SHA, 환경) 포함
- [ ] 민감 정보 (API key 값 등) 절대 미포함

---

### Step 4: 3단계 안전 게이트 정의 + 검증 유틸리티
**예상 복잡도**: 3~4 파일 | MEDIUM

신규 파일:
- `docs/ops/safety-gates.md` — 안전 게이트 정의 문서
- `src/lib/ops/safety-gate.ts` — 위험도 분류 유틸리티
- `src/app/api/ops/safety-check/route.ts` — 안전 게이트 검증 API

VCX 맥락 위험 명령 분류:

| 등급 | 색상 | 대상 | 예시 |
|------|------|------|------|
| **RED** (차단/수동 승인) | 빨강 | 비가역적 데이터 변경 | DB 마이그레이션 실행, RLS 정책 변경, DDL 명령, 환경변수 변경 (SUPABASE_SERVICE_ROLE_KEY 등), 프로덕션 배포 롤백 |
| **YELLOW** (경고/확인) | 노랑 | 영향 범위 넓은 변경 | 대량 데이터 업데이트, 레이트리밋 설정 변경, 초대/추천 대량 처리, Sentry 설정 변경 |
| **GREEN** (자동 허용) | 녹색 | 읽기 전용/안전한 작업 | 헬스체크, 스냅샷 조회, 로그 조회, 멤버 단건 조회, 통계 API 호출 |

구현 내용:
1. 운영 명령을 분류하는 타입 시스템 (`OperationRisk` enum)
2. 명령 패턴 매칭으로 위험도 자동 분류
3. RED 명령 시 Slack 알림 + 실행 로그 기록 (Redis)
4. 안전 게이트 검증 API (입력: 명령 설명, 출력: 위험 등급 + 필요 조치)

**수락 기준**:
- [ ] 모든 운영 명령이 RED/YELLOW/GREEN 중 하나로 분류됨
- [ ] RED 명령 실행 시 Slack 알림 발송
- [ ] 안전 게이트 문서에 VCX 특화 예시 포함
- [ ] 검증 API가 정확한 위험 등급 반환

---

### Step 5: 7개 런북 (VCX 서버리스 맞춤)
**예상 복잡도**: 7 파일 (마크다운) | LOW

신규 파일 (`docs/ops/runbooks/`):
1. `01-incident-response.md` — **장애 대응**: Vercel 다운, Supabase 장애, API 502/503 대응 절차
2. `02-maintenance.md` — **유지보수**: DB 마이그레이션 실행, 의존성 업데이트, Vercel 배포 관리
3. `03-ssl-domain.md` — **SSL/도메인 이슈**: Vercel 자동 SSL 문제, 커스텀 도메인 DNS, 인증서 갱신 실패
4. `04-storage-capacity.md` — **스토리지/용량**: Supabase DB 용량 모니터링, Storage 정리, Redis 메모리
5. `05-backup-verification.md` — **백업 검증**: Supabase 자동 백업 확인, 데이터 무결성 체크, RPC 동작 검증
6. `06-security-incident.md` — **보안 사고**: 토큰 유출 대응, RLS 우회 탐지, 레이트리밋 돌파, CSP 위반
7. `07-environment-discovery.md` — **환경 탐색**: 현재 인프라 상태 파악, 스냅샷 해석, 의존성 맵

각 런북 구조:
```markdown
# [런북 이름]
## 트리거 조건
## 영향 범위
## 대응 절차 (단계별)
## 에스컬레이션 기준
## 복구 확인 방법
## 관련 안전 게이트 (RED/YELLOW/GREEN)
```

**수락 기준**:
- [ ] 7개 런북 모두 작성 완료
- [ ] 각 런북에 VCX 특화 절차 포함 (Vercel, Supabase, Upstash 구체적 조작)
- [ ] 안전 게이트 등급과 연동
- [ ] 한국어 작성

---

### Step 6: 운영 대시보드 페이지 (Admin)
**예상 복잡도**: 5~8 파일 | MEDIUM-HIGH

신규 파일:
- `src/app/(protected)/admin/ops/page.tsx` — 운영 대시보드 페이지
- `src/components/admin/ops/HealthStatus.tsx` — 헬스 상태 카드
- `src/components/admin/ops/SnapshotView.tsx` — 환경 스냅샷 뷰
- `src/components/admin/ops/SafetyGatePanel.tsx` — 안전 게이트 패널
- `src/components/admin/ops/RunbookLinks.tsx` — 런북 바로가기

구현 내용:
1. 최신 헬스체크 결과 시각화 (상태별 색상 배지)
2. 환경 스냅샷 요약 (DB 레코드 수, 배포 정보)
3. 최근 안전 게이트 로그 (RED/YELLOW 이벤트 목록)
4. 7개 런북 바로가기 링크
5. admin/super_admin 전용 (기존 admin 라우트 보호 패턴 재사용)

**수락 기준**:
- [ ] `/admin/ops` 경로에서 운영 대시보드 렌더링
- [ ] admin 인증 필수 (미인증 시 `/login` 리다이렉트)
- [ ] 헬스 상태, 스냅샷, 안전 게이트 로그 표시
- [ ] 모바일 반응형 (Galaxy 360px 기준)
- [ ] 한국어 UI

---

## 기술 결정 사항

| 결정 | 선택 | 근거 |
|------|------|------|
| 크론 | Vercel Cron Functions | 서버리스 호환, 추가 비용 없음 (Pro 플랜 기준 무제한) |
| Slack 통합 | Incoming Webhook (fetch) | 별도 SDK 불필요, 가장 단순 |
| 상태 저장 | Upstash Redis | 이미 사용 중, 추가 비용 없음 |
| 런북 포맷 | Markdown (docs/) | 코드와 함께 버전 관리, AI 에이전트 참조 용이 |
| 대시보드 | 기존 Admin 영역 확장 | 새 인프라 없이 기존 패턴 활용 |

## 환경변수 추가 필요

| 변수 | 용도 | 필수 여부 |
|------|------|----------|
| `SLACK_OPS_WEBHOOK_URL` | Slack 운영 채널 알림 | 선택 (미설정 시 알림 스킵) |
| `CRON_SECRET` | Vercel Cron 인증 토큰 | 필수 (Vercel 자동 생성) |

## 의존성 추가

없음. 모든 구현이 기존 패키지 (`@upstash/redis`, `@supabase/ssr`, `@sentry/nextjs`) + 네이티브 `fetch`로 가능.

---

## Success Criteria

1. `/api/ops/health`가 10분마다 자동 실행되어 Supabase + Redis 상태 체크
2. 비정상 감지 시 Slack 한국어 알림 발송 (중복 방지)
3. `/api/ops/snapshot`으로 admin이 환경 상태 전체 조회 가능
4. 모든 운영 명령이 RED/YELLOW/GREEN으로 분류되어 문서화
5. 7개 런북이 VCX 특화 대응 절차 제공
6. `/admin/ops` 대시보드에서 운영 상태 한눈에 파악 가능
7. 추가 비용 $0 (기존 인프라만 활용)
