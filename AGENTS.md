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

- 항상 사용자에게 한국어로 응답합니다.
- 설명, 계획, 진행 상황 업데이트, 요약은 한국어로 작성합니다.
- 코드, 파일명, 명령어, 에러 메시지는 필요 시 원문(영어 등) 그대로 유지합니다.
- 영어가 불가피한 경우, 한국어를 먼저 제공하고 간단한 영어를 뒤에 덧붙입니다.
