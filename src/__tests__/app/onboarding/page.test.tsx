import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'

const { mockPush, mockReplace } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

vi.mock('lucide-react', () => ({
  Check: () => React.createElement('svg'),
}))

Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })

import OnboardingPage from '@/app/(protected)/onboarding/page'

function mockGet(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    json: async () => ({
      data: { name: '', current_company: '', title: '', linkedin_url: '', professional_fields: [], years_of_experience: null, bio: '', industry: '', location: '', ...overrides },
    }),
  }
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockGet()))
  })
  afterEach(() => { vi.unstubAllGlobals() })

  it('renders heading after profile check', async () => {
    render(<OnboardingPage />)
    expect(await screen.findByRole('heading', { name: '프로필 완성하기' })).toBeInTheDocument()
  })

  it('shows loading indicator', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    render(<OnboardingPage />)
    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  it('renders step 1 fields, buttons, and step indicator', async () => {
    render(<OnboardingPage />)
    await screen.findByRole('heading', { name: '프로필 완성하기' })
    expect(screen.getByPlaceholderText('홍길동')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('회사명')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('예: Senior Software Engineer')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://linkedin.com/in/your-profile')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음 — 선택 정보 입력' })).toBeInTheDocument()
    expect(screen.getAllByText('필수 정보').length).toBeGreaterThan(0)
    expect(screen.getByText('선택 정보')).toBeInTheDocument()
  })

  it('redirects to /directory when profile is already complete', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockGet({ name: '홍', current_company: 'A', title: 'B', linkedin_url: 'https://linkedin.com/in/h' }),
    ))
    render(<OnboardingPage />)
    await waitFor(() => { expect(mockReplace).toHaveBeenCalledWith('/directory') })
  })

  it('pre-fills form with existing partial profile data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockGet({ name: '김철수', current_company: '스타트업' })))
    render(<OnboardingPage />)
    await screen.findByRole('heading', { name: '프로필 완성하기' })
    expect(screen.getByPlaceholderText('홍길동')).toHaveValue('김철수')
    expect(screen.getByPlaceholderText('회사명')).toHaveValue('스타트업')
  })

  it('does not have skip button (강제 온보딩)', async () => {
    render(<OnboardingPage />)
    await screen.findByRole('heading', { name: '프로필 완성하기' })
    expect(screen.queryByText('나중에 작성하기')).not.toBeInTheDocument()
  })
})
