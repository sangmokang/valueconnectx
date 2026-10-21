import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const target = process.env.PUBLIC_WEB_BASE_URL ?? 'http://127.0.0.1:3198'
const url = new URL(target)
if (
  url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname) ||
  !url.port || Number(url.port) < 1024 || target !== url.origin
) throw new Error('[PUBLIC_WEB_TARGET] 명시한 로컬 앱 주소만 검사할 수 있습니다.')

const output = 'test-results/public-web'
const result = {
  startedAt: new Date().toISOString(),
  scope: '로컬 공개 화면·비회원·읽기 전용. 실제 DB와 회원 상세 화면은 미검증.',
  checks: [], errors: [], blockedRequests: [],
}
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  for (const width of [1280, 360, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' })
    await context.routeWebSocket('**/*', socket => {
      result.blockedRequests.push({ method: 'WEBSOCKET', url: socket.url() })
      socket.close()
    })
    await context.route('**/*', route => {
      const request = route.request()
      if (new URL(request.url()).origin === target && ['GET', 'HEAD'].includes(request.method())) {
        return route.continue()
      }
      result.blockedRequests.push({ method: request.method(), url: request.url() })
      return route.abort()
    })
    const page = await context.newPage()
    page.on('pageerror', error => result.errors.push(error.message))
    await page.goto(target, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: '최고 수준의 프로페셔널들의 Community', exact: true })).toBeVisible()
    const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }))
    expect(size.document).toBeLessThanOrEqual(size.viewport)
    result.checks.push({ width, action: '랜딩 표시·가로 넘침 없음', status: 'PASS' })
    await page.screenshot({ path: `${output}/landing-${width}.png`, fullPage: true })

    if (width < 768) {
      await page.getByRole('button', { name: '메뉴 열기', exact: true }).click()
      await expect(page.getByRole('dialog', { name: '모바일 네비게이션' })).toBeVisible()
      await page.getByRole('button', { name: '메뉴 닫기', exact: true }).click()
      await expect(page.getByRole('dialog', { name: '모바일 네비게이션' })).not.toBeVisible()
    } else {
      const menu = page.getByRole('button', { name: '서비스 소개 ▾', exact: true })
      await menu.click()
      await expect(page.getByRole('link', { name: '멤버십 혜택', exact: true })).toBeVisible()
      await menu.click()
    }
    result.checks.push({ width, action: '내비게이션 메뉴 열기·닫기', status: 'PASS' })

    for (const [name, path] of [['개인정보처리방침', '/privacy'], ['이용약관', '/terms']]) {
      await page.getByRole('link', { name, exact: true }).click()
      await expect(page).toHaveURL(target + path)
      await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible()
      result.checks.push({ width, action: name + ' 링크', status: 'PASS' })
      await page.goto(target, { waitUntil: 'networkidle' })
    }
    await page.getByRole('link', { name: '큐레이션 시작', exact: true }).click()
    await expect(page).toHaveURL(target + '/feed')
    await expect(page.getByRole('heading', { name: '멤버 전용 콘텐츠입니다', exact: true })).toBeVisible()
    await page.getByRole('link', { name: '로그인', exact: true }).last().click()
    await expect(page).toHaveURL(target + '/login?redirect=%2Ffeed')
    await expect(page.getByRole('textbox', { name: '이메일', exact: true })).toBeVisible()
    await page.screenshot({ path: `${output}/login-${width}.png`, fullPage: true })
    result.checks.push({ width, action: '피드 CTA·회원 안내·로그인 이동', status: 'PASS' })
    await page.getByRole('link', { name: '비밀번호를 잊으셨나요?', exact: true }).click()
    await expect(page).toHaveURL(target + '/forgot-password')
    await expect(page.getByRole('textbox', { name: '이메일', exact: true })).toBeVisible()
    result.checks.push({ width, action: '비밀번호 재설정 링크', status: 'PASS' })
    await page.goto(target + '/login', { waitUntil: 'networkidle' })
    await page.getByRole('link', { name: '초대 수락하기 →', exact: true }).click()
    await expect(page).toHaveURL(target + '/invite/accept')
    await expect(page.getByRole('heading', { level: 1, name: '초대를 수락하세요', exact: true })).toBeVisible()
    result.checks.push({ width, action: '초대 수락 링크', status: 'PASS' })
    await context.close()
  }
  expect(result.errors).toEqual([])
  expect(result.blockedRequests).toEqual([])
} catch (error) {
  result.errors.push(String(error))
  process.exitCode = 1
} finally {
  await browser.close()
  result.finishedAt = new Date().toISOString()
  result.status = result.errors.length ? 'FAIL' : 'PASS'
  await writeFile(`${output}/result.json`, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result))
}
