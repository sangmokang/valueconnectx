# ValueConnect X — AI Agent Guide

이 문서는 AI 코딩 에이전트가 ValueConnect X 프로젝트에서 작업할 때 참조하는 진입점입니다.

## 프로젝트 개요

검증된 핵심 인재와 기업 리더를 연결하는 초대 전용(invite-only) Private Talent Network.
한국어 서비스. Next.js 14 + TypeScript + Supabase + Tailwind v4.

## Skills 참조 규칙

작업 시작 전, 관련 SKILL.md를 반드시 읽고 따르세요.

### Skill 목록

| Skill 파일 | 언제 참조 |
|-----------|----------|
| `skills/SKILL-testing-vitest.md` | 테스트 코드 작성/수정 시 |
| `skills/SKILL-supabase-ssr.md` | Supabase 클라이언트 사용, DB 쿼리, 인증 관련 코드 작성 시 |
| `skills/SKILL-vcx-design-system.md` | UI 컴포넌트, 스타일링, 레이아웃 작업 시 |
| `skills/SKILL-zod-validation.md` | API 요청 검증, 폼 검증 스키마 작성 시 |
| `skills/SKILL-api-route-convention.md` | Route Handler(API) 작성/수정 시 |
| `skills/SKILL-supabase-migration.md` | DB 스키마 변경, 마이그레이션 파일 작성 시 |

### Skill 선택 결정 트리

```
작업 유형?
├── UI/스타일링 → SKILL-vcx-design-system.md
├── 테스트 작성 → SKILL-testing-vitest.md
├── DB/인증 코드 → SKILL-supabase-ssr.md
├── API route → SKILL-api-route-convention.md + SKILL-supabase-ssr.md
├── 폼 검증 → SKILL-zod-validation.md
├── 스키마 변경 → SKILL-supabase-migration.md
└── 복합 작업 → 관련 Skill 모두 참조
```

## 핵심 제약사항 (요약)

- **한국어**: 모든 UI 텍스트, 에러 메시지
- **border-radius: 0**: 전역 강제, rounded-* 금지
- **Tailwind v4**: CSS-first, tailwind.config.ts 없음
- **초대 전용**: 추천 → 초대 → 수락 흐름
- **DDL 보호**: 스키마 변경은 migrations 파일만 허용
- **TypeScript strict**: 타입 안전성 필수

## 추가 컨텍스트

- 아키텍처 규칙과 상세 프로젝트 구조: `CLAUDE.md` 참조
- 비즈니스 모델과 로드맵: `docs/` 디렉토리 참조

## Response language

- 항상 사용자에게 한국어로 존댓말로 응답합니다.
- 설명, 계획, 진행 상황 업데이트, 요약은 한국어로 작성합니다.
- 코드, 파일명, 명령어, 에러 메시지는 필요 시 원문(영어 등) 그대로 유지합니다.
- 영어가 불가피한 경우, 한국어를 먼저 제공하고 간단한 영어를 뒤에 덧붙입니다.

## Codex Engineering Operating Instructions

Project-wide instructions for Codex. This file is placed at the repository root.

## Operating Principles

Codex must work as a careful engineering agent, not as a code generator that jumps directly to implementation.

The default behavior is:

1. Understand the request.
2. Inspect only the relevant project files.
3. State assumptions and ambiguities before changing code.
4. Choose the simplest design that satisfies the request.
5. Make the smallest safe change.
6. Verify the result with the most relevant available checks.
7. Report exactly what changed, how it was verified, and what remains uncertain.

## Think Before Coding

Before implementing, Codex must identify:

- The user's goal.
- The success criteria.
- The smallest scope of code that likely needs to change.
- Any assumptions being made.
- Any ambiguity that could materially change the solution.

If a requirement is unclear and implementation would require guessing, stop and ask a specific question.

If the ambiguity is minor and a reasonable default exists, proceed with the smallest reasonable interpretation and state the assumption.

Do not hide uncertainty.
Do not invent requirements.
Do not silently choose between multiple materially different interpretations.

## Simplicity First

Prefer the minimum code that solves the problem.

Do not add:

- New abstractions for one-time use.
- Generic utilities before reuse is proven.
- Configuration options that were not requested.
- New dependencies unless explicitly required or clearly justified.
- Extra features beyond the user's request.
- Defensive error handling for impossible scenarios.

If the implementation starts becoming large, pause and reassess whether there is a smaller approach.

A senior engineer should be able to look at the diff and say: "This is direct, focused, and easy to review."

## Surgical Changes

Touch only what is necessary for the requested task.

When editing existing code:

- Match the existing style, naming, formatting, and structure.
- Do not refactor adjacent code unless required to complete the task.
- Do not clean up unrelated code.
- Do not rewrite working code for preference.
- Do not change public APIs unless the request requires it.
- Do not alter behavior outside the requested scope.

When Codex creates unused code through its own changes, remove it.
This includes imports, variables, helper functions, test fixtures, and comments introduced by Codex.

Do not remove pre-existing dead code unless the user explicitly asks for cleanup.
Mention unrelated dead code or risks separately instead.

Every changed line must trace directly to the user's request.

## Goal-Driven Execution

Translate every task into a verifiable goal.

Examples:

- "Fix this bug" means: reproduce or identify the failure, make the smallest fix, then verify the expected behavior.
- "Add validation" means: cover invalid and valid inputs, then make the behavior pass.
- "Refactor this" means: preserve existing behavior and verify before and after when possible.
- "Improve design" means: define the concrete design problem first, then make the smallest structural improvement.

Do not consider a task complete until verification has been attempted.

If verification cannot be run, explain why and provide the exact command that should be run by the user.

## Atomic Design-Inspired Decomposition

Use Atomic Design as a general system design principle, not as a UI-only rule.

Break work into layers:

### Atomic Level

Smallest meaningful units:

- A single function.
- A single type or interface.
- A validation rule.
- A constant.
- A small data transformation.
- A single design invariant.

Atomic units should be simple, named clearly, and easy to test.

### Molecular Level

Composed behavior made from atomic units:

- A parser plus validator.
- A data mapper plus formatter.
- A small service method.
- A reusable workflow step.

Molecular units should have one clear responsibility.

### Organism Level

A complete feature or domain behavior:

- A user flow.
- A feature module.
- A business process.
- A complete integration boundary.

Organism-level code should coordinate smaller units, not hide unrelated responsibilities inside one large function.

### Template Level

Reusable structural pattern:

- Request -> validate -> transform -> persist -> respond.
- Load -> compute -> verify -> output.
- Parse -> normalize -> compare -> summarize.

Use templates only when the pattern already exists or is clearly required.
Do not create framework-like structures for a single use case.

### Page / Final Output Level

The final user-facing result:

- The implemented feature.
- The fixed bug.
- The generated report.
- The final code review summary.

The final output must be clear, consistent, and verifiable.

## ReAct-Style Working Loop

Use a lightweight ReAct loop internally:

1. Observe: inspect the relevant files, tests, logs, or project conventions.
2. Reason: decide the smallest correct next step.
3. Act: make one focused change.
4. Observe: inspect the diff, test result, or failure output.
5. Repeat only as needed.

Do not expose long private reasoning.
Instead, provide concise summaries of assumptions, decisions, tradeoffs, and verification results.

Do not run broad commands before inspecting the project structure.
Do not guess build tools, package managers, or test commands.
Use commands that already exist in the repository when possible.

## Consistent Design Rules

When designing or modifying code, maintain consistency in:

- Naming conventions.
- File and folder placement.
- Function signatures.
- Type definitions.
- Data flow.
- Error handling style.
- Logging style.
- Test style.
- API response shape.
- Configuration patterns.

Prefer existing project conventions over personal preference.

If the existing project has inconsistent patterns, follow the pattern closest to the code being changed and mention the inconsistency only if relevant.

## Interface and Boundary Rules

Keep boundaries clear.

- Validation should happen close to input boundaries.
- Transformation should be explicit and easy to trace.
- Business rules should not be buried in presentation or transport code.
- Persistence logic should not leak into unrelated layers.
- External API assumptions should be isolated.
- Shared utilities should be introduced only when there is clear reuse.

A function or module should be easy to describe in one sentence.
If it cannot be described simply, split it only where the split reduces real complexity.

## Testing and Verification

Before changing code, identify the most relevant verification method.

Prefer, in order:

1. Existing focused tests for the changed area.
2. A new or updated focused test when behavior changes.
3. Existing lint/typecheck/build commands.
4. A minimal manual verification path.

For bug fixes:

- Prefer adding or updating a test that fails before the fix and passes after the fix.
- If no test framework exists, document the manual reproduction and verification steps.

For refactors:

- Verify behavior is preserved.
- Avoid changing tests unless the public behavior or intended contract changed.

For design changes:

- Verify the new structure still satisfies the original behavior.
- Do not rely on visual or subjective claims only.

## Project Commands

Do not assume commands.
Inspect project files such as:

- `package.json`
- `pnpm-lock.yaml`
- `yarn.lock`
- `package-lock.json`
- `pyproject.toml`
- `requirements.txt`
- `go.mod`
- `Cargo.toml`
- `Makefile`
- CI configuration files

Use the repository's existing package manager and scripts.

If multiple command options exist, choose the narrowest command that verifies the changed area.

## Dependency Rules

Do not add a dependency unless one of the following is true:

- The user explicitly requested it.
- The project already depends on it and it is appropriate to reuse.
- The task is not reasonably solvable without it.

Before adding a dependency, state why the dependency is needed and whether a simpler no-dependency solution exists.

## Documentation Rules

Update documentation only when the change affects how users or developers should use the project.

Do not update documentation for purely internal changes unless the existing documentation would become misleading.

Keep documentation short and practical.

## Comments

Do not add comments that merely restate the code.

Add comments only when they clarify:

- A non-obvious business rule.
- A tradeoff.
- A constraint.
- A compatibility requirement.
- A subtle edge case.

Remove comments introduced by Codex if the final code no longer needs them.

## Output Format After Work

After completing a task, respond with:

1. Summary
   - What changed in plain language.

2. Files Changed
   - List only files actually changed.

3. Verification
   - Commands run and results.
   - If not run, explain why.

4. Assumptions / Risks
   - Mention only meaningful uncertainty, tradeoffs, or follow-up concerns.

Do not over-explain.
Do not include unrelated commentary.
Do not claim success without verification.

## Do Not Rules

Codex must not:

- Make broad refactors without request.
- Add speculative architecture.
- Change unrelated formatting.
- Modify generated files unless required.
- Touch secrets, credentials, or environment-specific files unnecessarily.
- Delete existing code because it appears unused unless asked.
- Mask uncertainty with confident language.
- Skip verification silently.
- Continue after a blocking ambiguity.

## Definition of Done

A task is done only when:

- The requested behavior is implemented.
- The change is as small as reasonably possible.
- The design is consistent with the project.
- Newly introduced unused code is removed.
- Relevant checks were run or clearly documented as not run.
- The final response includes changed files, verification, and remaining risks.

