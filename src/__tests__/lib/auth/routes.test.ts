import { describe, it, expect } from 'vitest'
import {
  isPublicRoute,
  isSemiPublicRoute,
  isProtectedRoute,
  isAdminRoute,
  isAuthRoute,
} from '@/lib/auth/routes'

describe('isPublicRoute', () => {
  it('returns true for "/"', () => {
    expect(isPublicRoute('/')).toBe(true)
  })

  it('returns true for "/service-overview"', () => {
    expect(isPublicRoute('/service-overview')).toBe(true)
  })

  it('returns false for "/coffeechat" (protected route)', () => {
    expect(isPublicRoute('/coffeechat')).toBe(false)
  })
})

describe('isSemiPublicRoute', () => {
  it('returns true for "/positions"', () => {
    expect(isSemiPublicRoute('/positions')).toBe(true)
  })
})

describe('isProtectedRoute', () => {
  it('returns true for "/coffeechat"', () => {
    expect(isProtectedRoute('/coffeechat')).toBe(true)
  })
})

describe('isAdminRoute', () => {
  it('returns true for "/admin"', () => {
    expect(isAdminRoute('/admin')).toBe(true)
  })

  it('returns true for "/admin/recommendations" (sub-path)', () => {
    expect(isAdminRoute('/admin/recommendations')).toBe(true)
  })
})

describe('isAuthRoute', () => {
  it('returns true for "/login"', () => {
    expect(isAuthRoute('/login')).toBe(true)
  })

  it('returns true for "/invite/accept" (sub-path)', () => {
    expect(isAuthRoute('/invite/accept')).toBe(true)
  })
})
