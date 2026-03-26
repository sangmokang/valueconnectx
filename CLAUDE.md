# ValueConnect X

검증된 핵심 인재와 기업 리더를 연결하는 초대 전용(invite-only) Private Talent Network.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript (strict)
- **UI Primitives**: `@base-ui/react`
- **Styling**: Tailwind CSS v4 + `class-variance-authority` + `tailwind-merge` + `tw-animate-css`
- **Charts**: Recharts + D3
- **DB/Auth**: Supabase (`@supabase/ssr`)
- **Testing**: Vitest + Testing Library (unit), Playwright (e2e)
- **Deploy**: Vercel
- **Icons**: lucide-react
- **Validation**: Zod v4
- **Data fetching**: SWR (client), Route Handlers (server)

## Commands

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
npm test             # Vitest 단위 테스트
npm run test:watch   # Vitest watch 모드
npm run test:e2e     # Playwright e2e
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # 로그인, 초대 수락, 비밀번호 관련
│   ├── (protected)/     # 인증 필수 페이지
│   │   ├── admin/       # 관리자 전용 (admin/super_admin 역할)
│   │   ├── directory/   # 멤버 디렉토리 + 프로필
│   │   ├── ceo-coffeechat/  # CEO 커피챗
│   │   ├── coffeechat/  # 피어 커피챗
│   │   ├── community/   # 익명 커뮤니티
│   │   └── positions/   # 포지션
│   └── api/             # Route Handlers
├── components/
│   ├── ui/              # 공통 UI (Button, Badge, SectionHeader 등)
│   ├── layout/          # GNB, ProtectedPageWrapper
│   ├── auth/            # 로그인/회원가입 폼
│   ├── admin/           # 관리자 컴포넌트
│   ├── coffeechat/      # 커피챗 관련
│   ├── community/       # 커뮤니티 관련
│   ├── directory/       # 디렉토리 관련
│   └── positions/       # 포지션 관련
├── lib/
│   ├── supabase/        # Supabase 클라이언트 (client/server/admin/middleware)
│   ├── auth/            # 라우트 분류, getVcxUser
│   ├── api/             # error helpers, validation
│   └── *.ts             # invite, rate-limit, email 등
├── types/               # TypeScript 타입 정의
├── constants/           # site, navigation 상수
└── __tests__/           # 테스트 (소스 구조 미러링)
```

## Architecture Rules

### Routing & Auth
- **Public**: `/`, `/service-overview`
- **Semi-public**: `/positions` (비인증 시 제한된 뷰)
- **Protected**: `/coffeechat`, `/ceo-coffeechat`, `/community`, `/directory` (비인증 시 리다이렉트 없이 `x-vcx-authenticated: false` 헤더 전달 — 페이지에서 처리)
- **Admin**: `/admin/*` (system_role이 admin 또는 super_admin, 비인증 시 `/login`으로 리다이렉트)
- **Auth**: `/login`, `/invite`, `/forgot-password`, `/reset-password`
- 미들웨어(`src/middleware.ts`)에서 Supabase 세션 기반 인증 처리

### Member Types
- `vcx_members` — 인재 멤버 (tier: `core` | `endorsed`)
- `vcx_corporate_users` — 기업 사용자 (CEO, Founder, C-level, HR Leader)

### Database Safety (DDL Protection)
- 애플리케이션 역할(`anon`, `authenticated`, `service_role`)은 테이블 생성/수정/삭제 **불가**
- 스키마 변경은 반드시 `supabase/migrations/` 마이그레이션 파일을 통해서만 수행
- Event Trigger(`vcx_prevent_ddl`)가 비인가 DDL을 자동 차단
- 허용된 DDL 역할: `postgres`, `supabase_admin`, `supabase_auth_admin`
- 마이그레이션 파일 네이밍: `NNN_vcx_<description>.sql` (순번 증가)
- **절대 금지**: Supabase Dashboard의 Table Editor로 직접 테이블 생성/수정/삭제

### API Conventions
- Route Handlers는 `src/app/api/` 하위
- 에러 응답은 `src/lib/api/error.ts`의 헬퍼 사용 (`badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `serverError`)
- 요청 검증은 Zod 스키마 (`src/lib/api/validation.ts`)
- 인증은 미들웨어에서 처리, API route에서 `getVcxUser` 사용

### Styling
- 모바일 퍼스트 (Galaxy 360px 기준)
- 디자인 토큰은 `src/constants/site.ts`의 `DESIGN_TOKENS` 참조
- accent gold: `#c9a84c`
- `cn()` 유틸리티 (`src/lib/utils.ts`) = `clsx` + `tailwind-merge`

### Testing
- 단위 테스트: `src/__tests__/` 하위, 소스 구조 미러링
- 테스트 환경: jsdom, setup 파일: `src/__tests__/setup.ts`
- Mock 유틸리티: `src/__tests__/utils/supabase-mock.ts`
- `@/` alias 사용 가능 (vitest.config.ts에서 설정됨)

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # admin 클라이언트용
RESEND_API_KEY=                # 이메일 발송
```

## Key Constraints

- 한국어 서비스 — UI 텍스트, 에러 메시지 모두 한국어
- 초대 전용 시스템 — 회원가입은 추천(recommendation) → 초대(invite) → 수락(accept) 흐름
- `@/*` path alias → `./src/*`
- TypeScript strict mode

## Development Workflow

### 작업 규모별 실행 모드

| 작업 규모 | 모드 | 사용 예시 |
|-----------|------|----------|
| 버그 1개, 단순 수정 | 직접 요청 | "로그인 리다이렉트 버그 수정" |
| 기능 1개 (5-15 파일) | `autopilot` | "커피챗 매칭 알고리즘 구현" |
| 독립 기능 3개+ 병렬 | `ultrapilot` | "3개 페이지 동시 구현" |
| 대규모 리팩터/완성까지 | `ralph` | "인증 시스템 전체 리팩터" |
| 다수 소규모 수정 | `ultrawork` | "lint 에러 전부 수정" |

### 계획-실행 분리 원칙

복잡한 기능(3개+ 파일, 새 데이터 모델, 외부 API 연동)은 반드시 2단계로 진행:

1. **계획**: `plan` → 인터뷰 + 설계 확정
2. **실행**: `autopilot` 또는 `ultrapilot` → 확정된 계획 기반 자동 실행

### 문서 우선 개발

SDK/라이브러리/외부 API 사용 시 **공식 문서를 먼저 조회** 후 구현:
- Context7 MCP (`resolve-library-id` → `query-docs`) 활용
- `@base-ui/react`, `@supabase/ssr`, `recharts` 등 추측 금지

### 품질 게이트

기능 완성 후 반드시 순서대로 검증:

1. `npm run build` — 빌드 에러 제로
2. `npm run lint` — 린트 에러 제로
3. `npm test` — 테스트 통과
4. `code-review` — 코드 리뷰
5. 커밋 + 푸시

### 병렬화 기준

- **병렬 실행**: 독립적 페이지/컴포넌트, 서로 다른 도메인 (예: coffeechat + positions + community)
- **순차 실행**: 의존 관계 있는 작업 (예: 타입 정의 → API → 컴포넌트 → 페이지)
