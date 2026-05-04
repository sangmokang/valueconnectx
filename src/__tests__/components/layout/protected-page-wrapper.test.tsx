import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProtectedPageWrapper } from '@/components/layout/protected-page-wrapper'

const { mockHeaders } = vi.hoisted(() => ({
  mockHeaders: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: mockHeaders,
}))

describe('ProtectedPageWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비인증 상태에서는 로그인 월만 보여주고 자식은 렌더하지 않는다', async () => {
    mockHeaders.mockResolvedValue(new Headers({ 'x-vcx-authenticated': 'false' }))

    const ui = await ProtectedPageWrapper({
      currentPath: '/directory',
      children: <div>보호된 콘텐츠</div>,
    })

    render(ui)

    expect(screen.getByText('멤버 전용 콘텐츠입니다')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login?redirect=%2Fdirectory')
    expect(screen.queryByText('보호된 콘텐츠')).not.toBeInTheDocument()
  })

  it('인증 상태에서는 자식 콘텐츠를 렌더한다', async () => {
    mockHeaders.mockResolvedValue(new Headers({ 'x-vcx-authenticated': 'true' }))

    const ui = await ProtectedPageWrapper({
      currentPath: '/directory',
      children: <div>보호된 콘텐츠</div>,
    })

    render(ui)

    expect(screen.getByText('보호된 콘텐츠')).toBeInTheDocument()
    expect(screen.queryByText('멤버 전용 콘텐츠입니다')).not.toBeInTheDocument()
  })
})
