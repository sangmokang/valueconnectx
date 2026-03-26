import { describe, it, expect } from 'vitest'
import {
  generateInviteToken,
  hashToken,
  verifyTokenHash,
  calculateExpiry,
} from '@/lib/invite'

describe('generateInviteToken', () => {
  it('returns a 64-character hex string', () => {
    const token = generateInviteToken()
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces unique tokens on consecutive calls', () => {
    const token1 = generateInviteToken()
    const token2 = generateInviteToken()
    expect(token1).not.toBe(token2)
  })
})

describe('hashToken', () => {
  it('is deterministic (same input produces same output)', () => {
    const input = 'test-token-value'
    expect(hashToken(input)).toBe(hashToken(input))
  })

  it('output differs from input', () => {
    const input = 'test-token-value'
    expect(hashToken(input)).not.toBe(input)
  })
})

describe('verifyTokenHash', () => {
  it('returns true for a valid raw token and its hash', () => {
    const rawToken = generateInviteToken()
    const storedHash = hashToken(rawToken)
    expect(verifyTokenHash(rawToken, storedHash)).toBe(true)
  })

  it('returns false for an invalid (wrong) token', () => {
    const rawToken = generateInviteToken()
    const storedHash = hashToken(rawToken)
    const wrongToken = generateInviteToken()
    expect(verifyTokenHash(wrongToken, storedHash)).toBe(false)
  })

  it('returns false for a tampered hash', () => {
    const rawToken = generateInviteToken()
    const tamperedHash = hashToken('completely-different-value')
    expect(verifyTokenHash(rawToken, tamperedHash)).toBe(false)
  })
})

describe('calculateExpiry', () => {
  it('returns an ISO string approximately 24 hours from now (within 2s tolerance)', () => {
    const before = Date.now()
    const expiryStr = calculateExpiry()
    const after = Date.now()

    const expiryMs = new Date(expiryStr).getTime()
    const expectedMs = before + 24 * 60 * 60 * 1000

    // The expiry should be within [before + 24h, after + 24h + 2000ms]
    expect(expiryMs).toBeGreaterThanOrEqual(expectedMs)
    expect(expiryMs).toBeLessThanOrEqual(after + 24 * 60 * 60 * 1000 + 2000)
  })
})
