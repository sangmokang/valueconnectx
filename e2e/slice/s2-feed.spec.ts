import { test, expect } from "@playwright/test";
import { loginAs, TEST_USER } from "../helpers/auth";

test.describe("Phase 1 Slice — S2: 큐레이션 피드 열람 및 관심사 설정", () => {
  // ── Golden Path ──────────────────────────────────────────────────────────

  test.skip("golden path: 로그인 후 /feed 접근 → 피드 카드 렌더링 확인", async ({ page }) => {
    // TODO(Sprint 2): loginAs(TEST_USER) → /feed 이동 →
    //   피드 카드 컴포넌트(data-testid="feed-card" 또는 유사) 1개 이상 노출 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §2.1
    await loginAs(page, TEST_USER);
    await page.goto("/feed");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test.skip("golden path: 관심사(interest) 태그 선택 → 피드 업데이트 확인", async ({ page }) => {
    // TODO(Sprint 2): /feed → 관심사 필터/태그 클릭 →
    //   피드가 해당 관심사에 맞게 재렌더링되는지 확인 (카드 수 변화 또는 태그 활성화 상태)
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §2.2
    await loginAs(page, TEST_USER);
    await page.goto("/feed");
    await expect(page.locator("body")).toBeVisible();
  });

  test.skip("golden path: 피드 카드 클릭 → 상세 페이지 이동", async ({ page }) => {
    // TODO(Sprint 3): /feed 첫 번째 카드 클릭 →
    //   상세 URL(/feed/[id] 또는 /positions/[id])로 이동 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §2.3
    await loginAs(page, TEST_USER);
    await page.goto("/feed");
    await expect(page).toHaveURL(/\/feed/);
  });

  // ── Error Cases ───────────────────────────────────────────────────────────

  test.skip("error: 비인증 사용자 /feed 접근 → 제한된 뷰 또는 로그인 유도", async ({ page }) => {
    // TODO(Sprint 2): 로그인 없이 /feed 접근 →
    //   "로그인이 필요합니다" 메시지 또는 로그인 버튼 노출 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §2.E1
    await page.goto("/feed");
    await expect(page.locator("body")).toBeVisible();
  });

  test.skip("error: 피드 데이터 없음 → 빈 상태(empty state) UI 표시", async ({ page }) => {
    // TODO(Sprint 3): 관심사 필터 전체 해제 또는 데이터 없는 조건에서
    //   "아직 피드가 없습니다" 등 empty state 컴포넌트 렌더링 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §2.E2
    await loginAs(page, TEST_USER);
    await page.goto("/feed");
    await expect(page.locator("body")).toBeVisible();
  });
});
