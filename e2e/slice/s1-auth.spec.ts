import { test, expect } from "@playwright/test";
import { TEST_INVITE_EMAIL } from "../helpers/constants";

// ─────────────────────────────────────────────────────────────────────────────
// DEAD SPEC NOTICE — Sprint 1 placeholder, superseded by Sprint 2 슬라이스.
//
// 본 파일은 Sprint 1 단계에서 placeholder 로 작성된 6개 시나리오의 보존본이다.
// 실제 검증은 `e2e/slice/s1-invite-onboarding.spec.ts` 가 AC1~AC6 + 회귀
// 시나리오로 동등 또는 상위 수준으로 커버한다.
//
// 정책:
//  - 각 케이스는 `test.fixme` 로 표시하여 Playwright 결과 표에서 noise 를 줄인다.
//  - 파일 자체는 git history 보존을 위해 삭제하지 않는다.
//  - Sprint 2 후속 작업이 마무리되면 본 파일을 archive (혹은 정식 삭제) 한다.
//
// 출처:
//  - docs/plans/VERTICAL_SLICE_PHASE1.md §1 (AC 정의)
//  - e2e/slice/s1-invite-onboarding.spec.ts (실제 커버리지)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Phase 1 Slice — S1: 인재 로그인 및 초대 수락 온보딩 (DEAD — see s1-invite-onboarding)", () => {
  // ── Golden Path ──────────────────────────────────────────────────────────

  test.fixme("golden path: 초대 링크 → 회원가입 → 온보딩 완료", async ({ page }) => {
    // SUPERSEDED: s1-invite-onboarding.spec.ts AC1 + AC6
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §1.1
    await page.goto("/invite");
    await expect(page).toHaveURL(/\/invite/);
  });

  test.fixme("golden path: 온보딩 완료 후 /feed 리다이렉트 확인", async ({ page }) => {
    // SUPERSEDED: s1-invite-onboarding.spec.ts AC6 (/directory 리다이렉트)
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §1.2
    await page.goto("/");
    await expect(page).toHaveURL(/.*/);
  });

  test.fixme("golden path: 기존 회원 이메일/비밀번호 로그인", async ({ page }) => {
    // SUPERSEDED: s1-invite-onboarding.spec.ts AC2 (인증 후 /login 이탈)
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §1.3
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  });

  // ── Error Cases ───────────────────────────────────────────────────────────

  test.fixme("error: 만료된 초대 토큰으로 접근 시 에러 메시지 표시", async ({ page }) => {
    // SUPERSEDED: s1-invite-onboarding.spec.ts AC1 (invalid token 에러 표시)
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §1.E1
    await page.goto("/invite?token=invalid-token-for-testing");
    await expect(page.locator("body")).toBeVisible();
  });

  test.fixme("error: 잘못된 비밀번호 로그인 실패 → 에러 메시지 표시", async ({ page }) => {
    // SUPERSEDED: 추후 별도 시나리오로 분리 예정 — 현재는 인증 실패 케이스 미커버.
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §1.E2
    await page.goto("/login");
    await page.getByLabel("이메일").fill(TEST_INVITE_EMAIL);
    await page.getByLabel("비밀번호").fill("wrongpassword!");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page.locator("body")).toBeVisible();
  });

  test.fixme("error: 미초대 이메일로 회원가입 불가 확인", async ({ page }) => {
    // SUPERSEDED: 추후 admin 시드 기반 시나리오로 별도 분리 예정.
    // AC: docs/plans/VERTICAL_SLICE_PHASE1.md §1.E3
    await page.goto("/invite");
    await expect(page.locator("body")).toBeVisible();
  });
});
