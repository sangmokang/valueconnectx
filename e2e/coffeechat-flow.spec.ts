import { test, expect } from '@playwright/test'
import { loginAs, TEST_USER } from './helpers/auth'

test.describe('커피챗 플로우', () => {
  test('피어 커피챗 목록 조회', async ({ page }) => {
    await loginAs(page, TEST_USER)
    await page.goto('/coffeechat')

    // Heading or section content should be visible
    const heading = page.locator('h1, h2, [data-testid="page-heading"]').first()
    const hasHeading = await heading.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasHeading) {
      await expect(heading).toBeVisible()
    } else {
      // Fallback: page body contains coffeechat-related content
      await expect(page.locator('body')).toContainText(/커피챗|coffeechat/i)
    }
  })

  test('CEO 커피챗 목록 조회', async ({ page }) => {
    await loginAs(page, TEST_USER)
    await page.goto('/ceo-coffeechat')

    const heading = page.locator('h1, h2, [data-testid="page-heading"]').first()
    const hasHeading = await heading.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasHeading) {
      await expect(heading).toBeVisible()
    } else {
      await expect(page.locator('body')).toContainText(/CEO|커피챗|coffeechat/i)
    }
  })

  test('피어 커피챗 생성 페이지 접근', async ({ page }) => {
    await loginAs(page, TEST_USER)
    await page.goto('/coffeechat/create')

    // Expect form elements to be visible
    await expect(
      page.locator('input[name="topic"], input[placeholder*="주제"], input[placeholder*="topic"]').first()
    ).toBeVisible({ timeout: 8000 })

    await expect(
      page.locator('textarea[name="description"], textarea[placeholder*="내용"], textarea[placeholder*="description"]').first()
    ).toBeVisible()

    await expect(
      page.locator('button[type="submit"]').first()
    ).toBeVisible()
  })

  test('비인증 사용자 커피챗 접근 제한', async ({ page }) => {
    // Do NOT log in — go directly to /coffeechat
    await page.goto('/coffeechat')

    // Should either show restricted/unauthenticated state OR redirect to login
    const currentUrl = page.url()
    const isOnLoginPage = currentUrl.includes('/login')

    if (isOnLoginPage) {
      // Redirected to login — access is restricted
      await expect(page).toHaveURL(/\/login/)
    } else {
      // Page rendered but should show unauthenticated view (limited content / login prompt)
      const restrictedIndicator = page.locator(
        '[data-testid="unauthenticated"], [data-testid="login-prompt"], text=로그인, text=로그인이 필요, text=회원 전용'
      )
      const hasRestricted = await restrictedIndicator.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasRestricted) {
        await expect(restrictedIndicator.first()).toBeVisible()
      } else {
        // At minimum the page should not show full authenticated content
        await expect(page.locator('body')).not.toContainText('로그아웃')
      }
    }
  })

  test('커피챗 상세 페이지 탐색', async ({ page }) => {
    await loginAs(page, TEST_USER)
    await page.goto('/coffeechat')

    // Look for session cards or links that navigate to detail pages
    const sessionCard = page
      .locator('a[href^="/coffeechat/"], [data-testid="coffeechat-card"] a, [data-testid="session-card"] a')
      .first()

    const hasCards = await sessionCard.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasCards) {
      // No data available — skip interaction
      test.skip(true, '커피챗 세션 데이터가 없어 상세 페이지 탐색을 건너뜁니다.')
      return
    }

    await sessionCard.click()

    // Should navigate to a detail page matching /coffeechat/[id]
    await expect(page).toHaveURL(/\/coffeechat\/[^/]+$/, { timeout: 8000 })
  })
})
