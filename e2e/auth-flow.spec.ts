import { test, expect } from '@playwright/test'
import { loginAs, TEST_USER } from './helpers/auth'

test.describe('인증 플로우', () => {
  test('비인증 사용자 보호 라우트 접근', async ({ page }) => {
    await page.goto('/directory')

    // The page renders with x-vcx-authenticated: false — should show login prompt or restricted view
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Expect some indication of unauthenticated state (login link or restricted content notice)
    const loginIndicator = page.getByText(/로그인/, { exact: false })
    const restrictedIndicator = page.getByText(/접근|제한|인증/, { exact: false })

    const hasLoginText = await loginIndicator.count() > 0
    const hasRestrictedText = await restrictedIndicator.count() > 0

    expect(hasLoginText || hasRestrictedText).toBeTruthy()
  })

  test('로그인 성공 → 디렉토리 접근', async ({ page }) => {
    await loginAs(page, TEST_USER)

    await page.goto('/directory')
    await page.waitForLoadState('networkidle')

    // Expect member directory content to be visible
    const directoryContent =
      page.getByText(/멤버 디렉토리/, { exact: false })

    const memberElements = page.locator('[data-testid="member-card"], [data-testid="member-list"], .member-item')

    const hasDirectoryTitle = await directoryContent.count() > 0
    const hasMemberElements = await memberElements.count() > 0

    expect(hasDirectoryTitle || hasMemberElements).toBeTruthy()
  })

  test('로그인 실패 — 잘못된 비밀번호', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@valueconnectx.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(
      page.getByText('이메일 또는 비밀번호가 올바르지 않습니다', { exact: false })
    ).toBeVisible({ timeout: 5000 })
  })

  test('관리자 라우트 비인가 접근', async ({ page }) => {
    await loginAs(page, TEST_USER)

    await page.goto('/admin')

    // Non-admin user should be redirected to home
    await page.waitForURL((url) => url.pathname === '/', { timeout: 10000 })
    expect(new URL(page.url()).pathname).toBe('/')
  })

  test('비인증 API 요청 차단', async ({ request }) => {
    const response = await request.get('/api/directory')
    expect(response.status()).toBe(401)
  })
})
