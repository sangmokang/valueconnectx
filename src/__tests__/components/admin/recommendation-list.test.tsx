import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecommendationList } from '@/components/admin/recommendation-list'

const emptyFetchResponse = () =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: [], total: 0 }),
  } as Response)

const pendingItemFetchResponse = () =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        data: [
          {
            id: 'rec-1',
            recommended_email: 'test@example.com',
            recommended_name: '홍길동',
            reason: '훌륭한 분입니다',
            member_tier: 'endorsed',
            status: 'pending',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
      }),
  } as Response)

describe('RecommendationList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filter buttons: 전체, 대기, 승인, 거절', async () => {
    global.fetch = vi.fn().mockImplementation(emptyFetchResponse)
    render(<RecommendationList />)
    expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '대기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '승인' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '거절' })).toBeInTheDocument()
  })

  it('fetches data on mount with /api/recommendations/list', async () => {
    global.fetch = vi.fn().mockImplementation(emptyFetchResponse)
    render(<RecommendationList />)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
      expect(url).toContain('/api/recommendations/list')
    })
  })

  it('shows "추천이 없습니다" when data is empty', async () => {
    global.fetch = vi.fn().mockImplementation(emptyFetchResponse)
    render(<RecommendationList />)
    await waitFor(() => {
      expect(screen.getByText('추천이 없습니다')).toBeInTheDocument()
    })
  })

  it('shows "승인" and "거절" buttons for pending items', async () => {
    global.fetch = vi.fn().mockImplementation(pendingItemFetchResponse)
    render(<RecommendationList />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '승인' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '거절' })).toBeInTheDocument()
    })
  })

  it('clicking filter button refetches with new status', async () => {
    global.fetch = vi.fn().mockImplementation(emptyFetchResponse)
    const user = userEvent.setup()
    render(<RecommendationList />)
    await waitFor(() => screen.getByText('추천이 없습니다'))

    const callCountBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length
    await user.click(screen.getByRole('button', { name: '승인' }))

    await waitFor(() => {
      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls
      expect(calls.length).toBeGreaterThan(callCountBefore)
      const lastUrl = calls[calls.length - 1][0] as string
      expect(lastUrl).toContain('status=approved')
    })
  })
})
