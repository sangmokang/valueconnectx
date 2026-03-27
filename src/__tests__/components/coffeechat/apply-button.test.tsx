import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApplyButton } from '@/components/coffeechat/apply-button'

const { mockPush, mockRefresh } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

// ApplyModal is a separate component — stub it to isolate ApplyButton behavior
vi.mock('@/components/coffeechat/apply-modal', () => ({
  ApplyModal: ({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) => (
    <div data-testid="apply-modal">
      <button onClick={onSuccess}>모달 신청 완료</button>
      <button onClick={onClose}>모달 닫기</button>
    </div>
  ),
}))

const baseProps = {
  sessionId: 'session-1',
  sessionTitle: 'AI 시대의 CTO 역할',
  sessionStatus: 'open',
  hasApplied: false,
  applicationStatus: null as 'pending' | 'accepted' | 'rejected' | null,
  hostContactEmail: null as string | null,
}

describe('ApplyButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "비밀 신청하기" button when session is open and not applied', () => {
    render(<ApplyButton {...baseProps} />)
    expect(screen.getByRole('button', { name: '비밀 신청하기' })).toBeInTheDocument()
  })

  it('shows "신청 마감" when session is closed and not applied', () => {
    render(<ApplyButton {...baseProps} sessionStatus="closed" />)
    expect(screen.getByText('신청 마감')).toBeInTheDocument()
  })

  it('does not show apply button when session is closed', () => {
    render(<ApplyButton {...baseProps} sessionStatus="closed" />)
    expect(screen.queryByRole('button', { name: '비밀 신청하기' })).not.toBeInTheDocument()
  })

  it('shows "신청 완료" status badge when applied with pending status', () => {
    render(<ApplyButton {...baseProps} hasApplied={true} applicationStatus="pending" />)
    expect(screen.getByText('신청 완료')).toBeInTheDocument()
  })

  it('shows "수락됨" status badge when application is accepted', () => {
    render(<ApplyButton {...baseProps} hasApplied={true} applicationStatus="accepted" hostContactEmail="host@example.com" />)
    expect(screen.getByText('수락됨')).toBeInTheDocument()
  })

  it('shows "거절됨" status badge when application is rejected', () => {
    render(<ApplyButton {...baseProps} hasApplied={true} applicationStatus="rejected" />)
    expect(screen.getByText('거절됨')).toBeInTheDocument()
  })

  it('shows host email link when application is accepted and hostContactEmail provided', () => {
    render(
      <ApplyButton
        {...baseProps}
        hasApplied={true}
        applicationStatus="accepted"
        hostContactEmail="host@example.com"
      />
    )
    const link = screen.getByRole('link', { name: 'host@example.com' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'mailto:host@example.com')
  })

  it('does not show host email when application is accepted but no email provided', () => {
    render(<ApplyButton {...baseProps} hasApplied={true} applicationStatus="accepted" hostContactEmail={null} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows waiting message when application is pending', () => {
    render(<ApplyButton {...baseProps} hasApplied={true} applicationStatus="pending" />)
    expect(screen.getByText('호스트의 검토를 기다리고 있습니다')).toBeInTheDocument()
  })

  it('shows rejection message when application is rejected', () => {
    render(<ApplyButton {...baseProps} hasApplied={true} applicationStatus="rejected" />)
    expect(screen.getByText('이번에는 아쉽게도 거절되었습니다')).toBeInTheDocument()
  })

  it('opens modal when "비밀 신청하기" is clicked', async () => {
    const user = userEvent.setup()
    render(<ApplyButton {...baseProps} />)
    await user.click(screen.getByRole('button', { name: '비밀 신청하기' }))
    expect(screen.getByTestId('apply-modal')).toBeInTheDocument()
  })

  it('closes modal when onClose is called', async () => {
    const user = userEvent.setup()
    render(<ApplyButton {...baseProps} />)
    await user.click(screen.getByRole('button', { name: '비밀 신청하기' }))
    expect(screen.getByTestId('apply-modal')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '모달 닫기' }))
    expect(screen.queryByTestId('apply-modal')).not.toBeInTheDocument()
  })

  it('switches to applied state and calls router.refresh after successful modal submission', async () => {
    const user = userEvent.setup()
    render(<ApplyButton {...baseProps} />)
    await user.click(screen.getByRole('button', { name: '비밀 신청하기' }))
    await user.click(screen.getByRole('button', { name: '모달 신청 완료' }))
    expect(mockRefresh).toHaveBeenCalledOnce()
    // Modal should close and applied state shown
    expect(screen.queryByTestId('apply-modal')).not.toBeInTheDocument()
    expect(screen.getByText('신청 완료')).toBeInTheDocument()
  })
})
