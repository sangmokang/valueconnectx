import { render, screen, fireEvent } from '@testing-library/react'
import { PositionCard } from '@/components/positions/position-card'

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
  location: '서울 강남',
  level: 'Senior',
  tags: ['Backend', 'Node.js'],
}

describe('PositionCard', () => {
  const defaultProps = {
    position: basePosition,
    isOpen: false,
    onToggle: vi.fn(),
  }

  it('renders company name', () => {
    render(<PositionCard {...defaultProps} />)
    expect(screen.getByText('TechCorp')).toBeInTheDocument()
  })

  it('renders position title', () => {
    render(<PositionCard {...defaultProps} />)
    expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument()
  })

  it('renders salary range with icon when provided', () => {
    render(<PositionCard {...defaultProps} />)
    expect(screen.getByText(/5000-8000만원/)).toBeInTheDocument()
  })

  it('does not render salary range when null', () => {
    render(<PositionCard {...defaultProps} position={{ ...basePosition, salary_range: null }} />)
    expect(screen.queryByText(/5000-8000만원/)).not.toBeInTheDocument()
  })

  it('renders location when provided', () => {
    render(<PositionCard {...defaultProps} />)
    expect(screen.getByText(/서울 강남/)).toBeInTheDocument()
  })

  it('renders level when provided', () => {
    render(<PositionCard {...defaultProps} />)
    expect(screen.getByText(/📊 Senior/)).toBeInTheDocument()
  })

  it('calls onToggle when header is clicked', () => {
    const onToggle = vi.fn()
    render(<PositionCard {...defaultProps} onToggle={onToggle} />)
    fireEvent.click(screen.getByText('Senior Backend Engineer'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('shows expanded detail when isOpen is true', () => {
    render(<PositionCard {...defaultProps} isOpen={true} />)
    expect(screen.getByText('POSITION SUMMARY')).toBeInTheDocument()
    expect(screen.getByText(/Build scalable backend systems/)).toBeInTheDocument()
  })

  it('does not show expanded detail when isOpen is false', () => {
    render(<PositionCard {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('POSITION SUMMARY')).not.toBeInTheDocument()
  })
})
