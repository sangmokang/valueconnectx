import { render, screen } from '@testing-library/react'
import { MemberCard } from '@/components/directory/member-card'
import type { MemberCardData } from '@/components/directory/member-card'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const baseMember: MemberCardData = {
  id: 'user-123',
  name: '김철수',
  current_company: '(주)테크컴퍼니',
  title: '소프트웨어 엔지니어',
  member_tier: 'core',
  professional_fields: ['Engineering', 'Product'],
  industry: 'IT/소프트웨어',
  is_open_to_chat: false,
  avatar_url: null,
}

describe('MemberCard', () => {
  it('renders member name', () => {
    render(<MemberCard member={baseMember} />)
    expect(screen.getByText('김철수')).toBeInTheDocument()
  })

  it('renders member company', () => {
    render(<MemberCard member={baseMember} />)
    expect(screen.getByText('(주)테크컴퍼니')).toBeInTheDocument()
  })

  it('renders member title', () => {
    render(<MemberCard member={baseMember} />)
    expect(screen.getByText('소프트웨어 엔지니어')).toBeInTheDocument()
  })

  it('renders Core tier badge when member_tier is core', () => {
    render(<MemberCard member={baseMember} />)
    expect(screen.getByText('Core')).toBeInTheDocument()
  })

  it('renders Endorsed tier badge when member_tier is endorsed', () => {
    render(<MemberCard member={{ ...baseMember, member_tier: 'endorsed' }} />)
    expect(screen.getByText('Endorsed')).toBeInTheDocument()
  })

  it('shows "커피챗 가능" when is_open_to_chat is true', () => {
    render(<MemberCard member={{ ...baseMember, is_open_to_chat: true }} />)
    expect(screen.getByText('커피챗 가능')).toBeInTheDocument()
  })

  it('does not show "커피챗 가능" when is_open_to_chat is false', () => {
    render(<MemberCard member={{ ...baseMember, is_open_to_chat: false }} />)
    expect(screen.queryByText('커피챗 가능')).not.toBeInTheDocument()
  })

  it('renders all professional fields when 3 or fewer', () => {
    render(<MemberCard member={{ ...baseMember, professional_fields: ['Engineering', 'Product', 'Finance'] }} />)
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.getByText('Finance')).toBeInTheDocument()
  })

  it('truncates professional fields to first 3 when more than 3 are provided', () => {
    render(
      <MemberCard
        member={{ ...baseMember, professional_fields: ['Engineering', 'Product', 'Finance', 'Marketing'] }}
      />
    )
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.getByText('Finance')).toBeInTheDocument()
    expect(screen.queryByText('Marketing')).not.toBeInTheDocument()
  })

  it('shows overflow count badge when more than 3 professional fields', () => {
    render(
      <MemberCard
        member={{ ...baseMember, professional_fields: ['Engineering', 'Product', 'Finance', 'Marketing'] }}
      />
    )
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('links to /directory/[id]', () => {
    render(<MemberCard member={baseMember} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/directory/user-123')
  })

  it('renders avatar image when avatar_url is provided', () => {
    render(<MemberCard member={{ ...baseMember, avatar_url: 'https://example.com/avatar.jpg' }} />)
    const img = screen.getByRole('img', { name: '김철수' })
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('renders initials placeholder when avatar_url is null', () => {
    render(<MemberCard member={{ ...baseMember, avatar_url: null }} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    // The first character of the name should appear as the initial
    expect(screen.getByText('김')).toBeInTheDocument()
  })

  it('renders industry label when industry is provided', () => {
    render(<MemberCard member={baseMember} />)
    expect(screen.getByText('IT/소프트웨어')).toBeInTheDocument()
  })

  it('does not render company section when current_company and title are both null', () => {
    render(<MemberCard member={{ ...baseMember, current_company: null, title: null }} />)
    expect(screen.queryByText('(주)테크컴퍼니')).not.toBeInTheDocument()
    expect(screen.queryByText('소프트웨어 엔지니어')).not.toBeInTheDocument()
  })
})
