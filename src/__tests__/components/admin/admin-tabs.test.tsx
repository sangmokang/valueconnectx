import { render, screen } from '@testing-library/react'
import { AdminTabs } from '@/components/admin/admin-tabs'

const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
}))

vi.mock('next/link', () => ({
  default: ({ href, children, style }: { href: string; children: React.ReactNode; style?: React.CSSProperties }) => (
    <a href={href} style={style}>{children}</a>
  ),
}))

describe('AdminTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "추천 심사" and "초대 관리" links', () => {
    mockUsePathname.mockReturnValue('/admin/recommendations')
    render(<AdminTabs />)
    expect(screen.getByText('추천 심사')).toBeInTheDocument()
    expect(screen.getByText('초대 관리')).toBeInTheDocument()
  })

  it('active tab has gold color and inactive tab has default color', () => {
    mockUsePathname.mockReturnValue('/admin/recommendations')
    render(<AdminTabs />)
    const activeLink = screen.getByText('추천 심사').closest('a')
    expect(activeLink).toHaveStyle({ color: '#c9a84c' })
    const inactiveLink = screen.getByText('초대 관리').closest('a')
    expect(inactiveLink).toHaveStyle({ color: '#1a1a1a' })
  })

  it('links have correct hrefs', () => {
    mockUsePathname.mockReturnValue('/admin/recommendations')
    render(<AdminTabs />)
    expect(screen.getByText('추천 심사').closest('a')).toHaveAttribute('href', '/admin/recommendations')
    expect(screen.getByText('초대 관리').closest('a')).toHaveAttribute('href', '/admin/invites')
  })
})
