import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const mockRateLimit = vi.fn()
  const directoryLimiter = { name: 'directory' }
  const directoryBurstLimiter = { name: 'directory-burst' }
  const directoryDailyLimiter = { name: 'directory-daily' }

  return {
    mockRateLimit,
    directoryLimiter,
    directoryBurstLimiter,
    directoryDailyLimiter,
  }
})

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mocks.mockRateLimit,
  directoryLimiter: mocks.directoryLimiter,
  directoryBurstLimiter: mocks.directoryBurstLimiter,
  directoryDailyLimiter: mocks.directoryDailyLimiter,
}))

import {
  checkDirectoryAccess,
  DIRECTORY_BLOCK_MESSAGE,
  DIRECTORY_DAILY_LIMIT_MESSAGE,
  DIRECTORY_WARNING_MESSAGE,
} from '@/lib/anti-scraping'

describe('checkDirectoryAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockRateLimit.mockResolvedValue({ success: true, remaining: 10 })
  })

  it('checks daily, burst, and warning limits with separate keys', async () => {
    const result = await checkDirectoryAccess('user-123')

    expect(result).toEqual({ action: 'allow' })
    expect(mocks.mockRateLimit).toHaveBeenNthCalledWith(
      1,
      mocks.directoryDailyLimiter,
      'dir-daily:user-123'
    )
    expect(mocks.mockRateLimit).toHaveBeenNthCalledWith(
      2,
      mocks.directoryBurstLimiter,
      'dir-burst:user-123'
    )
    expect(mocks.mockRateLimit).toHaveBeenNthCalledWith(
      3,
      mocks.directoryLimiter,
      'dir-warn:user-123'
    )
  })

  it('restricts when the daily limit is exceeded', async () => {
    mocks.mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0 })

    const result = await checkDirectoryAccess('user-123')

    expect(result).toEqual({
      action: 'restrict',
      message: DIRECTORY_DAILY_LIMIT_MESSAGE,
    })
    expect(mocks.mockRateLimit).toHaveBeenCalledTimes(1)
  })

  it('blocks burst scraping before returning warning state', async () => {
    mocks.mockRateLimit
      .mockResolvedValueOnce({ success: true, remaining: 49 })
      .mockResolvedValueOnce({ success: false, remaining: 0 })

    const result = await checkDirectoryAccess('user-123')

    expect(result).toEqual({
      action: 'block',
      message: DIRECTORY_BLOCK_MESSAGE,
    })
    expect(mocks.mockRateLimit).toHaveBeenCalledTimes(2)
  })

  it('warns when only the one-minute warning threshold is exceeded', async () => {
    mocks.mockRateLimit
      .mockResolvedValueOnce({ success: true, remaining: 49 })
      .mockResolvedValueOnce({ success: true, remaining: 19 })
      .mockResolvedValueOnce({ success: false, remaining: 0 })

    const result = await checkDirectoryAccess('user-123')

    expect(result).toEqual({
      action: 'warn',
      message: DIRECTORY_WARNING_MESSAGE,
    })
  })
})
