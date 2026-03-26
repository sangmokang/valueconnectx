import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/login-form'

const { mockSignIn, mockPush, mockRefresh } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignIn,
    },
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email and password inputs', () => {
    render(<LoginForm />)
    expect(screen.getByPlaceholderText('name@company.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('renders login button with text "로그인"', () => {
    render(<LoginForm />)
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
  })

  it('shows error on auth failure', async () => {
    mockSignIn.mockResolvedValueOnce({ error: { message: 'Invalid credentials' } })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('name@company.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('이메일 또는 비밀번호가 올바르지 않습니다')).toBeInTheDocument()
  })

  it('calls signInWithPassword with entered email and password', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('name@company.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(mockSignIn).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' })
  })

  it('redirects to redirectTo prop on success', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null })
    const user = userEvent.setup()
    render(<LoginForm redirectTo="/dashboard" />)

    await user.type(screen.getByPlaceholderText('name@company.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    await screen.findByRole('button')
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it("redirects to '/' when no redirectTo provided", async () => {
    mockSignIn.mockResolvedValueOnce({ error: null })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('name@company.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    await screen.findByRole('button')
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('button shows "로그인 중..." during loading', async () => {
    let resolveSignIn!: (value: unknown) => void
    mockSignIn.mockReturnValueOnce(new Promise((resolve) => { resolveSignIn = resolve }))
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('name@company.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(screen.getByRole('button', { name: '로그인 중...' })).toBeInTheDocument()

    resolveSignIn({ error: null })
  })

  it('button is disabled during loading', async () => {
    let resolveSignIn!: (value: unknown) => void
    mockSignIn.mockReturnValueOnce(new Promise((resolve) => { resolveSignIn = resolve }))
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('name@company.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(screen.getByRole('button', { name: '로그인 중...' })).toBeDisabled()

    resolveSignIn({ error: null })
  })
})
