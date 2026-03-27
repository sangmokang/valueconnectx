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
    mockServerClient,
    createClient: vi.fn(async () => mockServerClient),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
  authLimiter: null,
  apiLimiter: null,
  directoryLimiter: null,
  directoryBurstLimiter: null,
  directoryDailyLimiter: null,
}))

import { POST } from '@/app/api/community/[id]/report/route'

const authenticatedUser = { id: 'user-id-1' }
const postId = 'post-id-1'
const commentId = '550e8400-e29b-41d4-a716-446655440000'

function makePostRequest(postId: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/community/${postId}/report`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/community/[id]/report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const res = await POST(makePostRequest(postId, { reason: '스팸 콘텐츠' }), {
      params: Promise.resolve({ id: postId }),
    })

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns 403 when authenticated user is not a VCX member', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    }))

    const res = await POST(makePostRequest(postId, { reason: '스팸 콘텐츠' }), {
      params: Promise.resolve({ id: postId }),
    })

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('VCX 멤버만 신고할 수 있습니다')
  })

  it('returns 400 when reason is missing', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: authenticatedUser.id }, error: null }),
          }),
        }),
      }),
    }))

    const res = await POST(makePostRequest(postId, {}), {
      params: Promise.resolve({ id: postId }),
    })

    expect(res.status).toBe(400)
  })

  it('returns 400 when reason is an empty string', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: authenticatedUser.id }, error: null }),
          }),
        }),
      }),
    }))

    const res = await POST(makePostRequest(postId, { reason: '' }), {
      params: Promise.resolve({ id: postId }),
    })

    expect(res.status).toBe(400)
  })

  it('returns 201 and creates report for a post when no comment_id provided', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const createdReport = { id: 'report-1', created_at: '2026-01-01T00:00:00Z' }

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: createdReport, error: null }),
      }),
    })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: authenticatedUser.id }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'community_reports') {
        return { insert: mockInsert }
      }
      return {}
    })

    const res = await POST(makePostRequest(postId, { reason: '스팸 콘텐츠입니다' }), {
      params: Promise.resolve({ id: postId }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.id).toBe('report-1')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ post_id: postId, reporter_id: authenticatedUser.id, reason: '스팸 콘텐츠입니다' })
    )
  })

  it('returns 201 and creates report for a comment when comment_id is provided', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    const createdReport = { id: 'report-2', created_at: '2026-01-01T00:00:00Z' }

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: createdReport, error: null }),
      }),
    })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: authenticatedUser.id }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'community_reports') {
        return { insert: mockInsert }
      }
      return {}
    })

    const res = await POST(makePostRequest(postId, { reason: '부적절한 댓글', comment_id: commentId }), {
      params: Promise.resolve({ id: postId }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.id).toBe('report-2')
    // When comment_id is present, post_id should be null
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ comment_id: commentId, post_id: null })
    )
  })

  it('returns 500 when database insert fails', async () => {
    mocks.mockGetUser.mockResolvedValue({ data: { user: authenticatedUser }, error: null })

    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'vcx_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: authenticatedUser.id }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'community_reports') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: new Error('db error') }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await POST(makePostRequest(postId, { reason: '스팸' }), {
      params: Promise.resolve({ id: postId }),
    })

    expect(res.status).toBe(500)
  })
})
