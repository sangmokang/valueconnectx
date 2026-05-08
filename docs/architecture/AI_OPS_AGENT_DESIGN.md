# AI Ops Agent — 시스템 설계 문서

- **Status**: Proposed (ADR 미결재)
- **Owner**: Platform / Infra
- **작성일**: 2026-05-08
- **타깃 페이즈**: Phase 2-A (MVP) → Phase 2-B (Stretch)
- **선행 자료**: `.omc/plans/ai-ops-agent.md` (2026-04-03), `docs/engineering/VCX_STACK.md`
- **권위 순서**: PRD 6.0 > PROCESS > FEATURE_MANIFEST > ADR > 본 문서
- **변경 가드**: 본 문서는 설계만 다룬다. `src/**` 구현은 ADR 결재 후 별도 트랙.

---

## 1. Goal & Non-Goals

### 1.1 Goal

Phase 1 종료(2026-05-15) 직후 Phase 2 착수 시 운영 부담을 줄이고, 1인 코어 운영 체계에서도 P0 인시던트를 30분 이내에 인지·대응할 수 있는 **자동화된 운영 관측 레이어**를 구축한다.

구체 목표:

1. Vercel 배포 헬스 자동 점검 (10분 주기)
2. Supabase 백업·연결 상태 모니터링 (일 1회)
3. Sentry P0(unhandled exception, 5xx 폭증) 즉시 인지
4. Slack + 이메일 다중 채널 알림 (중복 억제 포함)
5. `/admin/ops` 단일 대시보드에서 상태 통합 조회
6. 추가 인프라 비용 $0 ~ $20/월 한도 내

### 1.2 Non-Goals

본 트랙에서 **하지 않는다**:

- APM (DataDog, New Relic) 도입 — Sentry로 대체
- 자동 롤백 / 자동 복구 — 의사결정은 사람이 한다 (RED 등급 차단만)
- 멀티 리전 페일오버 — Phase 3 이후 검토
- 분산 트레이싱 — 트래픽 규모 미달
- 외부 SaaS 모니터링 (Pingdom, UptimeRobot) — Vercel Cron + Slack 자가 구축
- 프로덕션 SLO 공식 정의 — 사용자 이해관계자 미존재

> Non-Goal에 들어간 항목은 "필요해질 때 다시 검토" 의미이지 영구 거부가 아니다.

---

## 2. Trigger 패턴

세 가지 트리거 모드를 명시적으로 분리한다.

| 트리거 | 채널 | 주기 | 대상 작업 | MVP 포함 |
|---|---|---|---|---|
| **Cron** | Vercel Cron Functions | `*/10 * * * *` | `/api/ops/health` (Supabase ping, Redis ping, env 검증) | Y |
| **Cron** | Vercel Cron Functions | `0 9 * * *` (KST 18:00) | `/api/ops/daily-snapshot` (Supabase 백업 메타, DB 레코드 수) | Y |
| **Webhook** | Sentry → 자체 `/api/ops/sentry-webhook` | 이벤트 즉시 | P0 alert 수신 → Slack 라우팅 | Y |
| **Webhook** | GitHub Actions → `/api/ops/deploy-webhook` | PR merge / 배포 후 | 배포 성공·실패 기록 + 배포 직후 헬스 재점검 | 2-B |
| **Manual** | Admin UI 버튼 | 사용자 요청 시 | "지금 헬스체크 실행" / "스냅샷 즉시 갱신" | Y |
| **Manual** | CLI (`scripts/ops/`) | 수동 실행 | 안전 게이트 RED 명령 검증 도구 | 2-B |

설계 원칙:

- Vercel Cron Hobby 플랜 한도(2 cron / 일 100회)에 묶이지 않도록 Pro 플랜 가정.
- 모든 트리거는 멱등(idempotent). 동일 입력 → 동일 결과 또는 no-op.
- Cron 호출은 `CRON_SECRET` 헤더 검증 필수 (Vercel 자동 발급).

---

## 3. 데이터 소스

| 소스 | 접근 방식 | 용도 | 인증 |
|---|---|---|---|
| **Vercel REST API** | `https://api.vercel.com/v6/deployments` | 최근 배포 상태, 실패율 | `VERCEL_TOKEN` (read scope) |
| **Vercel Edge Runtime** | `process.env.VERCEL_GIT_COMMIT_SHA`, `VERCEL_ENV` | 현재 배포 식별 | 환경변수 |
| **Supabase REST/RPC** | `supabase-js` admin client | 연결 ping, 테이블별 카운트, RPC 정상 동작 검증 | `SUPABASE_SERVICE_ROLE_KEY` |
| **Supabase Management API** | `https://api.supabase.com/v1/projects/{ref}/database/backups` | 백업 메타데이터 (마지막 백업 시각, 사이즈) | `SUPABASE_PERSONAL_ACCESS_TOKEN` |
| **Sentry API** | `https://sentry.io/api/0/projects/{org}/{proj}/stats/` | 24h 에러 카운트, P0 이슈 목록 | `SENTRY_AUTH_TOKEN` |
| **Sentry Webhook** | Internal Integration | P0 즉시 통지 | Webhook secret |
| **Upstash Redis** | `@upstash/redis` (이미 사용 중) | 알림 dedup, 헬스 카운터 | 기존 env |
| **GitHub Actions** | Workflow webhook | 배포 결과, lint/test 실패 | `GITHUB_WEBHOOK_SECRET` (2-B) |

> Supabase Management API는 Personal Access Token 기반이며 service_role key와 다르다. 별도 발급 필요.

데이터 흐름:

```
[Cron]──▶/api/ops/health──┬─▶ Supabase ping
                          ├─▶ Redis ping
                          ├─▶ Vercel API (배포 상태)
                          └─▶ 결과 저장 ──▶ Redis (TTL 24h)
                                       └─▶ 임계치 초과 시 알림 모듈

[Sentry P0]──webhook──▶/api/ops/sentry-webhook──▶ 알림 모듈

[Admin UI]──fetch──▶/api/ops/snapshot──▶ Redis 캐시 또는 즉시 수집
```

---

## 4. 알림 채널

### 4.1 채널 매트릭스

| 심각도 | Slack `#vcx-ops` | 이메일 (Resend) | 비고 |
|---|---|---|---|
| **P0** (서비스 다운, 인증 불가, DB 끊김) | 즉시 + `@here` | 즉시, dev@valueconnect.kr | 30분 내 미응답 시 SMS 후속(2-B) |
| **P1** (degraded, 부분 장애, 5xx > 1%) | 즉시 (mention 없음) | 1일 1회 다이제스트 | 30분 dedup |
| **P2** (백업 지연, 환경변수 누락 경고) | 1시간 dedup | 주 1회 다이제스트 | — |
| **Info** (배포 성공, 일일 헬스 OK) | 일 1회 요약 | — | 노이즈 차단 |

### 4.2 Slack 메시지 포맷

- Block Kit, 한국어, 상태별 컬러바 (`#dc2626` / `#eab308` / `#16a34a`).
- 필수 필드: 시각(KST), 환경(prod/preview), 영향 범위, 런북 링크, 재실행 버튼(2-B).
- 멘션은 P0에만. P1 이하 무멘션으로 알림 피로 차단.

### 4.3 이메일

- 발신: `Resend` (이미 도입). 신규 의존성 없음.
- 템플릿: 서비스 정합성 위해 텍스트 + HTML 동시 전송.
- 수신자: 초기에는 `dev@valueconnect.kr` 단일. 멤버 늘어나면 `vcx_ops_recipients` 테이블화 (2-B).

### 4.4 중복 억제 (dedup)

- Redis 키: `ops:alert:{rule_id}:{state_hash}` → TTL 30분(P1) / 1시간(P2).
- 키 존재 시 알림 skip, 카운터만 증가. 임계치 도달 시 "지속 중 알림" 한 번 더 발송.

---

## 5. 의사결정 로직 (Rule-based vs LLM-assisted)

원칙: **MVP는 100% 룰 기반.** LLM은 Stretch에서만 보조 역할.

### 5.1 룰 기반 (MVP)

```
헬스체크 응답:
  supabase.latency > 2000ms  OR  supabase.error  → unhealthy
  redis.error                                     → unhealthy
  env.missing.length > 0                          → degraded
  vercel.lastDeploy.state == "ERROR"              → degraded
  sentry.p0Count(24h) > 0                         → unhealthy
  그 외                                            → healthy

알림 라우팅:
  unhealthy   → P0 알림
  degraded 3회 연속 → P1 알림
  healthy 복구    → "복구" 알림 (이전 상태가 비정상일 때만)
```

룰은 `src/lib/ops/alert-rules.ts`에 표 형태로 선언적으로 보관 → 테스트 용이.

### 5.2 LLM-assisted (Stretch, Phase 2-B 이후)

Anthropic API(이미 도입)를 사용해 다음 보조 작업만 수행:

1. **인시던트 요약**: 최근 1시간 Sentry 이벤트 + 헬스 로그를 받아 한국어 3문장 요약 생성 → Slack 첨부.
2. **런북 추천**: 알림 메타데이터 → 가장 적합한 런북 1개 제안 (top-1, 신뢰도 표기).
3. **사후 회고 초안**: P0 종료 시 타임라인 자동 정리 (Markdown 초안).

LLM 가드레일:

- 의사결정(차단/실행/롤백)에 LLM 출력 사용 금지.
- 출력은 항상 사람 검토 대상. "제안"으로만 표기.
- 토큰 한도: 1회당 Claude Haiku 4k 토큰 이하.
- 비용 상한: $5/월. 초과 시 자동 비활성.

---

## 6. 보안

CLAUDE.md §3 (Project Hard Rules) 준수:

| 항목 | 정책 |
|---|---|
| API key | 코드 하드코딩 금지. Vercel 환경변수만 사용. |
| 신규 secret | `VERCEL_TOKEN`, `SUPABASE_PERSONAL_ACCESS_TOKEN`, `SENTRY_AUTH_TOKEN`, `SLACK_OPS_WEBHOOK_URL`, `CRON_SECRET`, `OPS_EMAIL_FROM` |
| Cron 엔드포인트 | `CRON_SECRET` 헤더 검증. 미일치 시 401. |
| 스냅샷 API | `system_role IN (admin, super_admin)` 필수. 비admin 접근 차단. |
| Sentry webhook | 페이로드 HMAC 서명 검증. |
| 응답 노출 | API key 값, DB 커넥션 문자열, JWT, 토큰 절대 미포함. |
| 로그 | 민감 PII 미저장. 멤버 식별은 `auth.uid` UUID만. |
| RLS | 신규 `vcx_ops_*` 테이블은 service_role 단독 접근. authenticated 차단. |
| DDL | 모든 DB 변경은 `supabase/migrations/NNN_vcx_ops_*.sql` 파일로만. Dashboard 수정 금지. |
| Webhook 수신 IP | Sentry/GitHub 공식 IP allowlist 적용 검토 (2-B). |

신규 secret 목록은 별도 `.env.example` PR에 정리. 프로덕션 설정은 Vercel Dashboard 수동.

---

## 7. Cost 추정 ($/월)

| 항목 | MVP | Stretch (2-B) | 비고 |
|---|---|---|---|
| Vercel Cron | $0 | $0 | Pro 플랜 포함 |
| Vercel Functions invocation | ~$0 | ~$0 | 10분 × 30일 = 4,320 호출. 무료 티어 내 |
| Upstash Redis | $0 | $0 | 기존 사용량 + 일 ~6k 키 증가. 무료 한도 내 |
| Supabase Management API | $0 | $0 | Personal token 무료 |
| Sentry API | $0 | $0 | 기본 플랜 포함 |
| Resend 이메일 | $0 | $0~$5 | 일 ~10통. 무료 3k/월 한도 내 |
| Anthropic API (LLM 보조) | $0 | ~$5 | Haiku 사용, 일 ~30회 호출 한도 |
| Slack | $0 | $0 | Free workspace 가능 |
| **합계** | **$0** | **$0 ~ $10** | 최대 $20/월 한도 내 |

> 추가 의존성 없이 기존 SDK + native `fetch`로 구현 가능 (CLAUDE.md §2.2 단순성 원칙 충족).

---

## 8. MVP scope vs Stretch scope

### 8.1 MVP (Phase 2-A)

핵심 5개 산출물:

1. `/api/ops/health` (Supabase + Redis + env 검증, Vercel Cron 10분)
2. `/api/ops/daily-snapshot` (Supabase 백업 메타 + DB 카운트, 일 1회)
3. `/api/ops/sentry-webhook` (P0 즉시 Slack/이메일)
4. Slack `#vcx-ops` 알림 + dedup
5. `/admin/ops` 대시보드 페이지 (기존 admin 영역 확장)

### 8.2 Stretch (Phase 2-B)

추가 5개:

6. GitHub Actions deploy-webhook (배포 직후 헬스 재점검)
7. LLM 보조 인시던트 요약 + 런북 추천
8. 7개 런북 마크다운 (`docs/ops/runbooks/01~07`)
9. 안전 게이트 RED/YELLOW/GREEN 분류 시스템 + CLI 검증 도구
10. 다중 수신자 관리 (`vcx_ops_recipients` 테이블 + admin UI)

---

## 9. 구현 단계

### Phase 2-A (목표 2026-05-22 ~ 2026-06-05, 약 2주)

| Step | 산출물 | 파일 (예정) | 예상 복잡도 |
|---|---|---|---|
| A1 | 헬스체크 API + Cron | `src/app/api/ops/health/route.ts`, `src/lib/ops/health-checks.ts`, `vercel.json` | M |
| A2 | Slack 알림 + dedup | `src/lib/ops/slack.ts`, `src/lib/ops/alert-rules.ts` | L-M |
| A3 | 일일 스냅샷 + Supabase 백업 메타 | `src/app/api/ops/daily-snapshot/route.ts`, `src/lib/ops/supabase-mgmt.ts` | M |
| A4 | Sentry webhook + 이메일 알림 | `src/app/api/ops/sentry-webhook/route.ts`, `src/lib/ops/email.ts` | M |
| A5 | `/admin/ops` 대시보드 | `src/app/(protected)/admin/ops/page.tsx`, `src/components/admin/ops/*` | M-H |

### Phase 2-B (선택, 목표 2026-06-12 이후)

| Step | 산출물 | 우선순위 |
|---|---|---|
| B1 | 7개 런북 마크다운 | High |
| B2 | 안전 게이트 RED/YELLOW/GREEN | Medium |
| B3 | LLM 보조 요약/추천 | Medium |
| B4 | GitHub Actions webhook | Low |
| B5 | 다중 수신자 관리 | Low |

각 Step은 ADR 결재 후 vertical slice 단위 PR로 분할.

---

## 10. 미해결 질문

ADR 결재 전 확정 필요:

1. **Slack 워크스페이스**: 신규 생성 vs 기존 활용? `#vcx-ops` 채널 owner 지정 필요.
2. **Vercel 플랜**: Hobby 유지 시 Cron 한도(2개) 초과. Pro 업그레이드 시점 결정 필요.
3. **Supabase Personal Access Token 발급 권한**: dev@valueconnect.kr 계정 단독 보유 vs 팀 자격 분리?
4. **Sentry Internal Integration 생성 권한**: 기존 organization owner 확인.
5. **이메일 수신자 정책**: 단일 수신함 vs 운영 alias (예: `ops@valueconnect.kr`) 신설?
6. **백업 검증 깊이**: 메타데이터 확인만 vs 실제 복원 테스트 (Phase 3 이후)?
7. **알림 SLA 명문화**: P0 30분 응답 가능한가 (1인 운영 체계 기준)?
8. **DB 신규 테이블 필요성**: 알림 로그를 Redis(휘발) vs Postgres(영속)?
9. **민감 카피 노출 가드**: ops 알림에 멤버 이름/회사명 포함 여부 (CLAUDE.md §3.0 정책 적용 범위)?
10. **Cron 실패 자체 알림**: Vercel Cron이 죽었을 때 누가 알려주나? — 외부 핑(Cron-of-cron) 필요 여부 검토.

ADR 작성 시 위 10개 항목에 명시 답변 포함 권장.

---

## Changelog

| 일자 | 변경 | 사유 |
|---|---|---|
| 2026-05-08 | v0.1 Proposed 초안 | Phase 2 후보 설계 검토용 |
