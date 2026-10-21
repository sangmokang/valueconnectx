import { fireEvent, render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionForm } from '@/components/coffeechat/session-form'

const { mockPush, mockBack, mockRefresh } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockBack: vi.fn(),
  mockRefresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    refresh: mockRefresh,
  }),
}))

const validSession = {
  title: '신규 세션',
  description: '세션 설명입니다',
  session_date: '2026-05-01T10:00',
  duration_minutes: 60,
  max_participants: 5,
  location_type: 'online' as const,
  tags: [],
  agreement_accepted: true,
}

describe('SessionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls POST /api/ceo-coffeechat on valid form submit when creating', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'new-session-id' } }),
    } as Response)

    const user = userEvent.setup()
    render(<SessionForm />)

    fireEvent.change(screen.getByPlaceholderText('커피챗 제목을 입력해주세요'), { target: { value: validSession.title } })
    fireEvent.change(screen.getByPlaceholderText('커피챗에 대해 설명해주세요'), { target: { value: validSession.description } })
    // datetime-local uses a committed value rather than per-character text editing.
    const dateInput = screen.getByLabelText('날짜 및 시간 *')
    fireEvent.change(dateInput, { target: { value: '2026-05-01T10:00' } })
    expect(dateInput).toHaveValue('2026-05-01T10:00')
    await user.click(screen.getByRole('button', { name: '온라인' }))
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: '세션 만들기' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ceo-coffeechat',
        expect.objectContaining({ method: 'POST', body: expect.any(String) })
      )
    })
    expect(JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]!.body as string)).toEqual({ ...validSession, location_detail: '' })
  })

  it('calls PUT /api/ceo-coffeechat/:id on valid form submit when editing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'session-1' } }),
    } as Response)

    const user = userEvent.setup()
    render(
      <SessionForm
        sessionId="session-1"
        initialData={{
          title: '기존 제목',
          description: '기존 설명',
          session_date: '2026-05-01T10:00',
          duration_minutes: 60,
          max_participants: 5,
          location_type: 'online',
          tags: [],
          agreement_accepted: true,
        }}
      />
    )

    await user.click(screen.getByRole('button', { name: '세션 수정' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ceo-coffeechat/session-1',
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  it('redirects to session detail page after successful creation', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'new-session-id' } }),
    } as Response)

    const user = userEvent.setup()
    render(<SessionForm initialData={validSession} />)

    await user.click(screen.getByRole('button', { name: '세션 만들기' }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/ceo-coffeechat/new-session-id')
    })
  })

  it('shows server error message when API returns error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: '저장에 실패했습니다' }),
    } as Response)

    const user = userEvent.setup()
    render(<SessionForm initialData={validSession} />)

    await user.click(screen.getByRole('button', { name: '세션 만들기' }))

    await waitFor(() => {
      expect(screen.getByText('저장에 실패했습니다')).toBeInTheDocument()
    })
  })

  it('shows network error message when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'))

    const user = userEvent.setup()
    render(<SessionForm initialData={validSession} />)

    await user.click(screen.getByRole('button', { name: '세션 만들기' }))

    await waitFor(() => {
      expect(screen.getByText('네트워크 오류가 발생했습니다')).toBeInTheDocument()
    })
  })

  it('shows "저장 중..." on submit button while loading', async () => {
    let resolveFetch!: (value: unknown) => void
    global.fetch = vi.fn().mockReturnValue(new Promise((resolve) => { resolveFetch = resolve }))

    const user = userEvent.setup()
    render(<SessionForm initialData={validSession} />)

    await user.click(screen.getByRole('button', { name: '세션 만들기' }))

    expect(screen.getByRole('button', { name: '저장 중...' })).toBeInTheDocument()

    await act(async () => {
      resolveFetch({ ok: true, json: () => Promise.resolve({ data: { id: 'x' } }) })
    })
    expect(mockPush).toHaveBeenCalledWith('/ceo-coffeechat/x')
  })
})
