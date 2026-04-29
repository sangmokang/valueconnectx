import { test, expect } from "@playwright/test";
import { loginAs, TEST_USER } from "../helpers/auth";

test.describe("Phase 1 Slice — S4: 커피챗 신청 및 AI Brief 생성", () => {
  // ── Golden Path ──────────────────────────────────────────────────────────

  test.skip("golden path: 커피챗 신청 폼 작성 → 제출 성공", async ({ page }) => {
    // TODO(Sprint 3): loginAs(TEST_USER) → /coffeechat/create 이동 →
    //   주제·설명·희망 일정 입력 → 제출 버튼 클릭 →
    //   성공 메시지("커피챗 신청이 완료되었습니다") 또는 상세 페이지 이동 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §4.1
    await loginAs(page, TEST_USER);
    await page.goto("/coffeechat/create");
    await expect(page.locator("body")).toBeVisible();
  });

  test.skip("golden path: AI Brief 자동 생성 → Brief 카드 표시 확인", async ({ page }) => {
    // TODO(Sprint 3): 커피챗 신청 제출 후 →
    //   AI Brief 생성 중 로딩 인디케이터 노출 →
    //   Brief 카드(data-testid="ai-brief-card" 또는 유사) 렌더링 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §4.2
    await loginAs(page, TEST_USER);
    await page.goto("/coffeechat");
    await expect(page.locator("body")).toBeVisible();
  });

  test.skip("golden path: CEO 커피챗 신청 → AI Brief 포함 상세 페이지", async ({ page }) => {
    // TODO(Sprint 4): loginAs(TEST_USER) → /ceo-coffeechat →
    //   CEO 커피챗 신청 → AI Brief 자동 생성 → Brief 내용 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §4.3
    await loginAs(page, TEST_USER);
    await page.goto("/ceo-coffeechat");
    await expect(page).toHaveURL(/\/ceo-coffeechat/);
  });

  test.skip("golden path: 기존 Brief 카드에서 상세 내용 열람", async ({ page }) => {
    // TODO(Sprint 4): /coffeechat → 내 커피챗 세션 목록 →
    //   AI Brief 카드 클릭 → Brief 상세(요약·배경·예상 질문) 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §4.4
    await loginAs(page, TEST_USER);
    await page.goto("/coffeechat");
    await expect(page.locator("body")).toBeVisible();
  });

  // ── Error Cases ───────────────────────────────────────────────────────────

  test.skip("error: 필수 필드 미입력 커피챗 제출 → 유효성 검사 오류 표시", async ({ page }) => {
    // TODO(Sprint 3): /coffeechat/create → 주제·설명 비워두고 제출 →
    //   "주제를 입력해주세요" 등 필드 레벨 에러 메시지 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §4.E1
    await loginAs(page, TEST_USER);
    await page.goto("/coffeechat/create");
    const submitBtn = page.getByRole("button", { name: /제출|신청/ });
    const hasSubmit = await submitBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSubmit) {
      await submitBtn.click();
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test.skip("error: 비인증 사용자 커피챗 신청 페이지 접근 제한", async ({ page }) => {
    // TODO(Sprint 3): 로그인 없이 /coffeechat/create 접근 →
    //   로그인 페이지 리다이렉트 또는 인증 필요 안내 메시지 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §4.E2
    await page.goto("/coffeechat/create");
    await expect(page.locator("body")).toBeVisible();
  });
});
