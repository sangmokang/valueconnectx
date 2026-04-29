# Phase 1 Vertical Slice — E2E Test Stubs

Phase 1 슬라이스: **인재 로그인 → 큐레이션 피드 → 디렉토리 열람 → 커피챗 신청(AI Brief) → 세션 후 피드백**

> 이 디렉토리의 스펙은 모두 `test.skip()` 플레이스홀더입니다.
> 실제 구현은 Sprint 2-4 에서 진행합니다.

## 파일 인덱스

| 파일 | 슬라이스 | 구현 Sprint | 테스트 수 |
|------|----------|------------|----------|
| `s1-auth.spec.ts` | S1: 초대 수락 → 온보딩 → 로그인 | Sprint 2 | 6 |
| `s2-feed.spec.ts` | S2: 큐레이션 피드 열람 및 관심사 설정 | Sprint 2–3 | 5 |
| `s3-directory.spec.ts` | S3: 멤버 디렉토리 열람 및 프로필 확인 | Sprint 2–3 | 6 |
| `s4-coffeechat.spec.ts` | S4: 커피챗 신청 및 AI Brief 생성 | Sprint 3–4 | 6 |
| `s5-feedback.spec.ts` | S5: 세션 완료 후 피드백 제출 | Sprint 4 | 6 |

총 스텁 수: **29 tests**

## Sprint 매핑

### Sprint 2 — 인증 & 피드 & 디렉토리 기반
- `s1-auth.spec.ts` 전체 구현
- `s2-feed.spec.ts` golden path (피드 렌더, 관심사 선택)
- `s3-directory.spec.ts` golden path (목록, 프로필 상세)

### Sprint 3 — 디렉토리 심화 & 커피챗 신청
- `s2-feed.spec.ts` 나머지 (카드 클릭, empty state)
- `s3-directory.spec.ts` 나머지 (검색/필터, 404)
- `s4-coffeechat.spec.ts` golden path (신청 폼, AI Brief 생성)
- `s4-coffeechat.spec.ts` error cases

### Sprint 4 — AI Brief 심화 & 피드백
- `s4-coffeechat.spec.ts` CEO 커피챗 + Brief 상세
- `s5-feedback.spec.ts` 전체 구현

## 실행 방법

```bash
# 전체 e2e (스킵 포함 — 개발 완료 후 점진적으로 해제)
npm run test:e2e

# slice 디렉토리만
npx playwright test e2e/slice/

# 특정 슬라이스
npx playwright test e2e/slice/s1-auth.spec.ts
```

## 스텁 해제 가이드

각 `test.skip(...)` 을 `test(...)` 으로 변경하고 TODO 주석을 실제 구현으로 교체합니다.

```ts
// Before (stub)
test.skip("golden path: ...", async ({ page }) => {
  // TODO(Sprint 2): ...
});

// After (implemented)
test("golden path: ...", async ({ page }) => {
  await loginAs(page, TEST_USER);
  // ...실제 검증 코드...
});
```

## 참고 문서

- `docs/plans/VERTICAL_SLICE_PHASE1.md` — AC 정의 및 슬라이스 상세 스펙
- `e2e/helpers/auth.ts` — `loginAs`, `logout`, `isLoggedIn` 유틸
- `e2e/helpers/constants.ts` — `TEST_MEMBER`, `TEST_ADMIN`, `TEST_INVITE_EMAIL`
- `e2e/helpers/seed.ts` — `seedTestUser`, `cleanupTestData`
- `e2e/global-setup.ts` — 시드 데이터 주입
