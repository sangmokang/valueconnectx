import { headers } from 'next/headers'
import Footer from '@/components/layout/footer'

// 푸터를 숨기는 경로 — 인증/온보딩/초대 수락 흐름은 멤버가 단일 행동에 집중하도록 푸터를 노출하지 않는다.
// 정책 페이지(/privacy, /terms) 자체에는 푸터를 노출한다 (랜딩과 동일).
const HIDDEN_PATHS = ['/login', '/invite', '/forgot-password', '/reset-password', '/onboarding']

function matchesPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export async function FooterVisibility() {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? headersList.get('x-invoke-path') ?? ''
  const isHidden = HIDDEN_PATHS.some(p => matchesPath(pathname, p))
  if (isHidden) return null
  return <Footer />
}
