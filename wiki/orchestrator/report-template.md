# 프로젝트 리포트

> 생성일: {{DATE}}
> 생성자: orchestrator.sh

## 프로젝트 통계

| 항목 | 수치 |
|------|------|
| 총 소스 파일 | {{TOTAL_FILES}} |
| TypeScript 파일 | {{TS_FILES}} |
| 페이지 수 | {{PAGES}} |
| API 라우트 수 | {{API_ROUTES}} |
| 컴포넌트 수 | {{COMPONENTS}} |
| lib 모듈 수 | {{LIB_MODULES}} |
| 테스트 파일 수 | {{TEST_FILES}} |
| DB 마이그레이션 수 | {{MIGRATIONS}} |

## 도메인별 현황

| 도메인 | 페이지 | API | 컴포넌트 | 테스트 |
|--------|--------|-----|----------|--------|
| auth | {{AUTH_PAGES}} | {{AUTH_API}} | {{AUTH_COMP}} | {{AUTH_TEST}} |
| coffeechat | {{CC_PAGES}} | {{CC_API}} | {{CC_COMP}} | {{CC_TEST}} |
| community | {{CMT_PAGES}} | {{CMT_API}} | {{CMT_COMP}} | {{CMT_TEST}} |
| directory | {{DIR_PAGES}} | {{DIR_API}} | {{DIR_COMP}} | {{DIR_TEST}} |
| positions | {{POS_PAGES}} | {{POS_API}} | {{POS_COMP}} | {{POS_TEST}} |
| feed | {{FEED_PAGES}} | {{FEED_API}} | {{FEED_COMP}} | {{FEED_TEST}} |
| admin | {{ADM_PAGES}} | {{ADM_API}} | {{ADM_COMP}} | {{ADM_TEST}} |

## 구조 규칙 검증

- ✅/❌ R-001: 페이지 위치 — {{R001_STATUS}}
- ✅/❌ R-002: 컴포넌트 분리 — {{R002_STATUS}}
- ✅/❌ R-003: API 네스팅 — {{R003_STATUS}}
- ✅/❌ N-001: kebab-case — {{N001_STATUS}}
- ✅/❌ N-003: 에러 헬퍼 — {{N003_STATUS}}
- ✅/❌ X-001: rounded 금지 — {{X001_STATUS}}
- ✅/❌ X-002: 영어 텍스트 — {{X002_STATUS}}

## 품질 게이트

| 항목 | 상태 | 상세 |
|------|------|------|
| Build | {{BUILD_STATUS}} | {{BUILD_DETAIL}} |
| Lint | {{LINT_STATUS}} | {{LINT_DETAIL}} |
| Test | {{TEST_STATUS}} | {{TEST_DETAIL}} |
| Type Check | {{TSC_STATUS}} | {{TSC_DETAIL}} |

## 의존성

| 패키지 | 현재 | 최신 | 상태 |
|--------|------|------|------|
| next | {{NEXT_VER}} | {{NEXT_LATEST}} | {{NEXT_STATUS}} |
| react | {{REACT_VER}} | {{REACT_LATEST}} | {{REACT_STATUS}} |
| @supabase/ssr | {{SSR_VER}} | {{SSR_LATEST}} | {{SSR_STATUS}} |
| tailwindcss | {{TW_VER}} | {{TW_LATEST}} | {{TW_STATUS}} |
