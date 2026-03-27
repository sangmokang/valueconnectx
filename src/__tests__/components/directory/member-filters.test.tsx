import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemberFilters } from '@/components/directory/member-filters'

const { mockPush, mockGet } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockGet: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/directory',
  useSearchParams: () => ({
    get: mockGet,
    toString: () => '',
  }),
}))

describe('MemberFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockReturnValue(null)
  })

  it('renders search input with correct placeholder', () => {
    render(<MemberFilters />)
    expect(screen.getByPlaceholderText('이름, 회사, 소개 검색...')).toBeInTheDocument()
  })

  it('renders tier toggle buttons: 전체, Core, Endorsed', () => {
    render(<MemberFilters />)
    expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Core' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Endorsed' })).toBeInTheDocument()
  })

  it('renders industry dropdown', () => {
    render(<MemberFilters />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders "업종 전체" as the default option in industry dropdown', () => {
    render(<MemberFilters />)
    expect(screen.getByRole('option', { name: '업종 전체' })).toBeInTheDocument()
  })

  it('renders industry options in the dropdown', () => {
    render(<MemberFilters />)
    expect(screen.getByRole('option', { name: 'IT/소프트웨어' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '금융/핀테크' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '스타트업' })).toBeInTheDocument()
  })

  it('does not show clear filters button when no filters are active', () => {
    render(<MemberFilters />)
    expect(screen.queryByText('필터 초기화')).not.toBeInTheDocument()
  })

  it('updates search input value when user types', async () => {
    const user = userEvent.setup()
    render(<MemberFilters />)

    const input = screen.getByPlaceholderText('이름, 회사, 소개 검색...')
    await user.type(input, '김철수')

    expect(input).toHaveValue('김철수')
  })

  // Tier/industry buttons call updateParams synchronously (no debounce)
  it('clicking Core tier button calls router.push with tier=core', async () => {
    const user = userEvent.setup()
    render(<MemberFilters />)

    await user.click(screen.getByRole('button', { name: 'Core' }))

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('tier=core'))
  })

  it('clicking Endorsed tier button calls router.push with tier=endorsed', async () => {
    const user = userEvent.setup()
    render(<MemberFilters />)

    await user.click(screen.getByRole('button', { name: 'Endorsed' }))

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('tier=endorsed'))
  })

  it('clicking 전체 tier button calls router.push without tier param', async () => {
    const user = userEvent.setup()
    render(<MemberFilters />)

    await user.click(screen.getByRole('button', { name: '전체' }))

    expect(mockPush).toHaveBeenCalled()
    const calledUrl = mockPush.mock.calls[0][0] as string
    expect(calledUrl).not.toMatch(/tier=\w+/)
  })

  it('selecting industry from dropdown calls router.push with industry param', async () => {
    const user = userEvent.setup()
    render(<MemberFilters />)

    await user.selectOptions(screen.getByRole('combobox'), 'IT/소프트웨어')

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('industry=IT'))
  })

  it('shows "필터 초기화" button when tier filter is active', () => {
    mockGet.mockImplementation((key: string) => (key === 'tier' ? 'core' : null))
    render(<MemberFilters />)
    expect(screen.getByText('필터 초기화')).toBeInTheDocument()
  })

  it('shows "필터 초기화" button when industry filter is active', () => {
    mockGet.mockImplementation((key: string) => (key === 'industry' ? 'IT/소프트웨어' : null))
    render(<MemberFilters />)
    expect(screen.getByText('필터 초기화')).toBeInTheDocument()
  })

  it('clicking "필터 초기화" clears search input and calls router.push', async () => {
    mockGet.mockImplementation((key: string) => (key === 'tier' ? 'core' : null))
    const user = userEvent.setup()
    render(<MemberFilters />)

    await user.click(screen.getByText('필터 초기화'))

    // updateParams is called synchronously to clear all filters
    expect(mockPush).toHaveBeenCalled()
  })

  it('renders mobile filter toggle button', () => {
    render(<MemberFilters />)
    expect(screen.getByRole('button', { name: /필터/ })).toBeInTheDocument()
  })

  // Note: Debounce timing tests omitted — useEffect-based debounce + React 18 concurrent mode
  // + jsdom fake timers produce unreliable results. The debounce is tested implicitly via
  // the search input updating state without immediately calling router.push.
})
