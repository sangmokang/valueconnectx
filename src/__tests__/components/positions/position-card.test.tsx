import { render, screen } from '@testing-library/react'
import { PositionCard } from '@/components/positions/position-card'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/components/positions/interest-button', () => ({
  InterestButton: ({ positionId }: { positionId: string }) => (
    <div data-testid="interest-button" data-position-id={positionId} />
  ),
}))

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

const basePosition = {
  id: 'pos-1',
  company_name: 'TechCorp',
  title: 'Senior Backend Engineer',
  team_size: '10-50',
  role_description: 'Build scalable backend systems for our growing platform',
  salary_range: '5000-8000만원',
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
  my_interest: null as null,
}

describe('PositionCard', () => {
  it('renders company name', () => {
    render(<PositionCard position={basePosition} />)
    expect(screen.getByText('TechCorp')).toBeInTheDocument()
  })

  it('renders position title', () => {
    render(<PositionCard position={basePosition} />)
    expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument()
  })

  it('renders salary range when provided', () => {
    render(<PositionCard position={basePosition} />)
    expect(screen.getByText('5000-8000만원')).toBeInTheDocument()
  })

  it('does not render salary range when null', () => {
    render(<PositionCard position={{ ...basePosition, salary_range: null }} />)
    expect(screen.queryByText('5000-8000만원')).not.toBeInTheDocument()
  })

  it('renders team size when provided', () => {
    render(<PositionCard position={basePosition} />)
    expect(screen.getByText('팀 규모 10-50')).toBeInTheDocument()
  })

  it('does not render team size when null', () => {
    render(<PositionCard position={{ ...basePosition, team_size: null }} />)
    expect(screen.queryByText(/팀 규모/)).not.toBeInTheDocument()
  })

  it('renders role description preview', () => {
    render(<PositionCard position={basePosition} />)
    expect(screen.getByText('Build scalable backend systems for our growing platform')).toBeInTheDocument()
  })

  it('links to the position detail page', () => {
    render(<PositionCard position={basePosition} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/positions/pos-1')
  })

  it('renders the interest button with correct position id', () => {
    render(<PositionCard position={basePosition} />)
    const btn = screen.getByTestId('interest-button')
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('data-position-id', 'pos-1')
  })
})
