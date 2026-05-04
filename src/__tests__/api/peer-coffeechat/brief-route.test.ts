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

import { GET } from '@/app/api/peer-coffeechat/[id]/brief/route'

const CHAT_ID = '00000000-0000-4000-8000-000000000101'
const HOST_USER = { id: '00000000-0000-4000-8000-000000000201' }
const APPLICANT_USER = { id: '00000000-0000-4000-8000-000000000301' }

function makeRequest() {
  return new NextRequest(`http://localhost/api/peer-coffeechat/${CHAT_ID}/brief`)
}

function makeParams() {
  return { params: Promise.resolve({ id: CHAT_ID }) }
}

function mockChat(chat: Record<string, unknown> | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: chat, error: null }),
      }),
    }),
  }
}

function mockAcceptedApplication(application: Record<string, unknown> | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: application, error: null }),
          }),
        }),
      }),
    }),
  }
}

describe('GET /api/peer-coffeechat/[id]/brief', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('수락된 참여자에게 저장된 AI Brief를 반환한다', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: APPLICANT_USER }, error: null })
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'peer_coffee_chats') {
        return mockChat({
          author_id: HOST_USER.id,
          title: '커리어 전환 커피챗',
          content: '엔지니어링 매니저 전환 경험을 나누는 세션입니다.',
        })
      }
      if (table === 'peer_coffee_applications') {
        return mockAcceptedApplication({
          id: '00000000-0000-4000-8000-000000000401',
          applicant_id: APPLICANT_USER.id,
          host_brief: '호스트가 볼 브리프입니다.',
          applicant_brief: '참여자가 볼 AI Brief입니다.',
          brief_generated_at: '2026-05-01T10:00:00.000Z',
          status: 'accepted',
          message: '전환 경험이 궁금합니다.',
        })
      }
      return {}
    })

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.brief).toBe('참여자가 볼 AI Brief입니다.')
    expect(body.briefGeneratedAt).toBe('2026-05-01T10:00:00.000Z')
    expect(body.applicationId).toBe('00000000-0000-4000-8000-000000000401')
    expect(body.isFallback).toBe(false)
  })

  it('수락된 호스트에게 저장된 브리프가 없으면 한국어 기본 안내를 반환한다', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: HOST_USER }, error: null })
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'peer_coffee_chats') {
        return mockChat({
          author_id: HOST_USER.id,
          title: '커리어 전환 커피챗',
          content: '엔지니어링 매니저 전환 경험을 나누는 세션입니다.',
        })
      }
      if (table === 'peer_coffee_applications') {
        return mockAcceptedApplication({
          id: '00000000-0000-4000-8000-000000000401',
          applicant_id: APPLICANT_USER.id,
          host_brief: null,
          applicant_brief: null,
          brief_generated_at: null,
          status: 'accepted',
          message: '전환 경험이 궁금합니다.',
        })
      }
      return {}
    })

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.brief).toContain('[AI 브리프 기본 안내]')
    expect(body.brief).toContain('AI 브리프 생성 환경이 준비되지 않아 기본 브리프를 제공합니다.')
    expect(body.brief).toContain('커리어 전환 커피챗')
    expect(body.applicationId).toBe('00000000-0000-4000-8000-000000000401')
    expect(body.isFallback).toBe(true)
  })

  it('참여자가 아닌 사용자는 브리프 접근이 거부된다', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: APPLICANT_USER }, error: null })
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'peer_coffee_chats') {
        return mockChat({
          author_id: HOST_USER.id,
          title: '커리어 전환 커피챗',
          content: '엔지니어링 매니저 전환 경험을 나누는 세션입니다.',
        })
      }
      if (table === 'peer_coffee_applications') return mockAcceptedApplication(null)
      return {}
    })

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(403)
  })
})
