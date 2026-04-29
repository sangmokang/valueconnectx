import { test, expect } from "@playwright/test";
import { TEST_INVITE_EMAIL } from "../helpers/constants";

test.describe("Phase 1 Slice — S1: 인재 로그인 및 초대 수락 온보딩", () => {
  // ── Golden Path ──────────────────────────────────────────────────────────

  test.skip("golden path: 초대 링크 → 회원가입 → 온보딩 완료", async ({ page }) => {
    // TODO(Sprint 2): 초대 토큰 발급 → /invite?token=<token> 접속 →
    //   이메일/비밀번호 입력 → 프로필(이름·직책·회사) 작성 → 완료 후 /feed 리다이렉트
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §1.1
    await page.goto("/invite");
    await expect(page).toHaveURL(/\/invite/);
  });

  test.skip("golden path: 온보딩 완료 후 /feed 리다이렉트 확인", async ({ page }) => {
    // TODO(Sprint 2): 온보딩 마지막 단계 제출 시 /feed 로 이동하는지 검증
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §1.2
    await page.goto("/");
    await expect(page).toHaveURL(/.*/);
  });

  test.skip("golden path: 기존 회원 이메일/비밀번호 로그인", async ({ page }) => {
    // TODO(Sprint 2): /login 접속 → 이메일·비밀번호 입력 → 로그인 버튼 클릭 →
    //   /feed 또는 / 리다이렉트 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §1.3
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  });

  // ── Error Cases ───────────────────────────────────────────────────────────

  test.skip("error: 만료된 초대 토큰으로 접근 시 에러 메시지 표시", async ({ page }) => {
    // TODO(Sprint 2): /invite?token=EXPIRED_TOKEN 접속 →
    //   "초대 링크가 유효하지 않습니다" 메시지 노출 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §1.E1
    await page.goto("/invite?token=invalid-token-for-testing");
    await expect(page.locator("body")).toBeVisible();
  });

  test.skip("error: 잘못된 비밀번호 로그인 실패 → 에러 메시지 표시", async ({ page }) => {
    // TODO(Sprint 2): /login → 존재하는 이메일 + 잘못된 비밀번호 입력 →
    //   에러 문구("이메일 또는 비밀번호가 올바르지 않습니다") 노출 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §1.E2
    await page.goto("/login");
    await page.getByLabel("이메일").fill(TEST_INVITE_EMAIL);
    await page.getByLabel("비밀번호").fill("wrongpassword!");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page.locator("body")).toBeVisible();
  });

  test.skip("error: 미초대 이메일로 회원가입 불가 확인", async ({ page }) => {
    // TODO(Sprint 2): /invite 에서 초대받지 않은 이메일 입력 시
    //   "초대된 이메일이 아닙니다" 오류 표시 확인
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §1.E3
    await page.goto("/invite");
    await expect(page.locator("body")).toBeVisible();
  });
});
