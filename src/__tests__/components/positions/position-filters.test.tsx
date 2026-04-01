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
    expect(screen.getByText('Business')).toBeInTheDocument()
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('Finance')).toBeInTheDocument()
    expect(screen.getByText('Sales')).toBeInTheDocument()
  })

  it('calls onChange when a filter tab is clicked', () => {
    const onChange = vi.fn()
    render(<PositionFilters {...defaultProps} onChange={onChange} />)
    fireEvent.click(screen.getByText('Engineering'))
    expect(onChange).toHaveBeenCalledWith('Engineering')
  })

  it('calls onChange with 전체 when 전체 tab is clicked', () => {
    const onChange = vi.fn()
    render(<PositionFilters {...defaultProps} value="Engineering" onChange={onChange} />)
    fireEvent.click(screen.getByText('전체'))
    expect(onChange).toHaveBeenCalledWith('전체')
  })
})
