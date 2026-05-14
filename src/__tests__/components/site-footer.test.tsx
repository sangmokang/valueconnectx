import { render, screen } from '@testing-library/react'
import Footer from '@/components/layout/footer'

describe('Footer (사이트 푸터)', () => {
  it('회사명·사업자등록번호·대표·주소를 노출한다', () => {
    render(<Footer />)
    expect(screen.getAllByText(/밸류커넥트 주식회사/).length).toBeGreaterThan(0)
    expect(screen.getByText('646-87-02542')).toBeInTheDocument()
    expect(screen.getByText('강상모')).toBeInTheDocument()
    expect(screen.getByText(/서울시 서초구 사평대로335/)).toBeInTheDocument()
    expect(screen.getByText(/306-2호/)).toBeInTheDocument()
  })

  it('문의 이메일을 mailto 링크로 노출한다', () => {
    render(<Footer />)
    const mail = screen.getByRole('link', { name: /sangmokang@valueconnect\.kr/ })
    expect(mail).toHaveAttribute('href', 'mailto:sangmokang@valueconnect.kr')
  })

  it('개인정보처리방침·이용약관 링크를 노출한다', () => {
    render(<Footer />)
    const privacy = screen.getByRole('link', { name: /개인정보처리방침/ })
    expect(privacy).toHaveAttribute('href', '/privacy')
    const terms = screen.getByRole('link', { name: /^이용약관$/ })
    expect(terms).toHaveAttribute('href', '/terms')
  })

  it('수수료/25%/fee 관련 문구를 노출하지 않는다 (ADR-0001)', () => {
    const { container } = render(<Footer />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/수수료/)
    expect(text).not.toMatch(/25%/)
    expect(text).not.toMatch(/fee/i)
  })
})
