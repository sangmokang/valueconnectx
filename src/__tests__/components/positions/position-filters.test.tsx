import { render, screen, fireEvent } from '@testing-library/react'
import { PositionFilters } from '@/components/positions/position-filters'

describe('PositionFilters', () => {
  const defaultProps = {
    value: '전체' as const,
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all domain filter tabs', () => {
    render(<PositionFilters {...defaultProps} />)
    expect(screen.getByText('전체')).toBeInTheDocument()
    expect(screen.getByText('사업개발')).toBeInTheDocument()
    expect(screen.getByText('프로덕트')).toBeInTheDocument()
    expect(screen.getByText('엔지니어링')).toBeInTheDocument()
    expect(screen.getByText('재무')).toBeInTheDocument()
    expect(screen.getByText('세일즈')).toBeInTheDocument()
  })

  it('calls onChange when a filter tab is clicked', () => {
    const onChange = vi.fn()
    render(<PositionFilters {...defaultProps} onChange={onChange} />)
    fireEvent.click(screen.getByText('엔지니어링'))
    expect(onChange).toHaveBeenCalledWith('엔지니어링')
  })

  it('calls onChange with 전체 when 전체 tab is clicked', () => {
    const onChange = vi.fn()
    render(<PositionFilters {...defaultProps} value="엔지니어링" onChange={onChange} />)
    fireEvent.click(screen.getByText('전체'))
    expect(onChange).toHaveBeenCalledWith('전체')
  })
})
