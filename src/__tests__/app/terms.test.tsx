import { render, screen } from '@testing-library/react'
import TermsPage from '@/app/terms/page'
import { isPublicRoute } from '@/lib/auth/routes'

describe('/terms', () => {
  it('이용약관 heading 을 노출한다', () => {
    render(<TermsPage />)
    expect(
      screen.getByRole('heading', { level: 1, name: /이용약관/ })
    ).toBeInTheDocument()
  })

  it('제1조 이상의 조항이 존재한다', () => {
    const { container } = render(<TermsPage />)
    expect(container.textContent ?? '').toMatch(/제1조/)
  })

  it('publicRoutes 에 포함되어 비로그인 접근이 허용된다', () => {
    expect(isPublicRoute('/terms')).toBe(true)
  })

  it('수수료/25%/fee 관련 문구를 노출하지 않는다 (ADR-0001)', () => {
    const { container } = render(<TermsPage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/수수료/)
    expect(text).not.toMatch(/25%/)
    expect(text).not.toMatch(/fee/i)
  })
})
