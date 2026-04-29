# DESIGNER — ValueConnect X

## Mission

시장에서 통용되는 균형 잡힌 디자인. 모든 페이지 통일된 디자인 체계 준수.

## Scope (owns)

- 디자인 토큰 정의 및 변경
- 컴포넌트 라이브러리 (`src/components/ui/`)
- 브랜드 가이드
- 모바일 퍼스트 규율 (Galaxy 360px 기준)
- **스크린샷 매트릭스 관리** — `qa/screenshots/YYYYMMDD/`

## Non-Scope (owned by)

| 항목 | 실제 Owner |
|------|-----------|
| 컴포넌트 구현 (코드 작성) | CTO |
| 디자인 린트 자동화 런타임 | SRE (CI 통합) |
| 브랜드 톤 거시결정 | CEO |

## Inputs

- 디자인 토큰: `src/constants/site.ts` (DESIGN_TOKENS)
- 브랜드 문서: `docs/Branding.md`
- 디자인 리뷰: `docs/vcx-design-review.md`
- Figma 프롬프트: `docs/figma-design-prompt.md`
- 모바일 기준: 360px (Galaxy)

## Outputs

| 산출물 | 경로 | 주기 |
|--------|------|------|
| UI 컴포넌트 | `src/components/ui/**` | 기능 구현 시 |
| 디자인 시스템 문서 (단일 진실) | `docs/design/DESIGN-SYSTEM.md` | 변경 시 |
| 컴포넌트 인벤토리 | `docs/design/COMPONENT-INVENTORY.md` | Sprint별 |
| Figma 업데이트 기록 | `docs/design/figma-changelog.md` | 변경 시 |

## Harness

- **OMC agent:**
  - `designer` — UI 컴포넌트 설계, 디자인 시스템 정의
  - `style-reviewer` — 디자인 토큰 준수 여부 리뷰
  - `ux-researcher` — 사용자 경험 분석, 모바일 UX 검증
  - `vision` — 스크린샷 리뷰, 시각적 회귀 탐지
- **Skill (primary owner):**
  - `skills/SKILL-vcx-design-system.md` (**Designer = primary owner**)
- **Tool:**
  - `mcp__playwright__browser_take_screenshot` — 스크린샷 캡처
  - `mcp__magic__21st_magic_component_builder` — 컴포넌트 빌드
- **파일 루트:** `src/components/ui/`, `src/constants/`, `docs/design/`

## Verification

- 스크린샷 매트릭스: `qa/screenshots/YYYYMMDD/` 캡처 및 비교
- Design token grep: `rg "DESIGN_TOKENS" src/` — 직접 색상값 사용 없음 확인
- Galaxy 360px viewport 렌더링 확인

## Quality Gates

- `rg "rounded-[a-z]" src/ | grep -v rounded-none` 결과 0
- 하드코딩 색상 금지 — `DESIGN_TOKENS` 참조만 허용
- 영어 UI 텍스트 금지 (한국어 필수)
- 모바일 360px overflow 없음
- accent gold `#c9a84c` 는 DESIGN_TOKENS 통해서만 참조

## Current State

| 자산 | 상태 | 인용 |
|------|------|------|
| UI 컴포넌트 디렉토리 | ✅ 존재 | `src/components/ui/` |
| 디자인 토큰 | ✅ 존재 | `src/constants/site.ts:1` |
| 브랜드 문서 | ✅ 존재 | `docs/Branding.md:1` |
| 디자인 리뷰 문서 | ✅ 존재 | `docs/vcx-design-review.md:1` |
| Figma 프롬프트 | ✅ 존재 | `docs/figma-design-prompt.md:1` |
| `docs/design/DESIGN-SYSTEM.md` | ❌ 결여 | Gap G15 |
| `docs/design/COMPONENT-INVENTORY.md` | ❌ 결여 | Gap G16 |
| `scripts/design-lint.sh` | ❌ 결여 | Gap G17 |

## Gap Actions

| Gap ID | 내용 | 우선순위 | 기한 |
|--------|------|---------|------|
| G15 | `docs/design/DESIGN-SYSTEM.md` 통합 문서 작성 (Feed UI 작업 전 완료 필수) | **P0** | 2026-04-26 |
| G16 | `docs/design/COMPONENT-INVENTORY.md` + 자동 추출 script | P1 | Sprint 2 |
| G17 | `scripts/design-lint.sh` — `rg "rounded-[a-z]" src/ \| grep -v rounded-none` | P1 | Sprint 2 |

> See also: [HARNESS.md](./HARNESS.md), [GAP-LEDGER.md](./GAP-LEDGER.md), [PROCESS.md](../PROCESS.md) Annex A
