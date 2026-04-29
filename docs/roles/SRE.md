# SRE — ValueConnect X

## Mission

서비스 안정 운영. 지표 대시보드로 목표 달성.

## Scope (owns)

- 배포 게이트 관리
- 인시던트 대응
- 모니터링 임계치 설정
- SLO / 에러 예산 관리
- **런타임 보안 경보** — Sentry 알림, 이상 트래픽 감지

## Non-Scope (owned by)

| 항목 | 실제 Owner |
|------|-----------|
| 코드 수정 | CTO |
| Schema 변경 | CDO |
| 법률 이벤트 (PIPA 고지) | CPO |

## Inputs

- Vercel 배포 로그
- Supabase 로그
- Upstash 로그
- Sentry 에러 리포트
- SLO 타겟 정의

## Outputs

| 산출물 | 경로 | 주기 |
|--------|------|------|
| 운영 Runbook | `docs/ops/runbooks/**` | 인시던트 발생 시 |
| SLO 정의 | `docs/ops/SLO.md` | 분기/정책 변경 시 |
| 배포 체크리스트 | `docs/ops/DEPLOY-CHECKLIST.md` | 배포 전 |
| GitHub Actions 워크플로우 | `.github/workflows/*.yml` | 파이프라인 변경 시 |
| 운영 스크립트 | `scripts/ops/*.sh` | 필요 시 |

## Harness

- **OMC agent:**
  - `executor` — 운영 스크립트 실행, 배포 자동화
  - `verifier` — 배포 후 smoke test, SLO 검증
- **Tool:**
  - Vercel CLI — 배포 관리
  - Supabase CLI — DB 운영
  - `mcp__sentry__*` — Sentry 이슈 조회 및 알림 관리
- **파일 루트:** `docs/ops/`, `scripts/ops/`, `.github/workflows/`

## Verification

- 배포 후 smoke test 통과
- SLO daily 리뷰
- Sentry 임계치 alert 동작 확인

## Quality Gates

- Production 배포 = main 브랜치만
- Preview smoke test pass 후 merge
- Rollback plan 있는 migration만 merge
- `docs/ops/DEPLOY-CHECKLIST.md` 전체 체크 완료 후 production 배포

## Current State

| 자산 | 상태 | 인용 |
|------|------|------|
| Ops Runbook 디렉토리 (3개 runbook) | ✅ 존재 | `docs/ops/runbooks/` |
| Sentry 계측 (클라이언트) | ✅ 존재 | `instrumentation-client.ts:1` |
| Sentry 계측 (서버) | ✅ 존재 | `src/instrumentation.ts:1` |
| `docs/ops/SLO.md` | ❌ 결여 | Gap G12 |
| `docs/ops/DEPLOY-CHECKLIST.md` | ❌ 결여 | Gap G14 |
| `scripts/ops/` | ❌ 결여 | Gap G13 |

## Gap Actions

| Gap ID | 내용 | 우선순위 | 기한 |
|--------|------|---------|------|
| G12 | `docs/ops/SLO.md` 작성 (에러 예산 근거) | **P0** | 2026-04-26 |
| G13 | `scripts/ops/smoke-test.sh` 구현 | P1 | Sprint 2 |
| G14 | `docs/ops/DEPLOY-CHECKLIST.md` 작성 | P1 | Sprint 2 |

> See also: [HARNESS.md](./HARNESS.md), [GAP-LEDGER.md](./GAP-LEDGER.md), [PROCESS.md](../PROCESS.md) Annex A
