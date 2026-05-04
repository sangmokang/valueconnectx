import { type Page } from '@playwright/test'

export const TEST_USER = {
  email: process.env.E2E_USER_EMAIL || 'test@valueconnectx.com',
  password: process.env.E2E_USER_PASSWORD || 'testpass123!',
}

export const TEST_CORPORATE_USER = {
  email: process.env.E2E_CORPORATE_EMAIL || 'ceo@valueconnectx.com',
  password: process.env.E2E_CORPORATE_PASSWORD || 'testpass123!',
}

export async function gotoWithRetry(page: Page, url: string, attempts = 5) {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'load' })
      return
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      if (!message.includes('ERR_CONNECTION_REFUSED') || attempt === attempts) {
        throw error
      }
      await page.waitForTimeout(1000 * attempt)
    }
  }

  throw lastError
}

export async function loginAs(page: Page, user: { email: string; password: string }) {
  await gotoWithRetry(page, '/login')
  await page.getByLabel('이메일').fill(user.email)
  await page.getByLabel('비밀번호').fill(user.password)
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 15000,
      waitUntil: 'domcontentloaded',
    }),
    page.getByRole('button', { name: '로그인' }).click(),
  ])
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
