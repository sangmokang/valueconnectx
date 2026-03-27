import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApplicationList } from '@/components/coffeechat/application-list'

const makeApplicant = (overrides?: Partial<{
  id: string
  name: string
  email: string
  title: string | null
  current_company: string | null
  member_tier: string
  avatar_url: string | null
}>) => ({
  id: 'applicant-1',
  name: '이지원',
  email: 'jiwon@example.com',
  title: '프로덕트 매니저',
  current_company: '(주)스타트업',
  member_tier: 'core',
  avatar_url: null,
  ...overrides,
})

const makeApplication = (overrides?: Partial<{
  id: string
  session_id: string
  applicant_id: string
  applicant: ReturnType<typeof makeApplicant>
  message: string | null
  status: 'pending' | 'accepted' | 'rejected'
  reviewed_at: string | null
  created_at: string
  contact_email: string | null
}>) => ({
  id: 'app-1',
  session_id: 'session-1',
  applicant_id: 'applicant-1',
  applicant: makeApplicant(),
  message: null,
  status: 'pending' as const,
  reviewed_at: null,
  created_at: '2026-01-15T10:00:00Z',
  contact_email: null,
  ...overrides,
})

describe('ApplicationList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state message when no applications', () => {
    render(<ApplicationList sessionId="session-1" initialApplications={[]} />)
    expect(screen.getByText('아직 신청자가 없습니다')).toBeInTheDocument()
  })

  it('renders applicant name', () => {
    render(<ApplicationList sessionId="session-1" initialApplications={[makeApplication()]} />)
    expect(screen.getByText('이지원')).toBeInTheDocument()
  })

  it('renders applicant name initial as avatar', () => {
    render(<ApplicationList sessionId="session-1" initialApplications={[makeApplication()]} />)
    expect(screen.getByText('이')).toBeInTheDocument()
  })

  it('renders Core tier badge for core member', () => {
    render(<ApplicationList sessionId="session-1" initialApplications={[makeApplication()]} />)
    expect(screen.getByText('Core')).toBeInTheDocument()
  })

  it('renders Endorsed tier badge for endorsed member', () => {
    const app = makeApplication({ applicant: makeApplicant({ member_tier: 'endorsed' }) })
    render(<ApplicationList sessionId="session-1" initialApplications={[app]} />)
    expect(screen.getByText('Endorsed')).toBeInTheDocument()
  })

  it('renders "검토중" status badge for pending application', () => {
    render(<ApplicationList sessionId="session-1" initialApplications={[makeApplication()]} />)
    expect(screen.getByText('검토중')).toBeInTheDocument()
  })

  it('renders "수락됨" status badge for accepted application', () => {
    const app = makeApplication({ status: 'accepted' })
    render(<ApplicationList sessionId="session-1" initialApplications={[app]} />)
    expect(screen.getByText('수락됨')).toBeInTheDocument()
  })

  it('renders "거절됨" status badge for rejected application', () => {
    const app = makeApplication({ status: 'rejected' })
    render(<ApplicationList sessionId="session-1" initialApplications={[app]} />)
    expect(screen.getByText('거절됨')).toBeInTheDocument()
  })

  it('renders applicant title and company', () => {
    render(<ApplicationList sessionId="session-1" initialApplications={[makeApplication()]} />)
    expect(screen.getByText('프로덕트 매니저 · (주)스타트업')).toBeInTheDocument()
  })

  it('renders application message when provided', () => {
    const app = makeApplication({ message: '꼭 참여하고 싶습니다' })
    render(<ApplicationList sessionId="session-1" initialApplications={[app]} />)
    expect(screen.getByText('꼭 참여하고 싶습니다')).toBeInTheDocument()
  })

  it('shows accept and reject buttons for pending application', () => {
    render(<ApplicationList sessionId="session-1" initialApplications={[makeApplication()]} />)
    expect(screen.getByRole('button', { name: '수락' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '거절' })).toBeInTheDocument()
  })

  it('does not show accept/reject buttons for accepted application', () => {
    const app = makeApplication({ status: 'accepted' })
    render(<ApplicationList sessionId="session-1" initialApplications={[app]} />)
    expect(screen.queryByRole('button', { name: '수락' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '거절' })).not.toBeInTheDocument()
  })

  it('does not show accept/reject buttons for rejected application', () => {
    const app = makeApplication({ status: 'rejected' })
    render(<ApplicationList sessionId="session-1" initialApplications={[app]} />)
    expect(screen.queryByRole('button', { name: '수락' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '거절' })).not.toBeInTheDocument()
  })

  it('shows contact email link after accepting a pending application', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { contact_email: 'jiwon@example.com' } }),
    } as Response)

    const user = userEvent.setup()
    render(<ApplicationList sessionId="session-1" initialApplications={[makeApplication()]} />)

    await user.click(screen.getByRole('button', { name: '수락' }))

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'jiwon@example.com' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'mailto:jiwon@example.com')
    })
  })

  it('calls PUT /api/ceo-coffeechat/:sessionId/applications/:appId when accepting', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { contact_email: null } }),
    } as Response)

    const user = userEvent.setup()
    render(<ApplicationList sessionId="session-1" initialApplications={[makeApplication()]} />)

    await user.click(screen.getByRole('button', { name: '수락' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ceo-coffeechat/session-1/applications/app-1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'accepted' }),
        })
      )
    })
  })

  it('calls PUT with rejected status when reject button is clicked', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { contact_email: null } }),
    } as Response)

    const user = userEvent.setup()
    render(<ApplicationList sessionId="session-1" initialApplications={[makeApplication()]} />)

    await user.click(screen.getByRole('button', { name: '거절' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ceo-coffeechat/session-1/applications/app-1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'rejected' }),
        })
      )
    })
  })

  it('shows error message when API returns error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: '처리에 실패했습니다' }),
    } as Response)

    const user = userEvent.setup()
    render(<ApplicationList sessionId="session-1" initialApplications={[makeApplication()]} />)

    await user.click(screen.getByRole('button', { name: '수락' }))

    await waitFor(() => {
      expect(screen.getByText('처리에 실패했습니다')).toBeInTheDocument()
    })
  })

  it('shows network error message when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'))

    const user = userEvent.setup()
    render(<ApplicationList sessionId="session-1" initialApplications={[makeApplication()]} />)

    await user.click(screen.getByRole('button', { name: '수락' }))

    await waitFor(() => {
      expect(screen.getByText('네트워크 오류가 발생했습니다')).toBeInTheDocument()
    })
  })

  it('renders multiple applications', () => {
    const apps = [
      makeApplication({ id: 'app-1', applicant: makeApplicant({ id: 'a-1', name: '이지원' }) }),
      makeApplication({ id: 'app-2', applicant: makeApplicant({ id: 'a-2', name: '박민준' }), applicant_id: 'a-2' }),
    ]
    render(<ApplicationList sessionId="session-1" initialApplications={apps} />)
    expect(screen.getByText('이지원')).toBeInTheDocument()
    expect(screen.getByText('박민준')).toBeInTheDocument()
  })
})
