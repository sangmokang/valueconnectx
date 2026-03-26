import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InviteList } from '@/components/admin/invite-list'

const emptyFetchResponse = () =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: [], total: 0 }),
  } as Response)

describe('InviteList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all 5 filter buttons: 전체, 대기, 수락, 만료, 취소', async () => {
    global.fetch = vi.fn().mockImplementation(emptyFetchResponse)
    render(<InviteList />)
    expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '대기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '수락' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '만료' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument()
  })

  it('renders search input with placeholder "이메일로 검색..."', async () => {
    global.fetch = vi.fn().mockImplementation(emptyFetchResponse)
    render(<InviteList />)
    expect(screen.getByPlaceholderText('이메일로 검색...')).toBeInTheDocument()
  })

  it('renders "직접 초대" button', async () => {
    global.fetch = vi.fn().mockImplementation(emptyFetchResponse)
    render(<InviteList />)
    expect(screen.getByRole('button', { name: '직접 초대' })).toBeInTheDocument()
  })

  it('shows "초대가 없습니다" when data is empty', async () => {
    global.fetch = vi.fn().mockImplementation(emptyFetchResponse)
    render(<InviteList />)
    await waitFor(() => {
      expect(screen.getByText('초대가 없습니다')).toBeInTheDocument()
    })
  })

  it('clicking "직접 초대" shows create form', async () => {
    global.fetch = vi.fn().mockImplementation(emptyFetchResponse)
    const user = userEvent.setup()
    render(<InviteList />)

    expect(screen.queryByPlaceholderText('name@company.com')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '직접 초대' }))
    expect(screen.getByPlaceholderText('name@company.com')).toBeInTheDocument()
  })
})
