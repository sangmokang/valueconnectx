import { render, screen } from '@testing-library/react'
import { ProfileCompletion } from '@/components/directory/profile-completion'

const fullProfile = {
  name: '김철수',
  current_company: '(주)테크컴퍼니',
  title: '소프트웨어 엔지니어',
  professional_fields: ['Engineering'],
  years_of_experience: 5,
  bio: '안녕하세요',
  linkedin_url: 'https://www.linkedin.com/in/testuser',
}

const emptyProfile = {
  name: null,
  current_company: null,
  title: null,
  professional_fields: [],
  years_of_experience: null,
  bio: null,
  linkedin_url: null,
}

describe('ProfileCompletion', () => {
  it('shows 100% when all fields are filled', () => {
    render(<ProfileCompletion {...fullProfile} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('shows 0% when no fields are filled', () => {
    render(<ProfileCompletion {...emptyProfile} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('calculates correct percentage with only name filled (weight 10)', () => {
    render(<ProfileCompletion {...emptyProfile} name="김철수" />)
    expect(screen.getByText('10%')).toBeInTheDocument()
  })

  it('calculates correct percentage with only LinkedIn filled (weight 20)', () => {
    render(
      <ProfileCompletion
        {...emptyProfile}
        linkedin_url="https://www.linkedin.com/in/testuser"
      />
    )
    expect(screen.getByText('20%')).toBeInTheDocument()
  })

  it('calculates correct percentage with name + company + title filled (10+15+15=40)', () => {
    render(
      <ProfileCompletion
        {...emptyProfile}
        name="김철수"
        current_company="(주)테크컴퍼니"
        title="엔지니어"
      />
    )
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  it('renders progress bar element', () => {
    render(<ProfileCompletion {...fullProfile} />)
    // The progress bar is a div with width style reflecting the percentage
    const { container } = render(<ProfileCompletion {...fullProfile} />)
    const progressBar = container.querySelector('[style*="width: 100%"]')
    expect(progressBar).not.toBeNull()
  })

  it('progress bar has width 0% when no fields are filled', () => {
    const { container } = render(<ProfileCompletion {...emptyProfile} />)
    const progressBar = container.querySelector('[style*="width: 0%"]')
    expect(progressBar).not.toBeNull()
  })

  it('renders "프로필 완성도" label', () => {
    render(<ProfileCompletion {...emptyProfile} />)
    expect(screen.getByText('프로필 완성도')).toBeInTheDocument()
  })

  it('shows all completion item labels', () => {
    render(<ProfileCompletion {...emptyProfile} />)
    expect(screen.getByText('이름')).toBeInTheDocument()
    expect(screen.getByText('회사')).toBeInTheDocument()
    expect(screen.getByText('직함')).toBeInTheDocument()
    expect(screen.getByText('전문 분야')).toBeInTheDocument()
    expect(screen.getByText('경력 연수')).toBeInTheDocument()
    expect(screen.getByText('소개')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn')).toBeInTheDocument()
  })

  it('shows incomplete items hint when some fields are missing', () => {
    render(<ProfileCompletion {...emptyProfile} name="김철수" />)
    const hint = screen.getByText(/미완성 항목:/)
    expect(hint).toBeInTheDocument()
    expect(hint.textContent).toContain('회사')
    expect(hint.textContent).toContain('직함')
    expect(hint.textContent).toContain('LinkedIn')
  })

  it('does not show incomplete items hint when all fields are filled', () => {
    render(<ProfileCompletion {...fullProfile} />)
    expect(screen.queryByText(/미완성 항목:/)).not.toBeInTheDocument()
  })

  it('marks filled items with checkmark ✓', () => {
    render(<ProfileCompletion {...emptyProfile} name="김철수" />)
    expect(screen.getAllByText('✓')).toHaveLength(1)
  })

  it('marks unfilled items with ○ symbol', () => {
    render(<ProfileCompletion {...emptyProfile} name="김철수" />)
    // 7 total items - 1 filled = 6 unfilled
    expect(screen.getAllByText('○')).toHaveLength(6)
  })

  it('accepts className prop and applies it', () => {
    const { container } = render(
      <ProfileCompletion {...emptyProfile} className="custom-class" />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('treats whitespace-only name as unfilled', () => {
    render(<ProfileCompletion {...emptyProfile} name="   " />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('counts professional_fields as filled when array has at least one entry', () => {
    render(<ProfileCompletion {...emptyProfile} professional_fields={['Engineering']} />)
    // professional_fields weight is 15
    expect(screen.getByText('15%')).toBeInTheDocument()
  })

  it('counts years_of_experience as filled when value is 0', () => {
    render(<ProfileCompletion {...emptyProfile} years_of_experience={0} />)
    // years_of_experience weight is 10 — value 0 is not null, should count
    expect(screen.getByText('10%')).toBeInTheDocument()
  })
})
