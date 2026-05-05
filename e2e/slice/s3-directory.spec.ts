import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loginAs, TEST_USER } from "../helpers/auth";

// ── Admin 헬퍼 ────────────────────────────────────────────────────────────────

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
    // CI는 환경변수를 직접 주입한다.
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

async function hasDirectorySchema() {
  const admin = getAdminClient();
  if (!admin) return false;
  const { error } = await admin.from("vcx_members").select("id").limit(1);
  return !error;
}

async function hasAtLeastOneMember() {
  const admin = getAdminClient();
  if (!admin) return false;
  const { data, error } = await admin
    .from("vcx_members")
    .select("id")
    .eq("is_active", true)
    .limit(1);
  return !error && (data?.length ?? 0) > 0;
}

async function getFirstActiveMemberId(): Promise<string | null> {
  const admin = getAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("vcx_members")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .single();
  if (error || !data) return null;
  return data.id;
}

// ── 테스트 스위트 ──────────────────────────────────────────────────────────────

test.describe("Phase 1 Slice — S3: 멤버 디렉토리 열람 및 프로필 확인", () => {
  // ── 비인증 접근 (인증 불필요, 즉시 실행 가능) ──────────────────────────────

  test("비인증 사용자가 /directory 접근 시 멤버 전용 로그인 월이 표시된다", async ({
    page,
  }) => {
    await page.goto("/directory");

    // 미들웨어는 리다이렉트하지 않고 x-vcx-authenticated: false 헤더만 설정
    // ProtectedPageWrapper가 LoginWall을 렌더한다
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText("멤버 전용 콘텐츠입니다")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("초대된 멤버만 열람할 수 있습니다")).toBeVisible();
    await expect(
      page.locator('a[href="/login?redirect=%2Fdirectory"]', {
        hasText: "로그인",
      })
    ).toBeVisible();
    await expect(page.getByText(/수수료|요금/)).toHaveCount(0);
  });

  test("비인증 사용자의 /directory/[id] 접근 시 개인 정보가 노출되지 않는다", async ({
    page,
  }) => {
    // [id]/page.tsx는 DB 조회 후 notFound()를 호출하므로
    // 존재하지 않는 ID → 404, 존재하는 ID → LoginWall
    // 어느 경우든 멤버 정보(멤버 카드 목록)는 노출되지 않아야 한다
    await page.goto("/directory/non-existent-member-id-00000000");

    await expect(page).not.toHaveURL(/\/login/);
    // 멤버 디렉토리 그리드 내용이 노출되지 않아야 한다
    await expect(page.getByText(/명의 멤버/)).toHaveCount(0);
    await expect(page.getByText(/수수료|요금/)).toHaveCount(0);
    // 404 또는 LoginWall 중 하나가 표시된다
    const is404 = await page.locator("text=404").isVisible().catch(() => false);
    const isLoginWall = await page
      .getByText("멤버 전용 콘텐츠입니다")
      .isVisible()
      .catch(() => false);
    expect(is404 || isLoginWall).toBe(true);
  });

  test("디렉토리 로그인 월은 360px 모바일 폭에서 가로 overflow가 없다", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });

    await page.goto("/directory");
    await expect(page.getByText("멤버 전용 콘텐츠입니다")).toBeVisible({
      timeout: 15000,
    });

    const hasHorizontalOverflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("디렉토리 로그인 월에 수수료·요금 관련 문구가 노출되지 않는다", async ({
    page,
  }) => {
    await page.goto("/directory");
    await expect(page.getByText("멤버 전용 콘텐츠입니다")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/수수료/)).toHaveCount(0);
    await expect(page.getByText(/요금/)).toHaveCount(0);
    await expect(page.getByText(/25%/)).toHaveCount(0);
  });

  // ── 인증 필요 테스트 (E2E 자격증명 + DB 스키마가 있을 때) ─────────────────

  test("인증된 사용자가 /directory 접근 시 멤버 카드 목록이 렌더링된다", async ({
    page,
  }) => {
    test.skip(
      !(await hasAtLeastOneMember()),
      "E2E Supabase admin 권한 또는 활성 멤버 데이터가 없어 건너뜁니다."
    );

    await loginAs(page, TEST_USER);
    await page.goto("/directory");
    await page.waitForLoadState("networkidle");

    // 페이지 헤더 확인
    await expect(
      page.getByRole("heading", { name: "멤버 디렉토리" })
    ).toBeVisible({ timeout: 15000 });

    // 멤버 카드: MemberCard는 Link로 감싸진 카드이며 /directory/[id] 링크를 가진다
    // /directory/me(내 프로필 수정) 링크 제외
    const memberLinks = page.locator('a[href^="/directory/"]:not([href="/directory/me"])');
    await expect(memberLinks.first()).toBeVisible({ timeout: 15000 });
    const count = await memberLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // 총 멤버 수 텍스트 표시 확인
    await expect(page.getByText(/명의 멤버/)).toBeVisible();

    // 수수료 문구 0건 확인
    await expect(page.getByText(/수수료|요금|25%/)).toHaveCount(0);
  });

  test("인증된 사용자가 멤버 카드 클릭 시 /directory/[memberId]로 이동한다", async ({
    page,
  }) => {
    test.skip(
      !(await hasAtLeastOneMember()),
      "E2E Supabase admin 권한 또는 활성 멤버 데이터가 없어 건너뜁니다."
    );

    await loginAs(page, TEST_USER);
    await page.goto("/directory");
    await page.waitForLoadState("networkidle");

    // 첫 번째 멤버 카드(/directory/me 제외) 클릭
    const firstCard = page.locator('a[href^="/directory/"]:not([href="/directory/me"])').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.click();

    // URL이 /directory/[uuid] 패턴으로 이동하는지 확인
    await expect(page).toHaveURL(/\/directory\/[^/]+$/, { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/directory\/me/);
    await expect(page).not.toHaveURL(/\/directory$/, { timeout: 15000 });
  });

  test("인증된 사용자의 멤버 프로필 상세 페이지에 수수료 문구가 없다", async ({
    page,
  }) => {
    test.skip(
      !(await hasDirectorySchema()),
      "E2E Supabase admin 권한이 없어 건너뜁니다."
    );

    const memberId = await getFirstActiveMemberId();
    test.skip(
      !memberId,
      "활성 멤버가 없어 프로필 상세 페이지 검증을 건너뜁니다."
    );

    await loginAs(page, TEST_USER);
    await page.goto(`/directory/${memberId}`);
    await page.waitForLoadState("networkidle");

    // 멤버 전용 콘텐츠(LoginWall)가 아닌 실제 프로필이 보여야 한다
    await expect(page.getByText("멤버 전용 콘텐츠입니다")).toHaveCount(0);
    await expect(page.getByText("멤버 디렉토리로 돌아가기")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/수수료|요금|25%/)).toHaveCount(0);
  });

  test("인증된 사용자의 /directory가 360px 모바일 폭에서 가로 overflow가 없다", async ({
    page,
  }) => {
    test.skip(
      !(await hasDirectorySchema()),
      "E2E Supabase admin 권한이 없어 건너뜁니다."
    );

    await page.setViewportSize({ width: 360, height: 740 });

    await loginAs(page, TEST_USER);
    await page.goto("/directory");
    await page.waitForLoadState("networkidle");

    const hasHorizontalOverflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  // ── 에러 케이스 ───────────────────────────────────────────────────────────

  test("존재하지 않는 멤버 프로필 접근 시 멤버 정보가 노출되지 않는다", async ({
    page,
  }) => {
    // [id]/page.tsx: DB 조회 → notFound() 순서이므로
    // 비인증 + 존재하지 않는 ID → 404 페이지 표시
    // 어느 경우든 멤버 개인 정보는 노출되지 않아야 한다
    await page.goto("/directory/non-existent-member-id-00000000");

    await expect(page.getByText(/명의 멤버/)).toHaveCount(0);
    await expect(page.getByText(/수수료|요금/)).toHaveCount(0);
    // 404 또는 멤버 전용 로그인 월 중 하나가 표시된다
    const is404 = await page.locator("text=404").isVisible().catch(() => false);
    const isLoginWall = await page
      .getByText("멤버 전용 콘텐츠입니다")
      .isVisible()
      .catch(() => false);
    expect(is404 || isLoginWall).toBe(true);
  });

  test("인증된 사용자가 존재하지 않는 멤버 프로필 접근 시 404 처리된다", async ({
    page,
  }) => {
    test.skip(
      !(await hasDirectorySchema()),
      "E2E Supabase admin 권한이 없어 건너뜁니다."
    );

    await loginAs(page, TEST_USER);
    await page.goto("/directory/non-existent-member-id-00000000");
    await page.waitForLoadState("networkidle");

    // Next.js notFound() 호출 시 404 페이지 또는 404 status
    const isNotFound =
      (await page.locator("text=404").isVisible()) ||
      (await page.locator("text=찾을 수 없").isVisible()) ||
      (await page.locator("text=존재하지 않").isVisible());
    expect(isNotFound).toBe(true);
  });
});
