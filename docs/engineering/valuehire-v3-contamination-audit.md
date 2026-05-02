# ValueHire v3 유입 코드 감사

작성일: 2026-05-01

## 판정 기준

- `078d859 feat(s2): ValueHire 및 B2B 인텔리전스 슬라이스 추가`에서 새로 들어온 실행 코드와 UI 변경을 우선 조사했다.
- VCX의 현재 제품 정의인 초대 전용 Private Talent Network, 추천/초대/수락/온보딩/디렉토리/커피챗 흐름과 직접 충돌하는 코드를 제거 대상으로 분류했다.
- 역사적 의사결정 문서와 아카이브 문서는 실행 경로가 아니므로 삭제하지 않고 잔존 참조로 분리했다.

## 제거 대상

### ValueHire 실행 슬라이스

- `/valuehire/career`, `/valuehire/hire` 페이지
- `/api/valuehire/ai-search` API
- `src/components/valuehire/*`
- `src/data/valuehire-demo.ts`
- 홈 화면을 ValueHire Sprint 0 프리뷰로 바꾼 변경
- VCX 디자인 토큰과 GNB를 ValueHire 스타일로 덮어쓴 변경

### B2B Intelligence 실행 슬라이스

- `/admin/b2b` 화면
- `/api/admin/b2b/analyze` API
- `src/lib/b2b-intelligence.ts`
- 관련 테스트, PRD, Supabase migration, SQLite mirror 테이블/스모크 체크

### Invite-only 위반 조각

- 공개 `/signup` 페이지와 `signup-form`
- `/auth/callback` signup magic-link 처리
- `dev-qa` 쿠키 기반 인증 우회
- `/valuehire` 공개 라우트와 `/api/valuehire` 미들웨어 예외

## 유지한 잔존 참조

- `docs/engineering/2026-04-17-process-review.md`
- `docs/PROCESS.md`
- `docs/_archive/bm-plan-2026-03-27.md`

위 문서들은 실행 코드가 아니라 과거 벤치마크 또는 아카이브 자료다. 제품 코드에서 다시 참조되지 않는 한 런타임 오염으로 보지 않는다.

## 검증 쿼리

```bash
rg -n "ValueHire|valuehire|B2B Intelligence|B2B 분석|/api/valuehire|/valuehire|/signup|dev-qa|DEV_QA|vcx_dev_qa" src docs package.json scripts sqlite supabase --glob '!node_modules/**'
```

기대 결과: `src` 실행 코드에는 결과가 없어야 한다. `docs`에는 위 유지한 잔존 참조만 남을 수 있다.
