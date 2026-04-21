# VCX Stack Reference

> CLAUDE.md §12 의 상세 확장. 본 문서가 기술 스택·구조·규칙의 SoT.
> 변경은 L-Std (신규 파일·기술 규칙 보완). PROCESS §4.1 참조.

---

## 1. Tech Stack

| 영역 | 도구 / 버전 |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript strict |
| UI Primitives | `@base-ui/react` (반드시 서브패스 import — 예: `@base-ui/react/button`) |
| Styling | Tailwind CSS v4 (CSS-first — `tailwind.config.ts` 금지) + `class-variance-authority` + `tailwind-merge` + `tw-animate-css` |
| Charts | Recharts + D3 |
| DB / Auth | Supabase (`@supabase/ssr` — `{getAll, setAll}` 쿠키 모델) |
| Testing (unit) | Vitest + Testing Library (jsdom) |
| Testing (e2e) | Playwright |
| Deploy | Vercel (Production = main, Preview = PR 자동) |
| Icons | lucide-react (테스트에서 `vi.importActual` 금지 — 무한 hang) |
| Validation | Zod v4 (`ZodType`, `ZodSchema` 삭제됨) |
| Data Fetching | SWR (client) + Route Handlers (server) |
| AI | Anthropic (F-PEER-COFFEECHAT AI Brief 전용) |
| Email | Resend |

---

## 2. Commands

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
npm test             # Vitest 단위 테스트
npm run test:watch   # Vitest watch 모드
npm run test:e2e     # Playwright e2e
```

---

## 3. Project Structure

```
src/
├── app/
│   ├── (auth)/          # login, invite accept, forgot/reset password
│   ├── (protected)/     # 인증 필수
│   │   ├── admin/       # admin / super_admin 전용
│   │   ├── directory/   # 멤버 디렉토리 + 프로필
│   │   ├── ceo-coffeechat/  # CEO 커피챗 (컬쳐핏 — ADR-0002)
│   │   ├── coffeechat/  # Peer 커피챗 (AI Brief — ADR-0003)
│   │   ├── community/   # 익명 커뮤니티
│   │   ├── positions/   # 포지션
│   │   └── feed/        # 큐레이션 피드 (F-FEED, Sprint 2)
│   └── api/             # Route Handlers
├── components/
│   ├── ui/              # Button, Badge, SectionHeader 등 공통
│   ├── layout/          # GNB, ProtectedPageWrapper, GnbVisibility
│   ├── auth/            # 로그인·가입 폼
│   ├── admin/           # 어드민
│   ├── coffeechat/      # 커피챗 + PreBriefCard
│   ├── community/
│   ├── directory/
│   └── positions/
├── lib/
│   ├── supabase/        # client / server / admin / middleware
│   ├── auth/            # route 분류, getVcxUser
│   ├── api/             # error helpers, validation
│   └── *.ts             # invite, rate-limit, email 등
├── types/
├── constants/           # site, navigation
└── __tests__/           # 소스 구조 미러링

supabase/migrations/     # NNN_vcx_<description>.sql 순번 증가
```

Import alias: `@/*` → `./src/*` (barrel export 미사용).

---

## 4. Routing & Auth

| 분류 | 경로 | 비인증 동작 |
|---|---|---|
| Public | `/`, `/service-overview` | 접근 가능 |
| Semi-public | `/positions` | 제한된 뷰 |
| Protected | `/coffeechat`, `/ceo-coffeechat`, `/community`, `/directory`, `/feed` | 리다이렉트 없이 `x-vcx-authenticated: false` 헤더 전달 — 페이지에서 처리 |
| Admin | `/admin/*` | `/login` 리다이렉트 (system_role = admin or super_admin) |
| Auth | `/login`, `/invite/accept`, `/forgot-password`, `/reset-password` | 접근 가능 |

미들웨어 (`src/middleware.ts`) 에서 Supabase 세션 기반 인증.

---

## 5. Member Types

| 테이블 | 대상 | 구분 |
|---|---|---|
| `vcx_members` | 인재 멤버 | tier: `core` / `endorsed` |
| `vcx_corporate_users` | 기업 사용자 | CEO / Founder / C-level / HR Leader |

---

## 6. Database Safety (DDL Protection)

- 애플리케이션 역할 (`anon`, `authenticated`, `service_role`) 은 **테이블 생성 / 수정 / 삭제 불가**
- 스키마 변경은 `supabase/migrations/` 마이그레이션 파일로만
- Event Trigger `vcx_prevent_ddl` 가 비인가 DDL 자동 차단
- 허용 역할: `postgres`, `supabase_admin`, `supabase_auth_admin`
- 파일명: `NNN_vcx_<description>.sql` (순번 증가 — 중복 금지)
- **절대 금지**: Supabase Dashboard Table Editor 로 직접 테이블 수정
- 현재 중복 잔존: `013_vcx_head_hunting_agreement` / `013_vcx_notifications_insert_policy`, `014_vcx_community_reactions` / `014_vcx_profile_visibility` — D-0001 (Sprint 1 정리)

---

## 7. API Conventions

- Route Handlers = `src/app/api/` 하위
- 에러 응답: `src/lib/api/error.ts` 헬퍼 (`badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `serverError`)
- 요청 검증: Zod 스키마 (`src/lib/api/validation.ts`)
- 인증: 미들웨어에서 처리, API route 에서 `getVcxUser` 사용
- Response: JSON, 한국어 에러 메시지

---

## 8. Styling

- 모바일 퍼스트 (Galaxy 360px 기준)
- 디자인 토큰 = `src/constants/site.ts` 의 `DESIGN_TOKENS`
- Accent gold: `#c9a84c`
- `cn()` 유틸 (`src/lib/utils.ts`) = `clsx` + `tailwind-merge`
- 전역 `border-radius: 0` — `rounded-*` Tailwind 클래스 금지 (2026-04-20 `!important` 제거로 원형 아바타/배지 복구)

---

## 9. Testing

- 단위 테스트: `src/__tests__/` (소스 구조 미러링)
- 테스트 환경: jsdom, setup = `src/__tests__/setup.ts`
- Mock 유틸: `src/__tests__/utils/supabase-mock.ts`
- `@/` alias 사용 가능 (vitest.config.ts 설정 완료)
- E2E: `tests/e2e/slice/s{1..5}-*.spec.ts` — Phase 1 DoD 지표 M1 의 원천

---

## 10. State Management

- **서버 상태**: SWR (`useSWR`) — 캐시 키 규칙 `'/api/' + resource`
  - `mutate()` 후 revalidate 로 서버 동기화
  - 에러 처리: `onError` 콜백
  - 조건부 fetch: `useSWR(condition ? key : null, fetcher)`
- **클라이언트 상태**: React `useState` / `useReducer` — 전역 상태 라이브러리 없음
- **폼 상태**: React `useState` + Zod 검증

---

## 11. Component Patterns

- `(protected)/` 하위 = Server Component 기본, 인터랙션 필요 부분만 별도 Client Component 분리
- 공통 UI = `src/components/ui/`
- 레이아웃 = `src/components/layout/` (GNB, ProtectedPageWrapper, GnbVisibility)
- 도메인별 = `src/components/{coffeechat,community,directory,positions}/`
- Import 규칙: `@/components/ui/button` 형태 (barrel 미사용)

---

## 12. Deployment

- Platform: Vercel
- 환경: Production = main branch, Preview = PR 별 자동 배포
- 빌드 명령: `npm run build`
- 환경변수: Vercel Dashboard 관리 — 코드 하드코딩 절대 금지
- 도메인: Vercel DNS (커스텀)

---

## 13. Constraints (Project Level)

- 한국어 서비스 — UI 텍스트·에러 메시지 전부 한국어
- 초대 전용 시스템 — 추천 → 초대 → 수락
- TypeScript strict mode
- 한 번 merge 된 마이그레이션 번호 재사용 금지

---

## Changelog

| 일자 | 변경 | 사유 |
|---|---|---|
| 2026-04-21 | v1 생성 | CLAUDE.md §12 lean 압축을 위해 상세 외부화 (plan `.omc/plans/vcx-claude-md-refactor.md`) |
