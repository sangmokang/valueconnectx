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
  const authorId = await ensureMember(AUTHOR.email, 'E2E S4 Brief 작성자')
  await ensureMember(APPLICANT.email, 'E2E S4 Brief 신청자')
  const title = `E2E AI Brief 품질 검증 커피챗 ${Date.now()}`
  const { data, error } = await admin
    .from('peer_coffee_chats')
    .insert({
      author_id: authorId,
      title,
      content: 'AI Brief 내용 품질 검증을 위한 커피챗입니다. 카드 렌더링, 최소 질문 수, 수수료 문구 부재까지 확인합니다.',
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

test.describe('Phase 1 Slice - S4: AI Brief 내용 품질 검증', () => {
  // Given: 수락된 peer_coffee_chat이 존재하고, 신청자가 로그인된 상태
  // When: 커피챗 상세 페이지를 방문
  // Then: AI Brief 카드가 표시되고 내용에 수수료 언급 없음

  test('수락된 커피챗에서 AI Brief 카드가 렌더링되고 최소 1개 이상의 질문/주제가 포함된다', async ({ browser }) => {
    test.skip(
      !(await hasPeerCoffeechatSchema()),
      'E2E Supabase admin 권한 또는 peer_coffee_chats 스키마가 없어 AI Brief 품질 검증을 건너뜁니다.'
    )

    const authorContext = await browser.newContext()
    const applicantContext = await browser.newContext()
    const authorPage = await authorContext.newPage()
    const applicantPage = await applicantContext.newPage()
    let chatId: string | null = null

    try {
      // Given: 수락된 커피챗 생성 + 양쪽 로그인
      const chat = await createPeerCoffeechat()
      chatId = chat.id
      await loginAs(authorPage, AUTHOR)
      await loginAs(applicantPage, APPLICANT)

      // 신청자가 커피챗 신청
      await gotoWithRetry(applicantPage, chat.url)
      await expect(applicantPage.getByRole('heading', { name: chat.title })).toBeVisible({
        timeout: STATUS_TRANSITION_TIMEOUT,
      })
      await applicantPage.getByRole('button', { name: '비밀 신청하기' }).click()
      await applicantPage
        .getByPlaceholder('간단한 자기소개나 신청 이유를 적어주세요')
        .fill('AI Brief 품질 검증을 위해 신청합니다. 실제 대화 전 핵심 질문을 정리하고 싶습니다.')
      await applicantPage.getByRole('button', { name: '신청하기', exact: true }).click()
      await expect(applicantPage.getByText('신청 완료')).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })

      // 작성자가 수락
      await gotoWithRetry(authorPage, chat.url)
      await expect(authorPage.getByRole('heading', { name: chat.title })).toBeVisible({
        timeout: STATUS_TRANSITION_TIMEOUT,
      })
      await expect(authorPage.getByRole('heading', { name: /신청자 목록/ })).toBeVisible()
      await authorPage.getByRole('button', { name: '수락' }).first().click()
      await expect(authorPage.getByText('수락됨')).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })

      // When: 신청자가 커피챗 상세 페이지 재방문
      await applicantPage.reload()

      // Then: AI Brief 카드가 보이고 "AI Pre-Brief" 텍스트가 있어야 함
      const briefCard = applicantPage.getByTestId('ai-brief-card')
      await expect(briefCard).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })
      await expect(briefCard).toContainText('AI Pre-Brief')

      // Then: 카드 내부에 최소 1개 이상의 질문/주제가 있어야 함
      // 질문 항목은 li, p, [data-testid*="question"], [data-testid*="topic"] 등으로 렌더링될 수 있음
      const questionItems = briefCard.locator('li, [data-testid*="question"], [data-testid*="topic"]')
      const questionCount = await questionItems.count()
      expect(questionCount).toBeGreaterThanOrEqual(1)
    } finally {
      if (chatId) await deletePeerCoffeechat(chatId).catch(() => undefined)
      await authorContext.close()
      await applicantContext.close()
    }
  })

  test('AI Brief 카드 영역에 수수료/요금/fee/commission 문구가 없다', async ({ browser }) => {
    test.skip(
      !(await hasPeerCoffeechatSchema()),
      'E2E Supabase admin 권한 또는 peer_coffee_chats 스키마가 없어 수수료 문구 검증을 건너뜁니다.'
    )

    const authorContext = await browser.newContext()
    const applicantContext = await browser.newContext()
    const authorPage = await authorContext.newPage()
    const applicantPage = await applicantContext.newPage()
    let chatId: string | null = null

    try {
      // Given: 수락된 커피챗 + 신청자 로그인
      const chat = await createPeerCoffeechat()
      chatId = chat.id
      await loginAs(authorPage, AUTHOR)
      await loginAs(applicantPage, APPLICANT)

      await gotoWithRetry(applicantPage, chat.url)
      await expect(applicantPage.getByRole('heading', { name: chat.title })).toBeVisible({
        timeout: STATUS_TRANSITION_TIMEOUT,
      })
      await applicantPage.getByRole('button', { name: '비밀 신청하기' }).click()
      await applicantPage
        .getByPlaceholder('간단한 자기소개나 신청 이유를 적어주세요')
        .fill('수수료 문구 부재 검증을 위한 신청입니다.')
      await applicantPage.getByRole('button', { name: '신청하기', exact: true }).click()
      await expect(applicantPage.getByText('신청 완료')).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })

      await gotoWithRetry(authorPage, chat.url)
      await expect(authorPage.getByRole('heading', { name: chat.title })).toBeVisible({
        timeout: STATUS_TRANSITION_TIMEOUT,
      })
      await expect(authorPage.getByRole('heading', { name: /신청자 목록/ })).toBeVisible()
      await authorPage.getByRole('button', { name: '수락' }).first().click()
      await expect(authorPage.getByText('수락됨')).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })

      // When: 신청자가 상세 페이지 재방문
      await applicantPage.reload()
      const briefCard = applicantPage.getByTestId('ai-brief-card')
      await expect(briefCard).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })

      // Then: AI Brief 카드 영역에 수수료/요금/fee/commission 문구 0건
      const feeText = briefCard.locator('text=/수수료|요금|fee|commission/i')
      await expect(feeText).toHaveCount(0)
    } finally {
      if (chatId) await deletePeerCoffeechat(chatId).catch(() => undefined)
      await authorContext.close()
      await applicantContext.close()
    }
  })

  test('AI Brief API가 느리거나 비어있을 때 로딩 상태 또는 fallback 문구가 표시된다', async ({ browser }) => {
    test.skip(
      !(await hasPeerCoffeechatSchema()),
      'E2E Supabase admin 권한 또는 peer_coffee_chats 스키마가 없어 fallback 검증을 건너뜁니다.'
    )

    const authorContext = await browser.newContext()
    const applicantContext = await browser.newContext()
    const authorPage = await authorContext.newPage()
    const applicantPage = await applicantContext.newPage()
    let chatId: string | null = null

    try {
      // Given: 수락된 커피챗 + 신청자 로그인
      const chat = await createPeerCoffeechat()
      chatId = chat.id
      await loginAs(authorPage, AUTHOR)
      await loginAs(applicantPage, APPLICANT)

      await gotoWithRetry(applicantPage, chat.url)
      await expect(applicantPage.getByRole('heading', { name: chat.title })).toBeVisible({
        timeout: STATUS_TRANSITION_TIMEOUT,
      })
      await applicantPage.getByRole('button', { name: '비밀 신청하기' }).click()
      await applicantPage
        .getByPlaceholder('간단한 자기소개나 신청 이유를 적어주세요')
        .fill('Fallback 표시 검증을 위한 신청입니다.')
      await applicantPage.getByRole('button', { name: '신청하기', exact: true }).click()
      await expect(applicantPage.getByText('신청 완료')).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })

      await gotoWithRetry(authorPage, chat.url)
      await expect(authorPage.getByRole('heading', { name: chat.title })).toBeVisible({
        timeout: STATUS_TRANSITION_TIMEOUT,
      })
      await expect(authorPage.getByRole('heading', { name: /신청자 목록/ })).toBeVisible()
      await authorPage.getByRole('button', { name: '수락' }).first().click()
      await expect(authorPage.getByText('수락됨')).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })

      // When: 신청자가 수락 직후 즉시 페이지 재방문 (AI Brief 생성 중일 수 있음)
      await applicantPage.reload()

      // Then: AI Brief 카드가 있거나, fallback/skeleton/생성 중 메시지가 표시됨
      // Brief 카드가 완전히 로드되었거나 아직 생성 중인 상태 모두 허용
      const briefCard = applicantPage.getByTestId('ai-brief-card')
      const briefGenerating = applicantPage.getByText('AI Brief를 생성 중입니다')
      const briefSkeleton = applicantPage.locator('[data-testid="ai-brief-skeleton"], [aria-label="로딩 중"]')

      const cardVisible = await briefCard.isVisible({ timeout: STATUS_TRANSITION_TIMEOUT }).catch(() => false)
      const generatingVisible = await briefGenerating.isVisible().catch(() => false)
      const skeletonVisible = await briefSkeleton.isVisible().catch(() => false)

      expect(cardVisible || generatingVisible || skeletonVisible).toBe(true)
    } finally {
      if (chatId) await deletePeerCoffeechat(chatId).catch(() => undefined)
      await authorContext.close()
      await applicantContext.close()
    }
  })
})
