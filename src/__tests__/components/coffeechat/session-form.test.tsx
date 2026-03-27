import { render, screen, waitFor } from '@testing-library/react'
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

describe('SessionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title input field', () => {
    render(<SessionForm />)
    expect(screen.getByPlaceholderText('커피챗 제목을 입력해주세요')).toBeInTheDocument()
  })

  it('renders description textarea', () => {
    render(<SessionForm />)
    expect(screen.getByPlaceholderText('커피챗에 대해 설명해주세요')).toBeInTheDocument()
  })

  it('renders datetime-local input for session date', () => {
    render(<SessionForm />)
    const dateInput = screen.getByLabelText('날짜 및 시간 *') as HTMLInputElement
    expect(dateInput).toBeInTheDocument()
    expect(dateInput.type).toBe('datetime-local')
  })

  it('renders duration minutes input with default value 60', () => {
    render(<SessionForm />)
    const durationInput = screen.getByLabelText('소요 시간 (분) *') as HTMLInputElement
    expect(durationInput).toBeInTheDocument()
    expect(durationInput.value).toBe('60')
  })

  it('renders max participants input with default value 5', () => {
    render(<SessionForm />)
    const maxInput = screen.getByLabelText('최대 참가 인원 *') as HTMLInputElement
    expect(maxInput).toBeInTheDocument()
    expect(maxInput.value).toBe('5')
  })

  it('renders location type buttons: 온라인, 오프라인, 하이브리드', () => {
    render(<SessionForm />)
    expect(screen.getByRole('button', { name: '온라인' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '오프라인' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '하이브리드' })).toBeInTheDocument()
  })

  it('renders target tier buttons: 전체, Core, Endorsed', () => {
    render(<SessionForm />)
    expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Core' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Endorsed' })).toBeInTheDocument()
  })

  it('renders location detail input', () => {
    render(<SessionForm />)
    expect(screen.getByPlaceholderText('Zoom 링크, 주소 등')).toBeInTheDocument()
  })

  it('renders tag input with placeholder', () => {
    render(<SessionForm />)
    expect(screen.getByPlaceholderText('태그 입력 후 Enter')).toBeInTheDocument()
  })

  it('renders tag add button', () => {
    render(<SessionForm />)
    expect(screen.getByRole('button', { name: '추가' })).toBeInTheDocument()
  })

  it('renders headhunting agreement checkbox', () => {
    render(<SessionForm />)
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox).toBeInTheDocument()
    expect(checkbox.checked).toBe(false)
  })

  it('renders "세션 만들기" submit button when creating new session', () => {
    render(<SessionForm />)
    expect(screen.getByRole('button', { name: '세션 만들기' })).toBeInTheDocument()
  })

  it('renders "세션 수정" submit button when editing existing session', () => {
    render(<SessionForm sessionId="session-1" />)
    expect(screen.getByRole('button', { name: '세션 수정' })).toBeInTheDocument()
  })

  it('renders 취소 button', () => {
    render(<SessionForm />)
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument()
  })

  it('populates title from initialData', () => {
    render(<SessionForm initialData={{ title: '기존 제목' }} />)
    const input = screen.getByPlaceholderText('커피챗 제목을 입력해주세요') as HTMLInputElement
    expect(input.value).toBe('기존 제목')
  })

  it('adds tag via 추가 button click', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    await user.type(screen.getByPlaceholderText('태그 입력 후 Enter'), 'AI')
    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('adds tag via Enter key press', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    await user.type(screen.getByPlaceholderText('태그 입력 후 Enter'), '스타트업{Enter}')
    expect(screen.getByText('스타트업')).toBeInTheDocument()
  })

  it('clears tag input after adding a tag', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    const tagInput = screen.getByPlaceholderText('태그 입력 후 Enter') as HTMLInputElement
    await user.type(tagInput, 'AI')
    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(tagInput.value).toBe('')
  })

  it('does not add duplicate tags', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    await user.type(screen.getByPlaceholderText('태그 입력 후 Enter'), 'AI')
    await user.click(screen.getByRole('button', { name: '추가' }))
    await user.type(screen.getByPlaceholderText('태그 입력 후 Enter'), 'AI')
    await user.click(screen.getByRole('button', { name: '추가' }))
    const tagElements = screen.getAllByText('AI')
    expect(tagElements).toHaveLength(1)
  })

  it('removes tag when ✕ button is clicked', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    await user.type(screen.getByPlaceholderText('태그 입력 후 Enter'), 'AI{Enter}')
    expect(screen.getByText('AI')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'AI 제거' }))
    expect(screen.queryByText('AI')).not.toBeInTheDocument()
  })

  it('shows validation error for empty title on submit', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    await user.click(screen.getByRole('button', { name: '세션 만들기' }))
    await waitFor(() => {
      expect(screen.getByText('제목을 입력해주세요')).toBeInTheDocument()
    })
  })

  it('shows validation error for empty description on submit', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    await user.type(screen.getByPlaceholderText('커피챗 제목을 입력해주세요'), '테스트 제목')
    await user.click(screen.getByRole('button', { name: '세션 만들기' }))
    await waitFor(() => {
      expect(screen.getByText('설명을 입력해주세요')).toBeInTheDocument()
    })
  })

  it('shows agreement validation error when checkbox is not checked on submit', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    await user.type(screen.getByPlaceholderText('커피챗 제목을 입력해주세요'), '테스트 제목')
    await user.type(screen.getByPlaceholderText('커피챗에 대해 설명해주세요'), '테스트 설명')
    await user.click(screen.getByRole('button', { name: '온라인' }))
    await user.click(screen.getByRole('button', { name: '세션 만들기' }))
    await waitFor(() => {
      expect(screen.getByText('헤드헌팅 수수료 원칙에 동의해야 합니다')).toBeInTheDocument()
    })
  })

  it('calls POST /api/ceo-coffeechat on valid form submit when creating', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'new-session-id' } }),
    } as Response)

    const user = userEvent.setup()
    render(<SessionForm />)

    await user.type(screen.getByPlaceholderText('커피챗 제목을 입력해주세요'), '신규 세션')
    await user.type(screen.getByPlaceholderText('커피챗에 대해 설명해주세요'), '세션 설명입니다')
    // Set datetime-local value programmatically via change event
    const dateInput = screen.getByLabelText('날짜 및 시간 *')
    await user.type(dateInput, '2026-05-01T10:00')
    await user.click(screen.getByRole('button', { name: '온라인' }))
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: '세션 만들기' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ceo-coffeechat',
        expect.objectContaining({ method: 'POST' })
      )
    })
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
    render(<SessionForm />)

    await user.type(screen.getByPlaceholderText('커피챗 제목을 입력해주세요'), '신규 세션')
    await user.type(screen.getByPlaceholderText('커피챗에 대해 설명해주세요'), '세션 설명입니다')
    const dateInput = screen.getByLabelText('날짜 및 시간 *')
    await user.type(dateInput, '2026-05-01T10:00')
    await user.click(screen.getByRole('button', { name: '온라인' }))
    await user.click(screen.getByRole('checkbox'))
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
    render(<SessionForm />)

    await user.type(screen.getByPlaceholderText('커피챗 제목을 입력해주세요'), '신규 세션')
    await user.type(screen.getByPlaceholderText('커피챗에 대해 설명해주세요'), '세션 설명입니다')
    const dateInput = screen.getByLabelText('날짜 및 시간 *')
    await user.type(dateInput, '2026-05-01T10:00')
    await user.click(screen.getByRole('button', { name: '온라인' }))
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: '세션 만들기' }))

    await waitFor(() => {
      expect(screen.getByText('저장에 실패했습니다')).toBeInTheDocument()
    })
  })

  it('shows network error message when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'))

    const user = userEvent.setup()
    render(<SessionForm />)

    await user.type(screen.getByPlaceholderText('커피챗 제목을 입력해주세요'), '신규 세션')
    await user.type(screen.getByPlaceholderText('커피챗에 대해 설명해주세요'), '세션 설명입니다')
    const dateInput = screen.getByLabelText('날짜 및 시간 *')
    await user.type(dateInput, '2026-05-01T10:00')
    await user.click(screen.getByRole('button', { name: '온라인' }))
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: '세션 만들기' }))

    await waitFor(() => {
      expect(screen.getByText('네트워크 오류가 발생했습니다')).toBeInTheDocument()
    })
  })

  it('shows "저장 중..." on submit button while loading', async () => {
    let resolveFetch!: (value: unknown) => void
    global.fetch = vi.fn().mockReturnValue(new Promise((resolve) => { resolveFetch = resolve }))

    const user = userEvent.setup()
    render(<SessionForm />)

    await user.type(screen.getByPlaceholderText('커피챗 제목을 입력해주세요'), '신규 세션')
    await user.type(screen.getByPlaceholderText('커피챗에 대해 설명해주세요'), '세션 설명입니다')
    const dateInput = screen.getByLabelText('날짜 및 시간 *')
    await user.type(dateInput, '2026-05-01T10:00')
    await user.click(screen.getByRole('button', { name: '온라인' }))
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: '세션 만들기' }))

    expect(screen.getByRole('button', { name: '저장 중...' })).toBeInTheDocument()

    resolveFetch({ ok: true, json: () => Promise.resolve({ data: { id: 'x' } }) })
  })

  it('calls router.back when 취소 button is clicked', async () => {
    const user = userEvent.setup()
    render(<SessionForm />)
    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(mockBack).toHaveBeenCalledOnce()
  })
})
