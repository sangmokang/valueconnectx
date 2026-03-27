import { render, screen, fireEvent } from '@testing-library/react'
import { PositionFilters } from '@/components/positions/position-filters'

const { mockPush, mockSearchParamsGet } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSearchParamsGet: vi.fn().mockReturnValue(null),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/positions',
  useSearchParams: () => ({
    get: mockSearchParamsGet,
    toString: () => '',
  }),
}))

describe('PositionFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParamsGet.mockReturnValue(null)
  })

  it('renders search input with placeholder text', () => {
    render(<PositionFilters />)
    expect(screen.getByPlaceholderText('포지션, 회사, 역할 검색...')).toBeInTheDocument()
  })

  it('renders company filter input', () => {
    render(<PositionFilters />)
    expect(screen.getByPlaceholderText('회사명 필터...')).toBeInTheDocument()
  })

  it('search input updates its displayed value when user types', () => {
    render(<PositionFilters />)
    const searchInput = screen.getByPlaceholderText('포지션, 회사, 역할 검색...')
    fireEvent.change(searchInput, { target: { value: 'engineer' } })
    expect((searchInput as HTMLInputElement).value).toBe('engineer')
  })

  it('does not render reset button when no filters are active', () => {
    mockSearchParamsGet.mockReturnValue(null)
    render(<PositionFilters />)
    expect(screen.queryByText('필터 초기화')).not.toBeInTheDocument()
  })

  it('renders reset button when search query filter is active', () => {
    mockSearchParamsGet.mockImplementation((key: string) => {
      if (key === 'q') return 'engineer'
      return null
    })
    render(<PositionFilters />)
    expect(screen.getByText('필터 초기화')).toBeInTheDocument()
  })

  it('renders reset button when company filter is active', () => {
    mockSearchParamsGet.mockImplementation((key: string) => {
      if (key === 'company') return 'TechCorp'
      return null
    })
    render(<PositionFilters />)
    expect(screen.getByText('필터 초기화')).toBeInTheDocument()
  })

  it('clears search input when reset button is clicked', () => {
    mockSearchParamsGet.mockImplementation((key: string) => {
      if (key === 'q') return 'engineer'
      return null
    })
    render(<PositionFilters />)
    const resetButton = screen.getByText('필터 초기화')
    fireEvent.click(resetButton)
    const searchInput = screen.getByPlaceholderText('포지션, 회사, 역할 검색...')
    expect((searchInput as HTMLInputElement).value).toBe('')
  })
})
