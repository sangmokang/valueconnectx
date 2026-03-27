import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileEditForm } from '@/components/directory/profile-edit-form'

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

const defaultInitialData = {
  bio: null,
  industry: null,
  location: null,
  is_open_to_chat: false,
  profile_visibility: 'members_only' as const,
  professional_fields: [],
  linkedin_url: null,
}

describe('ProfileEditForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders LinkedIn URL input', () => {
    render(<ProfileEditForm initialData={defaultInitialData} />)
    expect(screen.getByPlaceholderText('https://www.linkedin.com/in/yourprofile')).toBeInTheDocument()
  })

  it('renders bio textarea', () => {
    render(<ProfileEditForm initialData={defaultInitialData} />)
    expect(screen.getByPlaceholderText('자신을 소개해 주세요 (최대 1000자)')).toBeInTheDocument()
  })

  it('renders professional fields input', () => {
    render(<ProfileEditForm initialData={defaultInitialData} />)
    expect(screen.getByPlaceholderText('예: Product, Engineering, Finance (쉼표로 구분)')).toBeInTheDocument()
  })

  it('renders industry dropdown', () => {
    render(<ProfileEditForm initialData={defaultInitialData} />)
    expect(screen.getByRole('option', { name: '선택 안 함' })).toBeInTheDocument()
  })

  it('renders location input', () => {
    render(<ProfileEditForm initialData={defaultInitialData} />)
    expect(screen.getByPlaceholderText('예: 서울, 성남')).toBeInTheDocument()
  })

  it('renders coffee chat toggle switch', () => {
    render(<ProfileEditForm initialData={defaultInitialData} />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('renders profile visibility radio options', () => {
    render(<ProfileEditForm initialData={defaultInitialData} />)
    expect(screen.getByLabelText(/멤버 전용/)).toBeInTheDocument()
    expect(screen.getByLabelText(/기업 회원 전용/)).toBeInTheDocument()
    expect(screen.getByLabelText(/전체 공개/)).toBeInTheDocument()
  })

  it('renders submit button with text "프로필 저장"', () => {
    render(<ProfileEditForm initialData={defaultInitialData} />)
    expect(screen.getByRole('button', { name: '프로필 저장' })).toBeInTheDocument()
  })

  it('populates fields with initialData values', () => {
    render(
      <ProfileEditForm
        initialData={{
          ...defaultInitialData,
          bio: '안녕하세요',
          location: '서울',
          linkedin_url: 'https://www.linkedin.com/in/testuser',
          professional_fields: ['Engineering', 'Product'],
        }}
      />
    )
    expect(screen.getByPlaceholderText('자신을 소개해 주세요 (최대 1000자)')).toHaveValue('안녕하세요')
    expect(screen.getByPlaceholderText('예: 서울, 성남')).toHaveValue('서울')
    expect(screen.getByPlaceholderText('https://www.linkedin.com/in/yourprofile')).toHaveValue(
      'https://www.linkedin.com/in/testuser'
    )
  })

  it('shows LinkedIn validation error when URL does not contain linkedin.com/in/', async () => {
    const user = userEvent.setup()
    render(<ProfileEditForm initialData={defaultInitialData} />)

    await user.type(
      screen.getByPlaceholderText('https://www.linkedin.com/in/yourprofile'),
      'https://www.example.com/profile'
    )
    await user.click(screen.getByRole('button', { name: '프로필 저장' }))

    expect(await screen.findByText('linkedin.com/in/ 형식의 URL을 입력해주세요')).toBeInTheDocument()
  })

  it('shows LinkedIn validation error when URL is valid but not LinkedIn', async () => {
    const user = userEvent.setup()
    render(<ProfileEditForm initialData={defaultInitialData} />)

    const linkedinInput = screen.getByPlaceholderText('https://www.linkedin.com/in/yourprofile')
    await user.type(linkedinInput, 'https://www.example.com/profile')
    await user.click(screen.getByRole('button', { name: '프로필 저장' }))

    // Valid URL but fails linkedin.com/in/ regex check
    expect(await screen.findByText('linkedin.com/in/ 형식의 URL을 입력해주세요')).toBeInTheDocument()
  })

  it('shows LinkedIn validation error when URL is empty', async () => {
    const user = userEvent.setup()
    render(<ProfileEditForm initialData={defaultInitialData} />)

    await user.click(screen.getByRole('button', { name: '프로필 저장' }))

    expect(await screen.findByText('LinkedIn URL을 입력해주세요')).toBeInTheDocument()
  })

  it('does not call fetch when LinkedIn validation fails', async () => {
    const user = userEvent.setup()
    render(<ProfileEditForm initialData={defaultInitialData} />)

    await user.click(screen.getByRole('button', { name: '프로필 저장' }))

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('enforces bio max length of 1000 characters', () => {
    render(<ProfileEditForm initialData={defaultInitialData} />)
    const textarea = screen.getByPlaceholderText('자신을 소개해 주세요 (최대 1000자)')
    expect(textarea).toHaveAttribute('maxLength', '1000')
  })

  it('shows bio character count', () => {
    render(<ProfileEditForm initialData={{ ...defaultInitialData, bio: '안녕' }} />)
    expect(screen.getByText('2 / 1000')).toBeInTheDocument()
  })

  it('calls fetch PUT /api/directory/me on valid submit', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response)

    const user = userEvent.setup()
    render(<ProfileEditForm initialData={defaultInitialData} />)

    await user.type(
      screen.getByPlaceholderText('https://www.linkedin.com/in/yourprofile'),
      'https://www.linkedin.com/in/testuser'
    )
    await user.click(screen.getByRole('button', { name: '프로필 저장' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/directory/me',
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  it('shows success message "프로필이 저장되었습니다." on successful save', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response)

    const user = userEvent.setup()
    render(<ProfileEditForm initialData={defaultInitialData} />)

    await user.type(
      screen.getByPlaceholderText('https://www.linkedin.com/in/yourprofile'),
      'https://www.linkedin.com/in/testuser'
    )
    await user.click(screen.getByRole('button', { name: '프로필 저장' }))

    expect(await screen.findByText('프로필이 저장되었습니다.')).toBeInTheDocument()
  })

  it('shows error message from API on failed save', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: '권한이 없습니다.' }),
    } as Response)

    const user = userEvent.setup()
    render(<ProfileEditForm initialData={defaultInitialData} />)

    await user.type(
      screen.getByPlaceholderText('https://www.linkedin.com/in/yourprofile'),
      'https://www.linkedin.com/in/testuser'
    )
    await user.click(screen.getByRole('button', { name: '프로필 저장' }))

    expect(await screen.findByText('권한이 없습니다.')).toBeInTheDocument()
  })

  it('shows "네트워크 오류가 발생했습니다." when fetch throws', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))

    const user = userEvent.setup()
    render(<ProfileEditForm initialData={defaultInitialData} />)

    await user.type(
      screen.getByPlaceholderText('https://www.linkedin.com/in/yourprofile'),
      'https://www.linkedin.com/in/testuser'
    )
    await user.click(screen.getByRole('button', { name: '프로필 저장' }))

    expect(await screen.findByText('네트워크 오류가 발생했습니다.')).toBeInTheDocument()
  })

  it('shows "저장 중..." during loading', async () => {
    let resolve!: (v: unknown) => void
    ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r
      })
    )

    const user = userEvent.setup()
    render(<ProfileEditForm initialData={defaultInitialData} />)

    await user.type(
      screen.getByPlaceholderText('https://www.linkedin.com/in/yourprofile'),
      'https://www.linkedin.com/in/testuser'
    )
    await user.click(screen.getByRole('button', { name: '프로필 저장' }))

    expect(screen.getByRole('button', { name: '저장 중...' })).toBeInTheDocument()

    resolve({ ok: true, json: () => Promise.resolve({}) })
  })

  it('submit button is disabled during loading', async () => {
    let resolve!: (v: unknown) => void
    ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r
      })
    )

    const user = userEvent.setup()
    render(<ProfileEditForm initialData={defaultInitialData} />)

    await user.type(
      screen.getByPlaceholderText('https://www.linkedin.com/in/yourprofile'),
      'https://www.linkedin.com/in/testuser'
    )
    await user.click(screen.getByRole('button', { name: '프로필 저장' }))

    expect(screen.getByRole('button', { name: '저장 중...' })).toBeDisabled()

    resolve({ ok: true, json: () => Promise.resolve({}) })
  })

  it('coffee chat toggle switches state when clicked', async () => {
    const user = userEvent.setup()
    render(<ProfileEditForm initialData={defaultInitialData} />)

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })
})
