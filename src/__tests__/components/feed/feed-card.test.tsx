import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { FeedCard } from '@/components/feed/feed-card'
import type { FeedItem } from '@/types'

vi.mock('lucide-react', () => ({
  BarChart3: () => 'BarChart3Icon',
  BriefcaseBusiness: () => 'BriefcaseBusinessIcon',
  Check: () => 'CheckIcon',
  ChevronRight: () => 'ChevronRightIcon',
  Eye: () => 'EyeIcon',
  MapPin: () => 'MapPinIcon',
  Users: () => 'UsersIcon',
  X: () => 'XIcon',
}))

const baseItem: FeedItem = {
  id: 'feed-1',
  company: 'Northstar AI',
  company_tag: 'AI Infra',
  role: 'Engineering Manager',
  level: 'Senior',
  team_size: '50-100명',
  salary_band: '협의',
  location: 'Remote',
  tags: ['AI / ML', '딥테크'],
  summary: 'AI 인프라 팀의 채용과 실행 리듬을 책임지는 역할',
  exclusive: true,
  published_at: '2026-05-01T09:00:00+09:00',
  user_response: null,
}

const defaultProps = {
  item: baseItem,
  onInterest: vi.fn(),
  onSkip: vi.fn(),
  onDetail: vi.fn(),
}

describe('FeedCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders feed item details with interest tags', () => {
    render(<FeedCard {...defaultProps} />)

    expect(screen.getByText('Northstar AI')).toBeInTheDocument()
    expect(screen.getByText('Engineering Manager')).toBeInTheDocument()
    expect(screen.getByText('AI Infra')).toBeInTheDocument()
    expect(screen.getByText('AI / ML')).toBeInTheDocument()
    expect(screen.getByText('딥테크')).toBeInTheDocument()
    expect(screen.getByText('HOT LINE')).toBeInTheDocument()
  })

  it('emits curation feed actions from card controls', () => {
    const onInterest = vi.fn()
    const onSkip = vi.fn()
    const onDetail = vi.fn()
    render(
      <FeedCard
        {...defaultProps}
        onInterest={onInterest}
        onSkip={onSkip}
        onDetail={onDetail}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /관심 있음/ }))
    fireEvent.click(screen.getByRole('button', { name: /관심 없음/ }))
    fireEvent.click(screen.getByRole('button', { name: /상세 보기/ }))

    expect(onInterest).toHaveBeenCalledWith('yes')
    expect(onSkip).toHaveBeenCalledTimes(1)
    expect(onDetail).toHaveBeenCalledTimes(1)
  })

  it('allows canceling an existing interest response', () => {
    const onInterest = vi.fn()
    render(
      <FeedCard
        {...defaultProps}
        item={{ ...baseItem, user_response: 'yes' }}
        onInterest={onInterest}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /관심 있음/ }))

    expect(onInterest).toHaveBeenCalledWith(null)
  })
})
