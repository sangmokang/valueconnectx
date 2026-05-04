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
        brief: '[AI 브리프 기본 안내]\n대화 전 확인할 핵심 질문을 정리해주세요.',
        briefGeneratedAt: null,
        applicationId: 'app-1',
        isFallback: true,
      }),
    } as Response)

    render(<PreBriefCard sessionId="chat-1" apiBasePath="peer-coffeechat" />)

    await waitFor(() => {
      expect(screen.getByTestId('ai-brief-card')).toBeInTheDocument()
    })
    expect(global.fetch).toHaveBeenCalledWith('/api/peer-coffeechat/chat-1/brief')
    expect(screen.getByText(/\[AI 브리프 기본 안내\]/)).toBeInTheDocument()
    expect(screen.getByTestId('ai-brief-card')).toHaveClass('overflow-hidden')
    expect(screen.getByText(/\[AI 브리프 기본 안내\]/)).toHaveClass('break-words')
    expect(screen.getByText('기본 안내')).toBeInTheDocument()
    expect(screen.getByText('AI 생성이 제한되어 세션 정보 기반의 기본 브리프를 제공합니다.')).toBeInTheDocument()
  })
})
