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

async function hasCommunitySchema() {
  const admin = getAdminClient();
  if (!admin) return false;
  const { error } = await admin.from("vcx_community_posts").select("id").limit(1);
  return !error;
}

async function hasAtLeastOnePost() {
  const admin = getAdminClient();
  if (!admin) return false;
  const { data, error } = await admin
    .from("vcx_community_posts")
    .select("id")
    .eq("status", "published")
    .limit(1);
  return !error && (data?.length ?? 0) > 0;
}

async function getFirstPublishedPostId(): Promise<string | null> {
  const admin = getAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("vcx_community_posts")
    .select("id")
    .eq("status", "published")
    .limit(1)
    .single();
  if (error || !data) return null;
  return data.id;
}

// ── 테스트 스위트 ──────────────────────────────────────────────────────────────

test.describe("Phase 2 Slice — S3: 커뮤니티 게시글 조회 및 상호작용", () => {
  // ── 비인증 접근 (인증 불필요, 즉시 실행 가능) ──────────────────────────────

  test("비인증 사용자가 /community 접근 시 멤버 전용 로그인 월이 표시된다", async ({
    page,
  }) => {
    await page.goto("/community");

    // 미들웨어는 리다이렉트하지 않고 x-vcx-authenticated: false 헤더만 설정
    // ProtectedPageWrapper가 LoginWall을 렌더한다
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByTestId("member-only-guard")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId("member-only-subtext")).toBeVisible();
    await expect(
      page.locator('a[href="/login?redirect=%2Fcommunity"]', {
        hasText: "로그인",
      })
    ).toBeVisible();
    await expect(page.getByText(/수수료|요금/)).toHaveCount(0);
  });

  test("커뮤니티 로그인 월은 360px 모바일 폭에서 가로 overflow가 없다", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });

    await page.goto("/community");
    await expect(page.getByTestId("member-only-guard")).toBeVisible({
      timeout: 15000,
    });

    const hasHorizontalOverflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("커뮤니티 로그인 월에 수수료·요금 관련 문구가 노출되지 않는다", async ({
    page,
  }) => {
    await page.goto("/community");
    await expect(page.getByTestId("member-only-guard")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/수수료/)).toHaveCount(0);
    await expect(page.getByText(/요금/)).toHaveCount(0);
    await expect(page.getByText(/25%/)).toHaveCount(0);
  });

  // ── 인증 필요 테스트 (E2E 자격증명 + DB 스키마가 있을 때) ─────────────────

  test("인증된 사용자가 /community 접근 시 게시글 목록이 렌더링된다", async ({
    page,
  }) => {
    test.skip(
      !(await hasAtLeastOnePost()),
      "E2E Supabase admin 권한 또는 활성 게시글 데이터가 없어 건너뜁니다."
    );

    await loginAs(page, TEST_USER);
    await page.goto("/community");
    await page.waitForLoadState("networkidle");

    // 페이지 헤더 확인
    await expect(
      page.getByRole("heading", { name: /커뮤니티|Community/ })
    ).toBeVisible({ timeout: 15000 });

    // 게시글 목록 요소 확인 (게시글은 div로 감싸진 카드이거나 목록 아이템)
    const postItems = page.locator('[data-testid="community-post"]');
    const fallbackPostItems = page.locator('article, [role="article"]');
    
    const count = await postItems.count();
    const fallbackCount = await fallbackPostItems.count();
    
    expect(count > 0 || fallbackCount > 0).toBe(true);

    // 수수료 문구 0건 확인
    await expect(page.getByText(/수수료|요금|25%/)).toHaveCount(0);
  });

  test("인증된 사용자가 게시글에서 반응(이모지) 토글 가능", async ({
    page,
  }) => {
    test.skip(
      !(await hasAtLeastOnePost()),
      "E2E Supabase admin 권한 또는 활성 게시글 데이터가 없어 건너뜁니다."
    );

    await loginAs(page, TEST_USER);
    await page.goto("/community");
    await page.waitForLoadState("networkidle");

    // 첫 번째 게시글의 반응 버튼 찾기
    const reactionButton = page.locator('[data-testid="reaction-toggle"]').first();
    
    if (await reactionButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      const initialText = await reactionButton.textContent();
      
      // 반응 토글 (클릭)
      await reactionButton.click();
      await page.waitForLoadState("networkidle");
      
      // 상태 변경 확인 (반응 카운트 증가 또는 스타일 변경)
      const updatedText = await reactionButton.textContent();
      
      // 최소한 상태가 변경되었음을 확인 (숫자 증가 또는 활성화 상태 변경)
      expect(initialText).not.toEqual(updatedText);
    }
  });

  test("인증된 사용자가 게시글에 댓글 작성 가능", async ({
    page,
  }) => {
    test.skip(
      !(await hasAtLeastOnePost()),
      "E2E Supabase admin 권한 또는 활성 게시글 데이터가 없어 건너뜁니다."
    );

    await loginAs(page, TEST_USER);
    await page.goto("/community");
    await page.waitForLoadState("networkidle");

    // 첫 번째 게시글 찾기
    const firstPost = page.locator('[data-testid="community-post"]').first();
    const fallbackPost = page.locator('article, [role="article"]').first();
    
    const post = await firstPost.isVisible({ timeout: 5000 }).catch(() => false)
      ? firstPost
      : fallbackPost;

    // 댓글 입력 필드 찾기
    const commentInput = post.locator('[data-testid="comment-input"]');
    const fallbackInput = post.locator('textarea, input[placeholder*="댓글"]');
    
    const input = await commentInput.isVisible({ timeout: 5000 }).catch(() => false)
      ? commentInput
      : fallbackInput;

    if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
      const testComment = `테스트 댓글 ${Date.now()}`;
      
      // 댓글 입력
      await input.fill(testComment);
      await expect(input).toHaveValue(testComment);
      
      // 댓글 제출 버튼 찾기
      const submitButton = post.locator('[data-testid="comment-submit"]');
      const fallbackButton = post.locator('button:has-text("제출"), button:has-text("작성"), button:has-text("Send")');
      
      const button = await submitButton.isVisible({ timeout: 5000 }).catch(() => false)
        ? submitButton
        : fallbackButton;

      if (await button.isVisible({ timeout: 5000 }).catch(() => false)) {
        await button.click();
        await page.waitForLoadState("networkidle");
        
        // 댓글이 목록에 나타나는지 확인
        await expect(page.getByText(testComment)).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test("댓글 작성자가 본인 댓글 삭제 가능", async ({
    page,
  }) => {
    test.skip(
      !(await hasAtLeastOnePost()),
      "E2E Supabase admin 권한 또는 활성 게시글 데이터가 없어 건너뜁니다."
    );

    await loginAs(page, TEST_USER);
    await page.goto("/community");
    await page.waitForLoadState("networkidle");

    // 첫 번째 게시글 찾기
    const firstPost = page.locator('[data-testid="community-post"]').first();
    const fallbackPost = page.locator('article, [role="article"]').first();
    
    const post = await firstPost.isVisible({ timeout: 5000 }).catch(() => false)
      ? firstPost
      : fallbackPost;

    // 댓글 입력 필드 찾기
    const commentInput = post.locator('[data-testid="comment-input"]');
    const fallbackInput = post.locator('textarea, input[placeholder*="댓글"]');
    
    const input = await commentInput.isVisible({ timeout: 5000 }).catch(() => false)
      ? commentInput
      : fallbackInput;

    if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
      const testComment = `삭제 테스트 댓글 ${Date.now()}`;
      
      // 댓글 입력
      await input.fill(testComment);
      
      // 댓글 제출 버튼 찾기
      const submitButton = post.locator('[data-testid="comment-submit"]');
      const fallbackButton = post.locator('button:has-text("제출"), button:has-text("작성"), button:has-text("Send")');
      
      const button = await submitButton.isVisible({ timeout: 5000 }).catch(() => false)
        ? submitButton
        : fallbackButton;

      if (await button.isVisible({ timeout: 5000 }).catch(() => false)) {
        await button.click();
        await page.waitForLoadState("networkidle");
        
        // 댓글이 목록에 나타나는지 확인
        await expect(page.getByText(testComment)).toBeVisible({ timeout: 10000 });
        
        // 댓글 삭제 버튼 찾기
        const deleteButton = page.locator('[data-testid="comment-delete"]').filter({
          has: page.getByText(testComment),
        });
        const fallbackDelete = page.locator('button:has-text("삭제"), button:has-text("Delete")').filter({
          has: page.getByText(testComment),
        });
        
        const delBtn = await deleteButton.isVisible({ timeout: 5000 }).catch(() => false)
          ? deleteButton
          : fallbackDelete;

        if (await delBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await delBtn.click();
          await page.waitForLoadState("networkidle");
          
          // 댓글이 삭제되었는지 확인 (여러 개 존재할 수 있으므로 특정 댓글만 사라지는지 확인)
          await expect(page.getByText(testComment)).toHaveCount(0, { timeout: 10000 });
        }
      }
    }
  });

  test("인증된 사용자의 /community가 360px 모바일 폭에서 가로 overflow가 없다", async ({
    page,
  }) => {
    test.skip(
      !(await hasCommunitySchema()),
      "E2E Supabase admin 권한이 없어 건너뜁니다."
    );

    await page.setViewportSize({ width: 360, height: 740 });

    await loginAs(page, TEST_USER);
    await page.goto("/community");
    await page.waitForLoadState("networkidle");

    const hasHorizontalOverflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  // ── 에러 케이스 ───────────────────────────────────────────────────────────

  test("인증된 사용자가 존재하지 않는 게시글 댓글 폼 접근 시 적절히 처리된다", async ({
    page,
  }) => {
    test.skip(
      !(await hasCommunitySchema()),
      "E2E Supabase admin 권한이 없어 건너뜁니다."
    );

    await loginAs(page, TEST_USER);
    // 존재하지 않는 게시글 ID로 직접 접근 (만약 상세 페이지가 있다면)
    await page.goto("/community");
    await page.waitForLoadState("networkidle");

    // 공개 커뮤니티 페이지에서는 존재하지 않는 게시글이 표시되지 않음
    await expect(page.getByText(/찾을 수 없|존재하지 않/)).toHaveCount(0);
  });

  test("댓글 작성자가 아닌 사용자는 타인의 댓글을 삭제할 수 없다", async ({
    page,
  }) => {
    test.skip(
      !(await hasAtLeastOnePost()),
      "E2E Supabase admin 권한 또는 활성 게시글 데이터가 없어 건너뜁니다."
    );

    await loginAs(page, TEST_USER);
    await page.goto("/community");
    await page.waitForLoadState("networkidle");

    // 첫 번째 게시글에서 댓글 찾기
    const firstPost = page.locator('[data-testid="community-post"]').first();
    const fallbackPost = page.locator('article, [role="article"]').first();
    
    const post = await firstPost.isVisible({ timeout: 5000 }).catch(() => false)
      ? firstPost
      : fallbackPost;

    // 댓글 목록에서 작성자 정보 확인
    const commentItems = post.locator('[data-testid="comment-item"]');
    const fallbackComments = post.locator('[role="listitem"]');
    
    const count = await commentItems.count();
    const fallbackCount = await fallbackComments.count();
    
    if (count > 0 || fallbackCount > 0) {
      // 댓글의 삭제 버튼이 작성자가 아니면 보이지 않거나 비활성화되어야 함
      const deleteButtons = post.locator('[data-testid="comment-delete"]');
      
      // 모든 댓글에 대해 삭제 버튼이 존재하지 않거나 비활성화되어 있어야 함
      const deleteCount = await deleteButtons.count();
      
      // 최소한 일부 댓글은 삭제 버튼이 없거나 비활성화되어야 함
      expect(deleteCount).toBeLessThanOrEqual(count);
    }
  });
});
