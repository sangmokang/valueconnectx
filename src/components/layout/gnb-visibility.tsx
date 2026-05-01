import { headers } from 'next/headers'
import GNB from '@/components/layout/gnb'

// 인증 페이지 경로 목록 — 이 경로에서는 GNB를 숨긴다
const AUTH_PATHS = ['/login', '/signup', '/invite', '/forgot-password', '/reset-password', '/auth/callback', '/onboarding']

export async function GNBVisibility() {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? headersList.get('x-invoke-path') ?? ''
  const isAuthPage = AUTH_PATHS.some(p => pathname.startsWith(p))
  if (isAuthPage) return null
  return <GNB />
}
