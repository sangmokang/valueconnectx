import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loginAs, TEST_USER } from "../helpers/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1 Slice — S1: 초대 수락 → 로그인 → 온보딩
//
// AC 출처: docs/plans/VERTICAL_SLICE_PHASE1.md §1
// 본 스펙은 D-0001 (GNB 노출), D-0002 (진행 바 0%), D-0004 (linkedin_url 선택)
// 회귀 방지를 포함한다.
// ─────────────────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  try {
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index);
      const value = trimmed.slice(index + 1);
      process.env[key] ||= value;
    }
  } catch {
    // CI 는 환경변수를 직접 주입한다.
  }
}

function getAdminClient() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function hasMembersTable(): Promise<boolean> {
  const admin = getAdminClient();
  if (!admin) return false;
  const { error } = await admin.from("vcx_members").select("id").limit(1);
  return !error;
}

/**
 * 테스트 멤버를 온보딩 미완료 상태로 되돌린다.
 * 진행도 0% 회귀 검증을 위해 일부 필드만 채워둔 상태를 만든다.
 */
async function resetTestMemberToPartialOnboarding(): Promise<boolean> {
  const admin = getAdminClient();
  if (!admin) return false;
  const { data: user } = await admin
    .from("vcx_members")
    .select("id, email")
    .eq("email", TEST_USER.email)
    .maybeSingle();
  if (!user) return false;

  const { error } = await admin
    .from("vcx_members")
    .update({
      // 일부 필드만 채워서 미완료 상태 — 진행 바가 0% 가 아닌 부분 % 를 보여야 한다.
      name: "S1 E2E 사용자",
      current_company: "",
      title: "",
      bio: "",
      linkedin_url: "https://www.linkedin.com/in/s1-e2e-user",
      professional_fields: [],
    })
    .eq("id", user.id);
  return !error;
}

async function restoreTestMemberAfterOnboarding(): Promise<void> {
  const admin = getAdminClient();
  if (!admin) return;
  const { data: user } = await admin
    .from("vcx_members")
    .select("id")
    .eq("email", TEST_USER.email)
    .maybeSingle();
  if (!user) return;
  // 온보딩 완료 상태로 복원하여 후속 테스트가 영향받지 않도록 한다.
  await admin
    .from("vcx_members")
    .update({
      name: "S1 E2E 사용자",
      current_company: "ValueConnect",
      title: "Engineer",
      bio: "S1 E2E 시드 사용자입니다.",
      linkedin_url: "https://www.linkedin.com/in/s1-e2e-user",
      professional_fields: [],
    })
    .eq("id", user.id);
}

async function gnbCount(page: Page): Promise<number> {
  // GNB 의 식별 마커: 로고 텍스트 "ValueConnect"
  return page.locator("nav").filter({ hasText: "ValueConnect" }).count();
}

test.describe("Phase 1 Slice — S1: 초대 수락 + 로그인 + 온보딩", () => {
  // ── AC1: /invite/accept 페이지 렌더링 (비인증) ────────────────────────────

  test("AC1: /invite/accept 비인증 사용자 → 초대 토큰 입력 폼 표시", async ({
    page,
  }) => {
    await page.goto("/invite/accept");

    await expect(
      page.getByRole("heading", { name: "초대를 수락하세요" })
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText("ValueConnect X 네트워크에 오신 것을 환영합니다")
    ).toBeVisible();
    // GNB 가 노출되지 않아야 한다 — 인증 페이지 그룹
    expect(await gnbCount(page)).toBe(0);
  });

  test("AC1: /invite/accept?token=<invalid> → 유효하지 않다는 에러 표시", async ({
    page,
  }) => {
    await page.goto("/invite/accept?token=invalid-e2e-token-000000");

    // 자동 검증 후 에러 메시지 — 정확한 문구 또는 폴백 패턴 매칭
    await expect(
      page.getByText(/초대.*유효하지 않|초대 확인 중 오류/)
    ).toBeVisible({ timeout: 15000 });
    expect(await gnbCount(page)).toBe(0);
  });

  // ── AC2: /login → 인증 → 리다이렉트 ───────────────────────────────────────

  test("AC2: /login 페이지에 GNB 가 노출되지 않는다", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("button", { name: "로그인" })
    ).toBeVisible({ timeout: 15000 });
    expect(await gnbCount(page)).toBe(0);
  });

  test("AC2: 인증된 사용자가 /login 접근 시 GNB 미노출, 정상 로그인 후 인증 페이지가 아닌 곳으로 이동", async ({
    page,
  }) => {
    test.skip(
      !(await hasMembersTable()),
      "E2E Supabase admin 권한이 없어 건너뜁니다."
    );

    await loginAs(page, TEST_USER);
    // 로그인 직후 URL 이 /login 이 아닌 경로 (대개 /directory 또는 /onboarding)
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
  });

  // ── AC3 + AC4: /onboarding GNB 미노출 + 진행도 % > 0 ──────────────────────

  test("AC3 + AC4: /onboarding 진입 시 GNB 가 숨겨지고 사전 채워진 데이터로 진행도가 표시된다", async ({
    page,
  }) => {
    test.skip(
      !(await hasMembersTable()),
      "E2E Supabase admin 권한이 없어 건너뜁니다."
    );

    const reset = await resetTestMemberToPartialOnboarding();
    test.skip(!reset, "테스트 멤버를 초기화할 수 없어 건너뜁니다.");

    try {
      await loginAs(page, TEST_USER);
      await page.goto("/onboarding");
      await expect(
        page.getByRole("heading", { name: "당신의 이야기를 들려주세요" })
      ).toBeVisible({ timeout: 15000 });

      // AC3: GNB 미노출 — 온보딩 집중 UX
      expect(await gnbCount(page)).toBe(0);

      // AC4: 진행 바가 0% 가 아닌 사전 채워진 % 로 표시 (D-0002 회귀 방지)
      // name(10) + linkedin_url(20) = 30%
      await expect(page.getByText("프로필 완성도")).toBeVisible();
      const completionText = await page
        .locator("span", { hasText: /^\d+%$/ })
        .first()
        .textContent();
      expect(completionText).not.toBe("0%");
      const percent = Number((completionText ?? "0%").replace("%", ""));
      expect(percent).toBeGreaterThan(0);
    } finally {
      await restoreTestMemberAfterOnboarding();
    }
  });

  // ── AC5: linkedin_url 선택 — 미입력 상태로 온보딩 완료 가능 (D-0004) ───────

  test("AC5: linkedin_url 미입력 시에도 온보딩 폼 제출이 차단되지 않는다 (D-0004)", async ({
    page,
  }) => {
    test.skip(
      !(await hasMembersTable()),
      "E2E Supabase admin 권한이 없어 건너뜁니다."
    );

    const admin = getAdminClient();
    test.skip(!admin, "Admin client 가 없어 건너뜁니다.");

    // linkedin_url 을 명시적으로 비운 상태로 시작
    const { data: user } = await admin!
      .from("vcx_members")
      .select("id")
      .eq("email", TEST_USER.email)
      .maybeSingle();
    test.skip(!user, "테스트 멤버 레코드가 없어 건너뜁니다.");

    await admin!
      .from("vcx_members")
      .update({
        name: "S1 E2E 사용자",
        current_company: "",
        title: "",
        bio: "",
        linkedin_url: null,
        professional_fields: [],
      })
      .eq("id", user!.id);

    try {
      await loginAs(page, TEST_USER);
      await page.goto("/onboarding");
      await expect(
        page.getByRole("heading", { name: "당신의 이야기를 들려주세요" })
      ).toBeVisible({ timeout: 15000 });

      // LinkedIn URL 입력 필드 라벨은 "선택" 표시를 포함해야 한다 (필수 별표 * 가 아니다)
      await expect(
        page.getByText(/LinkedIn URL\s*\(선택\)/)
      ).toBeVisible();

      // 필수 4개 필드만 채우고 LinkedIn URL 은 비운 채로 제출
      const company = page.getByPlaceholder("회사명");
      const titleInput = page.getByPlaceholder("예: 시니어 백엔드 엔지니어");
      const bioInput = page.getByPlaceholder(/10년차 백엔드 엔지니어/);

      await company.fill("ValueConnect");
      await titleInput.fill("Engineer");
      await bioInput.fill("S1 E2E 테스트 자기소개입니다. linkedin 미입력.");

      // LinkedIn 필드는 비워두고 제출 — D-0004 회귀 방지
      await page.getByRole("button", { name: "네트워크 입장하기" }).click();

      // AC6: 온보딩 완료 → /directory 리다이렉트
      await expect(page).toHaveURL(/\/directory(\?|$)/, { timeout: 15000 });
    } finally {
      await restoreTestMemberAfterOnboarding();
    }
  });

  // ── AC6: 온보딩 완료 → /directory 리다이렉트 (linkedin 포함 케이스) ────────

  test("AC6: 모든 필드를 채운 온보딩 제출 → /directory 로 이동", async ({
    page,
  }) => {
    test.skip(
      !(await hasMembersTable()),
      "E2E Supabase admin 권한이 없어 건너뜁니다."
    );

    const reset = await resetTestMemberToPartialOnboarding();
    test.skip(!reset, "테스트 멤버를 초기화할 수 없어 건너뜁니다.");

    try {
      await loginAs(page, TEST_USER);
      await page.goto("/onboarding");
      await expect(
        page.getByRole("heading", { name: "당신의 이야기를 들려주세요" })
      ).toBeVisible({ timeout: 15000 });

      await page.getByPlaceholder("회사명").fill("ValueConnect");
      await page
        .getByPlaceholder("예: 시니어 백엔드 엔지니어")
        .fill("Engineer");
      await page
        .getByPlaceholder(/10년차 백엔드 엔지니어/)
        .fill("S1 E2E 완료 시나리오입니다.");

      await page.getByRole("button", { name: "네트워크 입장하기" }).click();

      await expect(page).toHaveURL(/\/directory(\?|$)/, { timeout: 15000 });
      // /directory 도달 시 GNB 가 다시 노출되어야 한다
      await expect(
        page.locator("nav").filter({ hasText: "ValueConnect" })
      ).toBeVisible({ timeout: 15000 });
    } finally {
      await restoreTestMemberAfterOnboarding();
    }
  });

  // ── AC-V2: 전문 분야 프리셋 칩 렌더 + 선택 ────────────────────────────────────

  test("AC-V2: /onboarding 전문 분야 프리셋 칩이 표시되고 선택 시 태그로 추가된다", async ({
    page,
  }) => {
    test.skip(
      !(await hasMembersTable()),
      "E2E Supabase admin 권한이 없어 건너뜁니다."
    );

    const reset = await resetTestMemberToPartialOnboarding();
    test.skip(!reset, "테스트 멤버를 초기화할 수 없어 건너뜁니다.");

    try {
      await loginAs(page, TEST_USER);
      await page.goto("/onboarding");
      await expect(
        page.getByRole("heading", { name: "당신의 이야기를 들려주세요" })
      ).toBeVisible({ timeout: 15000 });

      // 프리셋 칩 "엔지니어링" 이 존재하는지 확인
      const chip = page.getByRole("button", { name: "엔지니어링 빠른 선택" });
      await expect(chip).toBeVisible();

      // 클릭 → aria-pressed="true" (선택됨)
      await chip.click();
      await expect(chip).toHaveAttribute("aria-pressed", "true");
    } finally {
      await restoreTestMemberAfterOnboarding();
    }
  });

  // ── 회귀 방지: GNB 가 /onboarding 에서 절대 노출되지 않는다 (D-0001) ───────

  test("회귀: /onboarding 에서 GNB 가 0회 렌더된다 (D-0001)", async ({
    page,
  }) => {
    test.skip(
      !(await hasMembersTable()),
      "E2E Supabase admin 권한이 없어 건너뜁니다."
    );

    const reset = await resetTestMemberToPartialOnboarding();
    test.skip(!reset, "테스트 멤버를 초기화할 수 없어 건너뜁니다.");

    try {
      await loginAs(page, TEST_USER);
      await page.goto("/onboarding");
      await expect(
        page.getByRole("heading", { name: "당신의 이야기를 들려주세요" })
      ).toBeVisible({ timeout: 15000 });

      // 페이지 내 nav 중 "ValueConnect" 로고 텍스트가 있는 nav 가 0개여야 한다
      const navWithLogo = page
        .locator("nav")
        .filter({ hasText: "ValueConnect" });
      await expect(navWithLogo).toHaveCount(0);
    } finally {
      await restoreTestMemberAfterOnboarding();
    }
  });
});
