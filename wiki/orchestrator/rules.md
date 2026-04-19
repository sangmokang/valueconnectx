# 코드 구조 규칙

## 디렉토리 규칙

### R-001: 페이지 컴포넌트는 도메인 폴더에
- **규칙**: `src/app/(protected)/[domain]/` 하위에만 페이지 생성
- **검증**: `find src/app -name "page.tsx" | grep -v "(protected)\|(__tests__)\|(auth)"`
- **위반 시**: 해당 도메인 폴더로 이동

### R-002: 컴포넌트는 도메인별 분리
- **규칙**: `src/components/[domain]/` 구조 유지
- **허용 도메인**: ui, layout, auth, admin, coffeechat, community, directory, positions, feed, onboarding
- **위반 시**: 적절한 도메인 폴더로 이동 또는 새 도메인 생성

### R-003: API 라우트는 도메인별 네스팅
- **규칙**: `src/app/api/[domain]/` 구조
- **검증**: 모든 route.ts가 2단계 이상 네스팅
- **위반 시**: 도메인 폴더로 이동

### R-004: lib 모듈은 단일 책임
- **규칙**: 각 lib 파일은 하나의 도메인/역할만 담당
- **검증**: 파일당 export 수 < 10
- **위반 시**: 모듈 분리

### R-005: 타입 정의는 types/ 폴더
- **규칙**: 공유 타입은 `src/types/` 하위
- **검증**: `grep -r "export type\|export interface" src/lib/ src/components/ | wc -l`
- **위반 시**: types/ 폴더로 이동 (로컬 타입 제외)

## 네이밍 규칙

### N-001: 파일명은 kebab-case
- **규칙**: 모든 소스 파일은 kebab-case (`my-component.tsx`)
- **검증**: `find src -name "*[A-Z]*" -not -path "*/node_modules/*"`

### N-002: 컴포넌트는 PascalCase export
- **규칙**: React 컴포넌트 export는 PascalCase
- **검증**: TSC + ESLint

### N-003: API 에러 헬퍼 사용
- **규칙**: Route Handler에서 직접 `NextResponse.json` 대신 `src/lib/api/error.ts` 헬퍼 사용
- **검증**: `grep -r "NextResponse.json.*status.*[45]" src/app/api/`

## 금지 패턴

### X-001: 라운드 보더 금지
- `rounded-*` Tailwind 클래스 사용 금지 (전역 border-radius: 0)

### X-002: 영어 UI 텍스트 금지
- 모든 사용자 노출 텍스트는 한국어

### X-003: Supabase 레거시 API 금지
- `createClientComponentClient`, `createServerComponentClient` 사용 금지
- 쿠키 `{get, set, remove}` 대신 `{getAll, setAll}` 사용

### X-004: tailwind.config.ts 생성 금지
- Tailwind v4는 CSS-first 설정

### X-005: 직접 DDL 금지
- 테이블 생성/수정은 마이그레이션 파일로만
