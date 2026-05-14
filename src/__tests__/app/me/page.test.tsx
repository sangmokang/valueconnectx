import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { MeClient, type MeProfile } from '@/app/(protected)/me/me-client'

const baseProfile: MeProfile = {
  id: 'user-1',
  name: '홍길동',
  email: 'hong@example.com',
  current_company: 'ValueConnect',
  title: 'CTO',
  bio: '백엔드 엔지니어',
  professional_fields: ['엔지니어링'],
  years_of_experience: 10,
  linkedin_url: 'https://linkedin.com/in/hong',
  member_tier: 'core',
  avatar_url: null,
}

describe('/me MeClient', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('renders heading with member name and 4 tabs', () => {
    render(<MeClient profile={baseProfile} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('홍길동')
    expect(screen.getByTestId('me-tab-profile')).toBeInTheDocument()
    expect(screen.getByTestId('me-tab-coffeechat')).toBeInTheDocument()
    expect(screen.getByTestId('me-tab-community')).toBeInTheDocument()
    expect(screen.getByTestId('me-tab-account')).toBeInTheDocument()
  })

  it('shows profile completion bar and edit link by default', () => {
    render(<MeClient profile={baseProfile} />)
    expect(screen.getByTestId('me-panel-profile')).toBeInTheDocument()
    const value = screen.getByTestId('me-profile-completion-value')
    expect(value.textContent).toMatch(/100%/)
    const link = screen.getByTestId('me-edit-profile-link')
    expect(link).toHaveAttribute('href', '/directory/me')
  })

  it('switches to coffeechat tab and shows filter row', async () => {
    render(<MeClient profile={baseProfile} />)
    await userEvent.click(screen.getByTestId('me-tab-coffeechat'))
    expect(screen.getByTestId('me-panel-coffeechat')).toBeInTheDocument()
    expect(screen.getByTestId('me-coffeechat-filters')).toBeInTheDocument()
  })

  it('switches to community tab', async () => {
    render(<MeClient profile={baseProfile} />)
    await userEvent.click(screen.getByTestId('me-tab-community'))
    expect(screen.getByTestId('me-panel-community')).toBeInTheDocument()
  })

  it('switches to account tab and shows email', async () => {
    render(<MeClient profile={baseProfile} />)
    await userEvent.click(screen.getByTestId('me-tab-account'))
    expect(screen.getByTestId('me-panel-account')).toBeInTheDocument()
    expect(screen.getByText('hong@example.com')).toBeInTheDocument()
  })

  it('does not expose 수수료/25%/fee terms (멤버 UI 정책)', () => {
    const { container } = render(<MeClient profile={baseProfile} />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/수수료/)
    expect(text).not.toMatch(/25%/)
    expect(text).not.toMatch(/fee/i)
  })

  it('does not use rounded-* classes (전역 border-radius:0)', () => {
    const { container } = render(<MeClient profile={baseProfile} />)
    const html = container.innerHTML
    expect(/\brounded-(?!none)/.test(html)).toBe(false)
  })
})
