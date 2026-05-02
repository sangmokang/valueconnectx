import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackForm } from '@/components/coffeechat/feedback-form'

vi.mock('lucide-react', () => ({
  Star: () => 'StarIcon',
  CheckCircle: () => 'CheckCircleIcon',
}))

describe('FeedbackForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PostHog 미연결 환경에서도 session_feedback_submit console.info fallback을 남긴다', async () => {
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
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/peer-coffeechat/chat-1/feedback',
      expect.objectContaining({ method: 'POST' })
    )

    infoSpy.mockRestore()
  })
})
