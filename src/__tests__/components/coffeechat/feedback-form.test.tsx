import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { mockTrackEvent } = vi.hoisted(() => ({
  mockTrackEvent: vi.fn(),
}))

vi.mock('lucide-react', () => ({
  Star: () => 'StarIcon',
  CheckCircle: () => 'CheckCircleIcon',
}))

vi.mock('@/lib/analytics', () => ({
  trackEvent: mockTrackEvent,
}))

import { FeedbackForm } from '@/components/coffeechat/feedback-form'

describe('FeedbackForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PostHog 미연결 환경에서도 session_feedback_submit console.info fallback을 남긴다', async () => {
    mockTrackEvent.mockImplementation(() => {
      throw new Error('analytics unavailable')
    })
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response)

    const user = userEvent.setup()
    render(
      <FeedbackForm
        sessionId="chat-1"
        applicationId="00000000-0000-4000-8000-000000000001"
        apiBasePath="peer-coffeechat"
      />
    )

    await user.click(screen.getByRole('button', { name: '5점' }))
    await user.click(screen.getByRole('button', { name: '피드백 제출' }))

    await waitFor(() => {
      expect(infoSpy).toHaveBeenCalledWith('session_feedback_submit', {
        sessionId: 'chat-1',
        applicationId: '00000000-0000-4000-8000-000000000001',
      })
    })
    expect(mockTrackEvent).toHaveBeenCalledWith('session_feedback_submit', {
      session_id: 'chat-1',
      application_id: '00000000-0000-4000-8000-000000000001',
      type: 'peer',
    })
    expect(screen.getByText('피드백이 제출되었습니다. 감사합니다.')).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/peer-coffeechat/chat-1/feedback',
      expect.objectContaining({ method: 'POST' })
    )

    infoSpy.mockRestore()
  })
})
