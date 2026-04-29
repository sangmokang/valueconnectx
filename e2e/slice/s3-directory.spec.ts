import { test, expect } from "@playwright/test";
import { loginAs, TEST_USER } from "../helpers/auth";

test.describe("Phase 1 Slice — S3: 멤버 디렉토리 열람 및 프로필 확인", () => {
  // ── Golden Path ──────────────────────────────────────────────────────────

  test.skip("golden path: /directory 접근 → 멤버 카드 목록 렌더링", async ({ page }) => {
    // TODO(Sprint 2): loginAs(TEST_USER) → /directory 이동 →
    //   멤버 카드(data-testid="member-card" 또는 유사) 1개 이상 노출 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §3.1
    await loginAs(page, TEST_USER);
    await page.goto("/directory");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test.skip("golden path: 멤버 카드 클릭 → 프로필 상세 페이지 이동", async ({ page }) => {
    // TODO(Sprint 2): /directory → 첫 번째 멤버 카드 클릭 →
    //   /directory/[memberId] URL 패턴으로 이동 및 프로필 정보 렌더링 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §3.2
    await loginAs(page, TEST_USER);
    await page.goto("/directory");
    await expect(page).toHaveURL(/\/directory/);
  });

  test.skip("golden path: 내 프로필(me 탭) 접근 → 본인 정보 표시", async ({ page }) => {
    // TODO(Sprint 3): /directory 의 'me' 탭 또는 /directory/me 접근 →
    //   로그인한 사용자의 이름·직책·회사 정보 렌더링 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §3.3
    await loginAs(page, TEST_USER);
    await page.goto("/directory");
    await expect(page.locator("body")).toBeVisible();
  });

  test.skip("golden path: 검색/필터로 특정 멤버 조회", async ({ page }) => {
    // TODO(Sprint 3): /directory → 검색창에 이름 입력 →
    //   해당 멤버만 필터링되어 노출되는지 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §3.4
    await loginAs(page, TEST_USER);
    await page.goto("/directory");
    await expect(page.locator("body")).toBeVisible();
  });

  // ── Error Cases ───────────────────────────────────────────────────────────

  test.skip("error: 비인증 사용자 /directory 접근 → 제한된 뷰 표시", async ({ page }) => {
    // TODO(Sprint 2): 로그인 없이 /directory 접근 →
    //   "로그인이 필요합니다" 또는 멤버 정보 숨김 처리 확인
    //   (미들웨어가 x-vcx-authenticated: false 헤더를 전달, 페이지에서 처리)
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §3.E1
    await page.goto("/directory");
    await expect(page.locator("body")).toBeVisible();
  });

  test.skip("error: 존재하지 않는 멤버 프로필 접근 → 404 처리", async ({ page }) => {
    // TODO(Sprint 3): /directory/non-existent-id 접근 →
    //   404 페이지 또는 "존재하지 않는 멤버입니다" 메시지 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §3.E2
    await loginAs(page, TEST_USER);
    await page.goto("/directory/non-existent-member-id-00000000");
    await expect(page.locator("body")).toBeVisible();
  });
});
