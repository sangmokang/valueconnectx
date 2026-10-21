import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionForm } from '@/components/coffeechat/session-form'

const { mockPush, mockBack, mockRefresh } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockBack: vi.fn(),
  mockRefresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    refresh: mockRefresh,
  }),
}))

describe('SessionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows validation error for empty title on submit', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    await user.click(screen.getByRole('button', { name: '세션 만들기' }))
    await waitFor(() => {
      expect(screen.getByText('제목을 입력해주세요')).toBeInTheDocument()
    })
  })

  it('shows validation error for empty description on submit', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    await user.type(screen.getByPlaceholderText('커피챗 제목을 입력해주세요'), '테스트 제목')
    await user.click(screen.getByRole('button', { name: '세션 만들기' }))
    await waitFor(() => {
      expect(screen.getByText('설명을 입력해주세요')).toBeInTheDocument()
    })
  })

  it('shows agreement validation error when checkbox is not checked on submit', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    await user.type(screen.getByPlaceholderText('커피챗 제목을 입력해주세요'), '테스트 제목')
    await user.type(screen.getByPlaceholderText('커피챗에 대해 설명해주세요'), '테스트 설명')
    await user.click(screen.getByRole('button', { name: '온라인' }))
    await user.click(screen.getByRole('button', { name: '세션 만들기' }))
    await waitFor(() => {
      expect(screen.getByText('컬쳐핏 확인 운영 원칙에 동의해야 합니다')).toBeInTheDocument()
    })
  })

  it('calls router.back when 취소 button is clicked', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(mockBack).toHaveBeenCalledOnce()
  })
})
