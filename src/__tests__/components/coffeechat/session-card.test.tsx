import { render, screen } from '@testing-library/react'
import { SessionCard } from '@/components/coffeechat/session-card'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const baseProps = {
  id: 'session-1',
  title: 'AI 시대의 CTO 역할',
  hostName: '김대표',
  hostCompany: '(주)테크벤처',
  sessionDate: '2026-04-10T14:00:00',
  durationMinutes: 60,
  locationType: 'online' as const,
  tags: ['AI', '스타트업', '리더십'],
  applicationCount: 3,
  status: 'open' as const,
  maxParticipants: 5,
}

describe('SessionCard', () => {
  it('renders session title', () => {
    render(<SessionCard {...baseProps} />)
    expect(screen.getByText('AI 시대의 CTO 역할')).toBeInTheDocument()
  })

  it('renders host name', () => {
    render(<SessionCard {...baseProps} />)
    expect(screen.getByText('김대표')).toBeInTheDocument()
  })

  it('renders host company', () => {
    render(<SessionCard {...baseProps} />)
    expect(screen.getByText('(주)테크벤처')).toBeInTheDocument()
  })

  it('renders duration in minutes', () => {
    render(<SessionCard {...baseProps} />)
    expect(screen.getByText('60분')).toBeInTheDocument()
  })

  it('renders "모집중" status badge when status is open', () => {
    render(<SessionCard {...baseProps} status="open" />)
    expect(screen.getByText('모집중')).toBeInTheDocument()
  })

  it('renders "마감" status badge when status is closed', () => {
    render(<SessionCard {...baseProps} status="closed" />)
    expect(screen.getByText('마감')).toBeInTheDocument()
  })

  it('renders "완료" status badge when status is completed', () => {
    render(<SessionCard {...baseProps} status="completed" />)
    expect(screen.getByText('완료')).toBeInTheDocument()
  })

  it('renders "취소" status badge when status is cancelled', () => {
    render(<SessionCard {...baseProps} status="cancelled" />)
    expect(screen.getByText('취소')).toBeInTheDocument()
  })

  it('renders application count with max participants', () => {
    render(<SessionCard {...baseProps} applicationCount={3} maxParticipants={5} />)
    expect(screen.getByText('3/5 신청')).toBeInTheDocument()
  })

  it('renders tags', () => {
    render(<SessionCard {...baseProps} />)
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getByText('스타트업')).toBeInTheDocument()
    expect(screen.getByText('리더십')).toBeInTheDocument()
  })

  it('only renders first 3 tags when more than 3 are provided', () => {
    render(<SessionCard {...baseProps} tags={['AI', '스타트업', '리더십', '투자']} />)
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getByText('스타트업')).toBeInTheDocument()
    expect(screen.getByText('리더십')).toBeInTheDocument()
    expect(screen.queryByText('투자')).not.toBeInTheDocument()
  })

  it('renders "온라인" location badge for online sessions', () => {
    render(<SessionCard {...baseProps} locationType="online" />)
    expect(screen.getByText('온라인')).toBeInTheDocument()
  })

  it('renders "오프라인" location badge for offline sessions', () => {
    render(<SessionCard {...baseProps} locationType="offline" />)
    expect(screen.getByText('오프라인')).toBeInTheDocument()
  })

  it('renders "하이브리드" location badge for hybrid sessions', () => {
    render(<SessionCard {...baseProps} locationType="hybrid" />)
    expect(screen.getByText('하이브리드')).toBeInTheDocument()
  })

  it('links to the session detail page', () => {
    render(<SessionCard {...baseProps} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/ceo-coffeechat/session-1')
  })
})
