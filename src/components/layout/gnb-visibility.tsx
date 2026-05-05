import { headers } from 'next/headers'
import GNB from '@/components/layout/gnb'

// 인증 페이지 경로 목록 — 이 경로에서는 GNB를 숨긴다
// 온보딩(`/onboarding`) 도 GNB 를 숨겨 멤버가 프로필 완성에만 집중하도록 한다.
const AUTH_PATHS = ['/login', '/invite', '/forgot-password', '/reset-password', '/onboarding']

/** 정확한 경로 일치 또는 `/<prefix>/...` 하위 경로만 일치 — `/loginsomething` 같은 false-match 방지 */
function matchesPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export async function GNBVisibility() {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? headersList.get('x-invoke-path') ?? ''
  const isAuthPage = AUTH_PATHS.some(p => matchesPath(pathname, p))
  if (isAuthPage) return null
  return <GNB />
}
