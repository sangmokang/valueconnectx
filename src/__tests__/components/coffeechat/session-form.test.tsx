import { render, screen } from '@testing-library/react'
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

  it('renders all new-session fields and controls with their defaults', () => {
    render(<SessionForm />)
    expect(screen.getByPlaceholderText('커피챗 제목을 입력해주세요')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('커피챗에 대해 설명해주세요')).toBeInTheDocument()
    const dateInput = screen.getByLabelText('날짜 및 시간 *') as HTMLInputElement
    expect(dateInput).toBeInTheDocument()
    expect(dateInput.type).toBe('datetime-local')
    const durationInput = screen.getByLabelText('소요 시간 (분) *') as HTMLInputElement
    expect(durationInput).toBeInTheDocument()
    expect(durationInput.value).toBe('60')
    const maxInput = screen.getByLabelText('최대 참가 인원 *') as HTMLInputElement
    expect(maxInput).toBeInTheDocument()
    expect(maxInput.value).toBe('5')
    expect(screen.getByPlaceholderText('Zoom 링크, 주소 등')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('태그 입력 후 Enter')).toBeInTheDocument()
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox).toBeInTheDocument()
    expect(checkbox.checked).toBe(false)
  })

  it('renders the accessible location, tier, add, submit and cancel buttons', () => {
    render(<SessionForm />)
    const buttons = screen.getAllByRole('button')
    for (const name of ['온라인', '오프라인', '하이브리드', '전체', '코어 멤버', '추천 멤버', '추가', '세션 만들기', '취소']) {
      const matches = buttons.filter((button) => button.textContent === name)
      expect(matches).toHaveLength(1)
      expect(matches[0]).toHaveAccessibleName(name)
    }
  })

  it('renders "세션 수정" submit button when editing existing session', () => {
    render(<SessionForm sessionId="session-1" />)
    expect(screen.getByRole('button', { name: '세션 수정' })).toBeInTheDocument()
  })

  it('populates title from initialData', () => {
    render(<SessionForm initialData={{ title: '기존 제목' }} />)
    const input = screen.getByPlaceholderText('커피챗 제목을 입력해주세요') as HTMLInputElement
    expect(input.value).toBe('기존 제목')
  })
})
