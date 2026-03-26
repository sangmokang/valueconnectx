import crypto from 'crypto'

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function verifyTokenHash(rawToken: string, storedHash: string): boolean {
  const incomingHash = hashToken(rawToken)
  const a = Buffer.from(incomingHash, 'hex')
  const b = Buffer.from(storedHash, 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export function calculateExpiry(): string {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + 24)
  return expiry.toISOString()
}
