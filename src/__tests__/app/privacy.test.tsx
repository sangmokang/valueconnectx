import { render, screen } from '@testing-library/react'
import PrivacyPage from '@/app/privacy/page'
import { isPublicRoute } from '@/lib/auth/routes'

describe('/privacy', () => {
  it('개인정보처리방침 heading 을 노출한다', () => {
    render(<PrivacyPage />)
    expect(
      screen.getByRole('heading', { level: 1, name: /개인정보처리방침/ })
    ).toBeInTheDocument()
  })

  it('수집 항목·이용 목적·보유 기간·정보주체 권리 섹션을 포함한다', () => {
    const { container } = render(<PrivacyPage />)
    const text = container.textContent ?? ''
    expect(text).toMatch(/수집.*개인정보 항목|개인정보.*수집.*항목/)
    expect(text).toMatch(/이용 목적|처리 목적/)
    expect(text).toMatch(/보유.*기간/)
    expect(text).toMatch(/정보주체의 권리|이용자의 권리/)
  })

  it('publicRoutes 에 포함되어 비로그인 접근이 허용된다', () => {
    expect(isPublicRoute('/privacy')).toBe(true)
  })

  it('수수료/25%/fee 관련 문구를 노출하지 않는다 (ADR-0001)', () => {
    const { container } = render(<PrivacyPage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/수수료/)
    expect(text).not.toMatch(/25%/)
    expect(text).not.toMatch(/fee/i)
  })
})
