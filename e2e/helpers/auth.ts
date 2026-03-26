import type { Page } from '@playwright/test'

/**
 * Log in as a user via the login page UI
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')

  // Wait for redirect after successful login
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 10000,
  })
}

/**
 * Log out the current user
 */
export async function logout(page: Page) {
  // Click user menu, then logout button
  const userMenu = page.locator('[data-testid="user-menu"]')
  if (await userMenu.isVisible()) {
    await userMenu.click()
    await page.click('text=로그아웃')
    await page.waitForURL('/')
  }
}

/**
 * Check if user is currently logged in by checking for user menu
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const userMenu = page.locator('[data-testid="user-menu"]')
  return userMenu.isVisible({ timeout: 3000 }).catch(() => false)
}
