import { render, screen } from '@testing-library/react'
import { PeerChatCard } from '@/components/coffeechat/peer-chat-card'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const baseProps = {
  id: 'chat-1',
  title: '커리어 전환 고민 나누실 분 구합니다',
  content: '5년차 백엔드 개발자로 일하고 있습니다. 최근 PM으로의 전환을 고민 중인데 비슷한 경험이 있으신 분과 이야기 나누고 싶습니다.',
  category: 'career' as const,
  status: 'open' as const,
  authorName: '김개발',
  authorTitle: 'Backend Engineer',
  authorCompany: '(주)테크스타트업',
  createdAt: '2026-03-27T10:00:00Z',
  applicationCount: 3,
}

describe('PeerChatCard', () => {
  it('renders title', () => {
    render(<PeerChatCard {...baseProps} />)
    expect(screen.getByText('커리어 전환 고민 나누실 분 구합니다')).toBeInTheDocument()
  })

  it('renders content excerpt when content is longer than 120 characters', () => {
    const longContent = '가'.repeat(200)
    render(<PeerChatCard {...baseProps} content={longContent} />)
    const expected = '가'.repeat(120) + '…'
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('renders full content when content is 120 characters or fewer', () => {
    const shortContent = '짧은 내용입니다'
    render(<PeerChatCard {...baseProps} content={shortContent} />)
    expect(screen.getByText(shortContent)).toBeInTheDocument()
  })

  it('renders author name', () => {
    render(<PeerChatCard {...baseProps} />)
    expect(screen.getByText('김개발')).toBeInTheDocument()
  })

  it('renders author title and company joined with middle dot', () => {
    render(<PeerChatCard {...baseProps} />)
    expect(screen.getByText('Backend Engineer · (주)테크스타트업')).toBeInTheDocument()
  })

  it('renders only company when authorTitle is null', () => {
    render(<PeerChatCard {...baseProps} authorTitle={null} />)
    expect(screen.getByText('(주)테크스타트업')).toBeInTheDocument()
  })

  it('renders only title when authorCompany is null', () => {
    render(<PeerChatCard {...baseProps} authorCompany={null} />)
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument()
  })

  it('does not render author subtitle when both authorTitle and authorCompany are null', () => {
    render(<PeerChatCard {...baseProps} authorTitle={null} authorCompany={null} />)
    expect(screen.queryByText('·')).not.toBeInTheDocument()
  })

  it('renders category badge with Korean label for career', () => {
    render(<PeerChatCard {...baseProps} category="career" />)
    expect(screen.getByText('커리어')).toBeInTheDocument()
  })

  it('renders category badge with Korean label for general', () => {
    render(<PeerChatCard {...baseProps} category="general" />)
    expect(screen.getByText('일반')).toBeInTheDocument()
  })

  it('renders category badge with Korean label for hiring', () => {
    render(<PeerChatCard {...baseProps} category="hiring" />)
    expect(screen.getByText('채용')).toBeInTheDocument()
  })

  it('renders category badge with Korean label for mentoring', () => {
    render(<PeerChatCard {...baseProps} category="mentoring" />)
    expect(screen.getByText('멘토링')).toBeInTheDocument()
  })

  it('renders "신청 받는 중" status badge when status is open', () => {
    render(<PeerChatCard {...baseProps} status="open" />)
    expect(screen.getByText('신청 받는 중')).toBeInTheDocument()
  })

  it('renders "매칭 완료" status badge when status is matched', () => {
    render(<PeerChatCard {...baseProps} status="matched" />)
    expect(screen.getByText('매칭 완료')).toBeInTheDocument()
  })

  it('renders "마감" status badge when status is closed', () => {
    render(<PeerChatCard {...baseProps} status="closed" />)
    expect(screen.getByText('마감')).toBeInTheDocument()
  })

  it('renders application count', () => {
    render(<PeerChatCard {...baseProps} applicationCount={3} />)
    expect(screen.getByText('3명 신청')).toBeInTheDocument()
  })

  it('renders application count of zero', () => {
    render(<PeerChatCard {...baseProps} applicationCount={0} />)
    expect(screen.getByText('0명 신청')).toBeInTheDocument()
  })

  it('links to the correct detail page', () => {
    render(<PeerChatCard {...baseProps} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/coffeechat/chat-1')
  })
})
