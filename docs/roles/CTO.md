# CTO — ValueConnect X

## Mission

서비스가 이상 없이 동작. TDD Input/Output 정의, 리팩터링·E2E·품질 총괄.

## Scope (owns)

- 아키텍처 변경
- 기술 스택 결정
- DDL (supabase/migrations/ 파일을 통해서만)
- 외부 API 구현
- 테스트 전략 (Vitest + Playwright)
- **AI Brief 런타임** — 모델 선택, 프롬프트 튜닝, 비용 최적화
- **코드 수준 보안** — OWASP, 인증/인가 로직

## Non-Scope (owned by)

| 항목 | 실제 Owner |
|------|-----------|
| 제품 스펙 (무엇을 만들지) | CPO |
| 데이터 정합성·ERD·RLS 정책 기획 | CDO |
| 배포 파이프라인·SLO | SRE |
| 디자인 토큰 변경 | Chief Designer (CTO는 enforce) |

## Inputs

- Feature Manifest AC: `docs/sdd/FEATURE_MANIFEST.yaml`
- API 계약: `docs/sdd/contracts/`
- 스키마: `docs/sdd/schemas/`
- 기존 코드: `src/**`

## Outputs

| 산출물 | 경로 | 주기/등급 |
|--------|------|---------|
| 아키텍처 ADR | `docs/prd/ADR/ADR-NNNN-*.md` | 변경 시 (L-High) |
| 단위 테스트 | `src/__tests__/**` | 기능 구현 시 |
| E2E 테스트 | `e2e/**` | 기능 구현 시 |
| DB 마이그레이션 | `supabase/migrations/NNN_vcx_*.sql` | 스키마 변경 시 |
| 기술 부채 기록 | `docs/sdd/DEBT_LEDGER.md` | 발견 시 |

## Harness

- **OMC agent:**
  - `architect` (`model=opus`) — 아키텍처 설계, 기술적 의사결정
  - `test-engineer` — 테스트 코드 작성 (TDD)
  - `qa-tester` — QA 시나리오 실행
  - `verifier` — 빌드·린트·테스트 검증
  - `build-fixer` — 빌드 에러 수정
  - `code-reviewer` — 코드 리뷰
  - `security-reviewer` — 보안 취약점 리뷰
- **Skill (owner):**
  - `skills/SKILL-testing-vitest.md` (owner: CTO)
  - `skills/SKILL-supabase-ssr.md` (owner: CTO)
  - `skills/SKILL-api-route-convention.md` (owner: CTO)
  - `skills/SKILL-supabase-migration.md` (CDO 설계 → CTO enforces)
  - `skills/SKILL-zod-validation.md` (owner: CTO)
  - `skills/SKILL-vcx-design-system.md` (Chief Designer owner → CTO enforces)
- **TDD Iron Law:** No production code without failing test first
- **파일 루트:** `src/`, `e2e/`, `supabase/migrations/`

## Verification

- `npm run build` — 빌드 에러 0
- `npm run lint` — 린트 에러 0
- `npm test` — 단위 테스트 전부 green
- `npm run test:e2e` — E2E 테스트 전부 green
- `code-reviewer` pass

## Quality Gates

- 4 gates (build/lint/test/e2e) green 후 merge
- DDL은 `supabase/migrations/` 파일만 허용 (CLAUDE.md 명시)
- `rg "rounded-[a-z]" src/ | grep -v rounded-none` 결과 0
- border-radius: 0 전역 적용
- Migration 번호 중복 금지

## Current State

| 자산 | 상태 | 인용 |
|------|------|------|
| npm 커맨드 (build/lint/test/e2e) | ✅ 완비 | `package.json:1` |
| Supabase migrations | ✅ 존재 (15개 파일, 중복 2쌍) | `supabase/migrations/` — `013_vcx_head_hunting_agreement.sql:1` |
| 단위 테스트 디렉토리 | ✅ 존재 | `src/__tests__/setup.ts:1` |
| E2E 테스트 디렉토리 | ✅ 존재 | `e2e/` |
| 6개 Skill 파일 | ✅ 전량 존재 | `skills/SKILL-testing-vitest.md:1` |
| `scripts/ci-local.sh` | ❌ 결여 | Gap G07 |
| `e2e/COVERAGE.md` | ❌ 결여 | Gap G08 |

## Gap Actions

| Gap ID | 내용 | 우선순위 | 기한 |
|--------|------|---------|------|
| G07 | `scripts/ci-local.sh` — 4 gate 단일 커맨드 구현 | P1 | Sprint 2 |
| G08 | `e2e/COVERAGE.md` — E2E 커버리지 문서화 | P2 | Sprint 3 |

> See also: [HARNESS.md](./HARNESS.md), [GAP-LEDGER.md](./GAP-LEDGER.md), [PROCESS.md](../PROCESS.md) Annex A
