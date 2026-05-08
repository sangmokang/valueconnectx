import { test, expect, type Page } from '@playwright/test'
import { loginAs, TEST_USER } from '../helpers/auth'

const FEED_ITEMS = [
  {
    id: 'feed-ai-1',
    company: 'Northstar AI',
    company_tag: 'AI Infra',
    role: 'Engineering Manager',
    level: 'Senior',
    team_size: '50-100명',
    salary_band: '협의',
    location: 'Remote',
    tags: ['AI / ML', '딥테크'],
    summary: 'AI 인프라 팀의 채용과 실행 리듬을 책임지는 역할',
    exclusive: true,
    published_at: '2026-05-01T09:00:00+09:00',
    user_response: null,
  },
  {
    id: 'feed-fintech-1',
    company: '토스',
    company_tag: '핀테크 B2B',
    role: 'Product Lead',
    level: 'Lead',
    team_size: '20-50명',
    salary_band: '협의',
    location: '서울',
    tags: ['핀테크 B2B', 'Product'],
    summary: '초기 GTM을 제품 관점에서 설계할 리드 포지션',
    exclusive: false,
    published_at: '2026-04-30T09:00:00+09:00',
    user_response: null,
  },
]

async function mockFeedApis(
  page: Page,
  options?: {
    chips?: string[]
    items?: typeof FEED_ITEMS
    onFeedRequest?: (url: string) => void
  }
) {
  const chips = options?.chips ?? []
  const items = options?.items ?? FEED_ITEMS

  await page.route(/\/api\/feed\/interests$/, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { chips } }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ chips }),
    })
  })

  await page.route(/\/api\/feed(?:\?.*)?$/, async (route) => {
    options?.onFeedRequest?.(route.request().url())
    const url = new URL(route.request().url())
    const tags = (url.searchParams.get('tags') ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
    const data = tags.length > 0
      ? items.filter((item) => item.tags.some((tag) => tags.includes(tag)))
      : items

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data, total: data.length, page: 1, limit: 10 }),
    })
  })
}

test.describe('Phase 1 Slice — S2: 큐레이션 피드 열람 및 관심사 설정', () => {
  test.describe.configure({ mode: 'serial' })

  test('golden path: 로그인 후 /feed 접근 → 피드 카드 렌더링 확인', async ({ page }) => {
    await mockFeedApis(page, { chips: ['AI / ML'] })
    await loginAs(page, TEST_USER)

    await page.goto('/feed')

    await expect(page.getByRole('heading', { name: /이번 주 큐레이션/ })).toBeVisible()
    await expect(page.getByTestId('feed-card')).toHaveCount(1)
    await expect(page.getByText('Northstar AI')).toBeVisible()
  })

  test('golden path: 관심사 태그 선택 → 피드 업데이트 확인', async ({ page }) => {
    const feedRequests: string[] = []
    await mockFeedApis(page, { chips: [], onFeedRequest: (url) => feedRequests.push(url) })
    await loginAs(page, TEST_USER)

    await page.goto('/feed')
    await page.getByRole('button', { name: '딥테크' }).click()

    await expect(page.getByTestId('feed-card')).toHaveCount(1)
    await expect(page.getByText('Northstar AI')).toBeVisible()
    expect(feedRequests.some((url) => decodeURIComponent(url).includes('tags=딥테크'))).toBe(true)
  })

  test('golden path: 피드 카드 상세 보기 → 상세 모달 표시', async ({ page }) => {
    const analyticsLogs: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'log') analyticsLogs.push(message.text())
    })

    await mockFeedApis(page)
    await loginAs(page, TEST_USER)

    await page.goto('/feed')
    await page.getByRole('button', { name: /상세 보기/ }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Engineering Manager' })).toBeVisible()
    await expect.poll(() =>
      analyticsLogs.some((log) =>
        log.includes('[Analytics] trackEvent: feed_item_click')
      )
    ).toBe(true)
  })

  test('mobile: 360px 폭에서 피드 화면 가로 overflow가 없다', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await mockFeedApis(page, { chips: ['AI / ML'] })
    await loginAs(page, TEST_USER)

    await page.goto('/feed')
    await expect(page.getByRole('heading', { name: /이번 주 큐레이션/ })).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(() => {
      const root = document.documentElement
      return root.scrollWidth > root.clientWidth
    })
    expect(hasHorizontalOverflow).toBe(false)
  })

  test('error: 비인증 사용자 /feed 접근 → 로그인 유도', async ({ page }) => {
    await mockFeedApis(page)

    await page.goto('/feed')

    await expect(page.getByTestId('member-only-guard')).toBeVisible()
    await expect(page.locator('a[href="/login?redirect=%2Ffeed"]', { hasText: '로그인' })).toBeVisible()
  })

  test('error: 피드 데이터 없음 → 빈 상태 UI 표시', async ({ page }) => {
    await mockFeedApis(page, { items: [] })
    await loginAs(page, TEST_USER)

    await page.goto('/feed')

    await expect(page.getByText('이번 주 큐레이션이 준비 중입니다')).toBeVisible()
  })
})
