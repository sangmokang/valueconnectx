import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CurationList } from '@/components/admin/curation/curation-list'
import type { FeedItem } from '@/components/admin/curation/curation-form'

const item: FeedItem = {
  id: 'feed-1',
  company: '토스',
  company_tag: '핀테크',
  role: '제품 총괄',
  level: 'Lead',
  team_size: '20-50명',
  salary_band: '협의',
  location: '서울',
  tags: ['핀테크 B2B'],
  summary: 'GTM을 제품 관점에서 설계할 리드 포지션',
  exclusive: true,
  published_at: '2026-05-01T00:00:00.000Z',
  created_by: 'admin-1',
  created_at: '2026-05-01T00:00:00.000Z',
}

describe('CurationList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('confirm', vi.fn(() => true))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  })

  it('등록된 피드 아이템을 운영 목록으로 표시하고 편집을 시작한다', () => {
    const onEdit = vi.fn()

    render(<CurationList items={[item]} onEdit={onEdit} onDelete={vi.fn()} />)

    expect(screen.getByText('토스')).toBeInTheDocument()
    expect(screen.getByText('제품 총괄')).toBeInTheDocument()
    expect(screen.getByText('EXCLUSIVE')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '편집' }))
    expect(onEdit).toHaveBeenCalledWith(item)
  })

  it('확인 후 피드 아이템을 삭제하고 목록 상태를 갱신한다', async () => {
    const onDelete = vi.fn()

    render(<CurationList items={[item]} onEdit={vi.fn()} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: '삭제' }))

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('feed-1'))
    expect(fetch).toHaveBeenCalledWith('/api/admin/feed/feed-1', { method: 'DELETE' })
  })
})
