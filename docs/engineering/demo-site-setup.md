# 데모 사이트/데이터 & Playwright MCP 가이드

본 문서는 실제 Supabase DB에 데모 데이터를 채워넣고, 브라우저 테스트(Playwright) 및 Playwright MCP를 연결해 시연 품질을 보장하는 방법을 정리합니다.

## 1) 전제 조건
- `.env.local`에 실제 Supabase 프로젝트 자격증명이 설정되어 있어야 합니다.
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- 로컬에서 앱을 띄워 시연합니다: `npm run dev`

## 2) 마이그레이션 적용(필수)
- 원격 Supabase 프로젝트에 스키마가 적용되어 있어야 시딩이 정상 동작합니다.

방법 A — Supabase SQL Editor:
- 대시보드 접속 → SQL Editor → `scripts/apply-migrations.sql` 파일 전체 내용을 붙여넣고 실행

방법 B — supabase CLI (원격 연결 구성된 경우):
- `supabase db push` 또는 `supabase migration up`으로 원격 프로젝트에 반영

적용 확인:
- 주요 테이블: `vcx_members`, `vcx_corporate_users`, `vcx_ceo_coffee_sessions`, `vcx_coffee_applications`, `peer_coffee_chats`, `peer_coffee_applications`, `community_posts`, `community_comments`, `vcx_community_reactions`, `positions`, `position_interests`, `vcx_notifications`

참고: `scripts/seed-dummy-data.ts`는 실행 초기에 위 테이블 존재 여부를 검사하며, 누락 시 친절한 오류 메시지와 함께 종료합니다.

## 3) 데모 데이터 시딩
- 실제 DB에 풍부한 더미 데이터를 생성합니다.

명령어:

```
npm run seed:demo
```

결과:
- 멤버/기업 사용자/추천/초대/CEO·피어 커피챗/커뮤니티/포지션/알림 등이 생성됩니다.
- 기본 로그인 예시:
  - 멤버: `jihoon.park@vcx-seed.com` / `VcxSeed2026!`
  - 관리자: `admin@vcx-seed.com` / `VcxSeed2026!`
  - 기업(CEO): `jaeyong.lee@vcx-seed.com` / `VcxSeed2026!`

정리(삭제):

```
npm run seed:clean
```

## 4) Playwright E2E로 브라우저 테스트
- Playwright가 데모 시드(글로벌 셋업) → 앱 구동 → 브라우저 시나리오를 수행합니다.

실행:

```
npm run e2e       # 헤드리스
npm run demo      # 시드 후 headed 모드 오픈
```

기본 로그인 계정:
- `playwright.config.ts`와 `e2e/global-setup.ts`에서 기본값을 지정했습니다.
- 필요시 환경변수로 오버라이드:

```
E2E_USER_EMAIL=your_email@vcx-seed.com \
E2E_USER_PASSWORD=YourPass123! \
npm run e2e
```

스킵(시드 건너뛰기):

```
SKIP_DEMO_SEED=1 npm run e2e
```

## 5) Playwright MCP 연결
Playwright MCP는 LLM이 브라우저를 통해 실제 앱을 조작·관찰하도록 도와주는 MCP 서버입니다. 아래 예시는 MCP 호스트(예: OpenAI Assistants, Claude Desktop Tools 등)에서 서버를 등록하는 일반적인 형태입니다.

예시 서버 등록(JSON 스니펫):

```
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp",
        "--base-url",
        "http://localhost:3000",
        "--storage-dir",
        ".playwright-mcp"
      ],
      "env": {
        "E2E_USER_EMAIL": "jihoon.park@vcx-seed.com",
        "E2E_USER_PASSWORD": "VcxSeed2026!"
      }
    }
  }
}
```

권장 절차:
- 1) `npm run dev`로 앱 실행
- 2) `npm run seed:demo`로 데이터 채우기
- 3) MCP 호스트 설정에 위 서버 등록 후 연결(Test connection)
- 4) 제공된 도구(예: `navigate`, `click`, `fill`)로 로그인 → 주요 페이지 탐색 → 캡처(YAML/trace)는 `.playwright-mcp/`에 기록

참고:
- 저장소에는 `.playwright-mcp/` 디렉터리가 있으며, MCP 실행 시 로그/페이지 스냅샷이 여기에 쌓입니다.
- MCP 플러그인은 호스트 환경에 설치되어 있어야 합니다. (네트워크/권한 제한 시 호스트 측에서 설치 필요)

## 6) 시연 루틴(권장)
- 홈 → 로그인(멤버) → 디렉토리 검색 → 커피챗(피어/CEO) 목록 및 상세 → 커뮤니티 글/댓글 → 포지션 매칭
- 관리자 계정으로 전환하여 추천/초대/알림·대시보드 확인

문제 발생 시 체크리스트:
- `.env.local` 키값 재확인 (URL/ANON_KEY/SERVICE_ROLE_KEY)
- Supabase RLS/테이블 유무 (migrations 최신 적용 여부)
- `npm run seed:clean` 후 `npm run seed:demo` 재실행
