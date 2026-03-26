import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/admin/status-badge'

describe('StatusBadge', () => {
  it('renders "대기" for pending', () => {
    render(<StatusBadge status="pending" />)
    expect(screen.getByText('대기')).toBeInTheDocument()
  })

  it('renders "승인" for approved', () => {
    render(<StatusBadge status="approved" />)
    expect(screen.getByText('승인')).toBeInTheDocument()
  })

  it('renders "거절" for rejected', () => {
    render(<StatusBadge status="rejected" />)
    expect(screen.getByText('거절')).toBeInTheDocument()
  })

  it('renders "수락" for accepted', () => {
    render(<StatusBadge status="accepted" />)
    expect(screen.getByText('수락')).toBeInTheDocument()
  })

  it('renders "만료" for expired', () => {
    render(<StatusBadge status="expired" />)
    expect(screen.getByText('만료')).toBeInTheDocument()
  })

  it('renders "취소" for revoked', () => {
    render(<StatusBadge status="revoked" />)
    expect(screen.getByText('취소')).toBeInTheDocument()
  })

  it('renders raw status string for unknown status', () => {
    render(<StatusBadge status="unknown_status" />)
    expect(screen.getByText('unknown_status')).toBeInTheDocument()
  })
})
