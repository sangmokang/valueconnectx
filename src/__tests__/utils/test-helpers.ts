import { NextRequest } from 'next/server'
import type { VcxUser } from '@/lib/auth/get-vcx-user'

// Create a mock NextRequest with configurable options
export function mockRequest(
  url: string,
  options: {
    method?: string
    body?: Record<string, unknown>
    headers?: Record<string, string>
    searchParams?: Record<string, string>
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {}, searchParams = {} } = options

  const urlObj = new URL(url, 'http://localhost:3000')
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value)
  })

  const requestInit: RequestInit = {
    method,
    headers: new Headers(headers),
  }

  if (body) {
    requestInit.body = JSON.stringify(body)
    ;(requestInit.headers as Headers).set('content-type', 'application/json')
  }

  return new NextRequest(urlObj, requestInit)
}

// Create a mock VcxUser for testing
export function mockVcxUser(overrides: Partial<NonNullable<VcxUser>> = {}): NonNullable<VcxUser> {
  return {
    id: 'test-user-id',
    name: '테스트 사용자',
    email: 'test@example.com',
    memberTier: 'core',
    systemRole: 'member',
    avatarUrl: null,
    ...overrides,
  }
}

// Create a mock admin user
export function mockAdminUser(overrides: Partial<NonNullable<VcxUser>> = {}): NonNullable<VcxUser> {
  return mockVcxUser({
    id: 'admin-user-id',
    name: '관리자',
    email: 'admin@example.com',
    systemRole: 'admin',
    ...overrides,
  })
}

// Create a mock core member
export function mockCoreMember(overrides: Partial<NonNullable<VcxUser>> = {}): NonNullable<VcxUser> {
  return mockVcxUser({
    id: 'core-member-id',
    name: '코어 멤버',
    email: 'core@example.com',
    memberTier: 'core',
    ...overrides,
  })
}
