import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginForm, SignupForm } from '@/components/auth/login-form'

const { mockSignInWithOtp, mockPush, mockRefresh } = vi.hoisted(() => ({
  mockSignInWithOtp: vi.fn(),
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
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
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost' },
      writable: true,
    })
  })

  it('renders email-only login form', () => {
    render(<LoginForm />)

    expect(screen.getByPlaceholderText('name@company.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인 링크 받기' })).toBeInTheDocument()
    expect(screen.queryByLabelText('비밀번호')).not.toBeInTheDocument()
  })

  it('sends login magic link with sanitized callback redirect', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: null })
    const user = userEvent.setup()
    render(<LoginForm redirectTo="/dashboard" />)

    await user.type(screen.getByPlaceholderText('name@company.com'), 'Test@Example.com')
    await user.click(screen.getByRole('button', { name: '로그인 링크 받기' }))

    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'http://localhost/auth/callback?next=%2Fdashboard&type=login',
          shouldCreateUser: false,
        },
      })
    })
    expect(await screen.findByText('로그인 링크를 보냈습니다')).toBeInTheDocument()
  })

  it('shows error on magic link failure', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: { message: 'send failed' } })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('name@company.com'), 'test@example.com')
    await user.click(screen.getByRole('button', { name: '로그인 링크 받기' }))

    expect(await screen.findByText('로그인 링크를 보내지 못했습니다. 이메일 주소를 확인하고 다시 시도해주세요.')).toBeInTheDocument()
  })

  it('disables submit button while sending', async () => {
    let resolveSignIn!: (value: unknown) => void
    mockSignInWithOtp.mockReturnValueOnce(new Promise((resolve) => { resolveSignIn = resolve }))
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('name@company.com'), 'test@example.com')
    await user.click(screen.getByRole('button', { name: '로그인 링크 받기' }))

    expect(screen.getByRole('button', { name: '링크 전송 중...' })).toBeDisabled()

    resolveSignIn({ error: null })
  })
})

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost' },
      writable: true,
    })
  })

  it('sends signup magic link with user creation enabled', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: null })
    const user = userEvent.setup()
    render(<SignupForm />)

    await user.type(screen.getByLabelText('이름'), '홍길동')
    await user.type(screen.getByPlaceholderText('name@company.com'), 'invitee@example.com')
    await user.click(screen.getByRole('button', { name: '가입 링크 받기' }))

    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'invitee@example.com',
        options: {
          emailRedirectTo: 'http://localhost/auth/callback?next=%2Fonboarding&type=signup',
          shouldCreateUser: true,
          data: { name: '홍길동' },
        },
      })
    })
    expect(await screen.findByText('가입 링크를 보냈습니다')).toBeInTheDocument()
  })
})
