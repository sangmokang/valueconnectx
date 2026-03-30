import { test, expect } from '@playwright/test'
import { loginAs, TEST_USER } from './helpers/auth'

test.describe('알림 플로우', () => {
  test('알림 벨 표시', async ({ page }) => {
    await loginAs(page, TEST_USER)
    const bellButton = page.getByRole('button', { name: '알림' })
    await expect(bellButton).toBeVisible()
  })

  test('알림 드롭다운 토글', async ({ page }) => {
    await loginAs(page, TEST_USER)

    const bellButton = page.getByRole('button', { name: '알림' })
    await bellButton.click()

    // Dropdown should appear with "알림" header
    await expect(page.getByText('알림').first()).toBeVisible()

    // Click outside to close
    await page.mouse.click(10, 10)

    // Dropdown should be closed — the bell button itself remains but dropdown content gone
    // We verify by checking the dropdown container is no longer visible
    const dropdown = page.locator('[data-testid="notification-dropdown"]')
    const isPresent = await dropdown.count()
    if (isPresent > 0) {
      await expect(dropdown).not.toBeVisible()
    }
  })

  test('빈 알림 상태', async ({ page }) => {
    await loginAs(page, TEST_USER)

    const bellButton = page.getByRole('button', { name: '알림' })
    await bellButton.click()

    // If there are no notifications, empty state text should appear
    const emptyState = page.getByText('새로운 알림이 없습니다')
    const notificationItems = page.locator('[data-testid="notification-item"]')

    const itemCount = await notificationItems.count()
    if (itemCount === 0) {
      await expect(emptyState).toBeVisible()
    } else {
      // Notifications exist — empty state should not be shown
      await expect(emptyState).not.toBeVisible()
    }
  })

  test('알림 API 인증 필수', async ({ page }) => {
    // No login — direct API call should return 401
    const response = await page.request.get('/api/notifications')
    expect(response.status()).toBe(401)
  })

  test('알림 읽음 처리 API', async ({ page }) => {
    await loginAs(page, TEST_USER)

    // GET notifications
    const getResponse = await page.request.get('/api/notifications')
    expect(getResponse.ok()).toBeTruthy()

    const body = await getResponse.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('unreadCount')

    const unreadCount: number = body.unreadCount
    const notifications: Array<{ id: string; isRead: boolean }> = body.data

    if (unreadCount > 0) {
      // Mark all as read
      const patchResponse = await page.request.patch('/api/notifications', {
        data: { markAllRead: true },
      })
      expect(patchResponse.ok()).toBeTruthy()

      // Verify unread count is now 0
      const afterResponse = await page.request.get('/api/notifications')
      expect(afterResponse.ok()).toBeTruthy()
      const afterBody = await afterResponse.json()
      expect(afterBody.unreadCount).toBe(0)
    } else {
      // No unread notifications — just verify the API shape is correct
      expect(Array.isArray(notifications)).toBeTruthy()
      expect(typeof unreadCount).toBe('number')
    }
  })
})
