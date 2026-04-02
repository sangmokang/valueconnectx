import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InviteAcceptForm } from '@/components/auth/invite-accept-form'

const { mockPush, mockRefresh } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('InviteAcceptForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('without initialToken: shows token input and "초대 확인하기" button', () => {
    render(<InviteAcceptForm />)
    expect(screen.getByPlaceholderText('초대 이메일의 링크를 붙여넣어 주세요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '초대 확인하기' })).toBeInTheDocument()
  })

  it('with initialToken: auto-calls verify API', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ valid: true, email: 'test@example.com', invitedByName: '홍길동', memberTier: 'core' }),
    })
    render(<InviteAcceptForm initialToken="abc123" />)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/invites/verify/abc123')
    })
  })

  it('on valid verify: shows invite info (inviter name, email, tier)', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ valid: true, email: 'test@example.com', invitedByName: '홍길동', memberTier: 'core' }),
    })
    render(<InviteAcceptForm initialToken="abc123" />)
    expect(await screen.findByText('홍길동님이 초대했습니다')).toBeInTheDocument()
    expect(screen.getByText(/test@example\.com/)).toBeInTheDocument()
    expect(screen.getByText(/Core Member/)).toBeInTheDocument()
  })

  it('shows error on invalid token: "유효하지 않은 초대 링크입니다"', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ valid: false }),
    })
    render(<InviteAcceptForm initialToken="bad-token" />)
    expect(await screen.findByText('유효하지 않은 초대 링크입니다')).toBeInTheDocument()
  })

  it('submit calls /api/invites/accept with token, password, name', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({ valid: true, email: 'test@example.com', invitedByName: '홍길동', memberTier: 'core' }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ success: true, redirectTo: '/' }),
      })

    render(<InviteAcceptForm initialToken="abc123" />)
    await screen.findByText('홍길동님이 초대했습니다')

    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('홍길동'), '김철수')
    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInputs[0], 'password123')
    await user.type(passwordInputs[1], 'password123')
    await user.type(screen.getByPlaceholderText('https://linkedin.com/in/your-profile'), 'https://linkedin.com/in/kimcheolsu')
    await user.click(screen.getByRole('button', { name: '계정 생성하기' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/invites/accept',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"token":"abc123"'),
        })
      )
    })

    const callBody = JSON.parse(
      (mockFetch.mock.calls[1][1] as RequestInit).body as string
    )
    expect(callBody.token).toBe('abc123')
    expect(callBody.password).toBe('password123')
    expect(callBody.name).toBe('김철수')
  })

  it('shows password mismatch error', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ valid: true, email: 'test@example.com', invitedByName: '홍길동', memberTier: 'core' }),
    })

    render(<InviteAcceptForm initialToken="abc123" />)
    await screen.findByText('홍길동님이 초대했습니다')

    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('홍길동'), '김철수')
    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInputs[0], 'password123')
    await user.type(passwordInputs[1], 'different456')
    await user.click(screen.getByRole('button', { name: '계정 생성하기' }))

    expect(await screen.findByText('비밀번호가 일치하지 않습니다')).toBeInTheDocument()
  })

  it('shows min length error', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ valid: true, email: 'test@example.com', invitedByName: '홍길동', memberTier: 'core' }),
    })

    render(<InviteAcceptForm initialToken="abc123" />)
    await screen.findByText('홍길동님이 초대했습니다')

    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('홍길동'), '김철수')
    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInputs[0], 'short')
    await user.type(passwordInputs[1], 'short')
    await user.click(screen.getByRole('button', { name: '계정 생성하기' }))

    expect(await screen.findByText('비밀번호는 8자 이상이어야 합니다')).toBeInTheDocument()
  })
})
