# CPO — ValueConnect X

## Mission

CEO 의도를 제품으로 구현. Scope·자원·문서·법규·결제·채용·Growth 실행의 책임자.

## Scope (owns)

- Sprint 범위 결정
- PRD 세부 조항 관리
- 랜딩페이지/부스/뉴스레터 문구 (tactical execution)
- 결제 모듈 스펙
- 법률/규제 증빙 관리 (PIPA, 전자상거래법, 통신판매업)
- 외부 채용 (JD 작성 포함)
- **AI Brief 제품 스펙** — 무엇을 보여줄지 (콘텐츠 스펙)

## Non-Scope (owned by)

| 항목 | 실제 Owner |
|------|-----------|
| 코드 구현 | CTO |
| 데이터 모델 설계 | CDO |
| 시각 디자인 | Chief Designer |
| AI Brief 런타임 (모델 선택, 프롬프트 튜닝, 비용) | CTO |
| 배포/운영 | SRE |

## Inputs

- PRD: `docs/prd6.0.md`, `docs/prd6.1.md`
- Feature Manifest: `docs/sdd/FEATURE_MANIFEST.yaml:1-200`
- 법률: PIPA, 전자상거래법, 통신판매업 규정
- PG사 계약서

## Outputs

| 산출물 | 경로 | 주기/등급 |
|--------|------|---------|
| ADR (제품 결정) | `docs/prd/ADR/ADR-NNNN-*.md` | 변경 시 (L-High) |
| Feature Manifest 업데이트 | `docs/sdd/FEATURE_MANIFEST.yaml` | 변경 시 (L-High) |
| 법률 문서 | `docs/legal/` | 필요 시 |
| 채용 문서 | `docs/hiring/ROLES-NEEDED.md` | 필요 시 |
| Sprint 계획 | `docs/plans/sprint-*.md` | Sprint 시작 시 |

## Harness

- **OMC agent:**
  - `product-manager` (`model=sonnet`) — 제품 요구사항 관리, 스펙 작성
  - `document-specialist` — 법률/규정 문서 처리
  - `writer` — 랜딩페이지·뉴스레터·부스 스크립트 문구
  - `information-architect` — 문서 구조·IA 설계
- **Skill (enforcer):** 모든 `skills/SKILL-*.md` 준수 (primary owner는 CTO/Designer/CDO, CPO는 enforcer)
- **파일 루트:** `docs/prd/`, `docs/plans/`, `docs/legal/`, `docs/hiring/`

## Verification

- `scripts/prd-freeze-check.sh` (PROCESS.md §1.3 전제) — **현 상태 부재, G05로 P0 처리**
- 법률 증빙: 외부 변호사 1회 리뷰 + ADR
- Feature Manifest 업데이트 시 ADR 쌍방향 링크 확인

## Quality Gates

- 모든 제품 결정은 ADR로 닫힘
- Feature는 Manifest 등록 시만 구현 허용
- 법률 문서는 `docs/legal/CHECKLIST.md` 전체 체크 완료 후 배포
- Sprint 계획은 Feature Manifest 기반으로만 작성

## Current State

| 자산 | 상태 | 인용 |
|------|------|------|
| PRD 문서 | ✅ 존재 | `docs/prd6.0.md:1` |
| Feature Manifest | ✅ 존재 | `docs/sdd/FEATURE_MANIFEST.yaml:1` |
| PROCESS 문서 | ✅ 존재 | `docs/PROCESS.md:38-47` |
| `docs/legal/` | ❌ 결여 | Gap G03 |
| `docs/hiring/` | ❌ 결여 | Gap G04 |
| `scripts/prd-freeze-check.sh` | ❌ 결여 | Gap G05 |

## Gap Actions

| Gap ID | 내용 | 우선순위 | 기한 |
|--------|------|---------|------|
| G03 | `docs/legal/CHECKLIST.md` + 법률 문서 템플릿 작성 | P1 | 2026-05-10 |
| G04 | `docs/hiring/ROLES-NEEDED.md` 초안 작성 | P2 | Sprint 3 |
| G05 | `scripts/prd-freeze-check.sh` 구현 (PROCESS §1.3 전제) | **P0** | 2026-04-22 |
| G06 | 결제 모듈 ADR 작성 | P1 | Sprint 2 |

> See also: [HARNESS.md](./HARNESS.md), [GAP-LEDGER.md](./GAP-LEDGER.md), [PROCESS.md](../PROCESS.md) Annex A
