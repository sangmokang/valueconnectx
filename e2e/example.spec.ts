import { test, expect } from '@playwright/test'

test('homepage has ValueConnect title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/ValueConnect/)
})
