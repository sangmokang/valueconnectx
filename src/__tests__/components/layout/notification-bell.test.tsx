import { SWRConfig } from 'swr'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationBell } from '@/components/layout/notification-bell'

const { pushMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('lucide-react', () => ({
  Bell: () => 'BellIcon',
}))

function renderBell() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <NotificationBell />
    </SWRConfig>
  )
}

const notificationsResponse = {
  data: [
    {
      id: 'n1',
      user_id: 'user-1',
      type: 'coffeechat_accepted',
      title: '커피챗 신청이 수락되었습니다',
      body: '상대방 연락처를 확인해보세요',
      link: '/ceo-coffeechat/session-1',
      is_read: false,
      created_at: new Date().toISOString(),
    },
  ],
  unreadCount: 1,
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(notificationsResponse),
    } as Response)
  })

  it('shows unread count and notification dropdown', async () => {
    const user = userEvent.setup()
    renderBell()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '알림 1개 읽지 않음' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: '알림 1개 읽지 않음' }))

    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument()
    expect(screen.getByText('커피챗 신청이 수락되었습니다')).toBeInTheDocument()
    expect(screen.getByText('상대방 연락처를 확인해보세요')).toBeInTheDocument()
  })

  it('marks a notification read before moving to its link', async () => {
    const user = userEvent.setup()
    renderBell()

    await user.click(await screen.findByRole('button', { name: '알림 1개 읽지 않음' }))
    await user.click(screen.getByTestId('notification-item'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ notificationIds: ['n1'] }),
        })
      )
      expect(pushMock).toHaveBeenCalledWith('/ceo-coffeechat/session-1')
    })
  })

  it('marks all unread notifications read', async () => {
    const user = userEvent.setup()
    renderBell()

    await user.click(await screen.findByRole('button', { name: '알림 1개 읽지 않음' }))
    await user.click(screen.getByRole('button', { name: '모두 읽음' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ markAllRead: true }),
        })
      )
    })
  })

  it('shows loading state while notifications are loading', async () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => undefined))

    const user = userEvent.setup()
    renderBell()

    await user.click(screen.getByRole('button', { name: '알림' }))

    expect(screen.getByText('알림을 불러오고 있습니다')).toBeInTheDocument()
  })

  it('shows error state when notifications fail to load', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'failed' }),
    } as Response)

    const user = userEvent.setup()
    renderBell()

    await user.click(screen.getByRole('button', { name: '알림' }))

    await waitFor(() => {
      expect(screen.getByText('알림을 불러오지 못했습니다')).toBeInTheDocument()
    })
  })

  it('keeps the user in place when marking a notification read fails', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(notificationsResponse),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'failed' }),
      } as Response)

    const user = userEvent.setup()
    renderBell()

    await user.click(await screen.findByRole('button', { name: '알림 1개 읽지 않음' }))
    await user.click(screen.getByTestId('notification-item'))

    await waitFor(() => {
      expect(screen.getByText('알림을 읽음 처리하지 못했습니다')).toBeInTheDocument()
      expect(pushMock).not.toHaveBeenCalled()
    })
  })
})
