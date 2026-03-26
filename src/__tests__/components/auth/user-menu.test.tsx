import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserMenu } from '@/components/auth/user-menu'

const { mockSignOut, mockPush, mockRefresh } = vi.hoisted(() => ({
  mockSignOut: vi.fn(),
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignOut.mockResolvedValue({})
  })

  it('renders user name', () => {
    render(<UserMenu userName="홍길동" isAdmin={false} />)
    expect(screen.getByText('홍길동')).toBeInTheDocument()
  })

  it('toggles dropdown on click', async () => {
    const user = userEvent.setup()
    render(<UserMenu userName="홍길동" isAdmin={false} />)

    expect(screen.queryByText('프로필')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /홍길동/ }))
    expect(screen.getByText('프로필')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /홍길동/ }))
    expect(screen.queryByText('프로필')).not.toBeInTheDocument()
  })

  it('shows "관리" link when isAdmin=true', async () => {
    const user = userEvent.setup()
    render(<UserMenu userName="관리자" isAdmin={true} />)

    await user.click(screen.getByRole('button', { name: /관리자/ }))
    const adminLink = screen.getByRole('link', { name: '관리' })
    expect(adminLink).toBeInTheDocument()
    expect(adminLink).toHaveAttribute('href', '/admin/recommendations')
  })

  it('hides "관리" link when isAdmin=false', async () => {
    const user = userEvent.setup()
    render(<UserMenu userName="일반회원" isAdmin={false} />)

    await user.click(screen.getByRole('button', { name: /일반회원/ }))
    expect(screen.queryByRole('link', { name: '관리' })).not.toBeInTheDocument()
  })

  it('calls signOut on "로그아웃" click', async () => {
    const user = userEvent.setup()
    render(<UserMenu userName="홍길동" isAdmin={false} />)

    await user.click(screen.getByRole('button', { name: /홍길동/ }))
    await user.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(mockSignOut).toHaveBeenCalled()
  })
})
