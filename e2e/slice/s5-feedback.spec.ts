import { test, expect } from "@playwright/test";
import { loginAs, TEST_USER } from "../helpers/auth";

test.describe("Phase 1 Slice — S5: 세션 완료 후 피드백 제출", () => {
  // ── Golden Path ──────────────────────────────────────────────────────────

  test.skip("golden path: 완료된 커피챗 세션 → 피드백 폼 접근", async ({ page }) => {
    // TODO(Sprint 4): loginAs(TEST_USER) → 완료 상태 커피챗 세션 상세 페이지 이동 →
    //   "피드백 남기기" 버튼 또는 피드백 폼 노출 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §5.1
    await loginAs(page, TEST_USER);
    await page.goto("/coffeechat");
    await expect(page.locator("body")).toBeVisible();
  });

  test.skip("golden path: 피드백 폼 작성 → 제출 성공 → 완료 메시지 표시", async ({ page }) => {
    // TODO(Sprint 4): 피드백 폼 → 별점·코멘트 입력 → 제출 →
    //   "피드백이 제출되었습니다" 성공 메시지 또는 완료 UI 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §5.2
    await loginAs(page, TEST_USER);
    await page.goto("/coffeechat");
    await expect(page).toHaveURL(/\/coffeechat/);
  });

  test.skip("golden path: 피드백 제출 후 해당 세션이 '완료' 상태로 업데이트", async ({ page }) => {
    // TODO(Sprint 4): 피드백 제출 완료 → 세션 목록 복귀 →
    //   해당 세션 카드에 "완료" 상태 배지 표시 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §5.3
    await loginAs(page, TEST_USER);
    await page.goto("/coffeechat");
    await expect(page.locator("body")).toBeVisible();
  });

  // ── Error Cases ───────────────────────────────────────────────────────────

  test.skip("error: 필수 항목 미입력 피드백 제출 → 유효성 검사 오류", async ({ page }) => {
    // TODO(Sprint 4): 피드백 폼 → 별점 없이 제출 버튼 클릭 →
    //   "평점을 선택해주세요" 등 필드 에러 메시지 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §5.E1
    await loginAs(page, TEST_USER);
    await page.goto("/coffeechat");
    await expect(page.locator("body")).toBeVisible();
  });

  test.skip("error: 이미 피드백 제출된 세션 중복 제출 방지", async ({ page }) => {
    // TODO(Sprint 4): 피드백 이미 제출된 세션 상세 →
    //   "이미 피드백을 제출하셨습니다" 메시지 또는 폼 비활성화 상태 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §5.E2
    await loginAs(page, TEST_USER);
    await page.goto("/coffeechat");
    await expect(page.locator("body")).toBeVisible();
  });

  test.skip("error: 완료되지 않은 세션에서 피드백 폼 접근 불가", async ({ page }) => {
    // TODO(Sprint 4): 진행 중(pending/scheduled) 상태 세션 →
    //   피드백 버튼 비노출 또는 비활성화 상태 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §5.E3
    await loginAs(page, TEST_USER);
    await page.goto("/coffeechat");
    await expect(page.locator("body")).toBeVisible();
  });
});
