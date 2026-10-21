import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

const { mockRouter } = vi.hoisted(() => {
  const mockPush = vi.fn()
  const mockReplace = vi.fn()
  return { mockPush, mockReplace, mockRouter: { push: mockPush, replace: mockReplace } }
})

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockGet()))
  })
  afterEach(() => {
    try {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('progress bar hidden during load, shown after', async () => {
    render(<OnboardingPage />)
    // 로딩 중에는 완성도 % 텍스트 없음
    expect(screen.queryByText(/프로필 완성도/)).not.toBeInTheDocument()
    // 로딩 완료 후 표시
    await screen.findByRole('heading', { name: '당신의 이야기를 들려주세요' })
    expect(screen.getByText('프로필 완성도')).toBeInTheDocument()
  })

  it('renders PROFESSIONAL_FIELDS preset chips in section 3', async () => {
    render(<OnboardingPage />)
    await screen.findByRole('heading', { name: '당신의 이야기를 들려주세요' })
    expect(screen.getByRole('button', { name: '엔지니어링 빠른 선택' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '프로덕트 빠른 선택' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '디자인 빠른 선택' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '데이터 빠른 선택' })).toBeInTheDocument()
  })

  it('clicking preset chip adds it as a tag', async () => {
    render(<OnboardingPage />)
    await screen.findByRole('heading', { name: '당신의 이야기를 들려주세요' })
    const chip = screen.getByRole('button', { name: '엔지니어링 빠른 선택' })
    await userEvent.click(chip)
    // chip is now pressed (selected)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    // tag appears in selected list
    expect(screen.getByLabelText('엔지니어링 태그 삭제')).toBeInTheDocument()
  })

  it('clicking already-selected preset chip removes it (toggle off)', async () => {
    render(<OnboardingPage />)
    await screen.findByRole('heading', { name: '당신의 이야기를 들려주세요' })
    const chip = screen.getByRole('button', { name: '프로덕트 빠른 선택' })
    await userEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByLabelText('프로덕트 태그 삭제')).not.toBeInTheDocument()
  })
})
