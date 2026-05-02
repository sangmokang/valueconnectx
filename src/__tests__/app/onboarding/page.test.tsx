import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

const { mockPush, mockReplace } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

import OnboardingPage from '@/app/(protected)/onboarding/page'

function mockGet(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    json: async () => ({
      data: {
        name: '',
        current_company: '',
        title: '',
        linkedin_url: '',
        professional_fields: [],
        bio: '',
        ...overrides,
      },
    }),
  }
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockGet()))
  })
  afterEach(() => { vi.unstubAllGlobals() })

  it('shows loading indicator before profile check completes', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    render(<OnboardingPage />)
    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  it('renders story-centric heading after profile check', async () => {
    render(<OnboardingPage />)
    expect(await screen.findByRole('heading', { name: '당신의 이야기를 들려주세요' })).toBeInTheDocument()
  })

  it('renders all three sections with correct fields', async () => {
    render(<OnboardingPage />)
    await screen.findByRole('heading', { name: '당신의 이야기를 들려주세요' })
    // 섹션 1: 자기소개
    expect(screen.getByText('당신의 이야기')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/10년차 백엔드 엔지니어/)).toBeInTheDocument()
    // 섹션 2: 현재
    expect(screen.getByText('현재')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('회사명')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('예: 시니어 백엔드 엔지니어')).toBeInTheDocument()
    // 섹션 3: 관심 분야
    expect(screen.getByText('관심 분야')).toBeInTheDocument()
    // 제출 버튼
    expect(screen.getByRole('button', { name: '네트워크 입장하기' })).toBeInTheDocument()
  })

  it('redirects to /directory when profile is already complete', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockGet({
        name: '홍',
        current_company: 'A',
        title: 'B',
        linkedin_url: 'https://linkedin.com/in/h',
        bio: '이미 완성된 프로필입니다',
      }),
    ))
    render(<OnboardingPage />)
    await waitFor(() => { expect(mockReplace).toHaveBeenCalledWith('/directory') })
  })

  it('pre-fills form with existing partial profile data and removes duplicate invite fields', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockGet({
        name: '홍길동',
        linkedin_url: 'https://linkedin.com/in/gildong',
        current_company: '스타트업',
        title: 'CTO',
      }),
    ))
    render(<OnboardingPage />)
    await screen.findByRole('heading', { name: '당신의 이야기를 들려주세요' })
    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://linkedin.com/in/gildong' })).toBeInTheDocument()
    expect(screen.queryByLabelText('이름 *')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('LinkedIn URL *')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('회사명')).toHaveValue('스타트업')
    expect(screen.getByPlaceholderText('예: 시니어 백엔드 엔지니어')).toHaveValue('CTO')
    expect(screen.getByText('60%')).toBeInTheDocument()
  })

  it('does not have skip button (강제 온보딩)', async () => {
    render(<OnboardingPage />)
    await screen.findByRole('heading', { name: '당신의 이야기를 들려주세요' })
    expect(screen.queryByText('나중에 작성하기')).not.toBeInTheDocument()
  })

  it('progress bar hidden during load, shown after', async () => {
    render(<OnboardingPage />)
    // 로딩 중에는 완성도 % 텍스트 없음
    expect(screen.queryByText(/프로필 완성도/)).not.toBeInTheDocument()
    // 로딩 완료 후 표시
    await screen.findByRole('heading', { name: '당신의 이야기를 들려주세요' })
    expect(screen.getByText('프로필 완성도')).toBeInTheDocument()
  })
})
