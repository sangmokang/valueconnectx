import { type Page } from '@playwright/test'

export const TEST_USER = {
  email: process.env.E2E_USER_EMAIL || 'test@valueconnectx.com',
  password: process.env.E2E_USER_PASSWORD || 'testpass123!',
}

export const TEST_CORPORATE_USER = {
  email: process.env.E2E_CORPORATE_EMAIL || 'ceo@valueconnectx.com',
  password: process.env.E2E_CORPORATE_PASSWORD || 'testpass123!',
}

export async function loginAs(page: Page, user: { email: string; password: string }) {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(user.email)
  await page.getByLabel('비밀번호').fill(user.password)
  await page.getByRole('button', { name: '로그인' }).click()
  // Wait for navigation after login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })
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
