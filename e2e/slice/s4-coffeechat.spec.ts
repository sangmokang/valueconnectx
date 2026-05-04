import { test, expect } from '@playwright/test'
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
  const authorId = await ensureMember(AUTHOR.email, 'E2E S4 작성자')
  await ensureMember(APPLICANT.email, 'E2E S4 신청자')
  const title = `E2E AI Brief 커피챗 ${Date.now()}`
  const { data, error } = await admin
    .from('peer_coffee_chats')
    .insert({
      author_id: authorId,
      title,
      content: 'Phase 1 S4 검증을 위한 커피챗입니다. 신청, 수락, AI Brief fallback 확인까지 한 번에 검증합니다.',
      category: 'career',
      status: 'open',
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`E2E peer coffeechat seed failed: ${error?.message}`)
  return {
    title,
    url: `/coffeechat/${data.id}`,
    id: data.id,
  }
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

test.describe('Phase 1 Slice - S4: 커피챗 신청 및 AI Brief 생성', () => {
  test('멤버가 신청하고 작성자가 수락하면 AI Brief 카드가 표시된다', async ({ browser }) => {
    test.skip(
      !(await hasPeerCoffeechatSchema()),
      'E2E Supabase admin 권한 또는 peer_coffee_chats 스키마가 없어 전체 신청/수락 경로를 건너뜁니다.'
    )

    const authorContext = await browser.newContext()
    const applicantContext = await browser.newContext()
    const authorPage = await authorContext.newPage()
    const applicantPage = await applicantContext.newPage()
    let chatId: string | null = null

    try {
      const chat = await createPeerCoffeechat()
      chatId = chat.id
      await loginAs(authorPage, AUTHOR)

      await loginAs(applicantPage, APPLICANT)
      await gotoWithRetry(applicantPage, chat.url)
      await expect(applicantPage.getByRole('heading', { name: chat.title })).toBeVisible({
        timeout: STATUS_TRANSITION_TIMEOUT,
      })
      await applicantPage.getByRole('button', { name: '비밀 신청하기' }).click()
      await applicantPage.getByPlaceholder('간단한 자기소개나 신청 이유를 적어주세요').fill(
        'AI Brief 품질 검증을 위해 신청합니다. 실제 대화 전 핵심 질문을 정리하고 싶습니다.'
      )
      await applicantPage.getByRole('button', { name: '신청하기', exact: true }).click()
      await expect(applicantPage.getByText('신청 완료')).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })

      await gotoWithRetry(authorPage, chat.url)
      await expect(authorPage.getByRole('heading', { name: chat.title })).toBeVisible({
        timeout: STATUS_TRANSITION_TIMEOUT,
      })
      await expect(authorPage.getByRole('heading', { name: /신청자 목록/ })).toBeVisible()
      await authorPage.getByRole('button', { name: '수락' }).first().click()
      await expect(authorPage.getByText('수락됨')).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })

      await applicantPage.reload()
      await expect(applicantPage.getByTestId('ai-brief-card')).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })
      await expect(applicantPage.getByTestId('ai-brief-card')).toContainText('AI Pre-Brief')
      await expect(applicantPage.getByText(/수수료|요금/)).toHaveCount(0)
    } finally {
      if (chatId) await deletePeerCoffeechat(chatId).catch(() => undefined)
      await authorContext.close()
      await applicantContext.close()
    }
  })

  test('비인증 사용자는 커피챗 보드 접근 시 멤버 전용 로그인 월이 표시된다', async ({ page }) => {
    await page.goto('/coffeechat')

    await expect(page).not.toHaveURL(/\/404/)
    await expect(page.getByText('멤버 전용 콘텐츠입니다')).toBeVisible()
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('a[href="/login?redirect=%2Fcoffeechat"]', { hasText: '로그인' })).toBeVisible()
    await expect(page.getByText(/수수료|요금/)).toHaveCount(0)
  })

  test('비인증 사용자의 커피챗 작성 페이지 접근은 로그인으로 보낸다', async ({ page }) => {
    await page.goto('/coffeechat/create')

    await expect(page).toHaveURL(/\/login\?redirect=%2Fcoffeechat%2Fcreate/)
  })

  test('커피챗 보드의 보호 UI는 360px 모바일 폭에서 가로 overflow가 없다', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })

    await page.goto('/coffeechat')
    await expect(page.getByText('멤버 전용 콘텐츠입니다')).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(() => {
      const root = document.documentElement
      return root.scrollWidth > root.clientWidth
    })
    expect(hasHorizontalOverflow).toBe(false)
  })
})
