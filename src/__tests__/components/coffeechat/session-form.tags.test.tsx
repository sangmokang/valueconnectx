import { render, screen } from '@testing-library/react'
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

  it('adds tag via 추가 button click', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    await user.type(screen.getByPlaceholderText('태그 입력 후 Enter'), 'AI')
    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('adds tag via Enter key press', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    await user.type(screen.getByPlaceholderText('태그 입력 후 Enter'), '스타트업{Enter}')
    expect(screen.getByText('스타트업')).toBeInTheDocument()
  })

  it('clears tag input after adding a tag', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    const tagInput = screen.getByPlaceholderText('태그 입력 후 Enter') as HTMLInputElement
    await user.type(tagInput, 'AI')
    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(tagInput.value).toBe('')
  })

  it('does not add duplicate tags', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    await user.type(screen.getByPlaceholderText('태그 입력 후 Enter'), 'AI')
    await user.click(screen.getByRole('button', { name: '추가' }))
    await user.type(screen.getByPlaceholderText('태그 입력 후 Enter'), 'AI')
    await user.click(screen.getByRole('button', { name: '추가' }))
    const tagElements = screen.getAllByText('AI')
    expect(tagElements).toHaveLength(1)
  })

  it('removes tag when ✕ button is clicked', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    await user.type(screen.getByPlaceholderText('태그 입력 후 Enter'), 'AI{Enter}')
    expect(screen.getByText('AI')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'AI 제거' }))
    expect(screen.queryByText('AI')).not.toBeInTheDocument()
  })
})
