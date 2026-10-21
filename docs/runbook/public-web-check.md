# 공개 화면 점검

로컬 공개 화면의 비회원 동작을 1280px·360px·390px에서 검사합니다. DB를 준비하거나 seed를 실행하지 않습니다. 로그인·초대·재설정 폼은 제출하지 않습니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-placeholder-anon-key npm run build
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-placeholder-anon-key npm start -- --hostname 127.0.0.1 --port 3198
```

→ 환경 파일이 없는 격리된 작업 폴더에서 실행합니다. 실제 키를 사용하지 않습니다. 앱 실행 터미널과 별도의 터미널에서 다음을 실행합니다.

```bash
npm run test:web:public
```

→ 설치된 Playwright Chromium을 사용합니다. 결과 JSON·화면 캡처는 `test-results/public-web/`에 기록합니다. 포트를 바꾸면 `PUBLIC_WEB_BASE_URL=http://127.0.0.1:포트`를 명시합니다. 브라우저의 외부 HTTP·쓰기 HTTP·WebSocket 요청과 Service Worker 등록을 차단합니다. 요청 처리 방식은 [Playwright 공식 문서](https://playwright.dev/docs/api/class-browsercontext#browser-context-route-web-socket)를 따릅니다.

검사 범위는 랜딩·내비게이션·정책 링크·피드의 로그인 이동·비밀번호 재설정 링크·초대 링크입니다. 회원별 기능·전체 버튼·실제 DB·배포 환경 검사를 대체하지 않습니다.
