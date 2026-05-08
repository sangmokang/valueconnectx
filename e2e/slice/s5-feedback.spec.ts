import { test, expect, type Browser } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gotoWithRetry, loginAs } from '../helpers/auth'

const PASSWORD = 'VcxSeed2026!'
const AUTHOR = { email: 'jihoon.park@vcx-seed.com', password: PASSWORD }
const APPLICANT = { email: 'hyuna.lee@vcx-seed.com', password: PASSWORD }
const STATUS_TRANSITION_TIMEOUT = 15000

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  try {
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const index = trimmed.indexOf('=')
      if (index === -1) continue
      const key = trimmed.slice(0, index)
      const value = trimmed.slice(index + 1)
      process.env[key] ||= value
    }
  } catch {
    // CI can provide environment variables directly.
  }
}

function getAdminClient() {
  loadEnv()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function ensureMember(email: string, name: string) {
  const admin = getAdminClient()
  if (!admin) throw new Error('E2E Supabase admin credentials are missing')
  const { data: member } = await admin
    .from('vcx_members')
    .select('id')
    .eq('email', email)
    .single()
  const userId = member?.id
  if (!userId) throw new Error(`E2E user not found: ${email}`)

  await admin.from('vcx_members').upsert({
    id: userId,
    email,
    name,
    current_company: 'ValueConnect X',
    title: name.includes('작성자') ? 'CTO' : 'Product Lead',
    professional_fields: ['Engineering', 'Product'],
    member_tier: 'core',
    system_role: 'member',
    is_active: true,
  })

  return userId
}

async function createPeerCoffeechat() {
  const admin = getAdminClient()
  if (!admin) throw new Error('E2E Supabase admin credentials are missing')
  const authorId = await ensureMember(AUTHOR.email, 'E2E S5 작성자')
  await ensureMember(APPLICANT.email, 'E2E S5 신청자')
  const title = `E2E 피드백 커피챗 ${Date.now()}`
  const { data, error } = await admin
    .from('peer_coffee_chats')
    .insert({
      author_id: authorId,
      title,
      content: 'Phase 1 S5 검증을 위한 완료 커피챗입니다. 세션 후 피드백 제출과 운영 집계 진입점을 확인합니다.',
      category: 'career',
      status: 'open',
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`E2E peer coffeechat seed failed: ${error?.message}`)
  return { chatUrl: `/coffeechat/${data.id}`, chatId: data.id, title }
}

async function hasPeerCoffeechatSchema() {
  const admin = getAdminClient()
  if (!admin) return false
  const { error } = await admin
    .from('peer_coffee_chats')
    .select('id')
    .limit(1)
  return !error
}

async function deletePeerCoffeechat(id: string) {
  const admin = getAdminClient()
  if (!admin) return
  await admin.from('peer_coffee_chats').delete().eq('id', id)
}

async function createAcceptedPeerCoffeechat(browser: Browser) {
  const authorContext = await browser.newContext()
  const applicantContext = await browser.newContext()
  const authorPage = await authorContext.newPage()
  const applicantPage = await applicantContext.newPage()
  const { chatUrl, chatId, title } = await createPeerCoffeechat()

  await loginAs(authorPage, AUTHOR)
  await loginAs(applicantPage, APPLICANT)
  await gotoWithRetry(applicantPage, chatUrl)
  await expect(applicantPage.getByRole('heading', { name: title })).toBeVisible({
    timeout: STATUS_TRANSITION_TIMEOUT,
  })
  await applicantPage.getByTestId('coffeechat-apply-btn').click()
  await applicantPage.getByTestId('coffeechat-application-textarea').fill(
    '세션 이후 피드백 제출 흐름을 검증하기 위해 신청합니다.'
  )
  await applicantPage.getByTestId('coffeechat-submit-btn').click()
  await expect(applicantPage.getByTestId('coffeechat-status-applied').first()).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })

  await gotoWithRetry(authorPage, chatUrl)
  await expect(authorPage.getByRole('heading', { name: title })).toBeVisible({
    timeout: STATUS_TRANSITION_TIMEOUT,
  })
  await authorPage.getByTestId('coffeechat-accept-btn').first().click()
  await expect(authorPage.getByTestId('coffeechat-status-accepted').first()).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })

  const closeResponse = await authorPage.request.put(`/api/peer-coffeechat/${chatId}`, {
    data: { status: 'closed' },
  })
  expect(closeResponse.ok()).toBe(true)

  return { authorContext, applicantContext, authorPage, applicantPage, chatUrl, chatId }
}

test.describe('Phase 1 Slice - S5: 세션 완료 후 피드백 제출', () => {
  test('완료된 Peer 커피챗에서 피드백을 제출하고 완료 메시지를 본다', async ({ browser }) => {
    test.skip(
      !(await hasPeerCoffeechatSchema()),
      'E2E Supabase admin 권한 또는 peer_coffee_chats 스키마가 없어 전체 피드백 경로를 건너뜁니다.'
    )

    const flow = await createAcceptedPeerCoffeechat(browser)

    try {
      await flow.applicantPage.goto(flow.chatUrl, { waitUntil: 'networkidle' })
      await expect(flow.applicantPage.getByTestId('ai-brief-card')).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })
      await expect(flow.applicantPage.getByText('커피챗 피드백')).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })

      // AC5: session_feedback_submit 이벤트 캡처
      const consoleEvents: string[] = []
      flow.applicantPage.on('console', (msg) => {
        if (msg.type() === 'info') consoleEvents.push(msg.text())
      })

      await flow.applicantPage.getByRole('button', { name: '5점' }).click()
      await flow.applicantPage.getByRole('button', { name: '도움됨' }).click()
      await flow.applicantPage.getByPlaceholder('자유롭게 남겨주세요').fill(
        'AI Brief 덕분에 대화 전에 핵심 질문을 정리할 수 있었습니다.'
      )
      await flow.applicantPage.getByRole('button', { name: '피드백 제출' }).click()

      await expect(flow.applicantPage.getByText('피드백이 제출되었습니다. 감사합니다.')).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })
      expect(consoleEvents.some((msg) => msg.includes('session_feedback_submit'))).toBe(true)
    } finally {
      await deletePeerCoffeechat(flow.chatId).catch(() => undefined)
      await flow.authorContext.close()
      await flow.applicantContext.close()
    }
  })

  test('비인증 사용자는 커피챗 피드백 영역에 접근하기 전에 로그인 월을 만난다', async ({ page }) => {
    await page.goto('/coffeechat', { waitUntil: 'networkidle' })

    await expect(page).not.toHaveURL(/\/404/)
    await expect(page.getByTestId('member-only-guard')).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })
    await expect(page.locator('a[href="/login?redirect=%2Fcoffeechat"]', { hasText: '로그인' })).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })
  })

  test('운영 대시보드는 비인증 상태에서 로그인 화면으로 보호된다', async ({ page }) => {
    await page.goto('/admin/ops')

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: '당신은 이미 검증되었습니다' })).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })
  })
})
