import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the resend module
const mockSend = vi.fn()
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockSend } }
  }),
}))

import { sendInviteEmail } from '@/lib/email'

describe('sendInviteEmail', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    // Default: no RESEND_API_KEY (dev mode)
    delete process.env.RESEND_API_KEY
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  const defaultParams = {
    to: 'test@example.com',
    inviterName: '테스트 추천인',
    token: 'test-token-123',
    memberTier: 'core' as const,
  }

  // Test 1: Dev mode returns success with dev flag
  it('returns dev success when RESEND_API_KEY is missing', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const result = await sendInviteEmail(defaultParams)
    expect(result).toEqual({ success: true, dev: true })
    consoleSpy.mockRestore()
  })

  // Test 2: Dev mode logs invite URL with correct token
  it('logs invite URL containing the token in dev mode', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await sendInviteEmail(defaultParams)
    const allLogs = consoleSpy.mock.calls.flat().join(' ')
    expect(allLogs).toContain('test-token-123')
    expect(allLogs).toContain('test@example.com')
    consoleSpy.mockRestore()
  })

  // Test 3: Production mode calls Resend with correct params
  it('calls Resend with correct params when API key is set', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    mockSend.mockResolvedValueOnce({ data: { id: 'msg-123' }, error: null })
    const result = await sendInviteEmail(defaultParams)
    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      from: expect.stringContaining('ValueConnect X'),
      to: 'test@example.com',
      subject: expect.stringContaining('테스트 추천인'),
    }))
    expect(result).toEqual({ success: true, data: { id: 'msg-123' } })
  })

  // Test 4: Handles Resend error gracefully
  it('returns error when Resend fails', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    const error = { message: 'Rate limited' }
    mockSend.mockResolvedValueOnce({ data: null, error })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await sendInviteEmail(defaultParams)
    expect(result).toEqual({ success: false, error })
    consoleSpy.mockRestore()
  })
})
