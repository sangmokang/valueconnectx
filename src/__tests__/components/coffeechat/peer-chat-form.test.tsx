import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PeerChatForm } from '@/components/coffeechat/peer-chat-form'

const mockPush = vi.fn()
const mockBack = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    refresh: mockRefresh,
  }),
}))

describe('PeerChatForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title input', () => {
    render(<PeerChatForm />)
    const titleInput = screen.getByPlaceholderText('커피챗 제목을 입력해주세요')
    expect(titleInput).toBeInTheDocument()
  })

  it('renders content textarea', () => {
    render(<PeerChatForm />)
    const textarea = screen.getByPlaceholderText(/어떤 분과 커피챗을 하고 싶으신지/)
    expect(textarea).toBeInTheDocument()
  })

  it('renders all four category selection buttons', () => {
    render(<PeerChatForm />)
    expect(screen.getByRole('button', { name: '일반' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '커리어' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '채용' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '멘토링' })).toBeInTheDocument()
  })

  it('defaults to general category selected', () => {
    render(<PeerChatForm />)
    const generalButton = screen.getByRole('button', { name: '일반' })
    expect(generalButton).toHaveClass('border-[#c9a84c]')
  })

  it('changes selected category when a category button is clicked', async () => {
    render(<PeerChatForm />)
    const careerButton = screen.getByRole('button', { name: '커리어' })
    await userEvent.click(careerButton)
    expect(careerButton).toHaveClass('border-[#c9a84c]')
  })

  it('shows title character count', async () => {
    render(<PeerChatForm />)
    const titleInput = screen.getByPlaceholderText('커피챗 제목을 입력해주세요')
    await userEvent.type(titleInput, '안녕')
    expect(screen.getByText('2/100')).toBeInTheDocument()
  })

  it('shows content character count', async () => {
    render(<PeerChatForm />)
    const textarea = screen.getByPlaceholderText(/어떤 분과 커피챗을 하고 싶으신지/)
    await userEvent.type(textarea, '테스트')
    expect(screen.getByText('3/3000')).toBeInTheDocument()
  })

  it('submit button is disabled when title is empty', () => {
    render(<PeerChatForm />)
    const submitButton = screen.getByRole('button', { name: '글 등록하기' })
    expect(submitButton).toBeDisabled()
  })

  it('submit button is disabled when content is empty but title is filled', async () => {
    render(<PeerChatForm />)
    const titleInput = screen.getByPlaceholderText('커피챗 제목을 입력해주세요')
    await userEvent.type(titleInput, '제목 입력')
    const submitButton = screen.getByRole('button', { name: '글 등록하기' })
    expect(submitButton).toBeDisabled()
  })

  it('submit button is enabled when both title and content are filled', async () => {
    render(<PeerChatForm />)
    const titleInput = screen.getByPlaceholderText('커피챗 제목을 입력해주세요')
    const textarea = screen.getByPlaceholderText(/어떤 분과 커피챗을 하고 싶으신지/)
    await userEvent.type(titleInput, '제목 입력')
    await userEvent.type(textarea, '내용 입력')
    const submitButton = screen.getByRole('button', { name: '글 등록하기' })
    expect(submitButton).not.toBeDisabled()
  })

  it('shows network error message when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    render(<PeerChatForm />)
    const titleInput = screen.getByPlaceholderText('커피챗 제목을 입력해주세요')
    const textarea = screen.getByPlaceholderText(/어떤 분과 커피챗을 하고 싶으신지/)
    await userEvent.type(titleInput, '제목')
    await userEvent.type(textarea, '내용')

    const submitButton = screen.getByRole('button', { name: '글 등록하기' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('네트워크 오류가 발생했습니다')).toBeInTheDocument()
    })

    vi.unstubAllGlobals()
  })

  it('shows API error message when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: '글 작성에 실패했습니다' }),
    }))

    render(<PeerChatForm />)
    const titleInput = screen.getByPlaceholderText('커피챗 제목을 입력해주세요')
    const textarea = screen.getByPlaceholderText(/어떤 분과 커피챗을 하고 싶으신지/)
    await userEvent.type(titleInput, '제목')
    await userEvent.type(textarea, '내용')

    const submitButton = screen.getByRole('button', { name: '글 등록하기' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('글 작성에 실패했습니다')).toBeInTheDocument()
    })

    vi.unstubAllGlobals()
  })

  it('redirects to chat detail page on successful submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'chat-new-1' } }),
    }))

    render(<PeerChatForm />)
    const titleInput = screen.getByPlaceholderText('커피챗 제목을 입력해주세요')
    const textarea = screen.getByPlaceholderText(/어떤 분과 커피챗을 하고 싶으신지/)
    await userEvent.type(titleInput, '제목')
    await userEvent.type(textarea, '내용')

    const submitButton = screen.getByRole('button', { name: '글 등록하기' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/coffeechat/chat-new-1')
    })

    vi.unstubAllGlobals()
  })

  it('calls router.back when cancel button is clicked', async () => {
    render(<PeerChatForm />)
    const cancelButton = screen.getByRole('button', { name: '취소' })
    await userEvent.click(cancelButton)
    expect(mockBack).toHaveBeenCalled()
  })
})
