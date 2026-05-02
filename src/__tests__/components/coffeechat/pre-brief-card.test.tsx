import { render, screen, waitFor } from '@testing-library/react'
import { PreBriefCard } from '@/components/coffeechat/pre-brief-card'

vi.mock('lucide-react', () => ({
  Sparkles: () => 'SparklesIcon',
  RefreshCw: () => 'RefreshCwIcon',
}))

describe('PreBriefCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('peer coffeechat brief API 응답을 카드로 표시한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        brief: '[AI Brief fallback]\n대화 전 확인할 핵심 질문을 정리해주세요.',
        briefGeneratedAt: null,
        applicationId: 'app-1',
      }),
    } as Response)

    render(<PreBriefCard sessionId="chat-1" apiBasePath="peer-coffeechat" />)

    await waitFor(() => {
      expect(screen.getByTestId('ai-brief-card')).toBeInTheDocument()
    })
    expect(global.fetch).toHaveBeenCalledWith('/api/peer-coffeechat/chat-1/brief')
    expect(screen.getByText(/\[AI Brief fallback\]/)).toBeInTheDocument()
    expect(screen.getByTestId('ai-brief-card')).toHaveClass('overflow-hidden')
    expect(screen.getByText(/\[AI Brief fallback\]/)).toHaveClass('break-words')
  })
})
