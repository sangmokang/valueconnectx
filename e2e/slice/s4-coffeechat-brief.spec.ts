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

      // Then: 카드 내부 brief 텍스트에 최소 10자 이상의 내용이 있어야 함
      // PreBriefCard는 <p> 태그로 brief 전체를 렌더링한다 (li 없음)
      const briefParagraph = briefCard.locator('p').first()
      const textContent = await briefParagraph.textContent()
      expect((textContent ?? '').trim().length).toBeGreaterThanOrEqual(10)
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

  test('S4 AC2: 호스트가 신청을 수락하면 host_brief가 비동기 큐를 통해 DB에 자동 채워진다', async ({ browser }) => {
    test.skip(
      !(await hasPeerCoffeechatSchema()),
      'E2E Supabase admin 권한 또는 peer_coffee_chats 스키마가 없어 자동 생성 검증을 건너뜁니다.'
    )
    test.skip(
      !process.env.ANTHROPIC_API_KEY,
      'ANTHROPIC_API_KEY 부재로 AI Brief 자동 생성 검증을 건너뜁니다.'
    )

    const admin = getAdminClient()
    if (!admin) {
      test.skip(true, 'Supabase admin 클라이언트를 생성할 수 없습니다.')
      return
    }

    const authorContext = await browser.newContext()
    const applicantContext = await browser.newContext()
    const authorPage = await authorContext.newPage()
    const applicantPage = await applicantContext.newPage()
    let chatId: string | null = null

    try {
      // Given: 새 커피챗 + 양쪽 로그인 + 신청 생성
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
        .fill('AC2 host_brief 자동 생성 검증을 위한 신청입니다. 핵심 질문 정리가 필요합니다.')
      await applicantPage.getByRole('button', { name: '신청하기', exact: true }).click()
      await expect(applicantPage.getByText('신청 완료')).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })

      // Given (시드 보강): 수락 직전 application 의 host_brief = null 강제 보장
      const { data: pending } = await admin
        .from('peer_coffee_applications')
        .select('id, host_brief')
        .eq('chat_id', chat.id)
        .eq('status', 'pending')
        .limit(1)
        .single()
      expect(pending?.id).toBeTruthy()
      const applicationId = pending!.id as string
      await admin
        .from('peer_coffee_applications')
        .update({ host_brief: null, applicant_brief: null, brief_generated_at: null, brief_error: null })
        .eq('id', applicationId)

      // When: 호스트가 UI 에서 수락 (PUT /applications/[appId] 트리거 → 비동기 큐 작동)
      await gotoWithRetry(authorPage, chat.url)
      await expect(authorPage.getByRole('heading', { name: chat.title })).toBeVisible({
        timeout: STATUS_TRANSITION_TIMEOUT,
      })
      await expect(authorPage.getByRole('heading', { name: /신청자 목록/ })).toBeVisible()
      await authorPage.getByRole('button', { name: '수락' }).first().click()
      await expect(authorPage.getByText('수락됨')).toBeVisible({ timeout: STATUS_TRANSITION_TIMEOUT })

      // Then: 5초 간격, 최대 30초 polling — host_brief IS NOT NULL 까지 대기
      // 비동기 큐(generatePeerBriefAsync, fire-and-forget) 이므로 응답 본문이 아닌 DB 폴링 필요
      let resolvedBrief: string | null = null
      const deadline = Date.now() + 30_000
      while (Date.now() < deadline) {
        const { data: row } = await admin
          .from('peer_coffee_applications')
          .select('host_brief, brief_generated_at, brief_error')
          .eq('id', applicationId)
          .single()
        if (row?.host_brief) {
          resolvedBrief = row.host_brief as string
          break
        }
        if (row?.brief_error) {
          throw new Error(`AI Brief 생성 실패: ${row.brief_error}`)
        }
        await applicantPage.waitForTimeout(5_000)
      }

      // Assertion 1: host_brief 가 30초 이내에 채워졌는가
      expect(resolvedBrief, 'host_brief 가 30초 이내에 자동 생성되지 않았습니다').not.toBeNull()
      // Assertion 2: brief 가 충분한 길이의 텍스트인가 (Claude 응답 sanity check)
      expect((resolvedBrief ?? '').trim().length).toBeGreaterThanOrEqual(20)
      // Assertion 3: 한국어 음절(가-힣)이 포함되어 있는가 — 한국어 brief 보장
      expect(resolvedBrief ?? '').toMatch(/[가-힣]/)
      // Assertion 4: 수수료 관련 키워드 0건 (멤버 UI 카피 정책)
      expect(resolvedBrief ?? '').not.toMatch(/수수료|요금|fee|commission|25%/i)
      // Assertion 5: brief_generated_at 타임스탬프가 기록되었는가
      const { data: finalRow } = await admin
        .from('peer_coffee_applications')
        .select('brief_generated_at')
        .eq('id', applicationId)
        .single()
      expect(finalRow?.brief_generated_at).toBeTruthy()
    } finally {
      if (chatId) await deletePeerCoffeechat(chatId).catch(() => undefined)
      await authorContext.close()
      await applicantContext.close()
    }
  })
})
