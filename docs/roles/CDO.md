# CDO — ValueConnect X

## Mission

인프라·데이터 파이프라인·정합성·최적화·설계. 데이터 품질 책임.

## Scope (owns)

- 데이터 모델 설계
- 인덱스 전략
- 파이프라인 아키텍처
- 데이터 보관 정책 (PIPA 연동)
- **RLS 정책 기획** — Row Level Security 설계 (구현은 CTO)
- PII 인벤토리 관리

## Non-Scope (owned by)

| 항목 | 실제 Owner |
|------|-----------|
| Migration 파일 실제 작성 | CTO (CDO 설계 → CTO 구현) |
| 애플리케이션 보안 (OWASP) | CTO |
| 인프라 비용·SLO | SRE |

## Inputs

- Migration 파일: `supabase/migrations/**`
- 스키마 정의: `docs/sdd/schemas/**`
- Supabase dashboard 메트릭
- 제품 analytics

## Outputs

| 산출물 | 경로 | 주기 |
|--------|------|------|
| 스키마 정의 (Zod/SQL 단일) | `docs/sdd/schemas/*.yaml` | 모델 변경 시 |
| ERD | `docs/data/ERD-YYYYMMDD.md` | 분기/변경 시 |
| PII 인벤토리 | `docs/data/PII-INVENTORY.md` | PIPA 연동, 변경 시 |
| 데이터 보관 정책 | `docs/data/RETENTION-POLICY.md` | 연간/PIPA 개정 시 |

## Harness

- **OMC agent:**
  - `scientist` (`model=opus`) — 데이터 분석, 파이프라인 설계
  - `architect` — 스키마 설계, ERD 설계
  - `executor` — migration 구현 (CDO 설계 기반)
- **Tool:**
  - `mcp__plugin_oh-my-claudecode_t__python_repl` — 데이터 분석 스크립트
  - Supabase SQL Editor — 쿼리 실행 및 EXPLAIN ANALYZE
- **Skill (primary owner):**
  - `skills/SKILL-supabase-migration.md` (**CDO = primary owner**)
  - `skills/SKILL-supabase-ssr.md`
- **파일 루트:** `supabase/migrations/`, `docs/data/`, `docs/sdd/schemas/`

## Verification

- Migration dry-run on local Supabase
- RLS 테스트: `src/__tests__/rls/**` (현재 부재 — Gap G10 연동)
- EXPLAIN ANALYZE — 신규 쿼리 성능 확인
- PII 컬럼 전량 RLS 적용 여부 확인

## Quality Gates

- Migration 번호 중복 금지 (자동 grep: `ls supabase/migrations/ | cut -d_ -f1 | sort | uniq -d`)
- 모든 PII 컬럼은 RLS + audit log 필수
- 신규 테이블은 `created_at`, `updated_at` 컬럼 필수
- `docs/data/PII-INVENTORY.md` 최신 상태 유지 (PIPA 요구)

## Current State

| 자산 | 상태 | 인용 |
|------|------|------|
| Supabase migrations 디렉토리 | ✅ 존재 | `supabase/migrations/013_vcx_head_hunting_agreement.sql:1` |
| Feature Manifest (스키마 포함) | ✅ 존재 | `docs/sdd/FEATURE_MANIFEST.yaml:1` |
| Migration 013/014 중복 4개 파일 | ❌ 충돌 | `supabase/migrations/013_vcx_notifications_insert_policy.sql:1`, `supabase/migrations/014_vcx_community_reactions.sql:1` |
| `docs/data/` 전체 | ❌ 결여 | Gap G09, G10 |
| RLS 테스트 `src/__tests__/rls/` | ❌ 결여 | Gap G10 |

## Gap Actions

| Gap ID | 내용 | 우선순위 | 기한 |
|--------|------|---------|------|
| G09 | `docs/data/ERD.md` 초안 작성 | P1 | Sprint 2 |
| G10 | `docs/data/PII-INVENTORY.md` 작성 (PIPA 컴플라이언스) | **P0** | 2026-05-01 |
| G11 | Migration 013/014 rename ADR + supabase_migrations 테이블 sync 절차 + rename script | **P0** | 2026-04-26 (하드 게이트: 다음 production deploy 전) |

> See also: [HARNESS.md](./HARNESS.md), [GAP-LEDGER.md](./GAP-LEDGER.md), [PROCESS.md](../PROCESS.md) Annex A
