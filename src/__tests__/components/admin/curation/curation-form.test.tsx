import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CurationForm, type FeedItem } from '@/components/admin/curation/curation-form'

const mockFetch = vi.fn()

const existingItem: FeedItem = {
  id: 'feed-1',
  company: 'Northstar AI',
  company_tag: 'AI Infra',
  role: 'Engineering Manager',
  level: 'Senior',
  team_size: '50-100명',
  salary_band: '협의',
  location: 'Remote',
  tags: ['AI / ML'],
  summary: 'AI 인프라 팀 리더',
  exclusive: true,
  published_at: '2026-05-01T00:00:00.000Z',
  created_by: 'admin-1',
  created_at: '2026-05-01T00:00:00.000Z',
}

describe('CurationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ item: existingItem }),
    })
    vi.stubGlobal('fetch', mockFetch)
  })

  it('submits a new feed item through the admin feed API', async () => {
    const onSuccess = vi.fn()

    render(
      <CurationForm
        onSuccess={onSuccess}
        onCancel={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText('회사명 *'), { target: { value: '토스' } })
    fireEvent.change(screen.getByLabelText('역할 *'), { target: { value: '제품 총괄' } })
    fireEvent.click(screen.getByRole('button', { name: '아이템 생성' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/feed',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"company":"토스"'),
      })
    )
  })

  it('submits edits to the selected feed item endpoint', async () => {
    const onSuccess = vi.fn()

    render(
      <CurationForm
        item={existingItem}
        onSuccess={onSuccess}
        onCancel={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText('역할 *'), { target: { value: 'AI Platform Lead' } })
    fireEvent.click(screen.getByRole('button', { name: '수정 완료' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/feed/feed-1',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('"role":"AI Platform Lead"'),
      })
    )
  })
})
