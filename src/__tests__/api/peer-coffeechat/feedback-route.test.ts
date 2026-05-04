import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  const mockServerClient = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }
  return {
    mockGetUser,
    mockFrom,
    createClient: vi.fn(async () => mockServerClient),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

import { POST } from '@/app/api/peer-coffeechat/[id]/feedback/route'

const CHAT_ID = '00000000-0000-4000-8000-000000000101'
const APP_ID = '00000000-0000-4000-8000-000000000401'
const HOST_ID = '00000000-0000-4000-8000-000000000201'
const APPLICANT_ID = '00000000-0000-4000-8000-000000000301'

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest(`http://localhost/api/peer-coffeechat/${CHAT_ID}/feedback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      applicationId: APP_ID,
      overallRating: 5,
      wouldConnectAgain: true,
      feedbackTags: ['인사이트 풍부'],
      comment: '좋은 대화였습니다.',
      briefHelpful: true,
      ...body,
    }),
  })
}

function makeParams() {
  return { params: Promise.resolve({ id: CHAT_ID }) }
}

function mockSingleRow(row: Record<string, unknown> | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: row, error: null }),
      }),
    }),
  }
}

function mockApplication(row: Record<string, unknown> | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: row, error: null }),
        }),
      }),
    }),
  }
}

function mockInsert(error: unknown = null) {
  const insert = vi.fn().mockResolvedValue({ error })
  return {
    insert,
  }
}

describe('POST /api/peer-coffeechat/[id]/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockGetUser.mockResolvedValue({ data: { user: { id: APPLICANT_ID } }, error: null })
  })

  it('완료된 커피챗의 수락된 신청자가 피드백을 제출할 수 있다', async () => {
    const feedbackTable = mockInsert()

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'peer_coffee_chats') {
        return mockSingleRow({ id: CHAT_ID, author_id: HOST_ID, status: 'closed' })
      }
      if (table === 'peer_coffee_applications') {
        return mockApplication({ id: APP_ID, applicant_id: APPLICANT_ID, status: 'accepted' })
      }
      if (table === 'peer_coffeechat_feedback') return feedbackTable
      return {}
    })

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ success: true })
    expect(feedbackTable.insert).toHaveBeenCalledWith({
      chat_id: CHAT_ID,
      application_id: APP_ID,
      reviewer_id: APPLICANT_ID,
      reviewer_role: 'applicant',
      overall_rating: 5,
      would_connect_again: true,
      feedback_tags: ['인사이트 풍부'],
      comment: '좋은 대화였습니다.',
      brief_helpful: true,
    })
  })

  it('작성자도 완료된 커피챗의 수락된 신청에 피드백을 제출할 수 있다', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: { id: HOST_ID } }, error: null })
    const feedbackTable = mockInsert()

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'peer_coffee_chats') {
        return mockSingleRow({ id: CHAT_ID, author_id: HOST_ID, status: 'closed' })
      }
      if (table === 'peer_coffee_applications') {
        return mockApplication({ id: APP_ID, applicant_id: APPLICANT_ID, status: 'accepted' })
      }
      if (table === 'peer_coffeechat_feedback') return feedbackTable
      return {}
    })

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(200)
    expect(feedbackTable.insert).toHaveBeenCalledWith(expect.objectContaining({
      reviewer_id: HOST_ID,
      reviewer_role: 'host',
    }))
  })

  it('완료되지 않은 커피챗에는 피드백을 제출할 수 없다', async () => {
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'peer_coffee_chats') {
        return mockSingleRow({ id: CHAT_ID, author_id: HOST_ID, status: 'matched' })
      }
      return {}
    })

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('완료된 커피챗에만 피드백을 작성할 수 있습니다')
  })

  it('중복 피드백 제출은 409로 막는다', async () => {
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'peer_coffee_chats') {
        return mockSingleRow({ id: CHAT_ID, author_id: HOST_ID, status: 'closed' })
      }
      if (table === 'peer_coffee_applications') {
        return mockApplication({ id: APP_ID, applicant_id: APPLICANT_ID, status: 'accepted' })
      }
      if (table === 'peer_coffeechat_feedback') return mockInsert({ code: '23505' })
      return {}
    })

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('이미 피드백을 제출했습니다')
  })
})
