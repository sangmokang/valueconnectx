import { describe, expect, it, vi, beforeEach } from 'vitest'

const { mockFrom, mockSelect, mockIn } = vi.hoisted(() => {
  const mockIn = vi.fn()
  const mockSelect = vi.fn(() => ({ in: mockIn }))
  const mockFrom = vi.fn(() => ({ select: mockSelect }))
  return { mockFrom, mockSelect, mockIn }
})

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

import { attachAcceptedApplicantEmails } from '@/lib/coffeechat-contact'

describe('attachAcceptedApplicantEmails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIn.mockResolvedValue({ data: [], error: null })
  })

  it('adds contact_email only for accepted applications', async () => {
    mockIn.mockResolvedValue({
      data: [{ id: 'applicant-1', email: 'accepted@example.com' }],
      error: null,
    })

    const result = await attachAcceptedApplicantEmails([
      { id: 'application-1', applicant_id: 'applicant-1', status: 'accepted' as const },
      { id: 'application-2', applicant_id: 'applicant-2', status: 'pending' as const },
      { id: 'application-3', applicant_id: 'applicant-3', status: 'rejected' as const },
    ])

    expect(result).toEqual([
      expect.objectContaining({ id: 'application-1', contact_email: 'accepted@example.com' }),
      expect.objectContaining({ id: 'application-2', contact_email: null }),
      expect.objectContaining({ id: 'application-3', contact_email: null }),
    ])
    expect(mockFrom).toHaveBeenCalledWith('vcx_members')
    expect(mockSelect).toHaveBeenCalledWith('id, email')
    expect(mockIn).toHaveBeenCalledWith('id', ['applicant-1'])
  })

  it('does not query admin client when there are no accepted applications', async () => {
    const result = await attachAcceptedApplicantEmails([
      { id: 'application-1', applicant_id: 'applicant-1', status: 'pending' as const },
    ])

    expect(result).toEqual([
      expect.objectContaining({ id: 'application-1', contact_email: null }),
    ])
    expect(mockFrom).not.toHaveBeenCalled()
  })
})
