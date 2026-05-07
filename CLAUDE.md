# ValueConnect X — CLAUDE.md

AI 코딩 에이전트가 ValueConnect X 프로젝트에서 작업을 시작할 때 가장 먼저 따르는 원칙 문서입니다.

이 문서는 세부 계획서가 아닙니다. 제품 범위, 프로세스, 스택, ADR, 부채 장부의 내용을 재선언하지 않고 시작 원칙과 프로젝트 하드 룰만 유지합니다.

권위 순서: `docs/plans/VERTICAL_SLICE_PHASE1.md` > `docs/prd-6.0.md` > `docs/PROCESS.md` > `docs/sdd/FEATURE_MANIFEST.yaml` > `docs/prd/ADR/` > `docs/roles/HARNESS.md` > 본 문서 > `docs/sdd/DEBT_LEDGER.md`.

---

## 1. Product North Star

ValueConnect X는 검증된 핵심 인재와 기업 리더를 연결하는 **초대 전용 Private Talent Network**입니다.

- 서비스 언어: 한국어
- 핵심 흐름: 추천 -> 초대 -> 수락 -> 온보딩 -> 디렉토리/커피챗
- 수익 모델: 성사 수수료 연봉 25%. 단, 멤버 UI에는 수수료/25%/fee 관련 문구를 노출하지 않습니다.
- 신규 기능은 Phase 1 slice 또는 사용자가 명시한 범위에 직접 연결되어야 합니다.

---

## 2. First Principles

### 2.1 Think Before Coding

추측하지 말고, 혼란을 숨기지 말고, 트레이드오프를 드러냅니다.

구현 전에 반드시 확인합니다:

- 목표가 무엇인지.
- 성공 기준이 무엇인지.
- 가장 작게 바꿔도 되는 범위가 어디인지.
- 어떤 가정을 하고 있는지.
- 어떤 모호함이 결과를 바꿀 수 있는지.

운영 규칙:

- 불확실하면 명시하고 질문합니다.
- 해석이 여러 개면 조용히 하나를 고르지 말고 후보를 제시합니다.
- 더 단순한 접근이 있으면 말합니다.
- 요청이 불명확하면 멈추고, 무엇이 혼란스러운지 말한 뒤 질문합니다.
- 타당하지 않거나 위험한 방향이면 근거를 들어 제동을 겁니다.

### 2.2 Simplicity First

요청을 해결하는 최소 코드만 작성합니다. 추측성 구조를 만들지 않습니다.

금지:

- 요청하지 않은 기능 추가.
- 1회성 코드를 위한 추상화.
- 요구되지 않은 유연성, 설정 가능성, 확장성.
- 실제로 발생할 수 없는 시나리오를 위한 방어 코드.
- 새 의존성 추가. 단, 사용자가 명시했거나 기존 의존성 재사용으로 충분히 정당한 경우는 예외입니다.

200줄로 쓴 코드가 50줄로 가능하면 다시 줄입니다. 시니어 엔지니어가 "과하다"고 볼 만한 구현이면 단순화합니다.

### 2.3 Surgical Changes

반드시 필요한 줄만 수정합니다. 정리는 내가 만든 어질러짐에 한정합니다.

기존 코드를 수정할 때:

- 인접 코드, 주석, 포맷을 덤으로 개선하지 않습니다.
- 고장 나지 않은 코드를 리팩터링하지 않습니다.
- 기존 스타일을 따릅니다.
- 공개 API나 외부 동작은 요청이 없으면 바꾸지 않습니다.
- 무관한 죽은 코드는 삭제하지 말고 언급만 합니다.

내 변경 때문에 생긴 unused import, 변수, 함수, 테스트 fixture, 주석은 제거합니다. 변경된 모든 줄은 사용자 요청과 직접 연결되어야 합니다.

### 2.4 Goal-Driven Execution

작업을 검증 가능한 목표로 바꾸고, 검증할 때까지 완료로 보지 않습니다.

- "검증 추가" -> 유효/무효 입력을 확인하고 통과시킵니다.
- "버그 수정" -> 실패를 재현하거나 원인을 특정하고, 가장 작은 수정 뒤 검증합니다.
- "리팩터링" -> 동작 보존을 검증합니다.
- "디자인 개선" -> 구체적인 디자인 문제를 먼저 정의하고 가장 작은 구조 개선만 합니다.

여러 단계 작업은 짧은 계획을 먼저 세웁니다. 완료, 테스트 통과, 빌드 성공을 말할 때는 같은 세션의 최신 실행 증거를 기준으로 합니다.

---

## 3. Project Hard Rules

### 3.0 사용자 승인 카피 불가침 원칙 (최우선)

**사용자가 직접 작성하거나 QA·프롬프팅을 통해 명시적으로 승인한 UI 카피(헤드카피, 버튼 텍스트, 섹션 레이블, 문구, 스타일링 포함)는 절대 임의로 변경하지 않습니다.**

- 승인된 카피란: 사용자가 직접 작성했거나, "이렇게 바꿔주세요"로 요청해서 반영된 텍스트 전부.
- 대상 파일 예시: `src/app/page.tsx`, `src/components/service-pillars.tsx`, 랜딩·온보딩·인증 페이지의 모든 사용자 노출 텍스트.
- 리팩터링, TDD, 버그 수정, 스타일 정리 작업 중에도 카피에 손대지 않습니다.
- 카피 변경이 불가피하다고 판단될 경우: 변경 전에 사용자에게 반드시 명시하고 승인을 받습니다.
- 위반 시 즉시 `git checkout <last-approved-commit> -- <파일>` 로 원복합니다.

- 모든 UI 텍스트와 사용자 노출 에러 메시지는 한국어로 작성합니다.
- `rounded-*` Tailwind 클래스 사용 금지. 전역 `border-radius: 0` 정책을 유지합니다.
- Tailwind v4 CSS-first 구조를 유지하며 `tailwind.config.ts`를 만들지 않습니다.
- TypeScript strict 기준을 지킵니다.
- DB 스키마 변경은 `supabase/migrations/NNN_vcx_*.sql` 파일로만 수행합니다.
- Supabase Dashboard Table Editor로 직접 스키마를 바꾸지 않습니다.
- secret/API key는 코드에 하드코딩하지 않고 배포 환경에서 관리합니다.
- Base UI는 서브패스 import를 사용합니다. 예: `@base-ui/react/button`
- Supabase SSR은 `@supabase/ssr`와 `{ getAll, setAll }` 쿠키 핸들러를 사용합니다.
- Next.js App Router에서 `cookies()`는 async API로 다룹니다.
- Zod v4에서는 `ZodSchema` 대신 `ZodType`을 사용합니다.
- `lucide-react` 테스트 mock에서 `vi.importActual('lucide-react')`를 사용하지 않습니다.

---

## 4. Start-Work Checklist

작업 전에 필요한 만큼만 확인합니다. 넓게 뒤지기보다 변경 지점과 검증 방법을 먼저 좁힙니다.

1. `git status -sb`로 현재 작업 중인 변경을 확인합니다.
2. 작업 유형에 맞는 skill 문서를 읽습니다.
3. 관련 파일, 테스트, 문서만 inspect합니다.
4. 성공 기준과 가장 작은 변경 범위를 정합니다.
5. 필요한 경우에만 중복 작업이나 이전 시도를 확인합니다.

작업 유형별 skill:

| 작업 유형 | 참조 문서 |
|---|---|
| UI/스타일링 | `skills/SKILL-vcx-design-system.md` |
| 테스트 작성/수정 | `skills/SKILL-testing-vitest.md` |
| Supabase 클라이언트, DB 쿼리, 인증 | `skills/SKILL-supabase-ssr.md` |
| API route | `skills/SKILL-api-route-convention.md`, `skills/SKILL-supabase-ssr.md` |
| Zod/API/폼 검증 | `skills/SKILL-zod-validation.md` |
| DB schema/migration | `skills/SKILL-supabase-migration.md` |

중복 작업 확인이 필요할 때:

```bash
git log --all --oneline --grep="<topic>"
gh pr list --state all --search "<topic>"
gh issue list --state all --search "<topic>"
```

`gh`가 없거나 결과가 없으면 그 한계를 명시하고 로컬 문서와 git 기록 기준으로 판단합니다.

---

## 5. Verification

변경 전에 가장 관련 있는 검증 방법을 정합니다.

우선순위:

1. 변경 영역의 기존 focused test.
2. 동작 변경이 있으면 새 focused test 또는 기존 테스트 보강.
3. 관련 lint/typecheck/build.
4. 최소 수동 검증 경로.

변경 유형별 기본 검증:

| 변경 유형 | 권장 검증 |
|---|---|
| 문서만 변경 | 문맥, 링크, 중복 원천 확인 |
| 단일 유틸/검증 로직 | 관련 Vitest |
| API route | route 테스트 또는 호출 테스트, 관련 Vitest |
| UI 변경 | lint/build, 필요한 경우 Playwright 또는 수동 스크린샷 |
| Supabase/migration | migration 순번, SQL 정합성, RLS 영향 확인 |

검증을 실행하지 못하면 이유와 사용자가 실행할 정확한 명령을 남깁니다.

---

## 6. Final Report Format

작업 후 응답은 짧고 증거 중심으로 작성합니다.

1. Summary
   - 무엇이 바뀌었는지.
2. Files Changed
   - 실제 변경된 파일만.
3. Verification
   - 실행한 명령과 결과. 실행하지 못했다면 이유.
4. Assumptions / Risks
   - 의미 있는 불확실성, 트레이드오프, 후속 우려만.

성공을 검증 없이 주장하지 않습니다.

---

## 7. Reference Documents

- 제품/스코프: `docs/prd-6.0.md`, `docs/sdd/FEATURE_MANIFEST.yaml`
- Phase 1 계획: `docs/plans/VERTICAL_SLICE_PHASE1.md`
- 운영 프로세스: `docs/PROCESS.md`
- 기술 스택 상세: `docs/engineering/VCX_STACK.md`
- 결정 기록: `docs/prd/ADR/`
- 역할/하네스: `docs/roles/HARNESS.md`
- 부채 장부: `docs/sdd/DEBT_LEDGER.md`
