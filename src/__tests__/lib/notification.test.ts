import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockInsert, mockFrom, mockGetUserById, mockSendEmail } = vi.hoisted(() => {
  const mockInsert = vi.fn().mockResolvedValue({ error: null })
  const mockFrom = vi.fn()
  const mockGetUserById = vi.fn()
  const mockSendEmail = vi.fn().mockResolvedValue(undefined)
  return { mockInsert, mockFrom, mockGetUserById, mockSendEmail }
})

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: mockFrom,
    auth: {
      admin: {
        getUserById: mockGetUserById,
      },
    },
  }),
}))

vi.mock('@/lib/email', () => ({
  sendNotificationEmail: mockSendEmail,
}))

import { sendNotification } from '@/lib/notification'

describe('sendNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const builder = {
      insert: mockInsert,
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockFrom.mockReturnValue(builder)
    mockInsert.mockResolvedValue({ error: null })
  })

  it('inserts in-app notification', async () => {
    mockGetUserById.mockResolvedValue({ data: { user: { email: null } }, error: null })

    await sendNotification('user-123', 'coffeechat_applied', {
      title: '커피챗 신청이 도착했습니다',
      body: '테스트 본문',
      link: '/coffeechat',
    })

    expect(mockFrom).toHaveBeenCalledWith('vcx_notifications')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        type: 'coffeechat_applied',
        title: '커피챗 신청이 도착했습니다',
      })
    )
  })

  it('sends email notification when user has email', async () => {
    mockGetUserById.mockResolvedValue({
      data: { user: { email: 'test@example.com' } },
      error: null,
    })

    await sendNotification('user-123', 'coffeechat_accepted', {
      title: '커피챗이 수락되었습니다',
    })

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        type: 'coffeechat_accepted',
        title: '커피챗이 수락되었습니다',
      })
    )
  })

  it('does not send email when user has no email', async () => {
    mockGetUserById.mockResolvedValue({
      data: { user: { email: null } },
      error: null,
    })

    await sendNotification('user-123', 'invite_accepted', { title: '초대 수락' })

    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('continues even if insert fails', async () => {
    mockInsert.mockResolvedValue({ error: new Error('DB error') })
    mockGetUserById.mockResolvedValue({ data: { user: { email: null } }, error: null })

    await expect(
      sendNotification('user-123', 'peer_chat_applied', { title: '피어 챗 신청' })
    ).resolves.toBeUndefined()
  })
})
